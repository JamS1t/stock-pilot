# Stock Pilot → Sari-Sari Utang SaaS — Roadmap

**Approved:** 2026-04-20
**Source brainstorm:** `C:\Users\James Carl\.claude\plans\now-that-you-have-resilient-quokka.md` (private) — this file is the shareable, in-repo copy.

This document is the single source of truth for the product pivot. A new Claude Code session should read this file before touching code.

---

## Context

Stock Pilot today is a generic desktop-style POS/inventory web app (React 19 + Vite + Express 5 + MySQL stored procedures, Google OAuth + JWT). Pre-revenue. No committed user base. The generic-POS space is brutally crowded (Loyverse, Square, Shopify POS, Foodics, Toast clones).

We're pivoting into a tighter, defensible niche:

| Decision | Answer |
|---|---|
| App goal | Real SaaS, pre-revenue, open to pivot |
| Target segment | Sari-sari / mini-mart (Philippines, ~1.3M stores) |
| Wedge | **Utang / listahan tracker** (replace the credit notebook) |
| Founder context | PH-based, Tagalog native, direct access to store owners |
| Form factor | Mobile-first PWA (keep existing backend, rebuild frontend for phone) |

**Why this pivot works**
- Utang is universal, daily, and felt — every sari-sari has a notebook with lost money and disputes.
- Pays for itself in week one: ₱500 of recovered "forgotten" credit covers a year of subscription.
- Viral: customers see their own balance → some customers are store owners themselves.
- AI-native: OCR notebook pages, voice entry in Taglish, SMS/Messenger reminder drafting.
- Natural moat: every utang entry is also a sale entry → unlocks POS, inventory, forecasting, AI coach without forcing "full POS" adoption.
- Incumbents (Packworks, GrowSari) are B2B/supply-chain focused — room below them for an owner-first AI-augmented ledger.

**Why it's feasible for this founder**
- PH-based + Tagalog → in-store pilots, voice samples, weekly iteration. Foreign competitors can't replicate.
- Existing backend (Express + MySQL stored procs) is reusable. The pivot is a frontend rebuild + new domain tables, not a from-scratch rewrite.

---

## Strategic Direction

### Product identity
Reposition from "Stock Pilot" to a Taglish, owner-first brand. Naming is deferred (options: *Listahan AI*, *Sukibook*, *Aling*, *Tindahan.ai*, *Utang+*). Resolve before pilot launch, not before building.

### Monetization ladder
- **Free** — up to ~20 customers, ~50 utang entries/month. FMCG ads later.
- **Pro (~₱149/mo ≈ $2.60)** — unlimited entries, AI voice/photo entry, SMS reminders.
- **Pro+ (~₱299/mo)** — AI business coach (RAG chat), multi-staff, full inventory/POS, GCash QR collect.
- **Overlays (later)** — 1% fee on utang paid through an in-app GCash link; anonymized aggregated demand signals sold to FMCG (consent-based).

### Competitive edge
- **vs Packworks / GrowSari** — they optimize supplier ordering (B2B). We optimize daily ₱ pain (B2C-in-SMB).
- **vs Kyte / Loyverse** — not localized (no Taglish, no utang, no GCash-native, no Messenger).
- **vs generic utang apps** — they're primitive data-entry shells. Our edge is AI (voice, OCR, reminders, coach).

---

## MVP — 12 weeks, 4 phases

### Phase 1 — Core utang module (Weeks 1–3)

**Backend** (extend existing stored-procedure pattern):
- New tables: `customers` (suki profiles), `utang_entries`, `utang_payments`.
- New stored procs + controllers/routes mirroring `backend/src/db/procedures/category.proc.ts` and `order.proc.ts`.
- Phone-OTP auth path (Semaphore or Globe Labs) alongside Google OAuth — many owners lack Google accounts.

**Frontend** (phone-first layout, inside existing `stackpilot/`):
- Bottom-nav shell: *Utang*, *Bayad* (Pay), *Suki* (Customers), *Ako* (Me).
- Pages: Customer list, Customer detail (running balance + entry history), New Utang (3-tap: pick suki → amount → save), New Payment, "Sino may utang" summary.
- Touch-first: ≥44px tap targets, large fonts, Taglish labels throughout.
- Demote current `InventoryPage`, `ReportsPage`, `CategoriesPage`, `SuppliersPage` to "Coming soon" — do NOT delete; they become Pro+ upsell later.

### Phase 2 — AI entry layer (Weeks 4–6)

**Stack:** Gemini 2.5 Flash (already wired via `GEMINI_API_KEY` in `stackpilot/vite.config.ts`). Chosen for cost + Taglish quality + multimodal (vision + audio in one API).

