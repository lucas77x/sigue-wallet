import db from './db.js';

function parseChains(raw) {
  if (Array.isArray(raw)) return raw;
  try {
    return JSON.parse(raw || '[]');
  } catch {
    return raw ? [raw] : [];
  }
}

function serializeChains(chains) {
  return JSON.stringify(Array.isArray(chains) ? chains : [chains]);
}

function deserialize(row) {
  if (row == null) return undefined;
  return { ...row, chains: parseChains(row.chains) };
}

export async function getWallets(userId) {
  const rows = await db('wallets').where('user_id', userId).orderBy('id');
  return rows.map(deserialize);
}

export async function getWalletById(id, userId) {
  const row = await db('wallets').where({ id, user_id: userId }).first();
  return deserialize(row);
}

export async function createWallet({ userId, alias, address, chains }) {
  return db('wallets').insert({
    user_id: userId,
    alias,
    address: address.toLowerCase(),
    chains: serializeChains(chains),
  });
}

export async function updateWallet(id, userId, { alias, address, chains }) {
  return db('wallets')
    .where({ id, user_id: userId })
    .update({
      alias,
      address: address ? address.toLowerCase() : undefined,
      chains: serializeChains(chains),
      updated_at: new Date().toISOString(),
    });
}

export async function deleteWallet(id, userId) {
  return db('wallets').where({ id, user_id: userId }).delete();
}
