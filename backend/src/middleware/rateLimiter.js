const redis = require('../config/redis');

// ── Redis sliding window rate limiter ─────────────────────────────────────────
//
// Uses a sorted set per key where each member is a unique request ID and
// the score is the request timestamp (ms). On each request:
//   1. Remove all entries older than the window.
//   2. Count remaining entries.
//   3. If count >= limit → 429.
//   4. Otherwise add the current request and set TTL.
//
// Options:
//   windowMs  — sliding window size in milliseconds (default 60 000)
//   max       — max requests per window (default 60)
//   keyPrefix — Redis key prefix (default 'rl')
//   keyFn     — (req) => string   key discriminator (default: IP + route)
//
// Usage:
//   app.use('/auth', rateLimiter({ max: 10, windowMs: 60_000 }), authRouter);
//   app.use(rateLimiter());  // global default

function rateLimiter({
  windowMs  = 60 * 1000,
  max       = 60,
  keyPrefix = 'rl',
  keyFn     = null,
} = {}) {
  return async function slidingWindowLimiter(req, res, next) {
    const ip = req.ip || req.socket?.remoteAddress || 'unknown';

    let discriminator;
    if (keyFn) {
      discriminator = keyFn(req);
    } else {
      // authenticated requests key on userId so limits are per-user not per-IP
      const userId = req.user?.userId;
      discriminator = userId ? `user:${userId}` : `ip:${ip}`;
    }

    const key = `${keyPrefix}:${discriminator}`;
    const now = Date.now();
    const windowStart = now - windowMs;

    try {
      const pipe = redis.pipeline();

      // remove expired entries
      pipe.zremrangebyscore(key, '-inf', windowStart);
      // count remaining
      pipe.zcard(key);
      // add this request (score = now, member = now:random for uniqueness)
      pipe.zadd(key, now, `${now}:${Math.random().toString(36).slice(2)}`);
      // reset TTL to keep the key alive for one window after last request
      pipe.pexpire(key, windowMs);

      const results = await pipe.exec();
      // results[1] is [err, count] from zcard (before this request is added)
      const count = results[1][1];

      const remaining = Math.max(0, max - count - 1);
      const resetAt   = new Date(now + windowMs).toISOString();

      res.setHeader('X-RateLimit-Limit', max);
      res.setHeader('X-RateLimit-Remaining', remaining);
      res.setHeader('X-RateLimit-Reset', resetAt);

      if (count >= max) {
        res.setHeader('Retry-After', Math.ceil(windowMs / 1000));
        return res.status(429).json({
          error: 'Too many requests',
          retryAfter: Math.ceil(windowMs / 1000),
          resetAt,
        });
      }

      next();
    } catch (err) {
      // Redis unavailable — fail open so a Redis outage doesn't take down the API
      console.error('rateLimiter Redis error (failing open):', err.message);
      next();
    }
  };
}

// ── Pre-built limiters for common use cases ───────────────────────────────────

// Auth endpoints: 10 attempts per minute per IP (brute-force protection)
const authLimiter = rateLimiter({
  windowMs:  60 * 1000,
  max:       10,
  keyPrefix: 'rl:auth',
  keyFn:     (req) => `ip:${req.ip || 'unknown'}`,
});

// General API: 120 requests per minute per user/IP
const apiLimiter = rateLimiter({
  windowMs:  60 * 1000,
  max:       120,
  keyPrefix: 'rl:api',
});

// AI / code execution: 20 per minute per user (expensive operations)
const heavyLimiter = rateLimiter({
  windowMs:  60 * 1000,
  max:       20,
  keyPrefix: 'rl:heavy',
});

module.exports = { rateLimiter, authLimiter, apiLimiter, heavyLimiter };
