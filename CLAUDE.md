# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

AIRESTO — a restaurant reservation/order grid for "Супра". UI strings, comments, and commit messages are in Russian; keep that convention when editing.

Live frontend: https://ariesto.netlify.app | Backend: deployed to Render (`ariesto-project.onrender.com`).

## Commands

All commands from the repo root unless noted.

```sh
# First-time setup (installs root, frontend, backend)
npm run install:all

# Run both servers concurrently (frontend on Vite default 5173, backend on 3000)
npm run dev

# Run one side only
npm run dev:frontend
npm run dev:backend

# Production build (frontend only — what Netlify runs)
npm run build

# Frontend type-check (no emit)
cd frontend && npm run type-check

# Backend production start (what Render runs)
npm start
```

There is **no test suite** and **no linter configured** — don't claim "tests pass" or run a non-existent lint script. The only correctness gate is `vue-tsc` via `type-check`.

## Architecture

### Two-package layout

- [frontend/](frontend/) — Vue 3 + Vite + TypeScript SPA. Deployed to Netlify (see [netlify.toml](netlify.toml)).
- [backend/](backend/) — Express 5 API. Deployed to Render (see [render.yaml](render.yaml)).
- Root [package.json](package.json) is a thin orchestrator with `concurrently` scripts; it has no source of its own.

The two sides share a domain model conceptually but **do not share types** — [frontend/src/types/reservation.ts](frontend/src/types/reservation.ts) is a hand-maintained mirror of the JSON shapes the backend produces. When you change one, update the other.

### Backend: in-memory Map + JSON file persistence

[backend/index.js](backend/index.js) is a single CommonJS file. The `tsc` build step exists but the entry is plain JS — `postbuild` just copies `index.js` into `dist/`.

State lives in `database.orders: Map<dateString, Map<itemId, Item>>`. On every mutating request the whole map is serialized to [backend/data/orders.json](backend/data/orders.json) via `saveDatabase()`, and on startup `loadDatabase()` rehydrates it. There is **no real DB**. SIGINT/SIGTERM handlers also flush before exit.

**One table holds both orders and reservations**, discriminated by `status`:
- Orders: `New`, `Bill`, `Closed`, `Banquet`
- Reservations: `Reservation`, `LiveQueue`

The `GET /api/reservations/:date` endpoint splits them back apart in the response (`tables[].orders` vs `tables[].reservations`) and reshapes the field names (`start`/`end` → `start_time`/`end_time` for orders, `seating_time`/`end_time` + `name_for_reservation`/`phone_number` for reservations). If you add a new status, decide which bucket it falls in at both the storage layer **and** the response-shaping layer in `generateMockTables`.

Tables themselves are hardcoded in `generateMockTables` (12 tables across zones "1 этаж", "2 этаж", "Банкетный зал"). There is no table CRUD.

### Frontend: two large components do everything

The UI is essentially two files:

- [frontend/src/components/ReservationPage.vue](frontend/src/components/ReservationPage.vue) (~2000 lines) — owns all state: data fetching, date/zone filters, theme, drag-to-create, the new-order modal, scale widget. Read this first.
- [frontend/src/components/ReservationItem.vue](frontend/src/components/ReservationItem.vue) (~700 lines) — renders a single order/reservation card; status drives its color class (`order-banquet`, `order-reservation`, `order-live-queue`, `reservation-regular`, …).

`App.vue` is a thin shell that loads theme from localStorage and toggles `light-theme` on `<body>`. CSS variables (defined in [App.vue](frontend/src/App.vue)) drive theming; new colors should go through those vars, not hardcoded hex.

### Time grid model

The grid is generated client-side in `timeSlots` computed (ReservationPage), iterating from `restaurant.opening_time` to `closing_time` in 30-minute steps. Layout constants live in `config.grid` ([frontend/src/config/index.ts](frontend/src/config/index.ts)): `timeSlotHeight: 50`, `timeSlotMinutes: 30`. Both the drag math and item positioning depend on these — change them in one place.

Drag-to-create logic (`handleMouseDown` / `handleGlobalMouseMove` / `handleGlobalMouseUp` in ReservationPage) supports two axes:
- Vertical drag = time range on a single table (down-only).
- Horizontal drag = multiple tables at one time slot.
- Direction is locked once `> 20px` movement in one axis exceeds the other.

### API configuration

[frontend/src/config/index.ts](frontend/src/config/index.ts) picks the base URL in this order:
1. `VITE_API_BASE_URL` (explicit override)
2. `VITE_API_BASE_URL_DEV` or `http://localhost:3000` in dev
3. `VITE_API_BASE_URL_PROD` or `https://ariesto-project.onrender.com` in prod

All API calls go through [frontend/src/services/api.ts](frontend/src/services/api.ts) (`reservationApi` singleton). It hand-rolls cache-busting via `?_t=&_r=` query params and `Cache-Control: no-cache` headers on every GET — keep this when adding new endpoints, the Render free tier and browser caching have caused stale-data issues.

## Conventions

- UI strings, log messages, and code comments are in Russian. Match the surrounding style.
- The backend is CommonJS (`require`); the frontend is ESM (`import`). Don't mix.
- `.gitignore` excludes `backend/data/` — `orders.json` is local state, never commit it.
- Persistent state survives across server restarts via the JSON file. Sample data is only seeded if no entry exists for today's date — if you need a clean state in dev, delete `backend/data/orders.json`.
