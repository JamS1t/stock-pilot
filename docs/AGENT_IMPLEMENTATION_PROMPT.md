# Agent Implementation Prompt - StockPilot Counter AI

You are implementing **StockPilot Counter AI** in this repository.

Read these files first, in order:

1. `docs/README.md`
2. `docs/COUNTER_AI_STRATEGY.md`
3. `docs/COUNTER_AI_ROADMAP.md`
4. `docs/COUNTER_AI_SYSTEM_SPECS.md`
5. `docs/COUNTER_AI_GTM.md`
6. `CLAUDE.md`

The old `docs/ROADMAP.md` is historical context for the earlier utang-only pivot. Use it only to understand already-started utang schema work. The current product direction is **tablet-first Counter AI**, not mobile-first utang-only.

## Mission

Redirect the existing StockPilot app from a generic POS/inventory dashboard into a tablet-first, offline-capable counter system for serious small retailers.

The product must help store owners answer:

- What did I sell today?
- How much cash should I have?
- What stock is low?
- Who owes me?
- What should I buy next?
- Where am I losing money?

## Non-Negotiables

- Keep the app usable manually before adding AI.
- Build tablet/desk counter mode first. Phone mode is secondary.
- Offline behavior is core, not polish.
- AI must create drafts/suggestions. It must not silently mutate stock, cash, or balances.
- Reuse existing backend, auth, stored-procedure pattern, and POS/inventory code where practical.
- Do not delete old POS/inventory/report code casually. Demote or reuse it.
- Do not overwrite unrelated user changes.
- Run builds/checks before committing.
- Commit each important feature slice separately.

## Git And Commit Rules

Before starting:

```bash
git status --short
```

If there are existing changes you did not make:

- Do not revert them.
- Do not include them in your commits unless they are required for your task.
- If a file has unrelated edits, inspect carefully before modifying.

Commit after each important feature slice. Do not wait until the end.

Recommended commit style:

```text
feat(counter): add tablet dashboard shell
feat(api): wire customer utang payment routes
feat(offline): add indexeddb sync queue
feat(pwa): add manifest and service worker
feat(cash): add cash session model
feat(ai): add receipt extraction endpoint stub
fix(counter): handle offline sale retry
docs(counter): update implementation notes
```

Each commit should contain:

- One coherent feature or fix
- Related tests/build fixes
- No unrelated formatting churn
- No generated build output unless the repo already tracks it

Before every commit:

```bash
cd backend && npm run build
cd ../stackpilot && npm run build
```

If a build cannot be run, document why in the commit message body or final report.

## Multi-Agent Coordination

If using multiple agents, assign disjoint ownership. Do not let two agents edit the same feature surface at the same time without coordination.

Recommended split:

### Agent A - Backend Counter APIs

Owns:

- `backend/src/controllers/*`
- `backend/src/routes/*`
- `backend/src/services/*`
- `backend/src/db/procedures/*`
- `backend/sql/*`
- `backend/src/app.ts`

Tasks:

- Wire `/api/customers`
- Wire `/api/utang`
- Wire `/api/payments`
- Add `stock_movements`
- Add `cash_sessions`
- Add sync-safe mutation IDs where practical

Do not edit frontend except minimal type/API notes if explicitly assigned.

### Agent B - Tablet Counter Frontend

Owns:

- `stackpilot/App.tsx`
- `stackpilot/components/*`
- `stackpilot/pages/*`
- `stackpilot/types.ts`

Tasks:

- Build `CounterDashboard`
- Replace sidebar-first default experience
- Add tablet/landscape counter layout
- Add sale/cart/customer/utang/payment UI skeleton
- Keep existing inventory/report pages accessible as secondary/admin views

Do not change backend API contracts unless coordinated.

### Agent C - API Client And Offline Layer

Owns:

- `stackpilot/utils/api.ts`
- `stackpilot/utils/*`
- new `stackpilot/offline/*` or `stackpilot/data/*`
- IndexedDB helpers

Tasks:

- Add customer/utang/payment API helpers
- Add local IndexedDB schema
- Add sync queue
- Add offline write helpers
- Add retry/idempotency utilities

Coordinate closely with Agents A and B.

### Agent D - PWA And Installability

Owns:

- `stackpilot/vite.config.ts`
- `stackpilot/index.html`
- `stackpilot/public/*`
- service worker files
- package dependencies for PWA only

Tasks:

- Add manifest
- Add icons if needed
- Add service worker/PWA plugin
- Remove core runtime dependence on CDN scripts where practical
- Ensure app shell can load offline after first install

### Agent E - AI Foundation

Owns:

- `backend/src/services/ai.service.ts`
- `backend/src/controllers/ai.controller.ts`
- `backend/src/routes/ai.routes.ts`
- AI-related SQL

Tasks:

- Add AI endpoint stubs
- Add `ai_calls` storage plan/table
- Add receipt extraction interface
- Add cost/rate-limit hooks
- Return draft data only

Do not build full chatbot first.

## Implementation Order

Follow this order unless explicitly redirected.

### Step 1: Stabilize Current Baseline

- Run backend build.
- Run frontend build.
- Record existing warnings.
- Check uncommitted changes.

Commit only if you changed documentation or setup.

### Step 2: Finish Core Utang/Customer/Payment API

Goal:

