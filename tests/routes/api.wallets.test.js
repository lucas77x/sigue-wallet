import { describe, it, expect, vi, beforeAll, afterAll, afterEach } from 'vitest';
import Fastify from 'fastify';
import fastifyCookie from '@fastify/cookie';
import fastifySession from '@fastify/session';

vi.mock('../../src/models/db.js', async () => {
  const { createTestDb } = await import('../helpers/create-test-db.js');
  const db = await createTestDb();
  return { default: db, runMigrations: vi.fn() };
});

import apiWalletsRoutes from '../../src/routes/api/wallets.js';
import db from '../../src/models/db.js';

const SESSION_SECRET = 'test-session-secret-must-be-32-characters-long';
let app;
let testUserId;

/**
 * Injects a request with a pre-set session (simulates authenticated user).
 * We hook into preHandler to set session.userId, bypassing real session cookies.
 */
async function buildAuthenticatedApp() {
  const a = Fastify();
  await a.register(fastifyCookie);
  await a.register(fastifySession, { secret: SESSION_SECRET, cookie: { secure: false } });

  // Inject authenticated session for all requests in tests
  a.addHook('preHandler', async (request) => {
    request.session.userId = testUserId;
  });

  await a.register(apiWalletsRoutes, { prefix: '/api/wallets' });
  await a.ready();
  return a;
}

beforeAll(async () => {
  [testUserId] = await db('users').insert({ username: 'tester', password_hash: 'hash' });
  app = await buildAuthenticatedApp();
});

afterAll(async () => {
  await app.close();
  await db.destroy();
});

afterEach(async () => {
  await db('wallets').delete();
});

describe('GET /api/wallets', () => {
  it('returns an empty array when user has no wallets', async () => {
    const response = await app.inject({ method: 'GET', url: '/api/wallets' });
    expect(response.statusCode).toBe(200);
    expect(JSON.parse(response.body)).toEqual([]);
  });

  it('returns all wallets for the authenticated user', async () => {
    await db('wallets').insert({ user_id: testUserId, alias: 'MyWallet', address: '0xabc', chains: '["ethereum"]' });

    const response = await app.inject({ method: 'GET', url: '/api/wallets' });
    const wallets = JSON.parse(response.body);
    expect(wallets).toHaveLength(1);
    expect(wallets[0].alias).toBe('MyWallet');
  });
});

describe('GET /api/wallets/:id', () => {
  it('returns a single wallet by id', async () => {
    const [id] = await db('wallets').insert({ user_id: testUserId, alias: 'One', address: '0xdef', chains: '["bsc"]' });

    const response = await app.inject({ method: 'GET', url: `/api/wallets/${id}` });
    expect(response.statusCode).toBe(200);
    expect(JSON.parse(response.body).alias).toBe('One');
  });

  it('returns 404 for a non-existent wallet', async () => {
    const response = await app.inject({ method: 'GET', url: '/api/wallets/9999' });
    expect(response.statusCode).toBe(404);
  });
});

describe('POST /api/wallets', () => {
  it('creates a new wallet and returns it', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/wallets',
      payload: { alias: 'New', address: '0x123456', chains: ['polygon'] },
    });

    expect(response.statusCode).toBe(200);
    const wallets = await db('wallets').where('user_id', testUserId);
    expect(wallets).toHaveLength(1);
    expect(wallets[0].alias).toBe('New');
  });
});

describe('PUT /api/wallets/:id', () => {
  it('updates an existing wallet', async () => {
    const [id] = await db('wallets').insert({ user_id: testUserId, alias: 'Old', address: '0x999', chains: '["ethereum"]' });

    await app.inject({
      method: 'PUT',
      url: `/api/wallets/${id}`,
      payload: { alias: 'Updated', address: '0x999', chains: ['ethereum'] },
    });

    const [updated] = await db('wallets').where({ id });
    expect(updated.alias).toBe('Updated');
  });
});

describe('DELETE /api/wallets/:id', () => {
  it('deletes the wallet', async () => {
    const [id] = await db('wallets').insert({ user_id: testUserId, alias: 'Bye', address: '0x777', chains: '["bsc"]' });

    const response = await app.inject({ method: 'DELETE', url: `/api/wallets/${id}` });
    expect(response.statusCode).toBe(200);

    const wallets = await db('wallets').where({ id });
    expect(wallets).toHaveLength(0);
  });
});

describe('Unauthenticated access', () => {
  it('returns 401 when no session userId is set', async () => {
    // Build app WITHOUT the session injection hook
    const unauthApp = Fastify();
    await unauthApp.register(fastifyCookie);
    await unauthApp.register(fastifySession, { secret: SESSION_SECRET, cookie: { secure: false } });
    await unauthApp.register(apiWalletsRoutes, { prefix: '/api/wallets' });
    await unauthApp.ready();

    const response = await unauthApp.inject({ method: 'GET', url: '/api/wallets' });
    expect(response.statusCode).toBe(401);

    await unauthApp.close();
  });
});
