const Redis = require('ioredis');

const redis = new Redis(process.env.REDIS_URL, {
  lazyConnect: true,
  enableOfflineQueue: false,
  maxRetriesPerRequest: 1,
});

redis.on('connect', () => console.log('Redis connected'));
redis.on('error', (err) => console.error('Redis error:', err.message));

redis.connect().catch(err => console.error('Redis initial connect failed (non-fatal):', err.message));

module.exports = redis;