Existing utang stored-procedure wrappers must be reachable over authenticated HTTP routes.

Required endpoints:

- `GET /api/customers`
- `POST /api/customers`
- `PUT /api/customers/:id`
- `DELETE /api/customers/:id`
- `GET /api/utang`
- `POST /api/utang`
- `DELETE /api/utang/:id` or `POST /api/utang/:id/void`
- `GET /api/utang/who-owes`
- `GET /api/utang/customers/:id/balance`
- `GET /api/payments`
- `POST /api/payments`
- `DELETE /api/payments/:id` or `POST /api/payments/:id/void`

Acceptance:

- Backend builds.
- Routes are behind `requireAuth`.
- `store_id` comes from JWT, not request body.
- Responses use existing response utility style.
- Commit: `feat(api): wire counter ledger routes`

### Step 3: Add Frontend API Helpers

Goal:

Frontend can call the new backend routes.

Required helpers:

- `getCustomers`
- `createCustomer`
- `updateCustomer`
- `deleteCustomer`
- `createUtang`
- `listUtang`
- `voidUtang`
- `getWhoOwes`
- `getCustomerBalance`
- `recordPayment`
- `listPayments`
- `voidPayment`

Acceptance:

- Types are defined.
- Existing `fetchApi` refresh behavior remains intact.
- Frontend builds.
- Commit: `feat(api): add counter ledger client helpers`

### Step 4: Build Tablet Counter Dashboard Shell

Goal:

Authenticated users land in a counter-first tablet interface.

Required UI:

- Main `CounterDashboard`
- Product/search area
- Cart/current transaction area
- Right-side owner panel with:
  - Today sales placeholder
  - Expected cash placeholder
  - Low stock placeholder
  - Who owes placeholder
  - Offline/sync status placeholder
- Secondary navigation to old Inventory, Reports, Categories, Suppliers, Order History, Settings

Acceptance:

- Default page is counter dashboard, not old POS sidebar.
- Layout works at desktop/tablet widths.
- Touch targets are large.
- Existing old pages are not deleted.
- Frontend builds.
- Commit: `feat(counter): add tablet dashboard shell`

### Step 5: Connect Manual Counter Flows

Goal:

Manual flow works before offline and AI.

Required:

- Add products to cart.
- Process sale using current order API where possible.
- Create utang entry from counter flow.
- Record payment/bayad.
- Show customer balance.
- Show who-owes list.

Acceptance:

- Owner can make a cash sale.
- Owner can add customer credit.
- Owner can record payment.
- Balances update after refresh.
- Build passes.
- Commit: `feat(counter): connect sale utang payment flows`

### Step 6: Add Stock Movements And Cash Sessions

Goal:

Move from POS-only transactions toward owner money control.

Required:

- `stock_movements` table/procs/API
- `cash_sessions` table/procs/API
- Open/close cash session
- Expected cash calculation placeholder or first pass
- Adjustment reasons

Acceptance:

- Stock changes are append-only.
- Cash close can record actual cash and difference.
- Backend builds.
- Commit: `feat(cash): add cash sessions and stock movements`

### Step 7: Add Offline Foundation

Goal:

Core writes can be queued offline.

Required:

- IndexedDB schema
- Device ID
- Sync queue
- Offline write helper
- Retry helper
- Idempotency/client mutation IDs
- Offline status indicator

Acceptance:

- App can create local queued records without network.
- Queue is visible/debuggable.
- No duplicate sync on retry for implemented operations.
- Frontend builds.
- Commit: `feat(offline): add indexeddb sync queue`

### Step 8: Add PWA Installability

Goal:

App can install and load shell offline.

Required:

- Manifest
- Service worker
- Icons
- App shell cache
- Offline fallback
- Remove or reduce CDN runtime dependencies

Acceptance:

- Frontend builds.
- App has manifest.
- App shell loads after first visit without network.
- Commit: `feat(pwa): add offline installability`

### Step 9: Add AI Receipt Foundation

Goal:

Prepare first marketable AI feature without overbuilding.

Required:

- Backend AI service wrapper
- `POST /api/ai/receipt/extract`
- `ai_calls` table or migration draft
- Response shape for receipt extraction draft
- Cost/rate-limit placeholders
- No automatic stock mutation

Acceptance:

- Endpoint returns structured draft or controlled stub.
- AI response is logged/planned for replay.
- Backend builds.
- Commit: `feat(ai): add receipt extraction foundation`

## Build And Verification

Minimum verification before final handoff:

```bash
cd backend
npm run build

cd ../stackpilot
npm run build
```

Also run:

```bash
git status --short
git log --oneline -n 10
```

Report:

- Commits created
- Files changed
- Features implemented
- Build results
- Known gaps
- Next recommended task

## Product Guardrails

Do not drift into:

- Chatbot-first UX
- Native mobile app
- Procurement marketplace
- Lending/BNPL
- Enterprise accounting
- Full rewrite

Stay focused on:

- Counter selling
- Daily cash clarity
- Inventory movement
- Utang/bayad
- Offline reliability
- AI receipt capture as a draft workflow

## Final Handoff Format

When done, respond with:

```text
Implemented:
- ...

Commits:
- <hash> <message>

Verification:
- backend build: pass/fail
- frontend build: pass/fail

Changed files:
- ...

Known gaps:
- ...

Next:
- ...
```

