# Counter "Calm Counter" Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reduce the Counter screen to one resting job — ring up a sale — moving every secondary tool behind one-tap summon overlays.

**Architecture:** Presentation/placement refactor of `stackpilot/pages/CounterDashboard.tsx`. All existing state, handlers, API calls, and offline-queue logic are preserved; they are relocated into focused child surfaces. One new reusable overlay primitive (`Sheet`) backs the summoned tools and the right-side drawer. Resting layout collapses from three columns to two (products | cart) plus a thin money strip.

**Tech Stack:** React 19, TypeScript, Vite, Tailwind 3.4 ("Palengke Daylight" tokens in `tailwind.config.js`, primitives in `stackpilot/index.css`).

## Global Constraints

- No test runner is configured in this repo. **Verification for every task = `cd stackpilot && npm run build` passes (TypeScript typecheck + Vite build), plus the manual check stated in the task.** Do not add a test framework.
- Use ONLY existing design-system tokens and primitives (`docs/DESIGN_SYSTEM.md`): `.card`, `.card-sunken`, `.btn`, `.btn-primary`, `.btn-gcash`, `.btn-utang`, `.btn-ghost`, `.btn-outline`, `.btn-danger`, `.btn-lg`, `.field`, `.field-sm`, `.pill`, `.pill-ok/-warn/-bad/-muted`, `.pill-dot`, `.money`, `.stat`, `.eyebrow`, `.page`, `.page-inner`, `.page-title`. Invent no new colors, fonts, radii, or shadows.
- The `Sheet` overlay is the ONLY new structural primitive permitted.
- Money color semantics: sales/cash-in = peso (jade); GCash = gcash blue; utang/owed = utang amber; shortfalls/errors = danger; neutral = ink.
- Touch targets min 44px (`min-h-11`); primary counter actions `min-h-14` (`btn-lg`). Visible `focus-visible` rings are provided globally by `index.css` — do not remove.
- Respect `prefers-reduced-motion` (handled globally in `index.css`; reuse existing `animate-fade-in`, do not add bespoke always-on animations).
- Copy: sentence case, Taglish where it is the counter's real word (Benta, Bayad, Utang, Suki, Kita, Paubos). Reuse the exact existing strings when relocating controls.
- Do NOT change any backend, API signature, data model, or the `InvoiceModal` receipt flow.
- Preserve every existing handler body in `CounterDashboard.tsx` (`handleSale`, `handleCreateCustomer`, `handleUtang`, `handleRecordPayment`, `handleRetrySync`, `handleOpenCashSession`, `handleCloseCashSession`, `handleStockAdjustment`) verbatim — only their call sites / surrounding JSX move.

**Reference modal idiom** (from `components/ConfirmationModal.tsx`) that overlays must follow: outer `fixed inset-0 z-[60] bg-ink/50 backdrop-blur-sm`, click-outside closes, inner panel `.card animate-fade-in shadow-pop` with `onClick={e => e.stopPropagation()}`.

---

## File Structure

- **Create** `stackpilot/components/Sheet.tsx` — reusable overlay (centered `sheet` variant + right-side `drawer` variant). One responsibility: backdrop + dismissable panel + title/close chrome.
- **Create** `stackpilot/components/counter/CounterTopBar.tsx` — thin money strip + three summon controls (cash drawer, stock, sync chip).
- **Create** `stackpilot/components/counter/ChargeSheet.tsx` — method picker (Cash/GCash/Utang) and the Utang sub-flow (suki picker + add suki + ledger note).
- **Create** `stackpilot/components/counter/WhoOwesDrawer.tsx` — floating pill + right drawer listing suki who owe, with per-person Record bayad.
- **Create** `stackpilot/components/counter/CashDrawerSheet.tsx` — open/close cash session + today's owner stats.
- **Create** `stackpilot/components/counter/StockAdjustSheet.tsx` — stock movement form.
- **Create** `stackpilot/components/counter/SyncSheet.tsx` — queued/failed/synced counts + retry.
- **Modify** `stackpilot/pages/CounterDashboard.tsx` — keep all state + handlers; replace the JSX body with the two-column layout + overlay orchestration. Add one overlay-state field.

