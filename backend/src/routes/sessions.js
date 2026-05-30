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

// ── POST /sessions/join — candidate joins an interviewer room via roomCode ────
// The room (parent) session can hold many candidates. Each candidate gets their
// own child session — own transcript, code submissions, and evaluation. Joining
// again returns the candidate's existing child (rejoin), never a duplicate.
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

    const match = await prisma.session.findUnique({
      where: { roomCode: roomCode.trim() }
    });

    if (!match) {
      return res.status(404).json({ error: 'No room found for that code. Double-check the code with your interviewer.' });
    }

    // A joinable room is an interviewer-created top-level session. Reject codes
    // that belong to a candidate practice session or to a child session — those
    // are not rooms, so guide the user instead of failing cryptically.
    if (match.parentId) {
      return res.status(400).json({ error: 'That code belongs to a candidate session, not a room. Ask your interviewer for the room code.' });
    }
    if (!match.interviewerId) {
      return res.status(400).json({ error: 'That code is a private practice session and cannot be joined.' });
    }

    const room = match;

    if (room.status === 'COMPLETED' || room.status === 'ABANDONED') {
      return res.status(400).json({ error: 'This interview room is no longer active.' });
    }

    // Rejoin: return the candidate's existing child session for this room.
    const existing = await prisma.session.findFirst({
      where: { parentId: room.id, candidateId: userId }
    });
    if (existing) {
      return res.json({ session: existing });
    }

    // First join: create a fresh child session for this candidate.
    const child = await prisma.session.create({
      data: {
        parentId: room.id,
        interviewerId: room.interviewerId,
        candidateId: userId
      }
    });

    res.json({ session: child });
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
      // The lobby lists the interviewer's rooms (top-level containers) so they
      // can re-enter the roster. Per-candidate results live in History/Analytics.
      where = { interviewerId: userId, parentId: null };
    }
    // ADMIN sees all sessions

    const sessions = await prisma.session.findMany({
      where,
      include: {
        candidate: { select: { id: true, name: true, email: true } },
        interviewer: { select: { id: true, name: true, email: true } },
        evaluation: { select: { score: true } },
        _count: { select: { children: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ sessions });
  } catch (err) {
    console.error('List sessions error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ── GET /sessions/:id/roster — candidates in an interviewer's room ───────────
// Interviewer/admin only. Returns each child session with its candidate,
// status, activity counts, and score so the room UI can show a live roster.
router.get('/:id/roster', authenticate, async (req, res) => {
  try {
    const { userId, role } = req.user;

    if (role !== 'INTERVIEWER' && role !== 'ADMIN') {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const room = await prisma.session.findUnique({ where: { id: req.params.id } });
    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }
    if (role === 'INTERVIEWER' && room.interviewerId !== userId) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const candidates = await prisma.session.findMany({
      where: { parentId: room.id },
      include: {
        candidate: { select: { id: true, name: true, email: true } },
        evaluation: { select: { id: true, score: true } },
        _count: { select: { messages: true, submissions: true } }
      },
      orderBy: { createdAt: 'asc' }
    });

    res.json({ room, candidates });
  } catch (err) {
    console.error('Roster error:', err);
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
