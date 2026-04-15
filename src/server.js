import 'dotenv/config';
import Fastify from 'fastify';
import fastifyCookie from '@fastify/cookie';
import fastifySession from '@fastify/session';
import ejs from 'ejs';
import path from 'path';
import { fileURLToPath } from 'url';

import { runMigrations } from './models/migrate.js';
import { initializeAdminUser } from './models/user.js';
import { loadUser } from './middleware/auth.js';

// Routes
import authRoutes from './routes/auth.js';
import dashboardRoutes from './routes/dashboard.js';
import walletsRoutes from './routes/wallets.js';
import apiWalletsRoutes from './routes/api/wallets.js';
import apiPortfolioRoutes from './routes/api/portfolio.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const fastify = Fastify({ logger: true });

// ── Plugins ──────────────────────────────────────────────
await fastify.register(fastifyCookie);
await fastify.register(fastifySession, {
  secret: process.env.SESSION_SECRET,
  cookie: {
    secure: false,
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
  }
});

// ── View engine ─────────────────────────────────────────
fastify.register(async (instance) => {
  instance.addHook('onRequest', loadUser);
  instance.setViewEngine({
    engine: { ejs },
    templates: path.join(__dirname, 'views')
  });
});

// ── Static ───────────────────────────────────────────────
fastify.register(async (instance) => {
  instance.register(import('@fastify/static'), {
    root: path.join(__dirname, '../public'),
    prefix: '/static/'
  });
});

// ── Routes ───────────────────────────────────────────────
await fastify.register(authRoutes);
await fastify.register(dashboardRoutes);
await fastify.register(walletsRoutes);
await fastify.register(apiWalletsRoutes);
await fastify.register(apiPortfolioRoutes);

// ── Start ────────────────────────────────────────────────
const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || '0.0.0.0';

async function start() {
  await runMigrations();
  await initializeAdminUser(process.env.ADMIN_PASSWORD || 'sigue2026');
  await fastify.listen({ port: PORT, host: HOST });
  console.log(`[server] Sigue Wallet running on http://${HOST}:${PORT}`);
}

start().catch(err => { console.error(err); process.exit(1); });
