const { executeAndSave, getSupportedLanguages } = require('../services/codeService');
const { handleCodeReview } = require('../services/aiService');

function registerCodeHandlers(io, socket) {

  // ── code:execute — run the code and return result ──────────────────────────
  socket.on('code:execute', async ({ sessionId, language, code, stdin }) => {
    if (!code?.trim()) {
      socket.emit('code:error', { message: 'No code provided' });
      return;
    }

    try {
      // tell the client execution has started
      socket.emit('code:running', { sessionId });

      const result = await executeAndSave(sessionId, language, code, stdin);

      socket.emit('code:result', { sessionId, result });

    } catch (err) {
      console.error('code:execute error:', err);
      socket.emit('code:error', { message: 'Code execution failed' });
    }
  });

  // ── code:execute_and_review — run code then send to AI for review ──────────
  socket.on('code:execute_and_review', async ({ sessionId, language, code, stdin }) => {
    if (!code?.trim()) {
      socket.emit('code:error', { message: 'No code provided' });
      return;
    }

    try {
      // step 1 — execute
      socket.emit('code:running', { sessionId });
      const result = await executeAndSave(sessionId, language, code, stdin);
      socket.emit('code:result', { sessionId, result });

      // step 2 — AI review streams back via chat:stream
      socket.emit('chat:reviewing', { sessionId });

      await handleCodeReview(sessionId, language, code, (chunk) => {
        socket.emit('chat:stream', { sessionId, chunk });
      });

      socket.emit('chat:done', { sessionId });

    } catch (err) {
      console.error('code:execute_and_review error:', err);
      socket.emit('code:error', { message: 'Execution or review failed' });
    }
  });

  // ── code:languages — return list of supported languages ───────────────────
  socket.on('code:languages', () => {
    socket.emit('code:languages_list', {
      languages: getSupportedLanguages()
    });
  });
}

module.exports = { registerCodeHandlers };