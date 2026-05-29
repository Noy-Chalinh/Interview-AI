const express = require('express');
const prisma = require('../config/db');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// ── POST /sessions — create a new session ─────────────────────────────────────
// Candidate: creates a private practice session (no body needed)
// Interviewer/Admin: creates an open session — no candidate required upfront;
//   a roomCode is returned which the candidate uses to join later.
router.post('/', authenticate, async (req, res) => {
  try {
    const { userId, role } = req.user;

    if (role === 'CANDIDATE') {
      const session = await prisma.session.create({
        data: { candidateId: userId },
        include: { candidate: { select: { id: true, name: true, email: true } } }
      });
      return res.status(201).json({ session });
    }

    if (role === 'INTERVIEWER' || role === 'ADMIN') {
      const session = await prisma.session.create({
        data: { interviewerId: userId },
        include: { interviewer: { select: { id: true, name: true, email: true } } }
      });
      return res.status(201).json({ session });
    }

    return res.status(403).json({ error: 'Forbidden' });
  } catch (err) {
    console.error('Create session error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ── POST /sessions/join — candidate joins an interviewer session via roomCode ──
router.post('/join', authenticate, async (req, res) => {
  try {
    const { userId, role } = req.user;

    if (role !== 'CANDIDATE') {
      return res.status(403).json({ error: 'Only candidates can join via room code' });
    }

    const { roomCode } = req.body;
    if (!roomCode) {
      return res.status(400).json({ error: 'roomCode is required' });
    }

    const session = await prisma.session.findUnique({
      where: { roomCode: roomCode.trim() }
    });

    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    if (!session.interviewerId) {
      return res.status(400).json({ error: 'This is a private practice session' });
    }

    if (session.candidateId && session.candidateId !== userId) {
      return res.status(409).json({ error: 'Session already has a candidate' });
    }

    if (session.status === 'COMPLETED' || session.status === 'ABANDONED') {
      return res.status(400).json({ error: 'Session is no longer active' });
    }

    // Claim the session if not already claimed by this candidate
    const updated = session.candidateId
      ? session
      : await prisma.session.update({
          where: { id: session.id },
          data: { candidateId: userId }
        });

    res.json({ session: updated });
  } catch (err) {
    console.error('Join session error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ── GET /sessions — list sessions for the logged-in user ─────────────────────
router.get('/', authenticate, async (req, res) => {
  try {
    const { userId, role } = req.user;

    let where = {};
    if (role === 'CANDIDATE') {
      where = { candidateId: userId };
    } else if (role === 'INTERVIEWER') {
      where = { interviewerId: userId };
    }
    // ADMIN sees all sessions

    const sessions = await prisma.session.findMany({
      where,
      include: {
        candidate: { select: { id: true, name: true, email: true } },
        interviewer: { select: { id: true, name: true, email: true } },
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
        interviewer: { select: { id: true, name: true, email: true } },
        messages: { orderBy: { createdAt: 'asc' } },
        evaluation: true
      }
    });

    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    const { userId, role } = req.user;
    if (role === 'CANDIDATE' && session.candidateId !== userId) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    if (role === 'INTERVIEWER' && session.interviewerId !== userId) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    res.json({ session });
  } catch (err) {
    console.error('Get session error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
