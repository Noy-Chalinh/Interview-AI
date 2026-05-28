const express = require('express');
const prisma = require('../config/db');
const { authenticate } = require('../middleware/auth');
const { requireRole } = require('../middleware/roleGuard');

const router = express.Router();

// ── GET /analytics/overview ───────────────────────────────────────────────────
// Aggregated platform stats — interviewers/admins only.
// Returns: total sessions, avg score, completion rate, top languages.

router.get('/overview', authenticate, requireRole('INTERVIEWER', 'ADMIN'), async (req, res) => {
  try {
    const [
      totalSessions,
      completedSessions,
      activeSessions,
      abandonedSessions,
      scoreAgg,
      topLanguages,
      recentSessions,
    ] = await Promise.all([
      // total sessions ever created
      prisma.session.count(),

      // sessions that reached COMPLETED
      prisma.session.count({ where: { status: 'COMPLETED' } }),

      // currently ACTIVE
      prisma.session.count({ where: { status: 'ACTIVE' } }),

      // abandoned sessions
      prisma.session.count({ where: { status: 'ABANDONED' } }),

      // avg + min + max evaluation score across all evaluations
      prisma.evaluation.aggregate({
        _avg: { score: true },
        _min: { score: true },
        _max: { score: true },
        _count: { score: true },
      }),

      // top languages from code submissions — group by language, count desc
      prisma.codeSubmission.groupBy({
        by: ['language'],
        _count: { language: true },
        orderBy: { _count: { language: 'desc' } },
        take: 5,
      }),

      // 7 most recent sessions with candidate name and score
      prisma.session.findMany({
        take: 7,
        orderBy: { createdAt: 'desc' },
        include: {
          candidate: { select: { id: true, name: true, email: true } },
          evaluation: { select: { score: true } },
        },
      }),
    ]);

    const completionRate = totalSessions > 0
      ? Math.round((completedSessions / totalSessions) * 100)
      : 0;

    res.json({
      sessions: {
        total: totalSessions,
        completed: completedSessions,
        active: activeSessions,
        abandoned: abandonedSessions,
        completionRate,
      },
      scores: {
        avg: scoreAgg._avg.score !== null
          ? Math.round(scoreAgg._avg.score * 10) / 10
          : null,
        min: scoreAgg._min.score,
        max: scoreAgg._max.score,
        evaluated: scoreAgg._count.score,
      },
      topLanguages: topLanguages.map((l) => ({
        language: l.language,
        submissions: l._count.language,
      })),
      recentSessions: recentSessions.map((s) => ({
        id: s.id,
        status: s.status,
        createdAt: s.createdAt,
        startedAt: s.startedAt,
        endedAt: s.endedAt,
        candidate: s.candidate,
        score: s.evaluation?.score ?? null,
      })),
    });
  } catch (err) {
    console.error('analytics:overview error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ── GET /analytics/sessions ───────────────────────────────────────────────────
// Full session history for the authenticated user.
// Candidates see only their own; interviewers/admins see all.
// Supports ?status=COMPLETED&page=1&limit=20

router.get('/sessions', authenticate, async (req, res) => {
  try {
    const { userId, role } = req.user;
    const { status, page = '1', limit = '20' } = req.query;

    const pageNum  = Math.max(1, parseInt(page, 10) || 1);
    const pageSize = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
    const skip     = (pageNum - 1) * pageSize;

    const where = {};

    // candidates only see their own sessions
    if (role === 'CANDIDATE') {
      where.candidateId = userId;
    }

    // optional status filter
    const validStatuses = ['WAITING', 'ACTIVE', 'COMPLETED', 'ABANDONED'];
    if (status && validStatuses.includes(status.toUpperCase())) {
      where.status = status.toUpperCase();
    }

    const [sessions, total] = await Promise.all([
      prisma.session.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
        include: {
          candidate: { select: { id: true, name: true, email: true } },
          evaluation: { select: { score: true, feedback: true, metrics: true } },
          _count: {
            select: { messages: true, submissions: true },
          },
        },
      }),
      prisma.session.count({ where }),
    ]);

    const formatted = sessions.map((s) => {
      const durationSeconds =
        s.startedAt && s.endedAt
          ? Math.round((new Date(s.endedAt) - new Date(s.startedAt)) / 1000)
          : null;

      return {
        id: s.id,
        roomCode: s.roomCode,
        status: s.status,
        createdAt: s.createdAt,
        startedAt: s.startedAt,
        endedAt: s.endedAt,
        durationSeconds,
        candidate: s.candidate,
        messageCount: s._count.messages,
        submissionCount: s._count.submissions,
        evaluation: s.evaluation ?? null,
      };
    });

    res.json({
      sessions: formatted,
      pagination: {
        total,
        page: pageNum,
        limit: pageSize,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  } catch (err) {
    console.error('analytics:sessions error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
