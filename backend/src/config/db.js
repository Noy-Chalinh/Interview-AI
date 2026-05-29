const { PrismaClient } = require('@prisma/client');

const url = process.env.DATABASE_URL || '';

// Neon serverless (prod) talks over WebSockets; a plain local/Docker Postgres
// talks over TCP. Pick the matching driver adapter so the app runs in both.
const isNeon = /\.neon\.tech|neon\.tech|\.neon\./i.test(url);

let adapter;
if (isNeon) {
  const { PrismaNeon } = require('@prisma/adapter-neon');
  adapter = new PrismaNeon({ connectionString: url });
} else {
  const { PrismaPg } = require('@prisma/adapter-pg');
  adapter = new PrismaPg({ connectionString: url });
}

const prisma = new PrismaClient({ adapter });

module.exports = prisma;
