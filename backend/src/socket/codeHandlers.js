const prisma = require('../config/db');
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
      // tell the room execution has started (candidate + observers)
      io.to(sessionId).emit('code:running', { sessionId });

      const result = await executeAndSave(sessionId, language, code, stdin);

      io.to(sessionId).emit('code:result', { sessionId, result });

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
      io.to(sessionId).emit('code:running', { sessionId });
      const result = await executeAndSave(sessionId, language, code, stdin);
      io.to(sessionId).emit('code:result', { sessionId, result });

      // step 2 — AI review streams back via chat:stream
      io.to(sessionId).emit('chat:reviewing', { sessionId });

      await handleCodeReview(sessionId, language, code, (chunk) => {
        io.to(sessionId).emit('chat:stream', { sessionId, chunk });
      });

      io.to(sessionId).emit('chat:done', { sessionId });

    } catch (err) {
      console.error('code:execute_and_review error:', err);
      socket.emit('code:error', { message: 'Execution or review failed' });
    }
  });

  // ── code:sync — candidate broadcasts live editor state to observers ────────
  // Only the candidate of the session may broadcast; observers (interviewer)
  // receive it through their room membership and render it read-only.
  socket.on('code:sync', async ({ sessionId, code, language }) => {
    try {
      const session = await prisma.session.findUnique({ where: { id: sessionId } });
      if (!session) return;
      if (socket.user.role !== 'CANDIDATE' || session.candidateId !== socket.user.userId) {
        return; // observers never push edits
      }
      socket.to(sessionId).emit('code:sync', { sessionId, code, language });
    } catch (err) {
      console.error('code:sync error:', err);
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
