import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default {
  development: {
    client: 'better-sqlite3',
    connection: { filename: path.join(__dirname, 'sigue-wallet.db') },
    useNullAsDefault: true,
    migrations: {
      directory: path.join(__dirname, 'src/models/migrations'),
      extension: 'js',
      loadExtensions: ['.js'],
    },
  },
};
