# StockPilot Counter AI - Roadmap

## Roadmap Principle

Build only what proves a store owner will use and pay for the product.

The roadmap is gated. Do not move to later phases because they are interesting. Move because the previous phase worked in real stores.

## Phase 0: Market Validation

Timeline: 2 weeks

Goal: confirm the target market before adding more code.

### Actions

- Interview 20 store owners.
- Visit 5 to 10 stores in person.
- Watch how they record sales, stock, supplier purchases, utang, and cash.
- Do not pitch first. Observe current behavior.
- Ask what costs them money each week.
- Ask what they would pay for: daily profit, stock alerts, receipt scanning, utang, or cash mismatch.
- Identify stores with a tablet, laptop, or willingness to use a counter device.

### Validation Gate

Continue only if:

- At least 5 owners agree to pilot.
- At least 3 owners say they would pay PHP 299+ per month if it works.
- At least 2 owners have or will use a tablet/laptop at the counter.
- At least 1 owner gives access to real supplier receipts for AI testing.

### Deliverables

- Interview notes
- Top 5 repeated pain points
- Pilot store shortlist
- Device/internet constraints
- First pricing signal

## Phase 1: Tablet Counter MVP

Timeline: 4 to 6 weeks

Goal: one real store can use StockPilot for a full selling day.

### Features

- Tablet-first counter shell
- Product catalog
- Fast product search
- Quick sale
- Cash, GCash, and utang payment modes
- Customer/suki balance
- Record bayad
- Stock deduction on sale
- Manual stock adjustment
- Basic daily sales summary
- Offline write queue for sales, utang, payments, and stock adjustments

### Backend Work

- Wire existing customer/utang/payment procedure wrappers into services, controllers, and routes.
- Add `stock_movements`.
- Add `cash_sessions`.
- Add sync-ready IDs and timestamps where needed.
- Keep old POS/inventory endpoints working while new counter UI is built.

### Frontend Work

- Replace sidebar-first app shell with tablet-first `CounterDashboard`.
- Keep existing pages as secondary/admin screens.
- Add large touch targets and landscape layout.
- Add offline/sync status in the main shell.
- Add basic IndexedDB local store.

### Success Gate

Continue only if:

- A store can process 100 transactions in one day.
- Sales still work when internet is off.
- Owner can close the day and see expected cash.
- Utang and payment balances are understandable.
- Manual flow is fast enough without AI.

## Phase 2: Offline PWA

Timeline: 3 to 4 weeks

Goal: make the app installable and reliable on cheap counter hardware.

### Features

- `manifest.webmanifest`
- Service worker
- Cached app shell
- IndexedDB local database
- Durable sync queue
- Retry failed sync
- Conflict-safe append-only events for sales, payments, and stock movement
- Offline badge
- Export backup CSV
- Reconnect sync status

### Engineering Tasks

- Remove runtime dependency on CDN scripts for core app behavior.
- Add PWA plugin or service-worker build integration.
- Add local schemas for products, customers, sales, sale items, utang entries, payments, stock movements, and sync queue.
- Add sync endpoints.
- Add device ID.
- Add idempotency keys for writes.

### Success Gate

Airplane-mode test must pass:

- Create sales.
- Add utang.
- Record bayad.
- Adjust stock.
- Close day locally.
- Reconnect.
- Sync without duplicate sales or wrong balances.

## Phase 3: AI Receipt Capture

Timeline: 4 to 6 weeks

Goal: ship the first marketable AI feature.

### Features

- Supplier receipt photo upload
- AI extraction into stock-in draft
- Extract supplier, date, items, quantities, unit cost, and total
- Product matching
- New product suggestion
- Cost price update draft
- Human confirmation before stock changes
- Confidence indicators
- AI call logging and cost tracking

### Backend Work

- Add AI service wrapper.
- Add `ai_calls`.
- Add `supplier_receipts`.
- Add `supplier_receipt_items`.
- Add image upload handling.
- Store raw AI response for debugging and eval replay.
- Add per-store rate limits.

### Frontend Work

- Add receipt capture flow.
- Add review screen for extracted items.
- Add match/create product UI.
- Add confirm stock-in action.

### Success Gate

Continue only if:

- Real receipt extraction is useful at least 80% of the time.
- Owner says it saves time.
- AI cost fits inside the planned subscription margin.
- Bad extraction cannot silently corrupt inventory.

## Phase 4: Owner Intelligence

Timeline: 4 to 6 weeks

Goal: make StockPilot valuable after setup, not only during checkout.

### Features

- Low-stock suggestions
- Reorder list
- Slow-moving item alerts
- Margin warning
- Profit leak alerts
- Daily close assistant
- Cash mismatch alert
- Weekly owner summary

### Success Gate

Continue only if:

- Owner opens the dashboard outside checkout.
- Owner uses reorder list or margin warnings at least weekly.
- Pilot stores report fewer stockouts or clearer daily cash.

## Phase 5: Paid Pilot

Timeline: 4 weeks

Goal: prove willingness to pay.

### Target

- 10 stores
- 2 to 4 weeks usage
- Founder-assisted onboarding
- PHP 299 per month intro price after short trial

### Measure

- Activated stores
- Days active per week
- Transactions recorded
- Stock-ins recorded
- Daily closes completed
- AI receipt scans used
- Week 2 retention
- Paid conversion
- Referrals

### Success Gate

Continue only if:

- 5 stores are still active after 14 days.
- 3 stores pay.
- At least 1 owner refers another store.
- Product support burden is survivable.

## Phase 6: Commercial Version

Timeline: post-validation

### Features

- Staff PINs
- Roles
- Multi-device sync
- Barcode scanner support
- Receipt printer support
- GCash QR recording
- SMS/Messenger reminder links
- Advanced reports
- Subscription billing
- Owner mobile companion
- Automated backups
- Import/export tooling

## Do Not Build Yet

- Full AI chatbot as the main interface
- Native iOS/Android apps
- Marketplace/procurement platform
- Lending/BNPL
- Accounting integrations
- Complex multi-branch features
- FMCG demand-data monetization
- Graph API Messenger bot

These may become valuable later, but they distract from the validation path.

## Immediate Repo Priorities

1. Wire `/api/customers`, `/api/utang`, and `/api/payments`.
2. Add frontend API helpers for customers, utang, payments, balances, and who-owes.
3. Build tablet-first `CounterDashboard`.
4. Add basic IndexedDB local database.
5. Make sales, utang, payments, and stock movements work offline.
6. Add `stock_movements` and `cash_sessions`.
7. Add PWA installability.
8. Add receipt OCR only after the manual counter flow works.

