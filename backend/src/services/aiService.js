const groq = require('../config/groq');
const prisma = require('../config/db');

const MODEL = 'llama-3.3-70b-versatile';

// ── System prompt ─────────────────────────────────────────────────────────────

const INTERVIEWER_SYSTEM_PROMPT = `You are an expert senior software engineer conducting a technical interview.

Your behavior:
- Ask ONE question at a time. Never ask multiple questions in one message.
- Start with a warm greeting and one opening question about the candidate's background.
- Progress from easier to harder questions naturally based on their answers.
- Cover a mix of: data structures, algorithms, system design, and coding problems.
- When the candidate submits code, review it thoroughly: correctness, efficiency, edge cases, style.
- Give brief encouraging feedback after each answer before moving to the next question.
- Be professional, friendly, and supportive — not intimidating.
- If the candidate is struggling, give a small hint rather than the full answer.
- Keep your responses concise — no more than 3-4 sentences unless reviewing code.

You must NOT:
- Ask multiple questions at once.
- Give away answers directly.
- Go off-topic from technical interviewing.`;

const EVALUATION_SYSTEM_PROMPT = `You are an expert technical interviewer evaluating a candidate's performance.
Analyze the interview transcript and return ONLY a valid JSON object. No markdown, no explanation, just the JSON.`;

// ── Load conversation history from DB ─────────────────────────────────────────

async function loadHistory(sessionId) {
  const messages = await prisma.message.findMany({
    where: { sessionId },
    orderBy: { createdAt: 'asc' }
  });

  return messages.map((m) => ({
    role: m.role === 'USER' ? 'user' : 'assistant',
    content: m.content
  }));
}

// ── Save a message to DB ──────────────────────────────────────────────────────

async function saveMessage(sessionId, role, content) {
  return prisma.message.create({
    data: {
      sessionId,
      role: role === 'user' ? 'USER' : 'ASSISTANT',
      content
    }
  });
}

// ── Stream AI response ────────────────────────────────────────────────────────
// onChunk is called with each text token as it streams in

async function streamResponse(messages, onChunk, retries = 1) {
  try {
    const stream = await groq.chat.completions.create({
      model: MODEL,
      messages: [
        { role: 'system', content: INTERVIEWER_SYSTEM_PROMPT },
        ...messages
      ],
      stream: true,
      temperature: 0.7,
      max_tokens: 1024
    });

    let fullResponse = '';

    for await (const chunk of stream) {
      const text = chunk.choices[0]?.delta?.content || '';
      if (text) {
        fullResponse += text;
        onChunk(text);
      }
    }

    return fullResponse;

  } catch (err) {
    // retry once with exponential backoff
    if (retries > 0) {
      console.warn('Groq API error, retrying in 2s...', err.message);
      await new Promise((r) => setTimeout(r, 2000));
      return streamResponse(messages, onChunk, retries - 1);
    }
    throw err;
  }
}

// ── Generate opening question ─────────────────────────────────────────────────

async function generateOpeningQuestion(sessionId) {
  const opening = [
    {
      role: 'user',
      content: 'Start the interview with a brief greeting and your first question.'
    }
  ];

  let fullResponse = '';
  await streamResponse(opening, (chunk) => {
    fullResponse += chunk;
  });

  await saveMessage(sessionId, 'assistant', fullResponse);
  return fullResponse;
}

// ── Handle candidate chat message ─────────────────────────────────────────────

async function handleChatMessage(sessionId, userMessage, onChunk) {
  // save user message to DB
  await saveMessage(sessionId, 'user', userMessage);

  // load full conversation history
  const history = await loadHistory(sessionId);

  // stream AI response
  const fullResponse = await streamResponse(history, onChunk);

  // save AI response to DB
  await saveMessage(sessionId, 'assistant', fullResponse);

  return fullResponse;
}

// ── Code review ───────────────────────────────────────────────────────────────

async function handleCodeReview(sessionId, language, code, onChunk) {
  const reviewPrompt = `The candidate submitted the following ${language} code for review:\n\n\`\`\`${language}\n${code}\n\`\`\`\n\nReview it. Cover: correctness, time/space complexity, edge cases, and one improvement suggestion.`;

  // save as a user message so history stays coherent
  await saveMessage(sessionId, 'user', reviewPrompt);

  const history = await loadHistory(sessionId);
  const fullResponse = await streamResponse(history, onChunk);

  await saveMessage(sessionId, 'assistant', fullResponse);
  return fullResponse;
}

// ── AI evaluation (called when session ends) ──────────────────────────────────

// Returns the saved Evaluation row (with id). Always produces one — even an
// empty session gets a minimal zero-score evaluation so the report page is
// never blank. Idempotent: if an evaluation already exists, it's returned as-is.
async function generateEvaluation(sessionId) {
  const existing = await prisma.evaluation.findUnique({ where: { sessionId } });
  if (existing) {
    return existing;
  }

  const history = await loadHistory(sessionId);

  if (history.length === 0) {
    return prisma.evaluation.create({
      data: {
        sessionId,
        score: 0,
        feedback: 'Not enough activity to assess this session.',
        metrics: {
          score: 0,
          feedback: 'Not enough activity to assess this session.',
          communication: 0,
          problem_solving: 0,
          code_quality: 0,
          technical_knowledge: 0,
          strengths: [],
          improvements: []
        }
      }
    });
  }

  const transcript = history
    .map((m) => `${m.role.toUpperCase()}: ${m.content}`)
    .join('\n\n');

  const response = await groq.chat.completions.create({
    model: MODEL,
    messages: [
      { role: 'system', content: EVALUATION_SYSTEM_PROMPT },
      {
        role: 'user',
        content: `Evaluate this technical interview transcript and return ONLY this JSON structure:
{
  "score": <0-100 integer>,
  "feedback": "<2-3 sentence overall summary>",
  "metrics": {
    "communication": <0-10 integer>,
    "problem_solving": <0-10 integer>,
    "code_quality": <0-10 integer>,
    "technical_knowledge": <0-10 integer>
  },
  "strengths": ["<strength 1>", "<strength 2>"],
  "improvements": ["<area 1>", "<area 2>"]
}

Transcript:
${transcript}`
      }
    ],
    temperature: 0.3,
    max_tokens: 1024,
    stream: false
  });

  const raw = response.choices[0].message.content.trim();

  // strip markdown code fences if model wraps in ```json
  const cleaned = raw.replace(/```json|```/g, '').trim();
  const evaluation = JSON.parse(cleaned);

  // save to DB and return the persisted row (with id)
  return prisma.evaluation.create({
    data: {
      sessionId,
      score: evaluation.score,
      feedback: evaluation.feedback,
      metrics: evaluation
    }
  });
}

module.exports = {
  handleChatMessage,
  handleCodeReview,
  generateEvaluation,
  generateOpeningQuestion
};