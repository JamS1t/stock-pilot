# Calm Counter — Counter Screen Redesign: Full Plan & Breakdown

> Single self-contained document: the *why*, the *what*, and the task-by-task *how*.
> Companion source docs (same content, split): design spec at
> `docs/superpowers/specs/2026-06-27-counter-calm-redesign-design.md`,
> task plan at `docs/superpowers/plans/2026-06-27-counter-calm-redesign.md`.

- **Date:** 2026-06-27
- **Scope:** `stackpilot/pages/CounterDashboard.tsx` and new supporting components only. No backend/API/data-model changes. No other pages.
- **Branch base:** `refactor/2025-10-baseline` (baseline WIP committed at `9f5586d` so this work stays isolated).

---

## 1. The problem

The Counter screen is the most-used screen and it overwhelms the user. At rest it renders **~9 competing sections**:

1. A 4-cell money bar (Benta / Cash / GCash / Utang)…
2. …glued to a sync-status block.
3. Left column: product search + grid.
4. Middle column: cart item list, **plus**
5. an embedded suki/utang ledger sub-panel (customer picker, add-customer, ledger note, bayad field), **plus**
6. totals + **four** competing action buttons (Cash / GCash / Utang / Record bayad).
7. Right "owner panel" column stacking owner stats,
8. cash session, stock adjustment, offline/sync, **and**
9. a who-owes list.

Everything is visible all the time. Nothing is clearly primary. The user's words: *"pushing and popping all data to the user."*

## 2. The principle

**The Counter screen has one job: ring up a sale.** Every secondary tool is one quiet tap away, never competing for attention at rest. Maximum calm.

## 3. Decisions (locked with the user)

| # | Decision | Choice |
|---|----------|--------|
| 1 | Scope | Counter screen first; establish the pattern here. |
| 2 | Secondary tools (cash session, stock adjust, sync, who-owes) | **Tuck away, summon on demand** — not always-visible, not merely regrouped. |
| 3 | Checkout | **One prominent `Charge ₱X` button → method picker**; suki UI surfaces only for Utang. |
| 4 | Bayad (paying down existing utang) | Lives **inside the who-owes drawer**, started from the person. |

## 4. Target layout

At rest, only three sections: **money strip · products · cart**.

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

- Three columns → **two** (products | cart). Products get more room (3-up grid, bigger targets) because tapping products is the most frequent action.
- The dense right-hand stack of five cards is **gone from the surface**; each returns as a one-tap overlay.
- Responsive: on tablet-portrait widths products and cart stack; the floating who-owes pill stays bottom-right.

## 5. Surfaces (what each piece becomes)

