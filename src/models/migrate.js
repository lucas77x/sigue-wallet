import { runMigrations } from './db.js';

await runMigrations();
console.log('[migrate] Done');
process.exit(0);
