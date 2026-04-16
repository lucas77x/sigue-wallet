import { vi, describe, it, expect, beforeAll, afterEach, afterAll } from 'vitest';

vi.mock('../../src/models/db.js', async () => {
  const { createTestDb } = await import('../helpers/create-test-db.js');
  const db = await createTestDb();
  return { default: db, runMigrations: vi.fn() };
});

import {
  getWallets,
  getWalletById,
  createWallet,
  updateWallet,
  deleteWallet,
} from '../../src/models/wallet.js';
import db from '../../src/models/db.js';

let user1Id, user2Id;

beforeAll(async () => {
  [user1Id] = await db('users').insert({ username: 'user1', password_hash: 'hash1' });
  [user2Id] = await db('users').insert({ username: 'user2', password_hash: 'hash2' });
});

afterEach(async () => {
  await db('wallets').delete();
});

afterAll(async () => {
  await db.destroy();
});

describe('createWallet', () => {
  it('inserts a wallet and returns its id', async () => {
    const result = await createWallet({
      userId: user1Id,
      alias: 'Main',
      address: '0xABC123',
      chains: ['ethereum'],
    });
    expect(result).toBeDefined();
  });

  it('stores the address lowercased', async () => {
    await createWallet({ userId: user1Id, alias: 'Test', address: '0xABCDEF', chains: ['bsc'] });
    const [wallet] = await db('wallets').where('alias', 'Test');
    expect(wallet.address).toBe('0xabcdef');
  });

  it('stores chains as a JSON array', async () => {
    await createWallet({
      userId: user1Id,
      alias: 'MultiChain',
      address: '0xmulti',
      chains: ['ethereum', 'polygon'],
    });
    const [wallet] = await db('wallets').where('alias', 'MultiChain');
    expect(JSON.parse(wallet.chains)).toEqual(['ethereum', 'polygon']);
  });
});

describe('getWallets', () => {
  it('returns only wallets belonging to the given user', async () => {
    await createWallet({ userId: user1Id, alias: 'W1', address: '0x111', chains: ['ethereum'] });
    await createWallet({ userId: user2Id, alias: 'W2', address: '0x222', chains: ['polygon'] });

    const user1Wallets = await getWallets(user1Id);
    expect(user1Wallets).toHaveLength(1);
    expect(user1Wallets[0].alias).toBe('W1');
  });

  it('returns chains as a parsed array', async () => {
    await createWallet({ userId: user1Id, alias: 'W3', address: '0x333', chains: ['ethereum', 'arbitrum'] });
    const [w] = await getWallets(user1Id);
    expect(w.chains).toEqual(['ethereum', 'arbitrum']);
  });

  it('returns an empty array when the user has no wallets', async () => {
    const wallets = await getWallets(user1Id);
    expect(wallets).toHaveLength(0);
  });
});

describe('getWalletById', () => {
  it('returns the wallet for the correct user', async () => {
    await createWallet({ userId: user1Id, alias: 'Mine', address: '0x444', chains: ['ethereum'] });
    const [{ id }] = await db('wallets').where('alias', 'Mine');

    const wallet = await getWalletById(id, user1Id);
    expect(wallet).toBeDefined();
    expect(wallet.alias).toBe('Mine');
    expect(wallet.chains).toEqual(['ethereum']);
  });

  it('returns undefined for a different user', async () => {
    await createWallet({ userId: user1Id, alias: 'NotYours', address: '0x555', chains: ['bsc'] });
    const [{ id }] = await db('wallets').where('alias', 'NotYours');

    const wallet = await getWalletById(id, user2Id);
    expect(wallet).toBeUndefined();
  });
});

describe('updateWallet', () => {
  it('updates the alias for the correct user', async () => {
    await createWallet({ userId: user1Id, alias: 'Old', address: '0x666', chains: ['ethereum'] });
    const [{ id }] = await db('wallets').where('alias', 'Old');

    await updateWallet(id, user1Id, { alias: 'New', address: '0x666', chains: ['ethereum'] });

    const updated = await getWalletById(id, user1Id);
    expect(updated.alias).toBe('New');
  });

  it('updates the chains list', async () => {
    await createWallet({ userId: user1Id, alias: 'Updatable', address: '0x777', chains: ['ethereum'] });
    const [{ id }] = await db('wallets').where('alias', 'Updatable');

    await updateWallet(id, user1Id, { alias: 'Updatable', address: '0x777', chains: ['ethereum', 'polygon'] });

    const updated = await getWalletById(id, user1Id);
    expect(updated.chains).toEqual(['ethereum', 'polygon']);
  });

  it('does not update a wallet belonging to a different user', async () => {
    await createWallet({ userId: user1Id, alias: 'Original', address: '0x888', chains: ['polygon'] });
    const [{ id }] = await db('wallets').where('alias', 'Original');

    await updateWallet(id, user2Id, { alias: 'Hacked', address: '0x888', chains: ['polygon'] });

    const unchanged = await getWalletById(id, user1Id);
    expect(unchanged.alias).toBe('Original');
  });
});

describe('deleteWallet', () => {
  it('deletes the wallet for the correct user', async () => {
    await createWallet({ userId: user1Id, alias: 'ToDelete', address: '0x999', chains: ['bsc'] });
    const [{ id }] = await db('wallets').where('alias', 'ToDelete');

    await deleteWallet(id, user1Id);

    const gone = await getWalletById(id, user1Id);
    expect(gone).toBeUndefined();
  });

  it('does not delete a wallet belonging to a different user', async () => {
    await createWallet({ userId: user1Id, alias: 'Protected', address: '0xaaa', chains: ['ethereum'] });
    const [{ id }] = await db('wallets').where('alias', 'Protected');

    await deleteWallet(id, user2Id);

    const stillExists = await getWalletById(id, user1Id);
    expect(stillExists).toBeDefined();
  });
});