1. **Quiet top bar** — thin strip with the four money figures + three summon controls (Cash drawer, Stock, sync chip). No forms.
2. **Products column** — search + roomier 3-up grid. Same empty/error/loading states.
3. **Cart column** — item rows with +/− steppers (unchanged), status banner, then Total + one big `Charge ₱X` button. Empty cart → calm empty state, button hidden.
4. **Charge sheet** — opens from Charge. Three method tiles (Cash / GCash / Utang). Cash/GCash → confirm → records → receipt. Utang → reveals suki picker + add-suki + note → confirm. Customer UI exists only here.
5. **Who-owes drawer (+ bayad)** — floating "Sino may utang? · N" pill → right drawer of suki who owe (sorted by balance) → tap a person → Record bayad in context.
6. **Summoned tool sheets** — Cash drawer (open/close session + today's owner stats), Stock adjustment, Sync (queued/failed/synced + retry). Same forms as today, relocated into overlays.
7. **Feel** — sheets/drawer slide in (reusing existing `animate-fade-in`), backdrop dims the counter, exactly one emphasized primary action per surface. `prefers-reduced-motion` respected globally; Esc closes; focus rings preserved.

## 6. Design-system guardrails (binding)

Use ONLY existing "Palengke Daylight" tokens/primitives (`docs/DESIGN_SYSTEM.md`):
`.card`, `.card-sunken`, `.btn` + `.btn-primary/-gcash/-utang/-ghost/-outline/-danger`, `.btn-lg`,
`.field`, `.field-sm`, `.pill` + `.pill-ok/-warn/-bad/-muted`, `.pill-dot`, `.money`, `.stat`, `.eyebrow`,
`.page`, `.page-inner`, `.page-title`. Invent no new colors, fonts, radii, or shadows.

- **One** new structural primitive permitted: the `Sheet` overlay. **One** new utility added: `.btn-sm`.
- Money color semantics: sales/cash-in = `peso`; GCash = `gcash`; utang/owed = `utang`; shortfalls/errors = `danger`; neutral = `ink`.
- Touch targets ≥ 44px (`min-h-11`); primary counter actions `min-h-14` (`btn-lg`).
- Copy: sentence case; Taglish where it's the counter's real word (Benta, Bayad, Utang, Suki, Kita, Paubos). Reuse exact existing strings when relocating controls.
- **Preserve every existing handler body** in `CounterDashboard.tsx` (`handleSale`, `handleCreateCustomer`, `handleUtang`, `handleRecordPayment`, `handleRetrySync`, `handleOpenCashSession`, `handleCloseCashSession`, `handleStockAdjustment`) verbatim — only call sites / JSX move. This is a placement refactor, not a logic rewrite. Offline-queue paths and the `InvoiceModal` receipt flow are untouched.

## 7. Verification model

**No test runner is configured in this repo** (confirmed; `tsconfig.json` does not set `noUnusedLocals`). Do not add a test framework. **Verification for every task = `cd stackpilot && npm run build` passes (TypeScript typecheck + Vite build), plus the manual check stated in the task.**

**Reference modal idiom** (from `stackpilot/components/ConfirmationModal.tsx`) all overlays follow: outer `fixed inset-0 z-[60] bg-ink/50 backdrop-blur-sm`, click-outside closes, inner panel `.card animate-fade-in shadow-pop` with `onClick={e => e.stopPropagation()}`.

## 8. File structure

| Action | File | Responsibility |
|--------|------|----------------|
| Create | `stackpilot/components/Sheet.tsx` | Reusable overlay (centered `sheet` + right `drawer` variant): backdrop + dismissable panel + title/close chrome. |
| Create | `stackpilot/components/counter/CounterTopBar.tsx` | Thin money strip + three summon controls. |
| Create | `stackpilot/components/counter/ChargeSheet.tsx` | Method picker + Utang sub-flow (suki picker / add suki / note). |
| Create | `stackpilot/components/counter/WhoOwesDrawer.tsx` | Floating pill + right drawer of suki who owe, with per-person Record bayad. |
| Create | `stackpilot/components/counter/CashDrawerSheet.tsx` | Open/close cash session + today's owner stats. |
| Create | `stackpilot/components/counter/StockAdjustSheet.tsx` | Stock movement form. |
| Create | `stackpilot/components/counter/SyncSheet.tsx` | Queued/failed/synced + retry. |
| Modify | `stackpilot/index.css` | Add `.btn-sm` primitive. |
| Modify | `stackpilot/pages/CounterDashboard.tsx` | Keep all state + handlers; replace JSX body with two-column layout + overlay orchestration; add one overlay-state field. |

`CounterDashboard.tsx` stays the single owner of state and handlers (it has grown unwieldy at ~1167 lines; extracting presentational surfaces is the targeted improvement). Children are presentational and receive exactly the props they need.

---

# Task breakdown

Seven tasks, each ending in an independently buildable, committable deliverable. Steps use checkbox syntax for tracking.

---

## Task 1 — Sheet overlay primitive

**Files:** Create `stackpilot/components/Sheet.tsx`

**Produces:**
```ts
export interface SheetProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  eyebrow?: string;
  variant?: 'sheet' | 'drawer';   // default 'sheet' (centered); 'drawer' = right side
  children: React.ReactNode;
  footer?: React.ReactNode;
}
export default function Sheet(props: SheetProps): JSX.Element | null;
```

- [ ] **Step 1 — Write the component**

```tsx
// stackpilot/components/Sheet.tsx
import React, { useEffect } from 'react';

export interface SheetProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  eyebrow?: string;
  variant?: 'sheet' | 'drawer';
  children: React.ReactNode;
  footer?: React.ReactNode;
}

const Sheet: React.FC<SheetProps> = ({
  isOpen, onClose, title, eyebrow, variant = 'sheet', children, footer,
}) => {
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const panelPosition =
    variant === 'drawer'
      ? 'ml-auto h-full w-full max-w-sm rounded-none rounded-l-2xl'
      : 'm-auto w-full max-w-lg';

  return (
    <div
      className={`fixed inset-0 z-[60] flex bg-ink/50 backdrop-blur-sm ${variant === 'drawer' ? '' : 'p-4'}`}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div
        className={`card flex max-h-full animate-fade-in flex-col overflow-hidden shadow-pop ${panelPosition}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b border-line px-5 py-4">
          <div>
            {eyebrow && <p className="eyebrow">{eyebrow}</p>}
            <h2 className="font-display text-lg font-semibold text-ink">{title}</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl border border-line text-muted transition hover:bg-sunken hover:text-ink"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-4">{children}</div>
        {footer && <div className="border-t border-line px-5 py-4">{footer}</div>}
      </div>
    </div>
  );
};

