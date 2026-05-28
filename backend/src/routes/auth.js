require('dotenv').config();
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const prisma = require('../config/db');
const redis = require('../config/redis');

const router = express.Router();
const SALT_ROUNDS = 12;

// ── Helpers ───────────────────────────────────────────────────────────────────

function signAccessToken(user) {
  return jwt.sign(
    { userId: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN }
  );
}

async function createRefreshToken(userId) {
  const raw = crypto.randomBytes(40).toString('hex');
  const hash = crypto.createHash('sha256').update(raw).digest('hex');
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  await prisma.refreshToken.create({
    data: { userId, tokenHash: hash, expiresAt }
  });

  return raw;
}

function safeUser(user) {
  const { passwordHash, ...rest } = user;
  return rest;
}

// ── POST /auth/register ───────────────────────────────────────────────────────

router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role = 'CANDIDATE' } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'name, email and password are required' });
    }

    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }

    if (!['CANDIDATE', 'INTERVIEWER'].includes(role)) {
      return res.status(400).json({ error: 'Role must be CANDIDATE or INTERVIEWER' });
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    const user = await prisma.user.create({
      data: { name, email, passwordHash, role }
    });

    const accessToken = signAccessToken(user);
    const refreshToken = await createRefreshToken(user.id);

    res.status(201).json({ accessToken, refreshToken, user: safeUser(user) });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ── POST /auth/login ──────────────────────────────────────────────────────────

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'email and password are required' });
    }

    const user = await prisma.user.findUnique({ where: { email } });

    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const accessToken = signAccessToken(user);
    const refreshToken = await createRefreshToken(user.id);

    await redis.setex(
      `session:${user.id}`,
      60 * 60 * 24,
      JSON.stringify({ userId: user.id, email: user.email, role: user.role })
    ).catch(err => console.error('Redis setex error (non-fatal):', err.message));

    res.json({ accessToken, refreshToken, user: safeUser(user) });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ── POST /auth/refresh ────────────────────────────────────────────────────────

router.post('/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({ error: 'Refresh token required' });
    }

    const hash = crypto.createHash('sha256').update(refreshToken).digest('hex');

    const stored = await prisma.refreshToken.findFirst({
      where: {
        tokenHash: hash,
        expiresAt: { gt: new Date() }
      },
      include: { user: true }
    });

    if (!stored) {
      return res.status(401).json({ error: 'Invalid or expired refresh token' });
    }

    await prisma.refreshToken.delete({ where: { id: stored.id } });

    const accessToken = signAccessToken(stored.user);
    const newRefreshToken = await createRefreshToken(stored.user.id);

    res.json({ accessToken, refreshToken: newRefreshToken });
  } catch (err) {
    console.error('Refresh error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ── POST /auth/logout ─────────────────────────────────────────────────────────

router.post('/logout', async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (refreshToken) {
      const hash = crypto.createHash('sha256').update(refreshToken).digest('hex');
      await prisma.refreshToken.deleteMany({ where: { tokenHash: hash } });
    }

    const header = req.headers.authorization;
    if (header) {
      try {
        const decoded = jwt.verify(
          header.replace('Bearer ', ''),
          process.env.JWT_SECRET
        );
        await redis.del(`session:${decoded.userId}`).catch(err => console.error('Redis del error (non-fatal):', err.message));
      } catch (_) {}
    }

    res.json({ message: 'Logged out successfully' });
  } catch (err) {
    console.error('Logout error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;