const express = require('express');
const prisma = require('../config/db');
const { authenticate } = require('../middleware/auth');
const { requireRole } = require('../middleware/roleGuard');

const router = express.Router();

// ── POST /sessions — create a new interview session ───────────────────────────
// Only interviewers and admins can create sessions
router.post('/', authenticate, async (req, res) => {
  try {
    const { userId, role } = req.user;
    const { candidateId, candidateEmail } = req.body;

    let resolvedCandidateId = candidateId;

    // Candidates can create their own practice session (no body needed)
    if (role === 'CANDIDATE') {
      resolvedCandidateId = userId;
    } else if (role === 'INTERVIEWER' || role === 'ADMIN') {
      if (!resolvedCandidateId && candidateEmail) {
        const found = await prisma.user.findUnique({ where: { email: candidateEmail } });
        if (!found || found.role !== 'CANDIDATE') {
          return res.status(404).json({ error: 'Candidate not found' });
        }
        resolvedCandidateId = found.id;
      }
      if (!resolvedCandidateId) {
        return res.status(400).json({ error: 'candidateId or candidateEmail is required' });
      }
    } else {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const candidate = await prisma.user.findUnique({ where: { id: resolvedCandidateId } });
    if (!candidate || candidate.role !== 'CANDIDATE') {
      return res.status(404).json({ error: 'Candidate not found' });
    }

    const session = await prisma.session.create({
      data: { candidateId: resolvedCandidateId },
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