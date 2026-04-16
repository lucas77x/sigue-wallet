# Sigue Wallet

Crypto portfolio dashboard — track wallet balances across multi-chain DeFi.

## Stack

- **Backend:** Fastify 5 + Knex + better-sqlite3
- **Frontend:** EJS + Tailwind CSS (CDN)
- **Auth:** bcrypt + @fastify/session
- **Data:** The Graph Token API (free tier: 100k queries/month)
- **Testing:** Vitest (pool: forks)

## Setup

```bash
git clone https://github.com/lucas77x/sigue-wallet.git
cd sigue-wallet
pnpm install
cp .env.example .env   # fill in THEGRAPH_API_KEY and SESSION_SECRET (min 32 chars)
pnpm migrate
pnpm dev
```

Open http://localhost:3000 — default login: `admin` / `sigue2026`

### Environment variables

| Variable | Required | Description |
|----------|----------|-------------|
| `THEGRAPH_API_KEY` | Yes | The Graph Token API key |
| `SESSION_SECRET` | Yes | Min 32 chars — server won't start without it |
| `PORT` | No | Default: `3000` |
| `HOST` | No | Default: `0.0.0.0` |
| `ADMIN_PASSWORD` | No | Default: `sigue2026` |

## Scripts

```bash
pnpm dev            # start with --watch (auto-restart)
pnpm start          # production start
pnpm migrate        # run pending DB migrations
pnpm test           # run test suite
pnpm test:watch     # test in watch mode
pnpm test:coverage  # coverage report
pnpm lint           # ESLint
pnpm lint:fix       # ESLint with auto-fix
pnpm format         # Prettier
```

## Project structure

```
sigue-wallet/
├── public/                     # Static assets
├── src/
│   ├── server.js               # Entry point — Fastify setup
│   ├── middleware/
│   │   └── auth.js             # loadUser + requireAuth hooks
│   ├── models/
│   │   ├── db.js               # Knex singleton + runMigrations()
│   │   ├── migrate.js          # Migration runner script (pnpm migrate)
│   │   ├── migrations/         # Knex JS migrations
│   │   ├── user.js             # User queries
│   │   └── wallet.js           # Wallet CRUD
│   ├── routes/
│   │   ├── auth.js             # GET/POST /login, GET /logout
│   │   ├── dashboard.js        # GET /dashboard
│   │   ├── wallets.js          # Wallet ABM pages
│   │   └── api/
│   │       ├── wallets.js      # GET/POST /api/wallets
│   │       └── portfolio.js    # GET /api/portfolio
│   ├── services/
│   │   ├── thegraph.js         # The Graph Token API client
│   │   └── portfolio.js        # Balance aggregation
│   └── views/
│       ├── login.ejs
│       ├── dashboard.ejs
│       └── wallets.ejs
├── tests/
│   ├── helpers/
│   │   └── create-test-db.js   # In-memory SQLite for tests
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   └── services/
├── knexfile.js
├── vitest.config.js
└── .env.example
```

## Chains supported

| Chain | Network ID | Status |
|-------|-----------|--------|
| Ethereum | `mainnet` | Supported |
| BSC | `bsc` | Supported |
| Polygon | `matic` | Supported |
| Avalanche | `avalanche` | Supported |
| Optimism | `optimism` | Supported |
| Arbitrum | `arbitrum-one` | Supported |
| Fantom | — | Not supported by Token API (returns empty) |
| Sonic | — | Not supported by Token API (returns empty) |

## Security notes

- `axios` is pinned to `1.14.0` (no `^`) — version `1.14.1` was compromised in a supply chain attack (March 2026, Sapphire Sleet / North Korea). Do not upgrade without verifying.
- `SESSION_SECRET` must be at least 32 characters. The server refuses to start without it.

## Roadmap

- [x] Login with encrypted passwords (bcrypt)
- [x] Wallet ABM (add, edit, delete)
- [x] Multi-chain balance display via The Graph Token API
- [x] Idempotent DB migrations (Knex)
- [x] Unit test suite (Vitest)
- [x] ESLint + Prettier
- [ ] Token icons from `logo_url`
- [ ] Balance total in USD
- [ ] Snapshot history (weekly cron)
- [ ] DeFi positions (Aave, Uniswap, Curve, etc.)
- [ ] Telegram alerts
