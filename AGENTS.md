# Sigue Wallet — Agents

Documentación para agentes que trabajen en este proyecto.

## Proyecto

App de dashboard crypto multi-chain para Lucas. Port 3000. Stack: Fastify 5 + Knex + better-sqlite3 + EJS + Tailwind CSS local (sin build step). JavaScript ESM puro (no TypeScript).

## Ramas

```
main        ← producción (protegida)
develop     ← integración
feature/*   ← desde develop, PR a develop
fix/*       ← desde develop, PR a develop
```

Workflow: `git checkout -b feature/nombre` desde develop → trabajo → PR a develop → merge.

## Setup Local

```bash
cd ~/desarrollo/sigue-wallet
pnpm install
cp .env.example .env   # completar SESSION_SECRET y THEGRAPH_API_KEY
pnpm migrate           # crea sigue-wallet.db con el schema completo
pnpm dev               # arranca en http://localhost:3000
```

## Variables de Entorno

| Variable | Requerida | Descripción |
|----------|-----------|-------------|
| `THEGRAPH_API_KEY` | Sí | JWT token de thegraph.market/dashboard (columna "API Token") — NO el API Key de 32 chars |
| `SESSION_SECRET` | Sí | Mínimo 32 chars — el server no arranca sin esto |
| `PORT` | No | Default: `3000` |
| `HOST` | No | Default: `0.0.0.0` |
| `ADMIN_PASSWORD` | No | Default: `sigue2026` |

## Base de Datos

- SQLite en `sigue-wallet.db` (gitignored)
- Migrations en `src/models/migrations/` — archivos JS con `up()` / `down()`
- Knex trackea migraciones en tabla `knex_migrations` — idempotente
- Tablas: `users`, `wallets` (con `user_id` FK y `chains` JSON array), `snapshots`

**No usar SQL raw** — usar Knex schema builder. No usar `createTableIfNotExists` (deprecado).

### Schema actual de `wallets`

| Campo | Tipo | Notas |
|-------|------|-------|
| id | INTEGER PK | |
| user_id | INTEGER FK | → users.id CASCADE DELETE |
| alias | TEXT | |
| address | TEXT | Siempre lowercase |
| chains | TEXT | JSON array, e.g. `["ethereum","polygon"]` |
| created_at | TEXT | |
| updated_at | TEXT | |

> **IMPORTANTE:** El campo es `chains` (JSON array), NO `chain` (TEXT). Fue migrado en `20260416000001_wallets_chains_json.js`. El modelo `wallet.js` serializa/deserializa automáticamente.

## Fastify 5 — Notas Importantes

- **Vista rendering:** Usar `reply.view('template.ejs', data)` — NO `reply.render()` (no existe en Fastify 5)
- **Body parsing:** `@fastify/formbody` debe estar registrado para que `request.body` funcione en POSTs de formularios
- **Session:** Usar `@fastify/session@^11` (v10 no es compatible con Fastify 5)
- **Static files:** `@fastify/static` con `prefix: '/static/'`

## Rutas Principales

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/login` | Login page |
| POST | `/login` | Autenticar |
| GET | `/logout` | Logout |
| GET | `/dashboard` | Vista portafolio |
| GET | `/wallets` | Lista billeteras |
| GET | `/wallets/new` | Nueva billetera |
| GET | `/wallets/:id/edit` | Editar billetera |
| POST | `/wallets` | Crear billetera |
| POST | `/wallets/:id` | Actualizar billetera |
| POST | `/wallets/:id/delete` | Eliminar billetera |
| GET | `/api/wallets` | API — lista billeteras |
| GET | `/api/wallets/:id` | API — billetera por ID |
| GET | `/api/portfolio/wallet/:id` | API — balances por billetera |

**Prefijos API:** Las rutas API se registran con `{ prefix: '/api/wallets' }` y `{ prefix: '/api/portfolio' }` en `server.js`.

## API Externa — The Graph Token API

- **Endpoint:** `https://token-api.thegraph.com/v1/evm/balances`
- **Auth:** `Authorization: Bearer {JWT}` (header)
- **Params:** `?network={networkId}&address={address}` (NO `network_id`, es `network`)
- Free tier: 100k queries/mes

### Campos de respuesta (campos reales de la API)

| Campo API | Campo mapeado | Notas |
|-----------|--------------|-------|
| `amount` | `balance` | Raw string en wei — se divide por `10^decimals` usando BigInt |
| `value` | `valueUsd` | USD float |
| `decimals` | `decimals` | |
| `symbol` | `symbol` | |
| `name` | `name` | |
| `contract` | `contract` | null para token nativo |

