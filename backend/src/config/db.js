const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');

const url = process.env.DATABASE_URL || '';

// Use the standard TCP `pg` adapter everywhere — Neon (prod), local Docker, and
// plain Postgres all speak TCP. We deliberately avoid the Neon serverless
// WebSocket driver: it needs a WebSocket constructor that doesn't exist in a
// normal Node process (Render runs a long-lived Node server, not an edge
// runtime), which otherwise fails with "All attempts to open a WebSocket ...".
const adapter = new PrismaPg({ connectionString: url });

const prisma = new PrismaClient({ adapter });

module.exports = prisma;