`CounterDashboard.tsx` stays the single owner of state and handlers (it has grown unwieldy at ~1167 lines; extracting presentational surfaces is the targeted improvement). Children are presentational and receive exactly the props they need.

---

## Task 1: Sheet overlay primitive

**Files:**
- Create: `stackpilot/components/Sheet.tsx`

**Interfaces:**
- Consumes: nothing (leaf component).
- Produces:
  ```ts
  export interface SheetProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    eyebrow?: string;          // optional Taglish label above title
    variant?: 'sheet' | 'drawer'; // default 'sheet' (centered); 'drawer' = right side
    children: React.ReactNode;
    footer?: React.ReactNode;  // optional sticky footer (primary action)
  }
  export default function Sheet(props: SheetProps): JSX.Element | null;
  ```

- [ ] **Step 1: Write the component**

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
  isOpen,
  onClose,
  title,
  eyebrow,
  variant = 'sheet',
  children,
  footer,
}) => {
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
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
      className={`fixed inset-0 z-[60] flex bg-ink/50 backdrop-blur-sm ${
        variant === 'drawer' ? '' : 'p-4'
      }`}
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

- [ ] **Step 2: Verify build**

Run: `cd stackpilot && npm run build`
Expected: build succeeds, no TypeScript errors.

- [ ] **Step 3: Commit**

```bash
git add stackpilot/components/Sheet.tsx
git commit -m "feat(counter): add reusable Sheet/Drawer overlay primitive"
```

---

## Task 2: Overlay state + CounterTopBar (replace the Kita bar)

Replaces the always-visible 4-cell Kita bar + sync block (`CounterDashboard.tsx:624-651`) with a thin money strip whose right side holds three summon controls. Adds the single piece of new UI state.

**Files:**
- Create: `stackpilot/components/counter/CounterTopBar.tsx`
- Modify: `stackpilot/pages/CounterDashboard.tsx`

**Interfaces:**
- Consumes: `formatCurrency` values already computed in `CounterDashboard` (`todaySales`, `expectedCash`, `gcashSales`, `utangOwed`, `isOnline`, `pendingSync`).
- Produces:
  ```ts
  export type CounterOverlay = 'none' | 'charge' | 'cashDrawer' | 'stock' | 'sync' | 'whoOwes';
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
  ```

- [ ] **Step 1: Write CounterTopBar**

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
  todaySales,
  expectedCash,
  gcashSales,
  utangOwed,
  isOnline,
  pendingSync,
  formatCurrency,
  onOpen,
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
            <p className={`money mt-1 text-xl font-bold lg:text-2xl ${cell.tone}`}>
              {cell.value}
            </p>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-2">
        <button type="button" onClick={() => onOpen('cashDrawer')} className="btn btn-ghost btn-sm">
          Cash drawer
        </button>
        <button type="button" onClick={() => onOpen('stock')} className="btn btn-ghost btn-sm">
          Stock
        </button>
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

Note: `.btn-sm` is not yet defined. Add it in this task (Step 2) so the summon buttons are compact.

- [ ] **Step 2: Add `.btn-sm` primitive to `index.css`**

In `stackpilot/index.css`, inside `@layer components` immediately after the `.btn-lg` block (around line 95), add:

```css
  .btn-sm {
    @apply min-h-9 px-3 text-xs;
  }
```

- [ ] **Step 3: Wire into CounterDashboard**

In `stackpilot/pages/CounterDashboard.tsx`:

Add imports near the top (after existing component imports):
```tsx
import CounterTopBar, { CounterOverlay } from "../components/counter/CounterTopBar";
```

Add state alongside the other `useState` hooks (after `orderForReceipt`, ~line 70):
```tsx
const [overlay, setOverlay] = useState<CounterOverlay>("none");
```

Replace the entire Kita Bar `<section>` block (currently `CounterDashboard.tsx:624-651`, the `{/* Kita Bar … */}` section) with:
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

- [ ] **Step 4: Verify build**

Run: `cd stackpilot && npm run build`
Expected: build succeeds. (The three summon buttons do nothing visible yet — overlays land in later tasks. That is expected.)

- [ ] **Step 5: Manual check**

Run `cd stackpilot && npm run dev`, open the Counter screen. The top of the page now shows a single thin strip with the four money figures and three controls on the right. The old stacked Kita+sync card is gone.

- [ ] **Step 6: Commit**

```bash
git add stackpilot/components/counter/CounterTopBar.tsx stackpilot/index.css stackpilot/pages/CounterDashboard.tsx
git commit -m "feat(counter): replace Kita bar with quiet top bar + summon controls"
```

---

## Task 3: Two-column layout + single Charge button

Collapse the three-column `<section className="grid …">` (`CounterDashboard.tsx:653-1153`) to two columns (products | cart). Remove from the cart column: the three method buttons, the inline suki/utang ledger sub-panel, and the standalone Record bayad button. Replace with one `Charge ₱X` button that opens the charge overlay. The entire `<aside>` owner-panel column (cash session, stock adjustment, offline/sync, who-owes, owner stats — `CounterDashboard.tsx:921-1152`) is removed from the layout in this task; its functionality returns via overlays in Tasks 4–6.

**Files:**
- Modify: `stackpilot/pages/CounterDashboard.tsx`

**Interfaces:**
- Consumes: existing `subtotal`, `cart`, `updateQuantity`, `isSubmitting`, `setCart`, `formatCurrency`, `setOverlay`.
- Produces: charge entry point — clicking `Charge` calls `setOverlay('charge')`.

- [ ] **Step 1: Change the grid to two columns**

Change the section opening tag (`CounterDashboard.tsx:654`) from the three-column template to:
```tsx
        <section className="grid gap-4 xl:grid-cols-[minmax(360px,1.3fr)_minmax(340px,1fr)]">
```

- [ ] **Step 2: Widen the product grid to 3-up**

In the Products card, change the product grid container (`CounterDashboard.tsx:682`) from `grid-cols-2` to:
```tsx
            <div className="grid flex-1 grid-cols-2 content-start gap-3 overflow-y-auto pr-1 sm:grid-cols-3">
```

- [ ] **Step 3: Replace the cart's totals/actions + remove the ledger sub-panel**

In the "Current Sale" card, delete the entire Suki/utang controls block (`{/* Suki / utang controls */}` … its closing `</div>`, currently `CounterDashboard.tsx:800-864`).

Then replace the totals+actions block (`{/* Totals + actions */}`, currently `CounterDashboard.tsx:866-918`) with:
```tsx
            {/* Total + charge */}
            <div className="mt-auto rounded-xl border border-line bg-surface p-4">
              <div className="mb-4 flex items-baseline justify-between">
                <span className="text-sm font-medium text-muted">Total</span>
                <span className="money text-3xl font-bold text-ink">
                  {formatCurrency(subtotal)}
                </span>
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

- [ ] **Step 4: Remove the owner-panel aside**

Delete the entire `<aside …>` … `</aside>` block (`CounterDashboard.tsx:921-1152`, from `{/* Owner panel */}` through the closing `</aside>`). Its content returns as overlays in Tasks 4–6.

- [ ] **Step 5: Verify build**

Run: `cd stackpilot && npm run build`
Expected: build succeeds. Several handlers/state become temporarily unused (e.g. `handleUtang`, `selectedCustomerId`) — that is fine; they are re-consumed in Tasks 4–6. `tsconfig.json` does NOT set `noUnusedLocals` (verified), so unused locals do not fail the build. Leave them in place.

- [ ] **Step 6: Manual check**

Counter screen now shows exactly two columns. Cart shows one big `Charge ₱X` button. No method buttons, no suki picker, no owner panel at rest.

- [ ] **Step 7: Commit**

```bash
git add stackpilot/pages/CounterDashboard.tsx
git commit -m "feat(counter): collapse to two-column layout with single Charge action"
```

---

## Task 4: ChargeSheet (method picker + utang flow)

**Files:**
- Create: `stackpilot/components/counter/ChargeSheet.tsx`
- Modify: `stackpilot/pages/CounterDashboard.tsx`

**Interfaces:**
- Consumes from CounterDashboard: `subtotal`, `formatCurrency`, `customers` (`Customer[]`), `customerBalance`, `selectedCustomerId`, `setSelectedCustomerId`, `newCustomerName`, `setNewCustomerName`, `newCustomerPhone`, `setNewCustomerPhone`, `ledgerNote`, `setLedgerNote`, `handleSale` (`(m:'cash'|'gcash')=>Promise<void>`), `handleUtang` (`()=>Promise<void>`), `handleCreateCustomer` (`()=>Promise<void>`), `isSubmitting`, `actionStatus`, `actionError`.
- Produces: `ChargeSheet` closes itself by calling `onClose`. The parent closes it after a successful sale.

- [ ] **Step 1: Write ChargeSheet**

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
  isOpen,
  onClose,
  subtotal,
  formatCurrency,
  customers,
  customerBalance,
  selectedCustomerId,
  setSelectedCustomerId,
  newCustomerName,
  setNewCustomerName,
  newCustomerPhone,
  setNewCustomerPhone,
  ledgerNote,
  setLedgerNote,
  isSubmitting,
  onCash,
  onGcash,
  onUtang,
  onCreateCustomer,
}) => {
  const [mode, setMode] = useState<'choose' | 'utang'>('choose');

  // Reset to method choice each time the sheet opens.
  React.useEffect(() => {
    if (isOpen) setMode('choose');
  }, [isOpen]);

  return (
    <Sheet isOpen={isOpen} onClose={onClose} eyebrow="Bayad" title={`Charge ${formatCurrency(subtotal)}`}>
      {mode === 'choose' ? (
        <div className="grid grid-cols-1 gap-3">
          <button type="button" onClick={onCash} disabled={isSubmitting} className="btn btn-primary btn-lg w-full">
            Cash
          </button>
          <button type="button" onClick={onGcash} disabled={isSubmitting} className="btn btn-gcash btn-lg w-full">
            GCash
          </button>
          <button
            type="button"
            onClick={() => setMode('utang')}
            disabled={isSubmitting}
            className="btn btn-utang btn-lg w-full"
          >
            Utang
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="grid grid-cols-[1fr_auto] gap-2">
            <select
              value={selectedCustomerId}
              onChange={(e) => setSelectedCustomerId(e.target.value)}
              className="field"
            >
              <option value="">Pumili ng suki</option>
              {customers.map((c) => (
                <option key={c.customer_id} value={c.customer_id}>
                  {c.name}
                </option>
              ))}
            </select>
            <div className="flex min-w-[110px] flex-col justify-center rounded-xl border border-line bg-surface px-3 py-1.5 text-right">
              <span className="text-[0.65rem] font-medium text-muted">Balance</span>
              <span className="money text-sm font-bold text-utang">
                {formatCurrency(customerBalance?.balance ?? 0)}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
            <input
              value={newCustomerName}
              onChange={(e) => setNewCustomerName(e.target.value)}
              placeholder="New suki name"
              className="field field-sm"
            />
            <div className="grid grid-cols-[1fr_auto] gap-2">
              <input
                value={newCustomerPhone}
                onChange={(e) => setNewCustomerPhone(e.target.value)}
                placeholder="Phone"
                className="field field-sm"
              />
              <button
                type="button"
                onClick={onCreateCustomer}
                disabled={!newCustomerName.trim() || isSubmitting}
                className="btn btn-ghost px-4"
              >
                Add
              </button>
            </div>
          </div>

          <input
            value={ledgerNote}
            onChange={(e) => setLedgerNote(e.target.value)}
            placeholder="Ledger note"
            className="field field-sm"
          />

          <div className="grid grid-cols-[auto_1fr] gap-2 pt-1">
            <button type="button" onClick={() => setMode('choose')} className="btn btn-ghost">
              Back
            </button>
            <button
              type="button"
              onClick={onUtang}
              disabled={!selectedCustomerId || isSubmitting}
              className="btn btn-utang btn-lg"
            >
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

- [ ] **Step 2: Wire into CounterDashboard + auto-close on success**

In `CounterDashboard.tsx`, import:
```tsx
import ChargeSheet from "../components/counter/ChargeSheet";
```

The existing `handleSale` and `handleUtang` already clear the cart on success. Wrap the handlers so the overlay closes when the cart empties. Add these thin wrappers next to the handlers:
```tsx
const chargeCash = async () => { await handleSale("cash"); setOverlay("none"); };
const chargeGcash = async () => { await handleSale("gcash"); setOverlay("none"); };
const chargeUtang = async () => { await handleUtang(); if (cart.length === 0) setOverlay("none"); };
```
(Note: `handleUtang` no-ops if no customer is selected; the `cart.length === 0` guard avoids closing on a rejected submit. `handleSale` already guards internally.)

Render the sheet just before the `InvoiceModal` at the bottom of the returned JSX (before `{orderForReceipt && (`):
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

- [ ] **Step 3: Verify build**

Run: `cd stackpilot && npm run build`
Expected: build succeeds.

- [ ] **Step 4: Manual check**

Add items → `Charge ₱X` → sheet opens with Cash / GCash / Utang. Cash records the sale, closes the sheet, shows the receipt. Utang reveals the suki picker; confirm with a suki selected records the utang and closes.

- [ ] **Step 5: Commit**

```bash
git add stackpilot/components/counter/ChargeSheet.tsx stackpilot/pages/CounterDashboard.tsx
git commit -m "feat(counter): add Charge sheet with Cash/GCash/Utang flow"
```

---

## Task 5: WhoOwesDrawer (+ bayad) and floating pill

**Files:**
- Create: `stackpilot/components/counter/WhoOwesDrawer.tsx`
- Modify: `stackpilot/pages/CounterDashboard.tsx`

**Interfaces:**
- Consumes: `whoOwes` (`WhoOwesCustomer[]` with `customer_id`, `name`, `balance`), `formatCurrency`, `paymentAmount`, `setPaymentAmount`, `ledgerNote`, `setLedgerNote`, `handleRecordPayment` (`()=>Promise<void>`), `setSelectedCustomerId`, `isSubmitting`, `overlay`, `setOverlay`.
- Produces: a floating trigger pill (rendered by the drawer component) + the drawer surface.

- [ ] **Step 1: Write WhoOwesDrawer**

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
  isOpen,
  onOpen,
  onClose,
  whoOwes,
  formatCurrency,
  paymentAmount,
  setPaymentAmount,
  ledgerNote,
  setLedgerNote,
  setSelectedCustomerId,
  isSubmitting,
  onRecordPayment,
}) => {
  const [openId, setOpenId] = useState<number | null>(null);
  const sorted = [...whoOwes].sort((a, b) => Number(b.balance) - Number(a.balance));

  const selectPerson = (id: number) => {
    setOpenId(id);
    setSelectedCustomerId(String(id));
  };

  return (
    <>
      {whoOwes.length > 0 && (
        <button
          type="button"
          onClick={onOpen}
          className="btn btn-utang fixed bottom-5 right-5 z-50 shadow-pop"
        >
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
                <button
                  type="button"
                  onClick={() => selectPerson(c.customer_id)}
                  className="flex min-h-11 w-full items-center justify-between gap-3 px-3 text-left"
                >
                  <span className="truncate text-sm text-ink">{c.name}</span>
                  <span className="money text-sm font-bold text-utang">
                    {formatCurrency(c.balance)}
                  </span>
                </button>

                {openId === c.customer_id && (
                  <div className="space-y-2 border-t border-line p-3">
                    <input
                      value={paymentAmount}
                      onChange={(e) => setPaymentAmount(e.target.value)}
                      placeholder="Bayad ₱"
                      inputMode="decimal"
                      className="field field-sm"
                    />
                    <input
                      value={ledgerNote}
                      onChange={(e) => setLedgerNote(e.target.value)}
                      placeholder="Note (optional)"
                      className="field field-sm"
                    />
                    <button
                      type="button"
                      onClick={onRecordPayment}
                      disabled={
                        !Number.isFinite(Number(paymentAmount)) ||
                        Number(paymentAmount) <= 0 ||
                        isSubmitting
                      }
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

- [ ] **Step 2: Wire into CounterDashboard**

Import:
```tsx
import WhoOwesDrawer from "../components/counter/WhoOwesDrawer";
```

Render alongside the other overlays (before `InvoiceModal`):
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

- [ ] **Step 3: Verify build**

Run: `cd stackpilot && npm run build`
Expected: build succeeds.

- [ ] **Step 4: Manual check**

With at least one suki owing, a floating "Sino may utang? · N" pill shows bottom-right. Tapping opens the right drawer. Tapping a person reveals a Bayad field + Record bayad; recording updates the balance.

- [ ] **Step 5: Commit**

```bash
git add stackpilot/components/counter/WhoOwesDrawer.tsx stackpilot/pages/CounterDashboard.tsx
git commit -m "feat(counter): add who-owes drawer with in-context bayad"
```

---

## Task 6: CashDrawerSheet, StockAdjustSheet, SyncSheet

**Files:**
- Create: `stackpilot/components/counter/CashDrawerSheet.tsx`
- Create: `stackpilot/components/counter/StockAdjustSheet.tsx`
- Create: `stackpilot/components/counter/SyncSheet.tsx`
- Modify: `stackpilot/pages/CounterDashboard.tsx`

**Interfaces:**
- CashDrawerSheet consumes: `cashSession` (`CashSession | null`), `openingCash`/`setOpeningCash`, `actualCash`/`setActualCash`, `expectedCash`, `todaySales`, `whoOwes.length`, `onOpenSession` (`handleOpenCashSession`), `onCloseSession` (`handleCloseCashSession`), `isSubmitting`, `formatCurrency`.
- StockAdjustSheet consumes: `products` (`Product[]`), `adjustmentProductId`/`setAdjustmentProductId`, `adjustmentQty`/`setAdjustmentQty`, `adjustmentReason`/`setAdjustmentReason` (`StockMovementReason`), `adjustmentNote`/`setAdjustmentNote`, `onRecord` (`handleStockAdjustment`), `isSubmitting`.
- SyncSheet consumes: `queueSummary` (`SyncQueueSummary`), `isOnline`, `onRetry` (`handleRetrySync`), `isSubmitting`.

- [ ] **Step 1: Write CashDrawerSheet**

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
  isOpen,
  onClose,
  cashSession,
  openingCash,
  setOpeningCash,
  actualCash,
  setActualCash,
  expectedCash,
  todaySales,
  owingCount,
  formatCurrency,
  isSubmitting,
  onOpenSession,
  onCloseSession,
}) => (
  <Sheet
    isOpen={isOpen}
    onClose={onClose}
    eyebrow="Kahon"
    title={cashSession ? `Cash session · #${cashSession.cash_session_id}` : 'Cash session'}
  >
    <div className="mb-4 grid grid-cols-2 gap-3">
      <div className="stat">
        <p className="stat-label">Benta</p>
        <p className="stat-value text-peso">{formatCurrency(todaySales)}</p>
      </div>
      <div className="stat">
        <p className="stat-label">Cash sa kahon</p>
        <p className="stat-value">{formatCurrency(expectedCash)}</p>
      </div>
      <div className="stat">
        <p className="stat-label">May utang</p>
        <p className="stat-value text-utang">{owingCount}</p>
      </div>
      <div className="stat">
        <p className="stat-label">Status</p>
        <p className="stat-value">{cashSession ? 'Open' : 'Closed'}</p>
      </div>
    </div>

    {cashSession ? (
      <div className="space-y-2">
        <input
          value={actualCash}
          onChange={(e) => setActualCash(e.target.value)}
          placeholder="Bilang ng cash (actual)"
          inputMode="decimal"
          className="field"
        />
        <button
          type="button"
          onClick={onCloseSession}
          disabled={!Number.isFinite(Number(actualCash)) || Number(actualCash) < 0 || isSubmitting}
          className="btn btn-primary w-full"
        >
          Close session
        </button>
      </div>
    ) : (
      <div className="space-y-2">
        <input
          value={openingCash}
          onChange={(e) => setOpeningCash(e.target.value)}
          placeholder="Opening cash"
          inputMode="decimal"
          className="field"
        />
        <button
          type="button"
          onClick={onOpenSession}
          disabled={!Number.isFinite(Number(openingCash || 0)) || Number(openingCash || 0) < 0 || isSubmitting}
          className="btn btn-primary w-full"
        >
          Open session
        </button>
      </div>
    )}
  </Sheet>
);

export default CashDrawerSheet;
```

- [ ] **Step 2: Write StockAdjustSheet**

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
  isOpen,
  onClose,
  products,
  adjustmentProductId,
  setAdjustmentProductId,
  adjustmentQty,
  setAdjustmentQty,
  adjustmentReason,
  setAdjustmentReason,
  adjustmentNote,
  setAdjustmentNote,
  isSubmitting,
  onRecord,
}) => (
  <Sheet isOpen={isOpen} onClose={onClose} eyebrow="Stock" title="Stock adjustment">
    <div className="space-y-2">
      <select
        value={adjustmentProductId}
        onChange={(e) => setAdjustmentProductId(e.target.value)}
        className="field"
      >
        <option value="">Select product</option>
        {products.map((p) => (
          <option key={p.product_id} value={p.product_id}>
            {p.name}
          </option>
        ))}
      </select>
      <div className="grid grid-cols-2 gap-2">
        <input
          value={adjustmentQty}
          onChange={(e) => setAdjustmentQty(e.target.value)}
          placeholder="+/- quantity"
          inputMode="decimal"
          className="field"
        />
        <select
          value={adjustmentReason}
          onChange={(e) => setAdjustmentReason(e.target.value as StockMovementReason)}
          className="field"
        >
          <option value="correction">Correction</option>
          <option value="stock_in">Stock in</option>
          <option value="return">Return</option>
          <option value="damage">Damage</option>
          <option value="expired">Expired</option>
          <option value="owner_use">Owner use</option>
        </select>
      </div>
      <input
        value={adjustmentNote}
        onChange={(e) => setAdjustmentNote(e.target.value)}
        placeholder="Reason note"
        className="field"
      />
      <button
        type="button"
        onClick={onRecord}
        disabled={
          !adjustmentProductId ||
          !Number.isFinite(Number(adjustmentQty)) ||
          Number(adjustmentQty) === 0 ||
          isSubmitting
        }
        className="btn btn-primary w-full"
      >
        Record movement
      </button>
    </div>
  </Sheet>
);

export default StockAdjustSheet;
```

- [ ] **Step 3: Write SyncSheet**

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
  isOpen,
  onClose,
  queueSummary,
  isOnline,
  isSubmitting,
  onRetry,
}) => (
  <Sheet isOpen={isOpen} onClose={onClose} eyebrow="Sync" title={isOnline ? 'Online' : 'Offline — saving locally'}>
    <div className="grid grid-cols-3 gap-2 text-center">
      {([
        ['Queued', queueSummary.queued],
        ['Failed', queueSummary.failed],
        ['Synced', queueSummary.synced],
      ] as const).map(([label, value]) => (
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

- [ ] **Step 4: Wire all three into CounterDashboard**

Import:
```tsx
import CashDrawerSheet from "../components/counter/CashDrawerSheet";
import StockAdjustSheet from "../components/counter/StockAdjustSheet";
import SyncSheet from "../components/counter/SyncSheet";
```

Render alongside the other overlays (before `InvoiceModal`):
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

- [ ] **Step 5: Verify build**

Run: `cd stackpilot && npm run build`
Expected: build succeeds with no unused-variable errors remaining (all previously-orphaned handlers/state from Task 3 are now consumed).

- [ ] **Step 6: Manual check**

Top-bar "Cash drawer", "Stock", and the sync chip each open their sheet. Opening/closing a cash session, recording a stock movement, and retrying sync all still work.

- [ ] **Step 7: Commit**

```bash
git add stackpilot/components/counter/CashDrawerSheet.tsx stackpilot/components/counter/StockAdjustSheet.tsx stackpilot/components/counter/SyncSheet.tsx stackpilot/pages/CounterDashboard.tsx
git commit -m "feat(counter): move cash session, stock, and sync into summon sheets"
```

---

## Task 7: Full-flow verification + cleanup

**Files:**
- Modify: `stackpilot/pages/CounterDashboard.tsx` (only if dead code remains)

- [ ] **Step 1: Remove dead imports/code**

Confirm the `ShoppingCartIcon` import is still used (it was only in the removed owner panel header). If unused now, remove it from the import on `CounterDashboard.tsx:2`. Remove any other now-unused imports the build flags.

- [ ] **Step 2: Full build**

Run: `cd stackpilot && npm run build`
Expected: clean build, no warnings about unused symbols.

- [ ] **Step 3: Manual regression pass**

Run `cd stackpilot && npm run dev` and verify, in order:
1. Resting Counter shows only: money strip, products, cart (3 sections). No owner panel.
2. Cash sale: tap products → Charge → Cash → receipt shows, cart clears, Benta + Cash update.
3. GCash sale: same, GCash figure updates.
4. Utang sale: Charge → Utang → pick suki → confirm → cart clears, who-owes pill count reflects it.
5. Add new suki inside the Utang flow works.
6. Who-owes pill → drawer → pick person → Record bayad updates balance + Cash.
7. Cash drawer sheet: open then close a session, difference message appears.
8. Stock sheet: record a movement, product stock reflects it.
9. Sync chip → sheet → retry enabled only when pending + online.
10. Offline (DevTools offline): a sale queues, status banner says queued, sync chip shows pending.
11. Keyboard: Esc closes any open sheet; Tab focus rings visible.
12. Narrow viewport (tablet portrait ~768px): products/cart stack, pill stays reachable.

- [ ] **Step 4: Commit any cleanup**

```bash
git add stackpilot/pages/CounterDashboard.tsx
git commit -m "chore(counter): remove dead code after Calm Counter refactor"
```

---

## Self-Review

**Spec coverage:**
- Two-column layout, 3-up products → Task 3. ✓
- Quiet top bar (money strip + summon) → Task 2. ✓
- Single Charge button → Task 3; Charge sheet method picker + Utang flow → Task 4. ✓
- Who-owes drawer + in-context bayad + floating pill → Task 5. ✓
- Cash drawer / Stock / Sync summon sheets, owner stats folded into cash drawer → Task 6. ✓
- Sheet/Drawer primitive, reduced-motion (via reused `animate-fade-in` + global CSS), Esc/focus → Task 1 + Task 7 Step 3. ✓
- Preserve handlers, offline queue, receipt flow, no API change → Global Constraints + every task reuses existing handlers. ✓

**Type consistency:** Overlay union `CounterOverlay` defined once in `CounterTopBar.tsx` (Task 2) and imported by `CounterDashboard`. Props types reference real exports from `utils/api` (`Customer`, `CustomerBalance`, `WhoOwesCustomer`, `CashSession`, `Product`, `StockMovementReason`) and `offline/syncQueue` (`SyncQueueSummary`) — all confirmed present in `CounterDashboard.tsx`'s existing imports.

**Placeholder scan:** No TODO/TBD; every code step shows complete component source or exact edits.

**Note for executor:** Tasks 3–6 carry temporarily-unused handlers between Task 3 and Task 6. `tsconfig.json` does not set `noUnusedLocals` (verified), so the build stays green throughout — no special handling needed.
