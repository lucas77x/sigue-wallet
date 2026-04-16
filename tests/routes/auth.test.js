import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest';
import Fastify from 'fastify';
import fastifyCookie from '@fastify/cookie';
import fastifySession from '@fastify/session';
import fastifyFormbody from '@fastify/formbody';
import fastifyView from '@fastify/view';
import ejs from 'ejs';
import path from 'path';
import { fileURLToPath } from 'url';

vi.mock('../../src/models/db.js', async () => {
  const { createTestDb } = await import('../helpers/create-test-db.js');
  const db = await createTestDb();
  return { default: db, runMigrations: vi.fn() };
});

import authRoutes from '../../src/routes/auth.js';
import db from '../../src/models/db.js';
import { hashPassword } from '../../src/models/user.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SESSION_SECRET = 'test-session-secret-must-be-32-characters-long';

let app;

beforeAll(async () => {
  app = Fastify();
  await app.register(fastifyCookie);
  await app.register(fastifySession, { secret: SESSION_SECRET, cookie: { secure: false } });
  await app.register(fastifyFormbody);
  await app.register(fastifyView, {
    engine: { ejs },
    root: path.join(__dirname, '../../src/views'),
  });
  await app.register(authRoutes);
  await app.ready();

  // Seed admin user
  const hash = await hashPassword('password123');
  await db('users').insert({ username: 'admin', password_hash: hash });
});

afterAll(async () => {
  await app.close();
  await db.destroy();
});

describe('GET /login', () => {
  it('returns 200 with an HTML login form', async () => {
    const response = await app.inject({ method: 'GET', url: '/login' });
    expect(response.statusCode).toBe(200);
    expect(response.headers['content-type']).toMatch(/html/);
    expect(response.body).toContain('<form');
  });
});

describe('POST /login', () => {
  it('redirects to /dashboard on valid credentials', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/login',
      payload: 'username=admin&password=password123',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
    });

    expect(response.statusCode).toBe(302);
    expect(response.headers.location).toBe('/dashboard');
    expect(response.headers['set-cookie']).toBeDefined();
  });

  it('returns 200 with error message on invalid credentials', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/login',
      payload: 'username=admin&password=wrongpassword',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
    });

    expect(response.statusCode).toBe(200);
    expect(response.body).toContain('inválidos');
  });

  it('returns 200 with error message for unknown user', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/login',
      payload: 'username=nobody&password=anything',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
    });

    expect(response.statusCode).toBe(200);
    expect(response.body).toContain('inválidos');
  });
});

describe('GET /logout', () => {
  it('redirects to /login', async () => {
    const response = await app.inject({ method: 'GET', url: '/logout' });
    expect(response.statusCode).toBe(302);
    expect(response.headers.location).toBe('/login');
  });
});
