const redis = require('../config/redis');
const prisma = require('../config/db');

const TIMER_DURATION = 60 * 60; // 60 minutes in seconds

function registerSessionHandlers(io, socket) {
  const userId = socket.user.userId;

  // ── session:join ────────────────────────────────────────────────────────────
  // Frontend emits this when a candidate enters an interview room
  socket.on('session:join', async ({ sessionId }) => {
    try {
      // verify session exists and user belongs to it
      const session = await prisma.session.findFirst({
        where: {
          id: sessionId,
          candidateId: userId
        }
      });

      if (!session) {
        socket.emit('session:error', { message: 'Session not found or access denied' });
        return;
      }

      // join the Socket.io room for this session
      socket.join(sessionId);

      // persist socketId in Redis so we can find this socket on reconnect
      await redis.hset(`socket:session:${sessionId}`, userId, socket.id);
      await redis.expire(`socket:session:${sessionId}`, 60 * 60 * 24); // 24hr TTL

      // track which session this socket belongs to (for disconnect cleanup)
      await redis.set(`socket:user:${socket.id}`, sessionId, 'EX', 60 * 60 * 24);

      // if session is still WAITING, mark it as ACTIVE
      if (session.status === 'WAITING') {
        await prisma.session.update({
          where: { id: sessionId },
          data: { status: 'ACTIVE', startedAt: new Date() }
        });

        // start the session timer
        startSessionTimer(io, sessionId, TIMER_DURATION);

        // notify everyone in the room the session has started
        io.to(sessionId).emit('session:start', {
          sessionId,
          startedAt: new Date()
        });

        console.log(`Session ${sessionId} started`);
      } else {
        // candidate is reconnecting — restore state
        const remaining = await redis.get(`timer:${sessionId}`);

        socket.emit('session:reconnected', {
          sessionId,
          status: session.status,
          remainingSeconds: remaining ? parseInt(remaining) : null
        });

        console.log(`User ${userId} reconnected to session ${sessionId}`);
      }

      // notify peers in the room this user is back
      socket.to(sessionId).emit('user:online', { userId });

    } catch (err) {
      console.error('session:join error:', err);
      socket.emit('session:error', { message: 'Failed to join session' });
    }
  });

  // ── session:end ─────────────────────────────────────────────────────────────
  socket.on('session:end', async ({ sessionId }) => {
    try {
      await prisma.session.update({
        where: { id: sessionId },
        data: { status: 'COMPLETED', endedAt: new Date() }
      });

      // stop the timer
      await redis.del(`timer:${sessionId}`);

      // notify everyone in the room
      io.to(sessionId).emit('session:ended', {
        sessionId,
        endedAt: new Date()
      });

      // clean up Redis presence
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
      // find which session this socket was in
      const sessionId = await redis.get(`socket:user:${socket.id}`);
      if (!sessionId) return;

      // remove this socket from the session's presence map
      await redis.hdel(`socket:session:${sessionId}`, userId);
      await redis.del(`socket:user:${socket.id}`);

      // mark session as ABANDONED if no sockets remain in the room
      const roomSockets = await io.in(sessionId).fetchSockets();
      if (roomSockets.length === 0) {
        // give a 30 second grace period before marking abandoned
        // (client might reconnect quickly)
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

      // notify peers this user went offline
      socket.to(sessionId).emit('user:offline', { userId });

    } catch (err) {
      console.error('disconnect cleanup error:', err);
    }
  });
}

// ── Session timer ─────────────────────────────────────────────────────────────

function startSessionTimer(io, sessionId, durationSeconds) {
  let remaining = durationSeconds;

  // store initial remaining time in Redis
  redis.set(`timer:${sessionId}`, remaining, 'EX', durationSeconds + 60);

  const interval = setInterval(async () => {
    remaining -= 60; // tick every 60 seconds

    if (remaining <= 0) {
      clearInterval(interval);
      await redis.del(`timer:${sessionId}`);

      io.to(sessionId).emit('session:timer', { sessionId, remaining: 0 });
      io.to(sessionId).emit('session:timeout', { sessionId });
      return;
    }

    // update Redis with current remaining time
    await redis.set(`timer:${sessionId}`, remaining, 'EX', remaining + 60);

    // emit to everyone in the room every minute
    io.to(sessionId).emit('session:timer', { sessionId, remaining });

  }, 60 * 1000); // every 60 seconds
}

module.exports = { registerSessionHandlers };