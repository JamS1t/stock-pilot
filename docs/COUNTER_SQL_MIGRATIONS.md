# Counter AI SQL Migration Order

Apply these SQL files in order against the target StockPilot database.

1. `backend/sql/phase1-utang.sql`
   - Adds customers, utang entries/items, payments, and ledger procedures.

2. `backend/sql/counter-cash-stock.sql`
   - Adds stock movements, cash sessions, and their initial procedures.

3. `backend/sql/counter-ledger-idempotency.sql`
   - Adds mutation metadata to utang entries and payments.
   - Replaces `CreateUtang` and `CreatePayment` with idempotent versions.

4. `backend/sql/counter-order-idempotency.sql`
   - Adds mutation metadata to orders.
   - Replaces `ProcessOrderPOS` with an idempotent version.
   - Assumes the order line-item table is named `orderitems`; verify this before applying.

5. `backend/sql/counter-stock-cache-update.sql`
   - Replaces `CreateStockMovement`.
   - Updates cached `products.stock` only when a movement is newly accepted.

6. `backend/sql/ai-receipt-foundation.sql`
   - Adds `ai_calls` and `LogAiCall` for draft-only AI receipt extraction.

## Smoke Test After Apply

- Log in and create a cash sale.
- Repeat the same `/api/orders/process` payload with the same `client_mutation_id`; confirm only one order and one stock deduction.
- Create an utang entry and payment with fixed `client_mutation_id` values; retry each and confirm balances do not duplicate.
- Create a stock movement with a fixed `client_mutation_id`; retry it and confirm `products.stock` changes once.
- Open and close a cash session.
- Call `POST /api/ai/receipt/extract`; confirm it returns a draft and inserts one `ai_calls` row.

## Current Caveats

- Cash sessions are online-only in the UI.
- Offline queue records remain in IndexedDB as `synced` after successful retry; there is no pruning policy yet.
- The AI receipt endpoint is intentionally a stub until a provider is configured.
