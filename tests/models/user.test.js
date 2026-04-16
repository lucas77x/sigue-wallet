import { vi, describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest';

// Must be before any import that uses db
vi.mock('../../src/models/db.js', async () => {
  const { createTestDb } = await import('../helpers/create-test-db.js');
  const db = await createTestDb();
  return { default: db, runMigrations: vi.fn() };
});

import {
  hashPassword,
  verifyPassword,
  createUser,
  findUserByUsername,
  findUserById,
  initializeAdminUser,
} from '../../src/models/user.js';
import db from '../../src/models/db.js';

afterEach(async () => {
  await db('users').delete();
});

afterAll(async () => {
  await db.destroy();
});

describe('hashPassword', () => {
  it('produces a bcrypt hash starting with $2b$', async () => {
    const hash = await hashPassword('mysecret');
    expect(hash).toMatch(/^\$2b\$/);
  });

  it('produces a different hash for the same password each time (salt)', async () => {
    const h1 = await hashPassword('mysecret');
    const h2 = await hashPassword('mysecret');
    expect(h1).not.toBe(h2);
  });
});

describe('verifyPassword', () => {
  it('returns true for the correct password', async () => {
    const hash = await hashPassword('correct');
    expect(await verifyPassword('correct', hash)).toBe(true);
  });

  it('returns false for the wrong password', async () => {
    const hash = await hashPassword('correct');
    expect(await verifyPassword('wrong', hash)).toBe(false);
  });
});

describe('createUser / findUserByUsername / findUserById', () => {
  it('creates a user and finds it by username', async () => {
    const hash = await hashPassword('pass');
    await createUser('alice', hash);

    const user = await findUserByUsername('alice');
    expect(user).toBeDefined();
    expect(user.username).toBe('alice');
    expect(user.password_hash).toBe(hash);
  });

  it('returns undefined for a non-existent username', async () => {
    const result = await findUserByUsername('nobody');
    expect(result).toBeUndefined();
  });

  it('finds a user by id', async () => {
    const hash = await hashPassword('pass');
    const [id] = await createUser('bob', hash);
    const user = await findUserById(id);
    expect(user).toBeDefined();
    expect(user.username).toBe('bob');
  });

  it('returns undefined for a non-existent id', async () => {
    const result = await findUserById(9999);
    expect(result).toBeUndefined();
  });
});

describe('initializeAdminUser', () => {
  it('creates the admin user when none exists', async () => {
    await initializeAdminUser('testpass');
    const user = await findUserByUsername('admin');
    expect(user).toBeDefined();
    expect(await verifyPassword('testpass', user.password_hash)).toBe(true);
  });

  it('does not create a duplicate admin on second call', async () => {
    await initializeAdminUser('pass1');
    await initializeAdminUser('pass2'); // should be a no-op

    const users = await db('users').where('username', 'admin');
    expect(users).toHaveLength(1);
  });
});
