# Sigue Wallet — Agents

Documentación para agentes que trabajen en este proyecto.

## Proyecto

App de dashboard crypto multi-chain para Lucas. Port 3000. Stack: Fastify 5 + Knex + better-sqlite3 + EJS + Tailwind CDN (sin build step).

## Ramas

```
main        ← producción (protegida)
develop     ← integración
feature/*   ← desde develop, PR a develop
```

Workflow: `git checkout -b feature/nombre` desde develop → trabajo → PR a develop → merge.

## Setup Local

```bash
cd ~/.hermes/sigue-wallet
npm install
# agregar THEGRAPH_API_KEY al .env
npm start
```

## Base de Datos

- SQLite en `sigue-wallet.db`
- Schema en `src/models/migrations/001_initial.sql`
- Tablas: `wallets`, `users`, `snapshots`

## Rutas Principales

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/login` | Login |
| POST | `/login` | Auth |
| GET | `/logout` | Logout |
| GET | `/dashboard` | Portafolio |
| GET | `/wallets` | Lista billeteras |
| GET | `/wallets/new` | Nueva |
| GET | `/wallets/:id/edit` | Editar |
| POST | `/wallets` | Crear |
| POST | `/wallets/:id` | Actualizar |
| POST | `/wallets/:id/delete` | Eliminar |
| GET | `/api/portfolio` | API portafolio |
| GET | `/api/wallets` | API billeteras |

## Billeteras (ya cargadas)

- Lucas1: `0x88a700a156935697a73c986adbfa0032ef8a7e25`
- Lucas2: `0x03c506af90ca423dd47b1c36f40ab4c31222199a`
- Luora: `0xd093da75a0564bab73b300ef5008b28025fb6e19`

## API Externa

The Graph Token API (free tier 100k queries/mes). Endpoint: `https://gateway.thegraph.com`. Requiere `THEGRAPH_API_KEY` en `.env`.

Chains: ethereum, bsc, polygon, avalanche, optimism, fantom, arbitrum, sonic.

## Usuario Admin

- user: `admin`
- pass: `sigue2026` (cambiar en primer login)

## Credenciales GitHub

- Repo: `https://github.com/lucas77x/sigue-wallet`
- push via HTTPS con `gh auth git-credential`

## Voz

Edge TTS con `es-AR-TomasNeural`. Solo audio en Telegram, sin texto.

## Design System

**Kraken Design System** — aplicado a todas las vistas.

Paleta:
- Primary: `#7132f5` (Kraken Purple)
- Text: `#101114` (near black)
- Muted: `#9497a9` (silver)
- Border: `#dedee5`
- Success green: `#149e61` / `#026b3f`
- Purple subtle: `rgba(133,91,251,0.16)`
- Background: `#ffffff` (white, NOT dark)

Tipografía: Inter (Google Fonts CDN)

Componentes:
- Buttons: `border-radius: 12px`, padding `13px 16px`
- Cards: `border-radius: 16px`, shadow `rgba(0,0,0,0.03) 0px 4px 24px`
- Inputs: border `#dedee5`, focus border `#7132f5`
- Badges: purple subtle bg + purple text

NO usar Tailwind defaults (bg-gray-900, text-emerald, etc). Usar siempre la paleta Kraken.
