require('dotenv').config();
const express = require('express');
const http = require('http');
const cors = require('cors');
const { initSocket } = require('./src/socket/index');
const { authLimiter, apiLimiter } = require('./src/middleware/rateLimiter');

const app = express();

app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json());

// ── Rate limiting ─────────────────────────────────────────────────────────────
app.use('/auth', authLimiter);          // 10 req/min per IP
app.use('/sessions', apiLimiter);       // 120 req/min per user
app.use('/analytics', apiLimiter);      // 120 req/min per user

// ── Routes ────────────────────────────────────────────────────────────────────
app.use('/auth', require('./src/routes/auth'));
app.use('/sessions', require('./src/routes/sessions'));

// ── Health check ──────────────────────────────────────────────────────────────
app.get('/health', (req, res) => res.json({ status: 'ok' }));

const httpServer = http.createServer(app);
initSocket(httpServer);

const PORT = process.env.PORT || 3000;
httpServer.listen(PORT, () => console.log(`Backend running on port ${PORT}`));