export default Sheet;
```

- [ ] **Step 2 — Verify:** `cd stackpilot && npm run build` → succeeds, no TS errors.
- [ ] **Step 3 — Commit:** `feat(counter): add reusable Sheet/Drawer overlay primitive`

---

## Task 2 — Overlay state + CounterTopBar (replace the Kita bar)

Replaces the always-visible 4-cell Kita bar + sync block with a thin money strip whose right side holds three summon controls. Adds the single piece of new UI state.

**Files:** Create `stackpilot/components/counter/CounterTopBar.tsx`; Modify `stackpilot/index.css`, `stackpilot/pages/CounterDashboard.tsx`

**Produces:**
```ts
export type CounterOverlay = 'none' | 'charge' | 'cashDrawer' | 'stock' | 'sync' | 'whoOwes';
export interface CounterTopBarProps {
  todaySales: number; expectedCash: number; gcashSales: number; utangOwed: number;
  isOnline: boolean; pendingSync: number;
  formatCurrency: (n: number) => string;
  onOpen: (overlay: CounterOverlay) => void;
}
```

- [ ] **Step 1 — Write CounterTopBar**

```tsx
// stackpilot/components/counter/CounterTopBar.tsx
import React from 'react';

export type CounterOverlay =
  | 'none' | 'charge' | 'cashDrawer' | 'stock' | 'sync' | 'whoOwes';

export interface CounterTopBarProps {
  todaySales: number;
  expectedCash: number;
  gcashSales: number;
  utangOwed: number;
  isOnline: boolean;
  pendingSync: number;
  formatCurrency: (n: number) => string;
  onOpen: (overlay: CounterOverlay) => void;
}

const CounterTopBar: React.FC<CounterTopBarProps> = ({
  todaySales, expectedCash, gcashSales, utangOwed, isOnline, pendingSync, formatCurrency, onOpen,
}) => {
  const cells = [
    { label: 'Benta ngayon', value: formatCurrency(todaySales), tone: 'text-peso' },
    { label: 'Cash sa kahon', value: formatCurrency(expectedCash), tone: 'text-ink' },
    { label: 'GCash', value: formatCurrency(gcashSales), tone: 'text-gcash' },
    { label: 'Utang (open)', value: formatCurrency(utangOwed), tone: 'text-utang' },
  ];

  return (
    <section className="card animate-fade-in flex flex-col gap-3 p-4 lg:flex-row lg:items-center lg:justify-between">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:flex lg:gap-6">
        {cells.map((cell) => (
          <div key={cell.label}>
            <p className="eyebrow">{cell.label}</p>
            <p className={`money mt-1 text-xl font-bold lg:text-2xl ${cell.tone}`}>{cell.value}</p>
          </div>
        ))}
      </div>
      <div className="flex items-center gap-2">
        <button type="button" onClick={() => onOpen('cashDrawer')} className="btn btn-ghost btn-sm">Cash drawer</button>
        <button type="button" onClick={() => onOpen('stock')} className="btn btn-ghost btn-sm">Stock</button>
        <button
          type="button"
          onClick={() => onOpen('sync')}
          className={`pill ${pendingSync ? 'pill-warn' : 'pill-ok'}`}
          title={isOnline ? 'Online' : 'Offline — saving locally'}
        >
          <span className="pill-dot" />
          {pendingSync ? `${pendingSync} pending` : 'Synced'}
        </button>
      </div>
    </section>
  );
};

export default CounterTopBar;
```

- [ ] **Step 2 — Add `.btn-sm` to `index.css`** (inside `@layer components`, right after the `.btn-lg` block):

```css
  .btn-sm {
    @apply min-h-9 px-3 text-xs;
  }
```

- [ ] **Step 3 — Wire into CounterDashboard**

Import: `import CounterTopBar, { CounterOverlay } from "../components/counter/CounterTopBar";`

Add state (after `orderForReceipt`): `const [overlay, setOverlay] = useState<CounterOverlay>("none");`

Replace the entire Kita-bar `<section>` (the `{/* Kita Bar … */}` block) with:
```tsx
        {/* Money truth + summon points */}
        <CounterTopBar
          todaySales={todaySales}
          expectedCash={expectedCash}
          gcashSales={gcashSales}
          utangOwed={utangOwed}
          isOnline={isOnline}
          pendingSync={pendingSync}
          formatCurrency={formatCurrency}
          onOpen={setOverlay}
        />
```

- [ ] **Step 4 — Verify:** `cd stackpilot && npm run build` → succeeds. (Summon buttons are inert until later tasks — expected.)
- [ ] **Step 5 — Manual:** Counter top now shows one thin strip with the four figures + three controls; old stacked Kita+sync card gone.
- [ ] **Step 6 — Commit:** `feat(counter): replace Kita bar with quiet top bar + summon controls`

---

## Task 3 — Two-column layout + single Charge button

Collapse the three-column grid to two (products | cart). Remove from the cart column: the three method buttons, the inline suki/utang ledger sub-panel, the standalone Record bayad button. Replace with one `Charge ₱X` button that opens the charge overlay. Remove the entire owner-panel `<aside>` (its functions return via overlays in Tasks 4–6).

**Files:** Modify `stackpilot/pages/CounterDashboard.tsx`

- [ ] **Step 1 — Two columns.** Change the section opening tag to:
```tsx
        <section className="grid gap-4 xl:grid-cols-[minmax(360px,1.3fr)_minmax(340px,1fr)]">
