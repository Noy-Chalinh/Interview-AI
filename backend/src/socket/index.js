const { Server } = require('socket.io');
const { authenticateSocket } = require('../middleware/auth');
const { registerSessionHandlers } = require('./sessionHandlers');
const { registerChatHandlers } = require('./chatHandlers');
const { registerCodeHandlers } = require('./codeHandlers');

function initSocket(httpServer) {
  const io = new Server(httpServer, {
    cors: {
      origin: process.env.CLIENT_URL || 'http://localhost:5173',
      methods: ['GET', 'POST'],
      credentials: true
    },
    pingTimeout: 60000,
    pingInterval: 25000
  });

  io.use(authenticateSocket);

  io.on('connection', (socket) => {
    console.log(`Socket connected: ${socket.id} | user: ${socket.user.userId}`);

    registerSessionHandlers(io, socket);
    registerChatHandlers(io, socket);
    registerCodeHandlers(io, socket);

    socket.on('disconnect', (reason) => {
      console.log(`Socket disconnected: ${socket.id} | reason: ${reason}`);
    });
  });

  return io;
}

module.exports = { initSocket };