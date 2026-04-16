import 'dotenv/config';
import Fastify from 'fastify';
import fastifyCookie from '@fastify/cookie';
import fastifySession from '@fastify/session';
import fastifyView from '@fastify/view';
import fastifyStatic from '@fastify/static';
import fastifyFormbody from '@fastify/formbody';
import ejs from 'ejs';
import path from 'path';
import { fileURLToPath } from 'url';

import { runMigrations } from './models/migrate.js';
import { initializeAdminUser } from './models/user.js';
import { loadUser } from './middleware/auth.js';

import authRoutes from './routes/auth.js';
import dashboardRoutes from './routes/dashboard.js';
import walletsRoutes from './routes/wallets.js';
import apiWalletsRoutes from './routes/api/wallets.js';
import apiPortfolioRoutes from './routes/api/portfolio.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ── Guards ───────────────────────────────────────
if (!process.env.SESSION_SECRET || process.env.SESSION_SECRET.length < 32) {
  console.error('[server] FATAL: SESSION_SECRET must be set to at least 32 characters');
  console.error('[server] Generate one with: node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))"');
  process.exit(1);
}

// ── Fastify ──────────────────────────────────────
const fastify = Fastify({ logger: true });

// ── Plugins ──────────────────────────────────────
await fastify.register(fastifyCookie);
await fastify.register(fastifySession, {
  secret: process.env.SESSION_SECRET,
  cookie: {
    secure: false,
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  },
});
await fastify.register(fastifyFormbody);
await fastify.register(fastifyView, {
  engine: { ejs },
  root: path.join(__dirname, 'views'),
});
await fastify.register(fastifyStatic, {
  root: path.join(__dirname, '../public'),
  prefix: '/static/',
});

// ── Global hook — load user from session ─────────
fastify.addHook('onRequest', loadUser);

// ── Routes ───────────────────────────────────────
await fastify.register(authRoutes);
await fastify.register(dashboardRoutes);
await fastify.register(walletsRoutes);
await fastify.register(apiWalletsRoutes, { prefix: '/api/wallets' });
await fastify.register(apiPortfolioRoutes, { prefix: '/api/portfolio' });

// ── Start ────────────────────────────────────────
const PORT = parseInt(process.env.PORT || '3000', 10);
const HOST = process.env.HOST || '0.0.0.0';

async function start() {
  await runMigrations();
  await initializeAdminUser(process.env.ADMIN_PASSWORD || 'sigue2026');
  await fastify.listen({ port: PORT, host: HOST });
  console.log(`[server] Sigue Wallet running on http://${HOST}:${PORT}`);
}

start().catch((err) => {
  console.error(err);
  process.exit(1);
});
