const redis = require('../config/redis');
const prisma = require('../config/db');

const TIMER_DURATION = 60 * 60; // 60 minutes in seconds

function registerSessionHandlers(io, socket) {
  const userId = socket.user.userId;
  const userRole = socket.user.role;

  // ── session:join ────────────────────────────────────────────────────────────
  socket.on('session:join', async ({ sessionId }) => {
    try {
      const session = await prisma.session.findUnique({ where: { id: sessionId } });

      if (!session) {
        socket.emit('session:error', { message: 'Session not found' });
        return;
      }

      // Candidate can only join a session they own (either practice or invited)
      if (userRole === 'CANDIDATE' && session.candidateId !== userId) {
        socket.emit('session:error', { message: 'Access denied' });
        return;
      }

      // Interviewer can only join sessions they created
      if (userRole === 'INTERVIEWER' && session.interviewerId !== userId) {
        socket.emit('session:error', { message: 'Access denied' });
        return;
      }

      socket.join(sessionId);

      await redis.hset(`socket:session:${sessionId}`, userId, socket.id);
      await redis.expire(`socket:session:${sessionId}`, 60 * 60 * 24);
      await redis.set(`socket:user:${socket.id}`, sessionId, 'EX', 60 * 60 * 24);

      // Start the session when the candidate joins a WAITING session
      if (session.status === 'WAITING' && userRole === 'CANDIDATE') {
        await prisma.session.update({
          where: { id: sessionId },
          data: { status: 'ACTIVE', startedAt: new Date() }
        });

        startSessionTimer(io, sessionId, TIMER_DURATION);

        io.to(sessionId).emit('session:start', { sessionId, startedAt: new Date() });
        console.log(`Session ${sessionId} started`);
      } else {
        const remaining = await redis.get(`timer:${sessionId}`);
        socket.emit('session:reconnected', {
          sessionId,
          status: session.status,
          remainingSeconds: remaining ? parseInt(remaining) : null
        });
        console.log(`User ${userId} reconnected to session ${sessionId}`);
      }

      socket.to(sessionId).emit('user:online', { userId });

    } catch (err) {
      console.error('session:join error:', err);
      socket.emit('session:error', { message: 'Failed to join session' });
    }
  });

  // ── session:end ─────────────────────────────────────────────────────────────
  socket.on('session:end', async ({ sessionId }) => {
    try {
      const session = await prisma.session.findUnique({ where: { id: sessionId } });

      if (!session) {
        socket.emit('session:error', { message: 'Session not found' });
        return;
      }

      // Only the candidate or the interviewer who owns the session can end it
      const isCandidate = userRole === 'CANDIDATE' && session.candidateId === userId;
      const isInterviewer = (userRole === 'INTERVIEWER' || userRole === 'ADMIN') && session.interviewerId === userId;

      if (!isCandidate && !isInterviewer) {
        socket.emit('session:error', { message: 'Not authorized to end this session' });
        return;
      }

      await prisma.session.update({
        where: { id: sessionId },
        data: { status: 'COMPLETED', endedAt: new Date() }
      });

      await redis.del(`timer:${sessionId}`);

      io.to(sessionId).emit('session:ended', { sessionId, endedAt: new Date() });
      await redis.hdel(`socket:session:${sessionId}`, userId);

      console.log(`Session ${sessionId} ended by user ${userId}`);
    } catch (err) {
      console.error('session:end error:', err);
      socket.emit('session:error', { message: 'Failed to end session' });
    }
  });

  // ── disconnect ──────────────────────────────────────────────────────────────
  socket.on('disconnect', async () => {
    try {
      const sessionId = await redis.get(`socket:user:${socket.id}`);
      if (!sessionId) return;

      await redis.hdel(`socket:session:${sessionId}`, userId);
      await redis.del(`socket:user:${socket.id}`);

      const roomSockets = await io.in(sessionId).fetchSockets();
      if (roomSockets.length === 0) {
        setTimeout(async () => {
          const stillEmpty = (await io.in(sessionId).fetchSockets()).length === 0;
          if (stillEmpty) {
            await prisma.session.updateMany({
              where: { id: sessionId, status: 'ACTIVE' },
              data: { status: 'ABANDONED' }
            });
            console.log(`Session ${sessionId} marked as ABANDONED`);
          }
        }, 30000);
      }

      socket.to(sessionId).emit('user:offline', { userId });

    } catch (err) {
      console.error('disconnect cleanup error:', err);
    }
  });
}

// ── Session timer ─────────────────────────────────────────────────────────────

function startSessionTimer(io, sessionId, durationSeconds) {
  let remaining = durationSeconds;

  redis.set(`timer:${sessionId}`, remaining, 'EX', durationSeconds + 60);

  const interval = setInterval(async () => {
    remaining -= 60;

    if (remaining <= 0) {
      clearInterval(interval);
      await redis.del(`timer:${sessionId}`);

      await prisma.session.updateMany({
        where: { id: sessionId, status: 'ACTIVE' },
        data: { status: 'COMPLETED', endedAt: new Date() }
      });

      io.to(sessionId).emit('session:timer', { sessionId, remaining: 0 });
      io.to(sessionId).emit('session:timeout', { sessionId });
      return;
    }

    await redis.set(`timer:${sessionId}`, remaining, 'EX', remaining + 60);
    io.to(sessionId).emit('session:timer', { sessionId, remaining });

  }, 60 * 1000);
}

module.exports = { registerSessionHandlers };