**Features:**
- **Voice entry** — "Si Aling Nena, beinte pesos Lucky Me pancit canton" → structured `{customer: "Aling Nena", items: [{name: "Lucky Me Pancit Canton", qty: 1}], amount: 20}`.
- **Photo OCR of notebook pages** — bulk-import legacy handwritten utang (onboarding accelerator).
- **Receipt / delivery-invoice OCR** — same pipeline, feeds future inventory module.
- **AI reminder drafting** — polite Taglish reminder messages sent via Messenger deep link (`m.me/?ref=...`) or SMS.

**Backend:**
- New `services/ai.service.ts` wrapping Gemini (transcription, vision, structured extraction).
- `ai_calls` table for cost tracking, response caching, eval replay.
- Per-store rate limits (protect margin).

### Phase 3 — Offline + PWA polish (Weeks 7–9)
- `manifest.webmanifest` + service worker (Workbox) for installability.
- IndexedDB queue: all utang entries work fully offline, sync on reconnect.
- Filipino/Taglish i18n with `react-i18next`.
- Onboarding flow: "3 taps from app-open to first utang entry saved."
- Performance target: FCP < 2.5s on 3G entry-level Android.

### Phase 4 — Pilot + first revenue (Weeks 10–12)
- Recruit 10 sari-sari owners for in-store pilot.
- Weekly interview loop. Instrument install → first entry → day-7 retention.
- Fix top 3 friction points.
- Turn on paid tier. Goal: ≥3 paying ₱149/mo subscribers by end of week 12.

### Explicitly NOT in MVP (YAGNI)
- AI business coach / RAG chat — moat, not wedge. Build after data accumulates.
- Inventory-from-receipts — reuses OCR pipeline, add Phase 5.
- Multi-staff / roles — single-owner is the MVP.
- Full POS checkout / GCash QR — overlay, not core.
- Native iOS/Android — PWA proves product first.

---

## Phase 1 — Task Breakdown

Dependencies noted inline. `blockedBy` means the task cannot start until its blockers complete.

| # | Task | Blocked by |
|---|---|---|
| 1 | Design DB schema for `customers`, `utang_entries`, `utang_payments` | — |
| 2 | Implement backend stored procedures for utang module | 1 |
| 3 | Add controllers and routes for customers, utang, payments | 2 |
| 4 | Add phone-OTP auth path alongside Google OAuth | — |
| 5 | Rebuild frontend shell as mobile bottom-nav layout | — |
| 6 | Build utang flow pages (Customer list, detail, new utang, new payment, summary) | 5, 7 |
| 7 | Add API client functions for utang domain | 3 |
| 8 | Phase 1 smoke test on real Android device | 6 |

**Task detail**

1. **Design DB schema** — MySQL DDL + stored-proc signatures for `customers` (suki profiles: name, phone, photo_url, store_id, notes), `utang_entries` (store_id, customer_id, amount, items_json, note, created_at, created_by), `utang_payments` (store_id, customer_id, amount, method, note, created_at). Include balance-calc stored proc.

2. **Implement stored procs** — `sp_customer_create/read/update/delete`, `sp_utang_create/list/get`, `sp_payment_create`, `sp_customer_balance`, `sp_who_owes` (summary). Mirror `backend/src/db/procedures/category.proc.ts` and `order.proc.ts`. Use `callProc` helper from `backend/src/db/callProc.ts`.

3. **Controllers + routes** — `backend/src/controllers/{customer,utang,payment}.controller.ts` and matching route files. Wire into `backend/src/app.ts` under `/api/customers`, `/api/utang`, `/api/payments` behind `requireAuth` middleware.

4. **Phone-OTP auth** — `POST /api/auth/phone/request-otp`, `POST /api/auth/phone/verify`. For MVP, stub SMS send (log to console) until provider chosen. Update `auth.middleware.ts` to accept both session types. Update `stackpilot/context/AuthContext.tsx` to handle either path.

