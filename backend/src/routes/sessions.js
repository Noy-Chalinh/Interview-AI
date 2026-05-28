const express = require('express');
const prisma = require('../config/db');
const { authenticate } = require('../middleware/auth');
const { requireRole } = require('../middleware/roleGuard');

const router = express.Router();

// ── POST /sessions — create a new interview session ───────────────────────────
// Only interviewers and admins can create sessions
router.post('/', authenticate, requireRole('INTERVIEWER', 'ADMIN'), async (req, res) => {
  try {
    const { candidateId } = req.body;

    if (!candidateId) {
      return res.status(400).json({ error: 'candidateId is required' });
    }

    // verify candidate exists
    const candidate = await prisma.user.findUnique({
      where: { id: candidateId }
    });

    if (!candidate || candidate.role !== 'CANDIDATE') {
      return res.status(404).json({ error: 'Candidate not found' });
    }

    const session = await prisma.session.create({
      data: { candidateId },
      include: { candidate: { select: { id: true, name: true, email: true } } }
    });

    res.status(201).json({ session });
  } catch (err) {
    console.error('Create session error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ── GET /sessions — list sessions for the logged-in user ─────────────────────
router.get('/', authenticate, async (req, res) => {
  try {
    const { userId, role } = req.user;

    const sessions = await prisma.session.findMany({
      where: role === 'CANDIDATE' ? { candidateId: userId } : {},
      include: {
        candidate: { select: { id: true, name: true, email: true } },
        evaluation: { select: { score: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ sessions });
  } catch (err) {
    console.error('List sessions error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ── GET /sessions/:id — get one session ──────────────────────────────────────
router.get('/:id', authenticate, async (req, res) => {
  try {
    const session = await prisma.session.findUnique({
      where: { id: req.params.id },
      include: {
        candidate: { select: { id: true, name: true, email: true } },
        messages: { orderBy: { createdAt: 'asc' } },
        evaluation: true
      }
    });

    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    res.json({ session });
  } catch (err) {
    console.error('Get session error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;