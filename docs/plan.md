# Sigue Wallet — Plan

## Meta

- **Usuario:** Lucas (developer, GitHub: lucas77x)
- **Fecha inicio:** 2026-04-15
- **Stack:** Fastify 5 + Knex + better-sqlite3 + EJS + Tailwind CDN
- **Repo:** `https://github.com/lucas77x/sigue-wallet`

---

## Estado Actual

### Etapa 1 — Balances

| Feature | Estado | Notas |
|---------|--------|-------|
| Login con password encriptada (bcrypt + sessions) | ✅ Completo | |
| Wallet ABM (crear, editar, eliminar) | ✅ Completo | |
| Balance de tokens ERC-20 por wallet/chain | ✅ Completo | Via The Graph Token API real |
| Migrations idempotentes (Knex) | ✅ Completo | Reemplazó runner SQL manual |
| Test suite (Vitest) | ✅ Completo | ~62 tests, pool: forks |
| ESLint + Prettier | ✅ Completo | ESLint 9 flat config |
| Iconos de tokens desde `logo_url` | ⬜ Pendiente | |
| Balance total en USD | ⬜ Pendiente | |
| Snapshot semanal (domingo 9am UTC-3) | ⬜ Pendiente | |

### Bugs Críticos Resueltos (2026-04-15)

| # | Bug | Branch |
|---|-----|--------|
| 1 | `loadUser` no existía — crash al importar | `fix/auth-middleware` |
| 2 | `setViewEngine()` no existe en Fastify 5 — usar `@fastify/view` + `reply.view()` | `fix/server-startup` |
| 3 | `@fastify/static` y `public/` no existían | `fix/server-startup` |
| 4 | `@fastify/formbody` no registrado — POSTs con `body = null` | `fix/server-startup` |
| 5 | API routes sin prefijo — conflictos de rutas | `fix/server-startup` |
| 6 | `wallets` sin columna `user_id` — queries vacías | `fix/database-schema` |
| 7 | `thegraph.js` era un stub con endpoint incorrecto | `fix/thegraph-service` |
| 8 | `SESSION_SECRET` undefined — sessions inseguras | `fix/server-startup` |
| 9 | `.env.example` incompleto (faltaban SESSION_SECRET, PORT, HOST, ADMIN_PASSWORD) | `fix/env-and-config` |
| 10 | Migration runner no idempotente — fallaba en ALTER TABLE | `fix/database-schema` |

---

## Etapa 2 — DeFi Positions (futuro)

- Aave, Uniswap, Curve, Venus, PancakeSwap, Beefy, QuickSwap, Balancer
- Health factor alerts
- Evaluar The Graph subgraphs vs otras opciones

---

## Data Source

**The Graph Token API** (gratis, 100k queries/mes)
- Endpoint: `https://token-api.thegraph.com/v1/evm/balances`
- Auth: `Authorization: Bearer {API_KEY}`
- Params: `?network_id={networkId}&address={address}`
- Requiere `THEGRAPH_API_KEY` en `.env`

### Coverage

| Chain | network_id | Soportado |
|-------|-----------|-----------|
| ethereum | `mainnet` | ✅ |
| bsc | `bsc` | ✅ |
| polygon | `matic` | ✅ |
| avalanche | `avalanche` | ✅ |
| optimism | `optimism` | ✅ |
| arbitrum | `arbitrum-one` | ✅ |
| fantom | — | ❌ No soportado |
| sonic | — | ❌ No soportado |

---

## Arquitectura

