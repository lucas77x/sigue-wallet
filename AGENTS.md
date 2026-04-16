# Sigue Wallet — Agents

Documentación para agentes que trabajen en este proyecto.

## Proyecto

App de dashboard crypto multi-chain para Lucas. Port 3000. Stack: Fastify 5 + Knex + better-sqlite3 + EJS + Tailwind CDN (sin build step). JavaScript ESM puro (no TypeScript).

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
| `THEGRAPH_API_KEY` | Sí | API key de The Graph Token API |
| `SESSION_SECRET` | Sí | Mínimo 32 chars — el server no arranca sin esto |
| `PORT` | No | Default: `3000` |
| `HOST` | No | Default: `0.0.0.0` |
| `ADMIN_PASSWORD` | No | Default: `sigue2026` |

## Base de Datos

- SQLite en `sigue-wallet.db` (gitignored)
- Migrations en `src/models/migrations/` — archivos JS con `up()` / `down()`
- Knex trackea migraciones en tabla `knex_migrations` — idempotente
- Tablas: `wallets` (con `user_id` FK), `users`, `snapshots`

**No usar SQL raw** — usar Knex schema builder. No usar `createTableIfNotExists` (deprecado).

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

**Prefijos API correctos:** Las rutas API se registran con `{ prefix: '/api/wallets' }` y `{ prefix: '/api/portfolio' }` en `server.js`.

## API Externa — The Graph Token API

- **Endpoint real:** `https://token-api.thegraph.com/v1/evm/balances`
- **Auth:** `Authorization: Bearer {THEGRAPH_API_KEY}` (header)
- **Params:** `?network_id={networkId}&address={address}`
- Requiere `THEGRAPH_API_KEY` en `.env`
- Free tier: 100k queries/mes

### Network IDs

| Chain | network_id |
|-------|-----------|
| ethereum | `mainnet` |
| bsc | `bsc` |
| polygon | `matic` |
| avalanche | `avalanche` |
| optimism | `optimism` |
| arbitrum | `arbitrum-one` |
| fantom | — |
| sonic | — |

### Limitaciones Conocidas

- **Fantom** y **Sonic** no están soportados por el Token API — `getWalletBalances()` retorna `[]` con un warning en consola
- Si se agregan wallets en esas chains, no mostrarán balances hasta que The Graph las soporte

## Testing

```bash
pnpm test              # run once
pnpm test:watch        # watch mode
pnpm test:coverage     # coverage report
```

### Estrategia

- **Models:** In-memory SQLite real (`:memory:`) — NO mockear la DB en tests de modelo
- **Services:** Mock `axios` con factory explícita: `vi.mock('axios', () => ({ default: { get: vi.fn(), post: vi.fn() } }))`
- **Middleware:** Mock `findUserById` con `vi.mock('../src/models/user.js')`
- **Routes:** `fastify.inject()` con instancia mínima de Fastify

### Configuración Vitest

`pool: 'forks'` es **obligatorio** — `better-sqlite3` y `bcrypt` son native addons que no son thread-safe.

**Nunca modificar el código fuente para hacer tests**. Si algo no es testeable, refactorizar la API del módulo.

## Seguridad

- `axios` fijado en `"1.14.0"` (sin `^`) — la versión `1.14.1` fue comprometida en un supply chain attack (marzo 2026, Sapphire Sleet). No actualizar sin verificar primero.
- `SESSION_SECRET` mínimo 32 chars. El servidor hace `process.exit(1)` si no está seteado.
- `loadUser` en `middleware/auth.js` NUNCA expone `password_hash` en `request.user`.
- XSS: el dashboard usa `esc()` helper para escapar datos de API antes de hacer `innerHTML`.

## Billeteras Cargadas

| Alias | Address | Chain |
|-------|---------|-------|
| Lucas1 | `0x88a700a156935697a73c986adbfa0032ef8a7e25` | ethereum |
| Lucas2 | `0x03c506af90ca423dd47b1c36f40ab4c31222199a` | bsc |
| Luora | `0xd093da75a0564bab73b300ef5008b28025fb6e19` | polygon |

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
- Success green: `#149e61` / `#026b3f`
- Purple subtle: `rgba(133,91,251,0.16)`
- Background: `#ffffff` (blanco, NO dark mode)

Tipografía: Inter (Google Fonts CDN)

Componentes:
- Buttons: `border-radius: 12px`, padding `13px 16px`
- Cards: `border-radius: 16px`, shadow `rgba(0,0,0,0.03) 0px 4px 24px`
- Inputs: border `#dedee5`, focus border `#7132f5`
- Badges: purple subtle bg + purple text

NO usar Tailwind defaults (bg-gray-900, text-emerald, etc). Usar siempre la paleta Kraken.

## Credenciales GitHub

- Repo: `https://github.com/lucas77x/sigue-wallet`
- Push via HTTPS con `gh auth git-credential`
