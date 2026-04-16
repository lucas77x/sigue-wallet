/**
 * Migration: Add user_id to wallets (guard for existing databases)
 *
 * The initial schema in 001_initial.sql was missing the user_id column.
 * This migration adds it for databases already created with the old schema.
 * New databases using 20260415000001 will already have user_id — the
 * hasColumn check makes this safe to run in both cases.
 */

export async function up(knex) {
  const hasColumn = await knex.schema.hasColumn('wallets', 'user_id');
  if (!hasColumn) {
    await knex.schema.alterTable('wallets', (table) => {
      table.integer('user_id').references('id').inTable('users').onDelete('CASCADE');
    });
  }
}

export async function down(knex) {
  const hasColumn = await knex.schema.hasColumn('wallets', 'user_id');
  if (hasColumn) {
    await knex.schema.alterTable('wallets', (table) => {
      table.dropColumn('user_id');
    });
  }
}