```
sigue-wallet/
├── public/                     # Static assets
├── src/
│   ├── server.js               # Fastify entry point
│   ├── middleware/
│   │   └── auth.js             # loadUser + requireAuth
│   ├── models/
│   │   ├── db.js               # Knex singleton + runMigrations()
│   │   ├── migrate.js          # Script: pnpm migrate
│   │   ├── migrations/         # JS migrations (up/down)
│   │   ├── user.js             # User queries
│   │   └── wallet.js           # Wallet CRUD
│   ├── routes/
│   │   ├── auth.js             # Login/logout
│   │   ├── dashboard.js        # Dashboard page
│   │   ├── wallets.js          # Wallet ABM pages
│   │   └── api/
│   │       ├── wallets.js      # GET /api/wallets
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
│   │   └── create-test-db.js   # In-memory SQLite helper
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   └── services/
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
| Campo | Tipo |
|-------|------|
| id | INTEGER PK |
| user_id | INTEGER FK → users.id |
| alias | TEXT |
| address | TEXT (lowercase) |
| chain | TEXT |
| created_at | TEXT |
| updated_at | TEXT |

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

- **Framework:** Vitest con `pool: 'forks'` (requerido para native addons como better-sqlite3 y bcrypt)
- **Models:** In-memory SQLite real (`:memory:`) — sin mocks de DB
- **Services:** `vi.mock('axios', () => ({ default: { get: vi.fn(), post: vi.fn() } }))` — factory explícita para ESM
- **Middleware:** Mock de `findUserById`
- **Routes:** `fastify.inject()` con instancia mínima

Estructura de tests espeja `src/`:
```
tests/
├── helpers/create-test-db.js
├── middleware/auth.test.js
├── models/user.test.js
├── models/wallet.test.js
├── routes/auth.test.js
├── routes/api.wallets.test.js
├── services/portfolio.test.js
└── services/thegraph.test.js
```

---

## Rutas

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/login` | Login page |
| POST | `/login` | Authenticate |
| GET | `/logout` | Logout |
| GET | `/dashboard` | Portfolio view |
| GET | `/wallets` | Lista billeteras |
| GET | `/wallets/new` | Nueva billetera |
| GET | `/wallets/:id/edit` | Editar billetera |
| POST | `/wallets` | Crear |
| POST | `/wallets/:id` | Actualizar |
| POST | `/wallets/:id/delete` | Eliminar |
| GET | `/api/wallets` | JSON billeteras |
| GET | `/api/wallets/:id` | JSON billetera por ID |
| GET | `/api/portfolio/wallet/:id` | JSON balances por billetera |

---

## Seguridad

- `axios` fijado en `"1.14.0"` (sin `^`) — `1.14.1` comprometida en supply chain attack (Sapphire Sleet, marzo 2026)
- `SESSION_SECRET` mínimo 32 chars — server hace `process.exit(1)` si no está
- `loadUser` nunca expone `password_hash` en `request.user`
- XSS: helper `esc()` en dashboard para datos de API en `innerHTML`

---

## Billeteras Cargadas

| Alias | Address | Chain |
|-------|---------|-------|
| Lucas1 | `0x88a700a156935697a73c986adbfa0032ef8a7e25` | ethereum |
| Lucas2 | `0x03c506af90ca423dd47b1c36f40ab4c31222199a` | bsc |
| Luora | `0xd093da75a0564bab73b300ef5008b28025fb6e19` | polygon |

---

## Cron Jobs (Pendientes)

| Job | Schedule | Descripción |
|-----|----------|-------------|
| Snapshot semanal | Domingo 9am UTC-3 | Guardar estado del portfolio |

---

## Credenciales

- **Admin:** `admin` / `sigue2026` (cambiar via `ADMIN_PASSWORD` en `.env`)
- **GitHub:** `lucas77x` (HTTPS con `gh auth git-credential`)
- **The Graph:** `THEGRAPH_API_KEY` en `.env`

---

## Git Flow

```
main        ← producción (protegida)
develop     ← integración
feature/*   ← desde develop, PR a develop
fix/*       ← desde develop, PR a develop
```

---

## Preguntas Abiertas (Etapa 2)

1. ¿The Graph subgraphs para DeFi o usar otra fuente?
2. ¿Alerts por Telegram, email o solo dashboard?
3. ¿Gráfico de evolución del portfolio?
4. ¿Soporte para Fantom/Sonic cuando Token API los agregue?