```

- [ ] **Step 2 — 3-up products.** Change the product grid container to:
```tsx
            <div className="grid flex-1 grid-cols-2 content-start gap-3 overflow-y-auto pr-1 sm:grid-cols-3">
```

- [ ] **Step 3 — Replace cart totals/actions + remove the ledger sub-panel.** Delete the entire `{/* Suki / utang controls */}` block. Replace the `{/* Totals + actions */}` block with:
```tsx
            {/* Total + charge */}
            <div className="mt-auto rounded-xl border border-line bg-surface p-4">
              <div className="mb-4 flex items-baseline justify-between">
                <span className="text-sm font-medium text-muted">Total</span>
                <span className="money text-3xl font-bold text-ink">{formatCurrency(subtotal)}</span>
              </div>
              <button
                type="button"
                onClick={() => setOverlay("charge")}
                disabled={cart.length === 0 || isSubmitting}
                className="btn btn-primary btn-lg w-full"
              >
                Charge {formatCurrency(subtotal)}
              </button>
            </div>
```

- [ ] **Step 4 — Remove the owner-panel aside.** Delete the entire `<aside …>` … `</aside>` block (`{/* Owner panel */}` through its close).
- [ ] **Step 5 — Verify:** `cd stackpilot && npm run build` → succeeds. Several handlers/state become temporarily unused (re-consumed in Tasks 4–6); `noUnusedLocals` is off so the build stays green. Leave them.
- [ ] **Step 6 — Manual:** Two columns only. Cart shows one big `Charge ₱X`. No method buttons, no suki picker, no owner panel at rest.
- [ ] **Step 7 — Commit:** `feat(counter): collapse to two-column layout with single Charge action`

---

## Task 4 — ChargeSheet (method picker + utang flow)

**Files:** Create `stackpilot/components/counter/ChargeSheet.tsx`; Modify `stackpilot/pages/CounterDashboard.tsx`

- [ ] **Step 1 — Write ChargeSheet**

```tsx
// stackpilot/components/counter/ChargeSheet.tsx
import React, { useState } from 'react';
import Sheet from '../Sheet';
import { Customer, CustomerBalance } from '../../utils/api';

interface ChargeSheetProps {
  isOpen: boolean;
  onClose: () => void;
  subtotal: number;
  formatCurrency: (n: number) => string;
  customers: Customer[];
  customerBalance: CustomerBalance | null;
  selectedCustomerId: string;
  setSelectedCustomerId: (v: string) => void;
  newCustomerName: string;
  setNewCustomerName: (v: string) => void;
  newCustomerPhone: string;
  setNewCustomerPhone: (v: string) => void;
  ledgerNote: string;
  setLedgerNote: (v: string) => void;
  isSubmitting: boolean;
  onCash: () => void;
  onGcash: () => void;
  onUtang: () => void;
  onCreateCustomer: () => void;
}

const ChargeSheet: React.FC<ChargeSheetProps> = ({
  isOpen, onClose, subtotal, formatCurrency, customers, customerBalance,
  selectedCustomerId, setSelectedCustomerId, newCustomerName, setNewCustomerName,
  newCustomerPhone, setNewCustomerPhone, ledgerNote, setLedgerNote, isSubmitting,
  onCash, onGcash, onUtang, onCreateCustomer,
}) => {
  const [mode, setMode] = useState<'choose' | 'utang'>('choose');

  React.useEffect(() => { if (isOpen) setMode('choose'); }, [isOpen]);

  return (
    <Sheet isOpen={isOpen} onClose={onClose} eyebrow="Bayad" title={`Charge ${formatCurrency(subtotal)}`}>
      {mode === 'choose' ? (
        <div className="grid grid-cols-1 gap-3">
          <button type="button" onClick={onCash} disabled={isSubmitting} className="btn btn-primary btn-lg w-full">Cash</button>
          <button type="button" onClick={onGcash} disabled={isSubmitting} className="btn btn-gcash btn-lg w-full">GCash</button>
          <button type="button" onClick={() => setMode('utang')} disabled={isSubmitting} className="btn btn-utang btn-lg w-full">Utang</button>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="grid grid-cols-[1fr_auto] gap-2">
            <select value={selectedCustomerId} onChange={(e) => setSelectedCustomerId(e.target.value)} className="field">
              <option value="">Pumili ng suki</option>
              {customers.map((c) => (
                <option key={c.customer_id} value={c.customer_id}>{c.name}</option>
              ))}
            </select>
            <div className="flex min-w-[110px] flex-col justify-center rounded-xl border border-line bg-surface px-3 py-1.5 text-right">
              <span className="text-[0.65rem] font-medium text-muted">Balance</span>
              <span className="money text-sm font-bold text-utang">{formatCurrency(customerBalance?.balance ?? 0)}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
            <input value={newCustomerName} onChange={(e) => setNewCustomerName(e.target.value)} placeholder="New suki name" className="field field-sm" />
            <div className="grid grid-cols-[1fr_auto] gap-2">
              <input value={newCustomerPhone} onChange={(e) => setNewCustomerPhone(e.target.value)} placeholder="Phone" className="field field-sm" />
              <button type="button" onClick={onCreateCustomer} disabled={!newCustomerName.trim() || isSubmitting} className="btn btn-ghost px-4">Add</button>
            </div>
          </div>

          <input value={ledgerNote} onChange={(e) => setLedgerNote(e.target.value)} placeholder="Ledger note" className="field field-sm" />

          <div className="grid grid-cols-[auto_1fr] gap-2 pt-1">
            <button type="button" onClick={() => setMode('choose')} className="btn btn-ghost">Back</button>
            <button type="button" onClick={onUtang} disabled={!selectedCustomerId || isSubmitting} className="btn btn-utang btn-lg">
              Confirm utang {formatCurrency(subtotal)}
            </button>
          </div>
        </div>
      )}
    </Sheet>
  );
};

