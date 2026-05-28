const {
  handleChatMessage,
  handleCodeReview,
  generateEvaluation,
  generateOpeningQuestion
} = require('../services/aiService');

function registerChatHandlers(io, socket) {
  const userId = socket.user.userId;

  // ── chat:start — emit opening question when session begins ─────────────────
  socket.on('chat:start', async ({ sessionId }) => {
    try {
      socket.emit('chat:stream', { sessionId, chunk: '' }); // signal start

      let fullResponse = '';
      const response = await generateOpeningQuestion(sessionId);

      // stream it chunk by chunk to feel real-time
      // (opening question is pre-generated so we simulate streaming)
      for (const char of response) {
        fullResponse += char;
        socket.emit('chat:stream', { sessionId, chunk: char });
        await new Promise((r) => setTimeout(r, 8)); // 8ms per char
      }

      socket.emit('chat:done', { sessionId, fullResponse });
    } catch (err) {
      console.error('chat:start error:', err);
      socket.emit('chat:error', { message: 'Failed to start interview' });
    }
  });

  // ── chat:message — candidate sends a message ───────────────────────────────
  socket.on('chat:message', async ({ sessionId, content }) => {
    if (!content?.trim()) return;

    try {
      let fullResponse = '';

      await handleChatMessage(sessionId, content, (chunk) => {
        fullResponse += chunk;
        socket.emit('chat:stream', { sessionId, chunk });
      });

      socket.emit('chat:done', { sessionId, fullResponse });

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
      let fullResponse = '';

      await handleCodeReview(sessionId, language, code, (chunk) => {
        fullResponse += chunk;
        socket.emit('chat:stream', { sessionId, chunk });
      });

      socket.emit('chat:done', { sessionId, fullResponse });

    } catch (err) {
      console.error('code:review error:', err);
      socket.emit('chat:error', {
        message: 'Code review failed. Please try again.'
      });
    }
  });

  // ── session:evaluate — generate AI evaluation when session ends ────────────
  socket.on('session:evaluate', async ({ sessionId }) => {
    try {
      socket.emit('evaluation:processing', { sessionId });

      const evaluation = await generateEvaluation(sessionId);

      if (!evaluation) {
        socket.emit('chat:error', { message: 'Not enough data to evaluate' });
        return;
      }

      // emit to everyone in the room (candidate + any observers)
      io.to(sessionId).emit('evaluation:done', { sessionId, evaluation });

    } catch (err) {
      console.error('session:evaluate error:', err);
      socket.emit('chat:error', { message: 'Evaluation failed. Please try again.' });
    }
  });
}

module.exports = { registerChatHandlers };