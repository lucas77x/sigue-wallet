# Sigue Wallet

Crypto portfolio dashboard — track wallet balances across multi-chain DeFi.

## Stack

- **Backend:** Fastify 5 + Knex + better-sqlite3
- **Frontend:** EJS + Tailwind CSS (local, no CDN)
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

> **THEGRAPH_API_KEY:** use the **JWT token** from [thegraph.market/dashboard](https://thegraph.market/dashboard) (API Token column), not the API Key.

### Environment variables

| Variable | Required | Description |
|----------|----------|-------------|
| `THEGRAPH_API_KEY` | Yes | The Graph Token API JWT token |
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
├── public/
│   ├── tailwind.min.js             # Tailwind Play CDN (local copy)
│   └── images/chains/              # Chain logos (png/svg)
├── src/
│   ├── server.js                   # Entry point — Fastify setup
│   ├── config/
│   │   └── chains.js               # Supported chains + metadata
│   ├── middleware/
│   │   └── auth.js                 # loadUser + requireAuth hooks
│   ├── models/
│   │   ├── db.js                   # Knex singleton + runMigrations()
│   │   ├── migrate.js              # Migration runner script (pnpm migrate)
│   │   ├── migrations/             # Knex JS migrations
│   │   ├── user.js                 # User queries
│   │   └── wallet.js               # Wallet CRUD
│   ├── routes/
│   │   ├── auth.js                 # GET/POST /login, GET /logout
│   │   ├── dashboard.js            # GET /dashboard
│   │   ├── wallets.js              # Wallet ABM pages
│   │   └── api/
│   │       ├── wallets.js          # REST /api/wallets
│   │       └── portfolio.js        # GET /api/portfolio/wallet/:id
│   ├── services/
│   │   ├── thegraph.js             # The Graph Token API client
│   │   └── portfolio.js            # Balance aggregation
│   └── views/
│       ├── login.ejs
│       ├── dashboard.ejs
│       └── wallets.ejs
├── tests/
│   ├── helpers/
│   │   └── create-test-db.js       # In-memory SQLite for tests
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
| Polygon | `polygon` | Supported |
| Avalanche | `avalanche` | Supported |
| Optimism | `optimism` | Supported |
| Arbitrum | `arbitrum-one` | Supported |
| Fantom | — | Not supported by Token API |
| Sonic | — | Not supported by Token API |

## Dashboard

- Multi-chain per wallet — each address can track multiple chains simultaneously
- Expandable chain rows: click a chain to see individual token balances
- Token table: symbol, balance (4 decimals), USD value
- Copy contract address — subtle icon on hover per token row
- Spam token filter: phishing URL patterns, "claim/airdrop" keywords, round-number airdrop detection (> 1,000 integer balance), overflow balances (> 1 trillion)

## Security notes

- `SESSION_SECRET` must be at least 32 characters. The server refuses to start without it.
- `loadUser` never exposes `password_hash` in `request.user`.
- XSS: `esc()` helper in dashboard escapes all API data before `innerHTML` insertion.
- `axios@1.15.0` — includes CRLF header injection fix and SSRF via no_proxy bypass fix.

## Roadmap

- [x] Login with encrypted passwords (bcrypt)
- [x] Wallet ABM (add, edit, delete)
- [x] Multi-chain support per wallet (JSON array of chains)
- [x] Multi-chain balance display via The Graph Token API
- [x] Expandable chain rows with per-token breakdown
- [x] Copy contract address per token
- [x] Spam token filtering (URL patterns + round-number airdrop detection)
- [x] Idempotent DB migrations (Knex)
- [x] Unit test suite (Vitest, 72 tests)
- [x] ESLint + Prettier
- [x] Local static assets (no external CDN dependencies)
- [ ] Token icons from `logo_url`
- [ ] Snapshot history (weekly cron)
- [ ] DeFi positions (Aave, Uniswap, Curve, etc.)
- [ ] Telegram alerts
