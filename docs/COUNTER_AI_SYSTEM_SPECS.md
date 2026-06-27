# StockPilot Counter AI - System Specs

## Product Shape

StockPilot Counter AI is a tablet-first PWA with offline write support and a backend API.

Primary device:

- 10-inch Android tablet
- iPad
- Counter laptop
- Desktop browser

Secondary device:

- Owner phone for reports, reminders, and remote checks

## Architecture

Current stack:

- Frontend: React, TypeScript, Vite
- Backend: Express, TypeScript, Node.js
- Database: MySQL/MariaDB through stored procedures
- Auth: Google OAuth, JWT access token, HttpOnly refresh cookie
- Hosting: Vercel frontend, Railway backend

Recommended additions:

- PWA manifest
- Service worker
- IndexedDB local database
- Sync queue
- AI service wrapper on backend
- Device registration
- Idempotency keys for offline writes

## Core Modules

### Counter POS

Responsibilities:

- Product search
- Quick sale
- Cart
- Cash, GCash, and utang payment modes
- Stock deduction
- Sale audit trail

### Inventory

Responsibilities:

- Product catalog
- SKU/barcode
- Cost price
- Selling price
- Current stock
- Low-stock threshold
- Stock movement history
- Adjustments with reason

### Suki / Utang Ledger

Responsibilities:

- Customer profile
- Running balance
- Utang entries
- Payments
- Customer statement
- Reminder draft

### Supplier Purchases

Responsibilities:

- Manual stock-in
- Supplier receipt draft
- Receipt item confirmation
- Product matching
- Cost price update

### Daily Close

Responsibilities:

- Open cash session
- Expected cash
- Actual cash
- GCash total
- Utang added
- Payments received
- Difference explanation
- Close audit record

### AI Assistant

Responsibilities:

- Receipt extraction
- Voice sale/utang parsing
- Reorder suggestions
- Margin/profit leak alerts
- Reminder drafting
- Usage/cost tracking

AI must create drafts and suggestions. It must not silently mutate stock, cash, or balances without confirmation.

## Frontend Specs

### App Shell

Primary shell: `CounterDashboard`

Desktop/tablet layout:

- Left: product search and quick items
- Center: cart/current transaction
- Right: today summary, alerts, AI suggestions, low stock, who owes
- Top or bottom: offline and sync status

Phone layout:

- Companion mode only
- Summary, customer lookup, reminders, and emergency entry

### Design Requirements

- Tablet-first, landscape-friendly
- Large touch targets, minimum 44px
- No hover-only controls
- Clear offline state
- Stable dimensions for buttons, tiles, and counters
- Fast add-to-cart flow
- No marketing landing page inside the authenticated app

### Local Storage

Use IndexedDB, not only `localStorage`.

Local entities:

- `products`
- `categories`
- `customers`
- `sales`
- `sale_items`
- `utang_entries`
- `utang_payments`
- `stock_movements`
- `cash_sessions`
- `cash_session_entries`
- `supplier_receipts`
- `sync_queue`
- `device_metadata`

`localStorage` should be limited to small non-critical preferences and auth bootstrap data.

## Backend Specs

### Route Groups

Existing:

- `/api/auth`
- `/api/categories`
- `/api/suppliers`
- `/api/products`
- `/api/orders`
- `/api/reports`

Add:

- `/api/customers`
- `/api/utang`
- `/api/payments`
- `/api/stock-movements`
- `/api/cash-sessions`
- `/api/supplier-receipts`
- `/api/sync`
- `/api/ai`
- `/api/devices`

### AI Endpoints

- `POST /api/ai/receipt/extract`
- `POST /api/ai/voice/sale`
- `POST /api/ai/reorder/suggest`
- `POST /api/ai/reminder/draft`
- `GET /api/ai/usage`

### Sync Endpoints

- `POST /api/sync/push`
- `GET /api/sync/pull?since=...`
- `POST /api/devices/register`

Sync writes should be idempotent.

Every client-created mutation should include:

- `client_mutation_id`
- `device_id`
- `local_id`
- `store_id`
- `created_at`
- `operation_type`

## Database Specs

