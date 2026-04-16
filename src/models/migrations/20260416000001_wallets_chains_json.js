/**
 * Migrate wallets.chain (TEXT) → wallets.chains (JSON array TEXT).
 * SQLite doesn't support DROP COLUMN reliably, so we recreate the table.
 */
export async function up(knex) {
  await knex.schema.createTable('wallets_new', (t) => {
    t.increments('id').primary();
    t.integer('user_id').references('id').inTable('users').onDelete('CASCADE');
    t.string('alias').notNullable();
    t.string('address').notNullable();
    t.text('chains').notNullable().defaultTo('[]'); // JSON array, e.g. '["ethereum","polygon"]'
    t.string('created_at').defaultTo(knex.fn.now());
    t.string('updated_at').defaultTo(knex.fn.now());
  });

  // Copy existing rows, wrapping the single chain value into a JSON array
  await knex.raw(`
    INSERT INTO wallets_new (id, user_id, alias, address, chains, created_at, updated_at)
    SELECT id, user_id, alias, address, json_array(chain), created_at, updated_at
    FROM wallets
  `);

  await knex.schema.dropTable('wallets');
  await knex.schema.renameTable('wallets_new', 'wallets');
}

export async function down(knex) {
  await knex.schema.createTable('wallets_old', (t) => {
    t.increments('id').primary();
    t.integer('user_id').references('id').inTable('users').onDelete('CASCADE');
    t.string('alias').notNullable();
    t.string('address').notNullable();
    t.string('chain').notNullable().defaultTo('ethereum');
    t.string('created_at').defaultTo(knex.fn.now());
    t.string('updated_at').defaultTo(knex.fn.now());
  });

  // Lossy rollback: keeps only the first chain
  await knex.raw(`
    INSERT INTO wallets_old (id, user_id, alias, address, chain, created_at, updated_at)
    SELECT id, user_id, alias, address,
           COALESCE(json_extract(chains, '$[0]'), 'ethereum'),
           created_at, updated_at
    FROM wallets
  `);

  await knex.schema.dropTable('wallets');
  await knex.schema.renameTable('wallets_old', 'wallets');
}