5. **Mobile bottom-nav shell** — Replace `activePage` switch in `stackpilot/App.tsx` with phone-first bottom-nav (Utang / Bayad / Suki / Ako). Create `BottomNav.tsx`. Demote existing Inventory/Reports/Categories/Suppliers to "Coming soon" placeholders (keep source, don't delete). Mobile-first CSS (tap ≥44px, single-column, large fonts).

6. **Utang flow pages** — `stackpilot/pages/UtangListPage.tsx` (who-owes dashboard), `CustomerDetailPage.tsx` (balance + history), `QuickEntryPage.tsx` (3-tap), `PaymentsPage.tsx`. Wire via api.ts helpers. Taglish labels throughout.

7. **API client functions** — Extend `stackpilot/utils/api.ts` with `getCustomers`, `createCustomer`, `updateCustomer`, `createUtang`, `listUtang`, `recordPayment`, `getCustomerBalance`, `getWhoOwes`. Reuse existing `fetchApi` refresh-token plumbing as-is.

8. **Smoke test on real Android** — Deploy to staging, open on an entry-level phone, complete: add 3 customers → create 5 utang entries → record 2 payments → verify balances → check one-handed usability. Fix friction before Phase 2.

---

## Critical Files

**Backend — extend, don't rewrite**
- `backend/src/app.ts` — add `/api/customers`, `/api/utang`, `/api/payments`, `/api/ai` routes.
- `backend/src/db/procedures/` — add `customer.proc.ts`, `utang.proc.ts`, `payment.proc.ts`.
- `backend/src/controllers/` — matching controllers; reuse `callProc`.
- `backend/src/services/ai.service.ts` — **new**, Gemini wrapper.
- `backend/src/middlewares/auth.middleware.ts` — accept phone-OTP sessions + Google JWT.
- MySQL migrations — `customers`, `utang_entries`, `utang_payments`, `ai_calls`, `phone_otps` tables + stored procs.

**Frontend — rebuild the shell, keep the pipes**
- `stackpilot/App.tsx` — replace switch with bottom-nav; existing pages become lazy-loaded "Pro+" targets.
- `stackpilot/pages/` — add `UtangListPage`, `CustomerDetailPage`, `QuickEntryPage`, `PaymentsPage`.
- `stackpilot/components/` — add `VoiceEntry`, `PhotoCapture`, `BottomNav`, `SukiAvatar`.
- `stackpilot/utils/api.ts` — add utang-domain helpers.
- `stackpilot/context/AuthContext.tsx` — extend for phone-OTP.
- `stackpilot/public/manifest.webmanifest` + `stackpilot/src/service-worker.ts` — **new**, PWA.
- `stackpilot/i18n/` — **new**, Taglish strings.
- `stackpilot/vite.config.ts` — add `vite-plugin-pwa`.

**Reuse as-is**
- `backend/src/db/callProc.ts`
- `backend/src/middlewares/error.middleware.ts`
- `stackpilot/utils/api.ts` `fetchApi` refresh-token logic (genuinely good code)
- Auth refresh/JWT issuance

---

## Verification

**Per-feature (Phases 1–3)**
- Manual smoke test on a real Android phone — not just desktop Chrome devtools. Entry-level (₱3k–₱5k) device matters.
- Lighthouse PWA audit score ≥ 90 before Phase 3 ships.
- Offline acceptance: airplane-mode phone, create 5 utang entries + 2 payments, reconnect, confirm sync with correct timestamps.
- AI eval set: 30 Taglish voice clips + 20 notebook photos with ground truth. Any accuracy regression blocks ship.

**End-to-end (end of MVP)**
- 10-store pilot: each owner uses app ≥2 weeks.
- Instrument: install → first entry → day-3/7/14 retention → paid conversion.
- 2 in-store interviews/week per active owner.
- Success = ≥3 paying subscribers by week 12, ≥60% day-14 retention among activated users.

---

## Open Questions (non-blocking — resolve during Phase 1)

1. **Brand name** — rename or stay "Stock Pilot"? Lean rename.
2. **SMS provider** — Semaphore (PH-local, cheaper) vs Globe Labs vs Twilio. Decide before Phase 2.
3. **Gemini cost model** — estimate per-entry cost vs ₱149/mo tier margin. Cap free-tier AI usage.
4. **Messenger integration depth** — deep-link-only for MVP (safe) vs Graph API bot (higher touch, platform risk). Start deep-link.
5. **Data residency** — Railway region. May need PH-region provider (AWS ap-southeast-1 / GCP asia-southeast1) before scaling.

---

## What This Plan Is Not

- Not a commitment to ship all four phases — Phase 4 happens only if Phases 1–3 validate.
- Not a greenfield rewrite — we extend the backend aggressively and rebuild the frontend shell, but keep auth, DB access pattern, refresh-token flow, and procedure-based controllers.
- Not final on monetization or branding — decided with pilot input, not upfront.

---

## How to resume in a new session

1. Read this file end-to-end.
2. Read `CLAUDE.md` for repo-level architecture context.
3. Use `TaskList` to see Phase 1 tasks (task list was created in the brainstorm session; recreate if not persisted across sessions — IDs and dependencies are captured in the table above).
4. Start with Task #1 (DB schema). Confirm approach before writing migrations.