Existing utang tables/procs can be reused as a starting point:

- `customers`
- `utangentries`
- `utangentryitems`
- `utangpayments`

Recommended new tables:

### `devices`

Tracks installed devices.

Fields:

- `device_id`
- `store_id`
- `name`
- `platform`
- `last_seen_at`
- `created_at`

### `stock_movements`

Append-only stock ledger.

Fields:

- `movement_id`
- `store_id`
- `product_id`
- `quantity_delta`
- `reason`
- `source_type`
- `source_id`
- `note`
- `created_by`
- `created_at`
- `client_mutation_id`

Allowed reasons:

- `sale`
- `stock_in`
- `return`
- `damage`
- `expired`
- `owner_use`
- `correction`

### `cash_sessions`

Daily or shift-level cash tracking.

Fields:

- `cash_session_id`
- `store_id`
- `opened_by`
- `closed_by`
- `opened_at`
- `closed_at`
- `opening_cash`
- `expected_cash`
- `actual_cash`
- `difference`
- `status`

### `supplier_receipts`

Receipt header and AI extraction metadata.

Fields:

- `receipt_id`
- `store_id`
- `supplier_id`
- `image_url`
- `status`
- `subtotal`
- `total`
- `receipt_date`
- `ai_call_id`
- `created_by`
- `created_at`

### `supplier_receipt_items`

Confirmed or draft receipt lines.

Fields:

- `receipt_item_id`
- `receipt_id`
- `store_id`
- `product_id`
- `raw_name`
- `matched_name`
- `quantity`
- `unit_cost`
- `line_total`
- `confidence`
- `status`

### `ai_calls`

AI cost and replay log.

Fields:

- `ai_call_id`
- `store_id`
- `feature`
- `provider`
- `model`
- `input_hash`
- `request_json`
- `response_json`
- `tokens_in`
- `tokens_out`
- `estimated_cost`
- `status`
- `created_at`

### `sync_events`

Tracks accepted offline mutations.

Fields:

- `sync_event_id`
- `store_id`
- `device_id`
- `client_mutation_id`
- `entity_type`
- `entity_id`
- `operation_type`
- `created_at`

## Offline Model

Use append-first design.

Good offline writes:

- Sale created
- Utang entry created
- Payment created
- Stock movement created
- Cash count submitted

Risky offline writes:

- Product deletion
- Customer merge
- Editing historical sale totals
- Backdating cash close

Prefer corrections through adjustment records instead of destructive edits.

## Conflict Rules

- Sales are append-only.
- Payments are append-only.
- Stock changes are append-only.
- Voids create a void marker and audit trail.
- Product name edits can be last-write-wins if tracked with `updated_at`.
- Balance is derived from entries and payments, not stored as the source of truth.
- Current stock is derived from stock movements, or cached with reconciliation.

## PWA Requirements

Required:

- `manifest.webmanifest`
- Service worker
- App shell cache
- Offline fallback
- IndexedDB
- Install prompt compatibility
- Icons for common sizes
- No core runtime dependency on CDN scripts

Acceptance:

- App loads offline after first install.
- User can create sales and payments offline.
- Sync resumes when network returns.
- No duplicate records after refresh or retry.

## Security Requirements

- All tenant data scoped by `store_id`.
- Backend derives `store_id` from auth/session, not request body.
- AI endpoints rate-limited per store.
- Uploaded receipt images expire unless retention is enabled.
- Audit all cash, stock, utang, and payment changes.
- Staff PINs before multi-staff pilot.
- Backups and CSV export before paid launch.

## Performance Targets

Target devices:

- Low-cost Android tablet
- Mid-range phone
- Counter laptop

Targets:

- App shell interactive under 3 seconds after install
- Product search under 150ms locally
- Add-to-cart under 100ms locally
- Offline write confirmation immediate
- Sync retries in background

## Current Repo Fit

Reuse:

- Express app structure
- Stored-procedure pattern
- Auth refresh flow
- Existing product/category/supplier/order work
- Existing utang SQL/procedure wrappers

Change:

- Frontend shell
- PWA/offline architecture
- API base URL configuration
- CDN dependency usage
- Add sync and AI services

