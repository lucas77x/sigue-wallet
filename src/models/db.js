import Knex from 'knex';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const db = Knex({
  client: 'better-sqlite3',
  connection: { filename: path.join(__dirname, '../../sigue-wallet.db') },
  useNullAsDefault: true,
  migrations: {
    directory: path.join(__dirname, 'migrations'),
    extension: 'js',
    loadExtensions: ['.js'],
  },
});

export async function runMigrations() {
  await db.migrate.latest();
  console.log('[db] Migrations complete');
}

export default db;
