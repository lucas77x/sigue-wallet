-- Wallets table
CREATE TABLE IF NOT EXISTS wallets (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  alias TEXT NOT NULL UNIQUE,
  address TEXT NOT NULL UNIQUE,
  chain TEXT NOT NULL DEFAULT 'eth',
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Users table (single user for now)
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Snapshots table for historical portfolio data
CREATE TABLE IF NOT EXISTS snapshots (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  wallet_id INTEGER REFERENCES wallets(id) ON DELETE CASCADE,
  total_usd REAL NOT NULL DEFAULT 0,
  chain_balances TEXT NOT NULL DEFAULT '{}',
  tokens TEXT NOT NULL DEFAULT '[]',
  snapshot_date DATE NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(wallet_id, snapshot_date)
);