export default ChargeSheet;
```

- [ ] **Step 2 — Wire + auto-close on success.** Import `ChargeSheet`. Add wrappers next to the handlers:
```tsx
const chargeCash = async () => { await handleSale("cash"); setOverlay("none"); };
const chargeGcash = async () => { await handleSale("gcash"); setOverlay("none"); };
const chargeUtang = async () => { await handleUtang(); if (cart.length === 0) setOverlay("none"); };
```
Render before `InvoiceModal`:
```tsx
        <ChargeSheet
          isOpen={overlay === "charge"}
          onClose={() => setOverlay("none")}
          subtotal={subtotal}
          formatCurrency={formatCurrency}
          customers={customers}
          customerBalance={customerBalance}
          selectedCustomerId={selectedCustomerId}
          setSelectedCustomerId={setSelectedCustomerId}
          newCustomerName={newCustomerName}
          setNewCustomerName={setNewCustomerName}
          newCustomerPhone={newCustomerPhone}
          setNewCustomerPhone={setNewCustomerPhone}
          ledgerNote={ledgerNote}
          setLedgerNote={setLedgerNote}
          isSubmitting={isSubmitting}
          onCash={chargeCash}
          onGcash={chargeGcash}
          onUtang={chargeUtang}
          onCreateCustomer={handleCreateCustomer}
        />
```

- [ ] **Step 3 — Verify:** `cd stackpilot && npm run build` → succeeds.
- [ ] **Step 4 — Manual:** Add items → Charge → Cash records + receipt + cart clears; Utang reveals suki picker, confirm with suki records utang and closes.
- [ ] **Step 5 — Commit:** `feat(counter): add Charge sheet with Cash/GCash/Utang flow`

---

## Task 5 — WhoOwesDrawer (+ bayad) and floating pill

**Files:** Create `stackpilot/components/counter/WhoOwesDrawer.tsx`; Modify `stackpilot/pages/CounterDashboard.tsx`

- [ ] **Step 1 — Write WhoOwesDrawer**

```tsx
// stackpilot/components/counter/WhoOwesDrawer.tsx
import React, { useState } from 'react';
import Sheet from '../Sheet';
import { WhoOwesCustomer } from '../../utils/api';

interface WhoOwesDrawerProps {
  isOpen: boolean;
  onOpen: () => void;
  onClose: () => void;
  whoOwes: WhoOwesCustomer[];
  formatCurrency: (n: number) => string;
  paymentAmount: string;
  setPaymentAmount: (v: string) => void;
  ledgerNote: string;
  setLedgerNote: (v: string) => void;
  setSelectedCustomerId: (v: string) => void;
  isSubmitting: boolean;
  onRecordPayment: () => void;
}

