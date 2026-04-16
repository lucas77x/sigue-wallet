# Sigue Wallet — Plan

## Meta

- **Usuario:** Lucas (developer, GitHub: lucas77x)
- **Fecha inicio:** 2026-04-15
- **Stack:** Fastify 5 + Knex + better-sqlite3 + EJS + Tailwind CSS local
- **Repo:** `https://github.com/lucas77x/sigue-wallet`

---

## Estado Actual

### Etapa 1 — Balances (Completa)

| Feature | Estado | Notas |
|---------|--------|-------|
| Login con password encriptada (bcrypt + sessions) | ✅ | |
| Wallet ABM (crear, editar, eliminar) | ✅ | |
| Multi-chain por wallet (JSON array de chains) | ✅ | Migrado desde `chain TEXT` a `chains TEXT` |
| Balance de tokens ERC-20 via The Graph Token API | ✅ | |
| Dashboard expandible por chain con tabla de tokens | ✅ | `<details>/<summary>` nativo |
| Copy contract address por token | ✅ | Ícono sutil on-hover |
| Spam token filter | ✅ | URL patterns + round-number airdrop + overflow |
| BigInt balance formatting | ✅ | Evita float64 precision loss |
| Migrations idempotentes (Knex) | ✅ | Reemplazó runner SQL manual |
| Test suite (Vitest) | ✅ | 72 tests, pool: forks |
| ESLint + Prettier | ✅ | ESLint 9 flat config |
| Assets estáticos locales (sin CDN) | ✅ | Tailwind local + logos de chains |
| Snapshot semanal | ⬜ Pendiente | |
| Token icons desde `logo_url` | ⬜ Pendiente | |

### Bugs Críticos Resueltos (2026-04-15/16)

| # | Bug | Fix |
|---|-----|-----|
| 1 | `loadUser` no existía — crash al importar | `fix/auth-middleware` |
| 2 | `reply.render()` no existe en Fastify 5 — usar `reply.view()` | `fix/server-startup` |
| 3 | `@fastify/static` y `public/` no existían | `fix/server-startup` |
| 4 | `@fastify/formbody` no registrado — POSTs con `body = null` | `fix/server-startup` |
| 5 | API routes sin prefijo — conflictos de rutas | `fix/server-startup` |
| 6 | `wallets` sin columna `user_id` — queries vacías | `fix/database-schema` |
| 7 | `thegraph.js` era un stub con endpoint incorrecto | `fix/thegraph-service` |
| 8 | `SESSION_SECRET` undefined — sessions inseguras | `fix/server-startup` |
| 9 | `.env.example` incompleto | `fix/env-and-config` |
| 10 | Migration runner no idempotente | `fix/database-schema` |
| 11 | Token API param era `network_id` → correcto es `network` | commit directo |
| 12 | Polygon slug era `matic` → correcto es `polygon` | commit directo |
| 13 | Campos de respuesta: `balance`/`value_usd` no existen → son `amount`/`value` | fix(thegraph) |
| 14 | `Number()` overflow en balances wei grandes → BigInt | fix(thegraph) |
| 15 | Spam tokens con valores inflados en wallet | fix(thegraph): spam filter |
| 16 | `chain TEXT` → `chains TEXT` (JSON array) para multi-chain | migration + model |
| 17 | `runMigrations` importado desde módulo incorrecto en server.js | fix(server) |
| 18 | Sin ruta `/` — 404 al entrar a la raíz | fix(server): redirect → /dashboard |

---

## Etapa 2 — DeFi Positions (futuro)

- Aave, Uniswap, Curve, Venus, PancakeSwap, Beefy, QuickSwap, Balancer
- Health factor alerts
- Evaluar The Graph subgraphs vs otras opciones

---

## Data Source

