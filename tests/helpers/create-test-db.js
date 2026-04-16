import Knex from 'knex';

/**
 * Creates an in-memory SQLite database with the full schema.
 * Use one instance per test file (pool: 'forks' gives each file its own process).
 * Call db.destroy() in afterAll to release the connection.
 */
export async function createTestDb() {
  const db = Knex({
    client: 'better-sqlite3',
    connection: { filename: ':memory:' },
    useNullAsDefault: true,
  });

  await db.schema.createTable('users', (t) => {
    t.increments('id').primary();
    t.text('username').notNullable().unique();
    t.text('password_hash').notNullable();
    t.datetime('created_at').defaultTo(db.fn.now());
  });

  await db.schema.createTable('wallets', (t) => {
    t.increments('id').primary();
    t.integer('user_id').references('id').inTable('users').onDelete('CASCADE');
    t.text('alias').notNullable();
    t.text('address').notNullable().unique();
    t.text('chains').notNullable().defaultTo('[]');
    t.text('notes');
    t.datetime('created_at').defaultTo(db.fn.now());
    t.datetime('updated_at').defaultTo(db.fn.now());
  });

  await db.schema.createTable('snapshots', (t) => {
    t.increments('id').primary();
    t.integer('wallet_id').references('id').inTable('wallets').onDelete('CASCADE');
    t.real('total_usd').notNullable().defaultTo(0);
    t.text('chain_balances').notNullable().defaultTo('{}');
    t.text('tokens').notNullable().defaultTo('[]');
    t.date('snapshot_date').notNullable();
    t.datetime('created_at').defaultTo(db.fn.now());
    t.unique(['wallet_id', 'snapshot_date']);
  });

  return db;
}
