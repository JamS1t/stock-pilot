# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Current Direction — Read This First

**As of 2026-04-20, this project is mid-pivot.** The app is being repositioned from a generic POS/inventory dashboard into a mobile-first utang (customer credit) tracker for Philippine sari-sari stores, with AI (Taglish voice entry + notebook OCR) as the differentiator.

Before writing code, read **`docs/ROADMAP.md`** — it contains the approved 4-phase MVP plan, the Phase 1 task breakdown with dependencies, and the list of files to extend vs rebuild vs reuse. The existing POS/Inventory/Reports pages are NOT deleted during the pivot; they get demoted to "Coming soon" and become a Pro+ tier later.

## Project Overview

Stock Pilot is a full-stack inventory and POS (Point of Sale) dashboard. It consists of two separate packages:

- **`backend/`** — Express 5 + TypeScript REST API, deployed on Railway
- **`stackpilot/`** — React 19 + Vite + TypeScript frontend, deployed on Vercel

## Commands

### Backend (`cd backend`)
```bash
npm run dev      # Start dev server with ts-node-dev (hot reload) on port 5000
npm run build    # Compile TypeScript to dist/
npm start        # Run compiled output
```

### Frontend (`cd stackpilot`)
```bash
npm run dev      # Start Vite dev server
npm run build    # Production build
npm run preview  # Preview production build
```

No test runner is configured in either package.

## Architecture

### Backend

The backend is a standard Express MVC app with a MySQL database accessed exclusively via stored procedures.

**Request flow:** `routes/` → `controllers/` → `db/procedures/` → MySQL via `db/callProc.ts`

- `src/app.ts` — wires up middleware and routes. `/health` and `/api/auth` are public; all other `/api/*` routes are protected by `requireAuth` middleware.
- `src/db/callProc.ts` — single utility that executes `CALL <DB_NAME>.<procName>(?)` against the connection pool. All DB access goes through this.
- `src/db/procedures/` — one file per domain (auth, category, order, product, report, supplier), each exporting typed wrappers around `callProc`.
- `src/middlewares/auth.middleware.ts` — JWT-based auth, reads `Authorization: Bearer <token>` header.
- Auth uses short-lived JWTs (15 min) + long-lived refresh tokens (30 days) stored as HttpOnly cookies.

**Environment variables** (configured in `backend/.env`):
- `PORT`, `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`
- `GOOGLE_CLIENT_ID` — for Google OAuth login
- `JWT_ACCESS_SECRET`, `ACCESS_EXP_MINUTES`
- `REFRESH_HMAC_KEY`, `REFRESH_EXP_DAYS`
- `CORS_ORIGIN` — set to frontend origin
- `NODE_ENV`, `MOCK_GOOGLE`

### Frontend

Single-page React app using manual routing (no React Router) via `activePage` state in `App.tsx`.

**Key patterns:**
- `stackpilot/utils/api.ts` — all API calls go through `fetchApi()`, which handles 401 token refresh automatically using a shared `refreshPromise` lock to avoid duplicate refresh races. The base URL points to the Railway-deployed backend.
- `stackpilot/context/AuthContext.tsx` — stores auth state (user, store, role, accessToken, metadata) in both React state and `localStorage`. Exports a `getAuthContext()` global accessor used by `api.ts` to call `login`/`logout` outside of React component scope.
- Each page component (`pages/`) is self-contained: it fetches its own data and manages its own local state.
- `stackpilot/types.ts` — legacy local type definitions (mostly unused now that API interfaces are defined in `api.ts`).

**Pages:** POS, Inventory, Reports, Categories, Suppliers, OrderHistory, AdminSettings, Login.

### Auth Flow

1. User authenticates via Google OAuth (`@react-oauth/google`).
2. Frontend sends the Google token to `/api/auth/google-login`.
3. Backend validates with Google, issues a short-lived JWT access token + HttpOnly refresh token cookie.
4. On 401, `fetchApi` calls `/api/auth/refresh` to get a new access token before retrying.
5. New users are redirected to setup their store before accessing the app.
