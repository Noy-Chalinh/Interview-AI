const jwt = require('jsonwebtoken');

// ── HTTP middleware (existing) ─────────────────────────────────────────────────

async function authenticate(req, res, next) {
  const header = req.headers.authorization;

  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }

  const token = header.replace('Bearer ', '');

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired' });
    }
    return res.status(401).json({ error: 'Invalid token' });
  }
}

// ── Socket.io middleware (new) ────────────────────────────────────────────────

function authenticateSocket(socket, next) {
  // frontend sends token in socket auth: { token: '...' }
  const token = socket.handshake.auth?.token;

  if (!token) {
    return next(new Error('No token provided'));
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.user = decoded; // attach to socket for use in handlers
    next();
  } catch (err) {
    next(new Error('Invalid or expired token'));
  }
}

module.exports = { authenticate, authenticateSocket };