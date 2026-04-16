/**
 * Migration: Initial schema
 * Creates users, wallets (with user_id), and snapshots tables.
 */

export async function up(knex) {
  if (!(await knex.schema.hasTable('users'))) {
    await knex.schema.createTable('users', (table) => {
      table.increments('id').primary();
      table.text('username').notNullable().unique();
      table.text('password_hash').notNullable();
      table.datetime('created_at').defaultTo(knex.fn.now());
    });
  }

  if (!(await knex.schema.hasTable('wallets'))) {
    await knex.schema.createTable('wallets', (table) => {
      table.increments('id').primary();
      table.integer('user_id').references('id').inTable('users').onDelete('CASCADE');
      table.text('alias').notNullable();
      table.text('address').notNullable().unique();
      table.text('chain').notNullable().defaultTo('eth');
      table.text('notes');
      table.datetime('created_at').defaultTo(knex.fn.now());
      table.datetime('updated_at').defaultTo(knex.fn.now());
    });
  }

  if (!(await knex.schema.hasTable('snapshots'))) {
    await knex.schema.createTable('snapshots', (table) => {
      table.increments('id').primary();
      table.integer('wallet_id').references('id').inTable('wallets').onDelete('CASCADE');
      table.real('total_usd').notNullable().defaultTo(0);
      table.text('chain_balances').notNullable().defaultTo('{}');
      table.text('tokens').notNullable().defaultTo('[]');
      table.date('snapshot_date').notNullable();
      table.datetime('created_at').defaultTo(knex.fn.now());
      table.unique(['wallet_id', 'snapshot_date']);
    });
  }
}

export async function down(knex) {
  await knex.schema.dropTableIfExists('snapshots');
  await knex.schema.dropTableIfExists('wallets');
  await knex.schema.dropTableIfExists('users');
}
