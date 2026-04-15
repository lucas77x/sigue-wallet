# Sigue Wallet

Crypto portfolio dashboard — track wallet balances across multi-chain DeFi.

## Stack

- **Backend:** Fastify 5 + Knex + better-sqlite3
- **Frontend:** EJS + Tailwind CSS (CDN)
- **Auth:** bcrypt + sessions
- **Data:** The Graph Token API (free tier: 100k queries/month)

## Setup

```bash
git clone https://github.com/lucas77x/sigue-wallet.git
cd sigue-wallet
pnpm install
cp .env.example .env          # add THEGRAPH_API_KEY
pnpm start
```

Open http://localhost:3000 — default login: `admin` / `sigue2026`

## Project structure

```
src/
├── server.js           # Entry point
├── models/
│   ├── db.js           # Knex singleton
│   ├── migrate.js      # Run migrations
│   ├── user.js         # User queries
│   └── wallet.js       # Wallet CRUD
├── services/
│   ├── thegraph.js     # The Graph Token API calls
│   └── portfolio.js    # Balance aggregation
├── routes/
│   ├── auth.js         # Login / logout
│   ├── dashboard.js    # Main dashboard page
│   ├── wallets.js      # Wallet ABM page
│   └── api/
│       ├── wallets.js  # Wallet CRUD API
│       └── portfolio.js # Portfolio data API
├── middleware/
│   └── auth.js         # Session auth guard
└── views/
    ├── layout.ejs
    ├── login.ejs
    ├── dashboard.ejs
    └── wallets.ejs
```

## Chains supported

Ethereum, BSC, Polygon, Avalanche, Optimism, Fantom, Sonic

## Roadmap

- [x] Login with encrypted passwords
- [x] Wallet ABM (add, edit, delete)
- [x] Multi-chain balance display
- [x] Token list with icons
- [x] Snapshot history in DB
- [ ] DeFi positions (Aave, Uniswap, Curve, etc.)
- [ ] Telegram alerts
