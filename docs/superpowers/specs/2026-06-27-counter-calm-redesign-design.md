# Counter "Calm Counter" Redesign — Design Spec

Date: 2026-06-27
Status: Approved (design), pending implementation plan
Scope: `stackpilot/pages/CounterDashboard.tsx` and supporting components only.

## Problem

The Counter screen (the most-used screen) overwhelms the user. At rest it renders
~9 competing sections: a 4-cell money bar + sync state, then a three-column grid
where the middle "current sale" column embeds the full suki/utang ledger sub-panel
(customer picker, add-customer, ledger note, bayad field) plus totals plus four
competing action buttons, and the right "owner panel" column stacks FIVE separate
cards (owner stats, cash session, stock adjustment, offline/sync, who-owes).

Everything is visible all the time. Nothing is clearly primary.

## Principle

**The Counter screen has one job: ring up a sale.** Every secondary tool is one
quiet tap away, never competing for attention at rest. Maximum calm.

No new design tokens, colors, fonts, radii, or components are invented. Reuse the
"Palengke Daylight" system (`docs/DESIGN_SYSTEM.md`): `.card`, `.btn-*`, `.field`,
`.pill`, `.money`, `.stat`, `.eyebrow`. One new reusable structural primitive is
allowed: a **Sheet/Drawer** overlay (backdrop + slide-in panel) built from existing
tokens, since several tools now summon as overlays.

## Decisions (locked with user)

1. Scope: Counter screen first; establish the pattern here.
2. Secondary tools: tuck away, summon on demand (not always-visible, not just regrouped).
3. Checkout: one prominent `Charge ₱X` button → method picker; suki UI only surfaces for Utang.
4. Bayad (paying down existing utang): lives inside the who-owes drawer, started from the person.

## Target layout

At rest, three resting sections only: **money strip**, **products**, **cart**.

```
┌──────────────────────────────────────────────────────────────┐
│  QUIET TOP BAR                                                 │
│  Benta ₱4,200 · Cash ₱2,400 · GCash ₱1,800 · Utang ₱650       │
│                        [ Cash drawer ] [ Stock ] [ ●Synced ]   │
├───────────────────────────────┬──────────────────────────────┤
│  PRODUCTS (wider, the focus)   │  CURRENT SALE                 │
│  search                        │  item list…                  │
│  3-up roomy product grid       │  Total            ₱320       │
│  taller tap targets            │  [   Charge ₱320          ]  │
└───────────────────────────────┴──────────────────────────────┘
                                       [ Sino may utang? · 4 ]  ← floating pill
```

Layout collapses from three columns to two (products | cart). Products get more
room (3-up grid, bigger tap targets) because tapping products is the most frequent
action. Responsive: on narrow/tablet-portrait widths, products and cart stack, cart
pinned accessible; the floating who-owes pill remains bottom-right.

## Components / surfaces

### 1. Quiet top bar
- Always-visible thin strip with the four money figures (Benta / Cash sa kahon /
  GCash / Utang open), using `.money` + existing tone colors (peso / ink / gcash / utang).
- Three quiet summon controls on the right: **Cash drawer**, **Stock**, and a **sync
  chip** (dot + "Synced" / "N pending"). The sync chip tap opens the sync sheet.
- No forms render here.

### 2. Products column
- Search field (`.field`, min-h-12) at top.
- 3-up product grid (was 2-up), taller cards, same product-card visual.
- Same empty/error/loading states as today, restyled to the roomier grid.

### 3. Cart column
- Cart item rows keep the +/− stepper and per-line totals (unchanged behavior).
- Inline status/error banner stays (sale recorded / queued offline / errors).
- Bottom: Total readout + a single big `Charge ₱X` primary button (`btn-primary btn-lg`).
- Empty cart → calm empty state, Charge button hidden, no ledger UI.
- Removed from this column: the three method buttons, the inline suki/utang ledger
  sub-panel, the standalone "Record bayad" field.

### 4. Charge sheet (method picker)
- Opens from `Charge ₱X`. Backdrop-dimmed sheet/modal.
- Three large method tiles: **Cash** (`btn-primary`), **GCash** (`btn-gcash`),
  **Utang** (`btn-utang`).
- Cash / GCash → confirm → records sale (online or offline-queue path unchanged) →
  closes → triggers receipt modal as today.
- Utang → reveals suki picker + inline "add new suki" (name/phone) + optional ledger
  note → confirm → creates utang entry (online/offline path unchanged). Utang confirm
  disabled until a suki is selected.
- All customer-selection UI exists ONLY here, in context.

### 5. Who-owes drawer (+ bayad)
- Floating quiet pill bottom-right: "Sino may utang? · N" (hidden if N = 0).
- Opens a right-side drawer: list of suki who owe, sorted by balance desc.
- Tap a person → expands their balance + a **Record bayad** amount field + optional
  note + confirm. Records payment via existing `recordPayment` (online/offline path
  unchanged), updates expected cash, refreshes data.

### 6. Summoned tool sheets
Each opens as its own focused sheet from the top bar; forms are the SAME as today,
just relocated into overlays so they are not all on screen at once.
- **Cash drawer sheet:** open-session (opening cash) when closed; close-session
  (actual cash, shows computed difference) when open. Existing handlers reused.
- **Stock adjustment sheet:** product select, +/- qty, reason select, note, record.
  Existing handler reused.
- **Sync sheet:** queued / failed / synced counts + Retry sync. Existing handler reused.
- Owner "today at a glance" stats (Benta / Cash / Paubos / May utang): the money
  figures already live in the top strip; the remaining owner stats fold into the
  cash-drawer sheet header (or a small "Today" section there). No separate always-on
  owner card at rest.

### 7. Feel / motion
- Sheets and the drawer slide in with a short ease; backdrop dims the counter so the
  active surface is unambiguous. Exactly one emphasized primary action per surface.
- Respect `prefers-reduced-motion`: no slide/transition, instant show/hide.
- Maintain 44px min touch targets and visible `focus-visible` rings (per design system).

## State & behavior notes

- All existing data fetching, handlers, offline-queue logic, and API calls in
  `CounterDashboard.tsx` are preserved. This is a presentation/placement refactor,
  not a logic rewrite. Handlers move into the new surfaces; their bodies stay intact.
- New local UI state: which overlay is open (`'none' | 'charge' | 'cashDrawer' |
  'stock' | 'sync' | 'whoOwes'`), and within the charge sheet, the selected method.
- Opening a sheet should not refetch unless the underlying action needs it (preserve
  current refresh-after-mutation behavior).
- Receipt modal (`InvoiceModal`) flow is unchanged.

## Out of scope (this pass)

- Other pages (Inventory, Reports, Suppliers, Categories, Order history, Settings).
- Sidebar/navigation changes.
- Any backend / API / data-model change.
- New tokens, colors, or brand changes.

## Success criteria

- Resting Counter screen shows only money strip + products + cart (3 sections).
- A cash sale takes: tap products → Charge → Cash → confirm. An utang sale and a
  bayad each reachable without any ledger UI visible at rest.
- No behavior regressions vs. current Counter (sales, utang, bayad, cash session,
  stock adjustment, offline queue, sync retry, receipt all still work).
- Only design-system tokens/primitives used; Sheet/Drawer is the only new primitive.