> **NO usar** `balance` (no existe), `value_usd` (no existe), ni `price_usd` (no existe).

### Network IDs correctos

| Chain | network param | Soportado |
|-------|--------------|-----------|
| ethereum | `mainnet` | ✅ |
| bsc | `bsc` | ✅ |
| polygon | `polygon` | ✅ (NO `matic`) |
| avalanche | `avalanche` | ✅ |
| optimism | `optimism` | ✅ |
| arbitrum | `arbitrum-one` | ✅ |
| fantom | — | ❌ retorna `[]` con warning |
| sonic | — | ❌ retorna `[]` con warning |

### Spam token filtering

`getWalletBalances` aplica tres filtros client-side (la API no tiene filtrado nativo):

1. **URL/phishing patterns** en nombre o símbolo: `https://`, `www.`, `.com`, `.net`, `.io`, `.org`, `claim`, `airdrop`, `reward`, `visit`, `prize`
2. **Balance > 1 trillion** (overflow o supply astronómico)
3. **Round-number airdrop**: balance entero > 1,000 con valueUsd > $10 (spam se distribuye en cantidades redondas exactas; tokens legítimos de trading siempre tienen decimales)

### formatBalance usa BigInt

`Number()` pierde precisión para valores `> 2^53`. `formatBalance()` usa `BigInt` para la división entera, solo convierte a `Number` para el `.toFixed(4)` final.

## Testing

```bash
pnpm test              # run once
pnpm test:watch        # watch mode
pnpm test:coverage     # coverage report
```

### Estrategia

- **Models:** In-memory SQLite real (`:memory:`) — NO mockear la DB en tests de modelo
- **Services:** Mock `axios` con factory explícita: `vi.mock('axios', () => ({ default: { get: vi.fn(), post: vi.fn() } }))`
- **Middleware:** Mock de `findUserById`
- **Routes:** `fastify.inject()` con instancia mínima de Fastify

### Configuración Vitest

`pool: 'forks'` es **obligatorio** — `better-sqlite3` y `bcrypt` son native addons que no son thread-safe.

**Nunca modificar el código fuente para hacer tests**. Si algo no es testeable, refactorizar la API del módulo.

### Estado actual

72 tests, 7 archivos, todos en verde.

## Seguridad

- `SESSION_SECRET` mínimo 32 chars. El servidor hace `process.exit(1)` si no está seteado.
- `loadUser` en `middleware/auth.js` NUNCA expone `password_hash` en `request.user`.
- XSS: el dashboard usa `esc()` helper para escapar datos de API antes de hacer `innerHTML`.
- `axios@1.15.0` — incluye fix de CRLF header injection y SSRF via no_proxy bypass.

## Assets Estáticos

- **Tailwind:** `public/tailwind.min.js` (copia local del Play CDN — sin dependencia externa)
- **Logos de chains:** `public/images/chains/{chain}.png` (o `.svg` para Sonic)
- Todos los logos están descargados localmente. No hay CDN de imágenes.

## Dashboard — Notas de Implementación

- **Multi-chain:** cada wallet puede tener múltiples chains. El formulario envía `chains[]` como array.
- **Expandable rows:** `<details>/<summary>` nativo de HTML — sin JS para expand/collapse.
- **Copy contract:** ícono sutil por fila de token (`.opacity-0.group-hover:opacity-100`). Al hacer click muestra ✓ verde por 1.2s. No aparece para tokens sin contrato (ETH nativo).
- **Fetch por wallet:** el dashboard hace `fetch(/api/portfolio/wallet/${id})` por cada wallet al cargar. Los balances se muestran en skeleton hasta que responde la API.

## Billeteras Cargadas

| Alias | Address | Chains |
|-------|---------|--------|
| Lucas1 | `0x88a700a156935697a73c986adbfa0032ef8a7e25` | ethereum, bsc, polygon |

## Usuario Admin

- user: `admin`
- pass: `sigue2026` (cambiar en primer login via `ADMIN_PASSWORD` en `.env`)

## Design System

**Kraken Design System** — aplicado a todas las vistas.

Paleta:
- Primary: `#7132f5` (Kraken Purple)
- Text: `#101114` (near black)
- Muted: `#9497a9` (silver)
- Border: `#dedee5`
- Success green: `#149e61`
- Background: `#ffffff` (blanco, NO dark mode)

Tipografía: Inter (Google Fonts CDN)

NO usar Tailwind defaults (bg-gray-900, text-emerald, etc). Usar siempre la paleta Kraken.

## Credenciales GitHub

- Repo: `https://github.com/lucas77x/sigue-wallet`
- Push via HTTPS con `gh auth git-credential`
