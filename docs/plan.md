# Sigue Wallet — Plan

## Meta

- **Usuario:** Lucas (developer, GitHub: lucas77x)
- **Fecha:** 2026-04-15
- **Stack:** Fastify 5 + Knex + better-sqlite3 + EJS + Tailwind CDN
- **Repo:** `https://github.com/lucas77x/sigue-wallet`

---

## Alcance

### Etapa 1 — Balances (presente)

- Login con password encriptada (bcrypt + sessions)
- Wallet ABM (CRUD): crear, editar, eliminar billeteras
- Balance de tokens ERC-20 por wallet y chain
- Balance total USD
- Snapshot semanal (domingo 9am UTC-3)
- Iconos de tokens desde `logo_url` del API

### Etapa 2 — DeFi Positions (futuro)

- Aave, Uniswap, Curve, Venus, PancakeSwap, Beefy, QuickSwap, Balancer
- Health factor alerts
- Evaluar The Graph subgraphs vs otras opciones

---

## Data Source

**The Graph Token API** (gratis, 100k queries/mes)
- Endpoint: `https://gateway.thegraph.com`
- Requiere `THEGRAPH_API_KEY` en `.env`
- Coverage: ETH, BSC, Polygon, Avalanche, Optimism, Fantom, Arbitrum
- Sonic: verificar soporte; RPC fallback si no

---

## Arquitectura

```
src/
├── server.js              # Fastify entry point
├── models/
│   ├── db.js              # Knex singleton
│   ├── migrations/         # SQL migrations
│   ├── user.js             # User queries
│   └── wallet.js           # Wallet CRUD
├── services/
│   ├── thegraph.js         # The Graph API client
│   └── portfolio.js        # Balance aggregation
├── routes/
│   ├── auth.js             # Login/logout
│   ├── dashboard.js        # Dashboard page
│   ├── wallets.js          # Wallet ABM pages
│   └── api/
│       ├── wallets.js      # Wallet REST API
│       └── portfolio.js    # Portfolio REST API
├── middleware/
│   └── auth.js             # Session guard
└── views/
    ├── login.ejs
    ├── dashboard.ejs
    └── wallets/
        ├── index.ejs
        └── form.ejs
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
| user_id | INTEGER FK |
| alias | TEXT |
| address | TEXT |
| chain | TEXT |
| created_at | TEXT |
| updated_at | TEXT |

### Tabla `snapshots`
| Campo | Tipo |
|-------|------|
| id | INTEGER PK |
| user_id | INTEGER FK |
| wallet_id | INTEGER FK |
| data | TEXT (JSON) |
| created_at | TEXT |

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
| GET | `/api/portfolio` | JSON portafolio |
| GET | `/api/portfolio/wallet/:id` | JSON por billetera |
| GET | `/api/wallets` | JSON billeteras |

---

## Billeteras Cargadas

| Alias | Address | Chain |
|-------|---------|-------|
| Lucas1 | `0x88a700a156935697a73c986adbfa0032ef8a7e25` | ethereum |
| Lucas2 | `0x03c506af90ca423dd47b1c36f40ab4c31222199a` | bsc |
| Luora | `0xd093da75a0564bab73b300ef5008b28025fb6e19` | polygon |

---

## Cron Jobs

| Job | Schedule | Descripción |
|-----|----------|-------------|
| Snapshot semanal | Domingo 9am UTC-3 | Guardar estado del portfolio |
| NPM security | Daily 9am UTC-3 | Verificar vulnerabilidades |

---

## Credenciales

- **Admin:** `admin` / `sigue2026` (cambiar en primer login)
- **GitHub:** `lucas77x` (HTTPS con `gh auth git-credential`)
- **The Graph:** requiere API key en `THEGRAPH_API_KEY`

---

## Git Flow

```
main        ← producción (protegida)
develop     ← integración
feature/*   ← desde develop, PR a develop
```

Para cada feature:
1. `git checkout -b feature/nombre` desde `develop`
2. Trabajo
3. PR a `develop`
4. Merge a `main` cuando esté en producción

---

## Preguntas Abiertas (Etapa 2)

1. ¿The Graph subgraphs para DeFi o usar otra fuente?
2. ¿Alerts por Telegram, email o solo dashboard?
3. ¿Gráfico de evolución del portfolio?
4. ¿Otras chains además de las 7 ya cubiertas?
