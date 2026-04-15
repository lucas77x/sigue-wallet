import db from './db.js';

export async function getWallets(userId) {
  return db('wallets').where('user_id', userId).orderBy('id');
}

export async function getWalletById(id, userId) {
  return db('wallets').where({ id, user_id: userId }).first();
}

export async function createWallet({ userId, alias, address, chain }) {
  return db('wallets').insert({
    user_id: userId,
    alias,
    address: address.toLowerCase(),
    chain
  });
}

export async function updateWallet(id, userId, { alias, address, chain }) {
  return db('wallets').where({ id, user_id: userId }).update({
    alias,
    address: address ? address.toLowerCase() : undefined,
    chain,
    updated_at: new Date().toISOString()
  });
}

export async function deleteWallet(id, userId) {
  return db('wallets').where({ id, user_id: userId }).delete();
}