const WhoOwesDrawer: React.FC<WhoOwesDrawerProps> = ({
  isOpen, onOpen, onClose, whoOwes, formatCurrency, paymentAmount, setPaymentAmount,
  ledgerNote, setLedgerNote, setSelectedCustomerId, isSubmitting, onRecordPayment,
}) => {
  const [openId, setOpenId] = useState<number | null>(null);
  const sorted = [...whoOwes].sort((a, b) => Number(b.balance) - Number(a.balance));

  const selectPerson = (id: number) => { setOpenId(id); setSelectedCustomerId(String(id)); };

  return (
    <>
      {whoOwes.length > 0 && (
        <button type="button" onClick={onOpen} className="btn btn-utang fixed bottom-5 right-5 z-50 shadow-pop">
          Sino may utang? · {whoOwes.length}
        </button>
      )}

      <Sheet isOpen={isOpen} onClose={onClose} variant="drawer" eyebrow="Suki ledger" title="Sino may utang">
        {sorted.length === 0 ? (
          <p className="text-sm text-muted">Walang open na utang. Lahat bayad.</p>
        ) : (
          <div className="space-y-2">
            {sorted.map((c) => (
              <div key={c.customer_id} className="rounded-xl border border-line">
                <button type="button" onClick={() => selectPerson(c.customer_id)} className="flex min-h-11 w-full items-center justify-between gap-3 px-3 text-left">
                  <span className="truncate text-sm text-ink">{c.name}</span>
                  <span className="money text-sm font-bold text-utang">{formatCurrency(c.balance)}</span>
                </button>

                {openId === c.customer_id && (
                  <div className="space-y-2 border-t border-line p-3">
                    <input value={paymentAmount} onChange={(e) => setPaymentAmount(e.target.value)} placeholder="Bayad ₱" inputMode="decimal" className="field field-sm" />
                    <input value={ledgerNote} onChange={(e) => setLedgerNote(e.target.value)} placeholder="Note (optional)" className="field field-sm" />
                    <button
                      type="button"
                      onClick={onRecordPayment}
                      disabled={!Number.isFinite(Number(paymentAmount)) || Number(paymentAmount) <= 0 || isSubmitting}
                      className="btn btn-primary w-full"
                    >
                      Record bayad
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </Sheet>
    </>
  );
};

export default WhoOwesDrawer;
```

- [ ] **Step 2 — Wire.** Import `WhoOwesDrawer`. Render before `InvoiceModal`:
```tsx
        <WhoOwesDrawer
          isOpen={overlay === "whoOwes"}
          onOpen={() => setOverlay("whoOwes")}
          onClose={() => setOverlay("none")}
          whoOwes={whoOwes}
          formatCurrency={formatCurrency}
          paymentAmount={paymentAmount}
          setPaymentAmount={setPaymentAmount}
          ledgerNote={ledgerNote}
          setLedgerNote={setLedgerNote}
          setSelectedCustomerId={setSelectedCustomerId}
          isSubmitting={isSubmitting}
          onRecordPayment={handleRecordPayment}
        />
```

- [ ] **Step 3 — Verify:** `cd stackpilot && npm run build` → succeeds.
- [ ] **Step 4 — Manual:** With a suki owing, floating pill shows bottom-right → drawer → tap person → Bayad field → Record bayad updates balance.
- [ ] **Step 5 — Commit:** `feat(counter): add who-owes drawer with in-context bayad`

---

## Task 6 — CashDrawerSheet, StockAdjustSheet, SyncSheet

**Files:** Create the three `stackpilot/components/counter/*Sheet.tsx`; Modify `stackpilot/pages/CounterDashboard.tsx`

- [ ] **Step 1 — CashDrawerSheet**

```tsx
// stackpilot/components/counter/CashDrawerSheet.tsx
import React from 'react';
import Sheet from '../Sheet';
import { CashSession } from '../../utils/api';

interface CashDrawerSheetProps {
  isOpen: boolean;
  onClose: () => void;
  cashSession: CashSession | null;
  openingCash: string;
  setOpeningCash: (v: string) => void;
  actualCash: string;
  setActualCash: (v: string) => void;
  expectedCash: number;
  todaySales: number;
  owingCount: number;
  formatCurrency: (n: number) => string;
  isSubmitting: boolean;
  onOpenSession: () => void;
  onCloseSession: () => void;
}

const CashDrawerSheet: React.FC<CashDrawerSheetProps> = ({
  isOpen, onClose, cashSession, openingCash, setOpeningCash, actualCash, setActualCash,
  expectedCash, todaySales, owingCount, formatCurrency, isSubmitting, onOpenSession, onCloseSession,
}) => (
  <Sheet
    isOpen={isOpen}
    onClose={onClose}
    eyebrow="Kahon"
    title={cashSession ? `Cash session · #${cashSession.cash_session_id}` : 'Cash session'}
  >
    <div className="mb-4 grid grid-cols-2 gap-3">
      <div className="stat"><p className="stat-label">Benta</p><p className="stat-value text-peso">{formatCurrency(todaySales)}</p></div>
      <div className="stat"><p className="stat-label">Cash sa kahon</p><p className="stat-value">{formatCurrency(expectedCash)}</p></div>
      <div className="stat"><p className="stat-label">May utang</p><p className="stat-value text-utang">{owingCount}</p></div>
      <div className="stat"><p className="stat-label">Status</p><p className="stat-value">{cashSession ? 'Open' : 'Closed'}</p></div>
    </div>

    {cashSession ? (
      <div className="space-y-2">
        <input value={actualCash} onChange={(e) => setActualCash(e.target.value)} placeholder="Bilang ng cash (actual)" inputMode="decimal" className="field" />
        <button type="button" onClick={onCloseSession} disabled={!Number.isFinite(Number(actualCash)) || Number(actualCash) < 0 || isSubmitting} className="btn btn-primary w-full">Close session</button>
      </div>
    ) : (
      <div className="space-y-2">
        <input value={openingCash} onChange={(e) => setOpeningCash(e.target.value)} placeholder="Opening cash" inputMode="decimal" className="field" />
        <button type="button" onClick={onOpenSession} disabled={!Number.isFinite(Number(openingCash || 0)) || Number(openingCash || 0) < 0 || isSubmitting} className="btn btn-primary w-full">Open session</button>
      </div>
    )}
  </Sheet>
);

export default CashDrawerSheet;
```

- [ ] **Step 2 — StockAdjustSheet**

```tsx
// stackpilot/components/counter/StockAdjustSheet.tsx
import React from 'react';
import Sheet from '../Sheet';
import { Product, StockMovementReason } from '../../utils/api';

interface StockAdjustSheetProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  adjustmentProductId: string;
  setAdjustmentProductId: (v: string) => void;
  adjustmentQty: string;
  setAdjustmentQty: (v: string) => void;
  adjustmentReason: StockMovementReason;
  setAdjustmentReason: (v: StockMovementReason) => void;
  adjustmentNote: string;
  setAdjustmentNote: (v: string) => void;
  isSubmitting: boolean;
  onRecord: () => void;
}

const StockAdjustSheet: React.FC<StockAdjustSheetProps> = ({
  isOpen, onClose, products, adjustmentProductId, setAdjustmentProductId, adjustmentQty,
  setAdjustmentQty, adjustmentReason, setAdjustmentReason, adjustmentNote, setAdjustmentNote,
  isSubmitting, onRecord,
}) => (
  <Sheet isOpen={isOpen} onClose={onClose} eyebrow="Stock" title="Stock adjustment">
    <div className="space-y-2">
      <select value={adjustmentProductId} onChange={(e) => setAdjustmentProductId(e.target.value)} className="field">
        <option value="">Select product</option>
        {products.map((p) => (<option key={p.product_id} value={p.product_id}>{p.name}</option>))}
      </select>
      <div className="grid grid-cols-2 gap-2">
        <input value={adjustmentQty} onChange={(e) => setAdjustmentQty(e.target.value)} placeholder="+/- quantity" inputMode="decimal" className="field" />
        <select value={adjustmentReason} onChange={(e) => setAdjustmentReason(e.target.value as StockMovementReason)} className="field">
          <option value="correction">Correction</option>
          <option value="stock_in">Stock in</option>
          <option value="return">Return</option>
          <option value="damage">Damage</option>
          <option value="expired">Expired</option>
          <option value="owner_use">Owner use</option>
        </select>
      </div>
      <input value={adjustmentNote} onChange={(e) => setAdjustmentNote(e.target.value)} placeholder="Reason note" className="field" />
      <button
        type="button"
        onClick={onRecord}
        disabled={!adjustmentProductId || !Number.isFinite(Number(adjustmentQty)) || Number(adjustmentQty) === 0 || isSubmitting}
        className="btn btn-primary w-full"
      >
        Record movement
      </button>
    </div>
  </Sheet>
);

export default StockAdjustSheet;
```

- [ ] **Step 3 — SyncSheet**

```tsx
// stackpilot/components/counter/SyncSheet.tsx
import React from 'react';
import Sheet from '../Sheet';
import { SyncQueueSummary } from '../../offline/syncQueue';

interface SyncSheetProps {
  isOpen: boolean;
  onClose: () => void;
  queueSummary: SyncQueueSummary;
  isOnline: boolean;
  isSubmitting: boolean;
  onRetry: () => void;
}

const SyncSheet: React.FC<SyncSheetProps> = ({
  isOpen, onClose, queueSummary, isOnline, isSubmitting, onRetry,
}) => (
  <Sheet isOpen={isOpen} onClose={onClose} eyebrow="Sync" title={isOnline ? 'Online' : 'Offline — saving locally'}>
    <div className="grid grid-cols-3 gap-2 text-center">
      {([['Queued', queueSummary.queued], ['Failed', queueSummary.failed], ['Synced', queueSummary.synced]] as const).map(([label, value]) => (
        <div key={label} className="card-sunken py-2.5">
          <p className="money text-lg font-bold text-ink">{value}</p>
          <p className="text-[0.65rem] font-medium text-muted">{label}</p>
        </div>
      ))}
    </div>
    <button
      type="button"
      onClick={onRetry}
      disabled={isSubmitting || (!queueSummary.queued && !queueSummary.failed) || !isOnline}
      className="btn btn-ghost mt-3 w-full"
    >
      Retry sync
    </button>
  </Sheet>
);

export default SyncSheet;
```

- [ ] **Step 4 — Wire all three.** Import the three components. Render before `InvoiceModal`:
```tsx
        <CashDrawerSheet
          isOpen={overlay === "cashDrawer"}
          onClose={() => setOverlay("none")}
          cashSession={cashSession}
          openingCash={openingCash}
          setOpeningCash={setOpeningCash}
          actualCash={actualCash}
          setActualCash={setActualCash}
          expectedCash={expectedCash}
          todaySales={todaySales}
          owingCount={whoOwes.length}
          formatCurrency={formatCurrency}
          isSubmitting={isSubmitting}
          onOpenSession={handleOpenCashSession}
          onCloseSession={handleCloseCashSession}
        />
        <StockAdjustSheet
          isOpen={overlay === "stock"}
          onClose={() => setOverlay("none")}
          products={products}
          adjustmentProductId={adjustmentProductId}
          setAdjustmentProductId={setAdjustmentProductId}
          adjustmentQty={adjustmentQty}
          setAdjustmentQty={setAdjustmentQty}
          adjustmentReason={adjustmentReason}
          setAdjustmentReason={setAdjustmentReason}
          adjustmentNote={adjustmentNote}
          setAdjustmentNote={setAdjustmentNote}
          isSubmitting={isSubmitting}
          onRecord={handleStockAdjustment}
        />
        <SyncSheet
          isOpen={overlay === "sync"}
          onClose={() => setOverlay("none")}
          queueSummary={queueSummary}
          isOnline={isOnline}
          isSubmitting={isSubmitting}
          onRetry={handleRetrySync}
        />
```

- [ ] **Step 5 — Verify:** `cd stackpilot && npm run build` → succeeds; no unused-symbol issues remain (all prior orphaned handlers/state now consumed).
- [ ] **Step 6 — Manual:** Top-bar Cash drawer / Stock / sync chip each open their sheet; open+close session, record a movement, retry sync all work.
- [ ] **Step 7 — Commit:** `feat(counter): move cash session, stock, and sync into summon sheets`

---

## Task 7 — Full-flow verification + cleanup

**Files:** Modify `stackpilot/pages/CounterDashboard.tsx` (only if dead code remains)

- [ ] **Step 1 — Remove dead imports/code.** Confirm `ShoppingCartIcon` import (was only in the removed owner-panel header) is still used; if not, remove it. Remove any other now-unused imports the build flags.
- [ ] **Step 2 — Full build:** `cd stackpilot && npm run build` → clean.
- [ ] **Step 3 — Manual regression pass** (`npm run dev`), in order:
  1. Resting Counter shows only money strip + products + cart (3 sections); no owner panel.
  2. Cash sale: products → Charge → Cash → receipt, cart clears, Benta + Cash update.
  3. GCash sale: GCash figure updates.
  4. Utang sale: Charge → Utang → pick suki → confirm → cart clears, who-owes count reflects it.
  5. Add new suki inside the Utang flow works.
  6. Who-owes pill → drawer → person → Record bayad updates balance + Cash.
  7. Cash drawer sheet: open then close a session; difference message appears.
  8. Stock sheet: record a movement; product stock reflects it.
  9. Sync chip → sheet → retry enabled only when pending + online.
  10. Offline (DevTools): a sale queues, banner says queued, sync chip shows pending.
  11. Keyboard: Esc closes any open sheet; Tab focus rings visible.
  12. Narrow viewport (~768px): products/cart stack, pill reachable.
- [ ] **Step 4 — Commit:** `chore(counter): remove dead code after Calm Counter refactor`

---

## 9. Coverage check (spec → task)

| Spec item | Task |
|-----------|------|
| Two-column layout, 3-up products | 3 |
| Quiet top bar (money strip + summon) | 2 |
| Single Charge button | 3 |
| Charge sheet method picker + Utang flow | 4 |
| Who-owes drawer + in-context bayad + floating pill | 5 |
| Cash drawer / Stock / Sync summon sheets; owner stats folded into cash drawer | 6 |
| Sheet/Drawer primitive; reduced-motion; Esc/focus | 1 + 7 |
| Preserve handlers, offline queue, receipt flow, no API change | Global guardrails (§6); every task reuses existing handlers |

**Type consistency:** `CounterOverlay` is defined once (`CounterTopBar.tsx`) and imported by `CounterDashboard`. Prop types reference real exports already imported by `CounterDashboard.tsx`: `Customer`, `CustomerBalance`, `WhoOwesCustomer`, `CashSession`, `Product`, `StockMovementReason` (`utils/api`) and `SyncQueueSummary` (`offline/syncQueue`).

## 10. Suggested commit sequence

```
feat(counter): add reusable Sheet/Drawer overlay primitive            (Task 1)
feat(counter): replace Kita bar with quiet top bar + summon controls  (Task 2)
feat(counter): collapse to two-column layout with single Charge action(Task 3)
feat(counter): add Charge sheet with Cash/GCash/Utang flow            (Task 4)
feat(counter): add who-owes drawer with in-context bayad              (Task 5)
feat(counter): move cash session, stock, and sync into summon sheets  (Task 6)
chore(counter): remove dead code after Calm Counter refactor          (Task 7)
```
