import db from './db.js';
import bcrypt from 'bcrypt';

const SALT_ROUNDS = 12;

export async function hashPassword(password) {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export async function verifyPassword(password, hash) {
  return bcrypt.compare(password, hash);
}

export async function createUser(username, passwordHash) {
  return db('users').insert({ username, password_hash: passwordHash });
}

export async function findUserByUsername(username) {
  return db('users').where('username', username).first();
}

export async function findUserById(id) {
  return db('users').where('id', id).first();
}

export async function initializeAdminUser(password) {
  const existing = await findUserByUsername('admin');
  if (existing) {
    console.log('[auth] Admin user already exists');
    return;
  }
  const hash = await hashPassword(password);
  await createUser('admin', hash);
  console.log(`[auth] Admin user created with password: ${password}`);
}
