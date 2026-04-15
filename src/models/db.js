import Knex from 'knex';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const db = Knex({
  client: 'better-sqlite3',
  connection: { filename: path.join(__dirname, '../../sigue-wallet.db') },
  useNullAsDefault: true
});

export async function runMigrations() {
  const migrationsDir = path.join(__dirname, 'migrations');
  if (!fs.existsSync(migrationsDir)) return;

  const files = fs.readdirSync(migrationsDir).sort();
  for (const file of files) {
    if (!file.endsWith('.sql')) continue;
    const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
    for (const stmt of sql.split(';').filter(s => s.trim())) {
      await db.raw(stmt);
    }
  }
  console.log('[db] Migrations complete');
}

export default db;
