const prisma = require('../config/db');
const {
  handleChatMessage,
  handleCodeReview,
  generateEvaluation,
  generateOpeningQuestion
} = require('../services/aiService');

// The AI examiner only ever runs inside a candidate's own session. This guards
// against an interviewer (observer) being treated as the interviewee — the root
// cause of the AI asking the interviewer about their "background".
async function assertCandidateSession(socket, sessionId) {
  const session = await prisma.session.findUnique({ where: { id: sessionId } });
  if (!session) {
    socket.emit('chat:error', { message: 'Session not found' });
    return null;
  }
  if (socket.user.role !== 'CANDIDATE' || session.candidateId !== socket.user.userId) {
    socket.emit('chat:error', {
      message: 'Only the candidate can talk to the AI interviewer in this session.'
    });
    return null;
  }
  return session;
}

function registerChatHandlers(io, socket) {

  // ── chat:start — emit opening question when session begins ─────────────────
  socket.on('chat:start', async ({ sessionId }) => {
    try {
      const session = await assertCandidateSession(socket, sessionId);
      if (!session) return;

      // relay to the whole room so observers (interviewer) see it too
      io.to(sessionId).emit('chat:stream', { sessionId, chunk: '' }); // signal start

      const response = await generateOpeningQuestion(sessionId);

      // stream it chunk by chunk to feel real-time
      // (opening question is pre-generated so we simulate streaming)
      for (const char of response) {
        io.to(sessionId).emit('chat:stream', { sessionId, chunk: char });
        await new Promise((r) => setTimeout(r, 8)); // 8ms per char
      }

      io.to(sessionId).emit('chat:done', { sessionId, fullResponse: response });
    } catch (err) {
      console.error('chat:start error:', err);
      socket.emit('chat:error', { message: 'Failed to start interview' });
    }
  });

  // ── chat:message — candidate sends a message ───────────────────────────────
  socket.on('chat:message', async ({ sessionId, content }) => {
    if (!content?.trim()) return;

    try {
      const session = await assertCandidateSession(socket, sessionId);
      if (!session) return;

      // echo the candidate's message to observers in the room
      socket.to(sessionId).emit('chat:user', { sessionId, content });

      let fullResponse = '';

      await handleChatMessage(sessionId, content, (chunk) => {
        fullResponse += chunk;
        io.to(sessionId).emit('chat:stream', { sessionId, chunk });
      });

      io.to(sessionId).emit('chat:done', { sessionId, fullResponse });

    } catch (err) {
      console.error('chat:message error:', err);
      socket.emit('chat:error', {
        message: 'AI is temporarily unavailable. Please try again.'
      });
    }
  });

  // ── code:review — candidate submits code for AI review ────────────────────
  socket.on('code:review', async ({ sessionId, language, code }) => {
    if (!code?.trim()) return;

    try {
      const session = await assertCandidateSession(socket, sessionId);
      if (!session) return;

      let fullResponse = '';

      await handleCodeReview(sessionId, language, code, (chunk) => {
        fullResponse += chunk;
        io.to(sessionId).emit('chat:stream', { sessionId, chunk });
      });

      io.to(sessionId).emit('chat:done', { sessionId, fullResponse });

    } catch (err) {
      console.error('code:review error:', err);
      socket.emit('chat:error', {
        message: 'Code review failed. Please try again.'
      });
    }
  });

  // ── session:evaluate — generate AI evaluation for one candidate session ────
  socket.on('session:evaluate', async ({ sessionId }) => {
    try {
      socket.emit('evaluation:processing', { sessionId });

      const evaluation = await generateEvaluation(sessionId);

      // emit to everyone in the room (candidate + any observers) with the DB id
      io.to(sessionId).emit('evaluation:done', {
        sessionId,
        evaluationId: evaluation.id,
        evaluation
      });

    } catch (err) {
      console.error('session:evaluate error:', err);
      socket.emit('chat:error', { message: 'Evaluation failed. Please try again.' });
    }
  });
}

module.exports = { registerChatHandlers };