**The Graph Token API** (gratis, 100k queries/mes)
- Endpoint: `https://token-api.thegraph.com/v1/evm/balances`
- Auth: `Authorization: Bearer {JWT}` — JWT de [thegraph.market/dashboard](https://thegraph.market/dashboard)
- Params: `?network={networkId}&address={address}`
- Campos de respuesta: `amount` (raw wei), `value` (USD), `decimals`, `symbol`, `name`, `contract`

### Network IDs

| Chain | network | Soportado |
|-------|---------|-----------|
| ethereum | `mainnet` | ✅ |
| bsc | `bsc` | ✅ |
| polygon | `polygon` | ✅ |
| avalanche | `avalanche` | ✅ |
| optimism | `optimism` | ✅ |
| arbitrum | `arbitrum-one` | ✅ |
| fantom | — | ❌ |
| sonic | — | ❌ |

---

## Arquitectura

```
sigue-wallet/
├── public/
│   ├── tailwind.min.js             # Tailwind Play CDN (local)
│   └── images/chains/              # Logos png/svg por chain
├── src/
│   ├── server.js                   # Fastify entry point
│   ├── config/
│   │   └── chains.js               # Supported chains + metadata
│   ├── middleware/
│   │   └── auth.js                 # loadUser + requireAuth
│   ├── models/
│   │   ├── db.js                   # Knex singleton + runMigrations()
│   │   ├── migrate.js              # Script: pnpm migrate
│   │   ├── migrations/             # JS migrations (up/down)
│   │   ├── user.js                 # User queries
│   │   └── wallet.js               # Wallet CRUD (serializa chains)
│   ├── routes/
│   │   ├── auth.js
│   │   ├── dashboard.js
│   │   ├── wallets.js
│   │   └── api/
│   │       ├── wallets.js          # REST /api/wallets
│   │       └── portfolio.js        # GET /api/portfolio/wallet/:id
│   ├── services/
│   │   ├── thegraph.js             # Token API client + spam filter
│   │   └── portfolio.js            # Balance aggregation
│   └── views/
│       ├── login.ejs
│       ├── dashboard.ejs           # Expandable chain rows + copy contract
│       └── wallets.ejs             # Multi-chain selector
├── tests/
│   ├── helpers/create-test-db.js
│   ├── middleware/auth.test.js
│   ├── models/user.test.js
│   ├── models/wallet.test.js
│   ├── routes/auth.test.js
│   ├── routes/api.wallets.test.js
│   ├── services/portfolio.test.js
│   └── services/thegraph.test.js
├── knexfile.js
├── vitest.config.js
└── .env.example
```

---

## Base de Datos

### Tabla `users`
| Campo | Tipo |
|-------|------|
| id | INTEGER PK |
| username | TEXT UNIQUE |
| password_hash | TEXT |
| created_at | TEXT |

### Tabla `wallets`
| Campo | Tipo | Notas |
|-------|------|-------|
| id | INTEGER PK | |
| user_id | INTEGER FK | → users.id CASCADE DELETE |
| alias | TEXT | |
| address | TEXT | Siempre lowercase |
| chains | TEXT | JSON array de chain names |
| created_at | TEXT | |
| updated_at | TEXT | |

### Tabla `snapshots`
| Campo | Tipo |
|-------|------|
| id | INTEGER PK |
| user_id | INTEGER FK → users.id |
| wallet_id | INTEGER FK → wallets.id |
| data | TEXT (JSON) |
| created_at | TEXT |

---

## Testing Strategy

- **Framework:** Vitest con `pool: 'forks'` (requerido para native addons: better-sqlite3, bcrypt)
- **Models:** In-memory SQLite real (`:memory:`) — sin mocks de DB
- **Services:** `vi.mock('axios', () => ({ default: { get: vi.fn(), post: vi.fn() } }))` — factory explícita para ESM
- **Middleware:** Mock de `findUserById`
- **Routes:** `fastify.inject()` con instancia mínima

**72 tests, 7 archivos, todos en verde.**

---

## Seguridad

- `SESSION_SECRET` mínimo 32 chars — server hace `process.exit(1)` si no está
- `loadUser` nunca expone `password_hash` en `request.user`
- XSS: helper `esc()` en dashboard para datos de API en `innerHTML`
- `axios@1.15.0` — CRLF header injection fix + SSRF via no_proxy bypass fix

---

## Cron Jobs (Pendientes)

| Job | Schedule | Descripción |
|-----|----------|-------------|
| Snapshot semanal | Domingo 9am UTC-3 | Guardar estado del portfolio |

---

## Preguntas Abiertas (Etapa 2)

1. ¿The Graph subgraphs para DeFi o usar otra fuente?
2. ¿Alerts por Telegram, email o solo dashboard?
3. ¿Gráfico de evolución del portfolio?
4. ¿Soporte para Fantom/Sonic cuando Token API los agregue?
5. ¿Integrar token list (CoinGecko/Uniswap) para mejorar filtrado de spam?
