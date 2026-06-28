-- ============================================================
-- Sample Counter data seed (local/dev only)
-- Target store_id = 10 (James Carl Sitsit -> jamescarlsitsit@gmail.com),
-- created_by = 11. Creates its own seed categories + products so the
-- counter is usable on your own login.
--
-- Idempotent: tagged rows are removed before re-insert. Also clears any
-- earlier seed that lived on store 9. Seed markers:
--   categories.name  ends with ' (seed)'
--   products.sku     LIKE 'SEED-%'
--   customers.notes  = '[seed]'
--   utang/payments/movements.client_mutation_id LIKE 'seed-%'
--   cash_sessions    opened_at = '2026-06-26 08:00:00'
-- ============================================================
SET @uid := 11;

-- ---- Remove any previous seed on BOTH stores (children first) ----
DELETE FROM utangentryitems
  WHERE entry_id IN (SELECT entry_id FROM utangentries WHERE client_mutation_id LIKE 'seed-%');
DELETE FROM utangpayments  WHERE client_mutation_id LIKE 'seed-%';
DELETE FROM utangentries   WHERE client_mutation_id LIKE 'seed-%';
DELETE FROM stock_movements WHERE client_mutation_id LIKE 'seed-%';
DELETE FROM cash_sessions   WHERE opened_at = '2026-06-26 08:00:00';
DELETE FROM customers       WHERE notes = '[seed]';
DELETE FROM products        WHERE store_id = 10 AND sku LIKE 'SEED-%';
DELETE FROM categories      WHERE store_id = 10 AND name LIKE '% (seed)';

-- ---- Seed categories (store 10) ----
INSERT INTO categories (store_id, name, created_at)
  VALUES (10, 'Beverages (seed)', '2026-06-19 08:00:00');
SET @c_bev := LAST_INSERT_ID();
INSERT INTO categories (store_id, name, created_at)
  VALUES (10, 'Snacks (seed)', '2026-06-19 08:00:00');
SET @c_snack := LAST_INSERT_ID();

-- ---- Seed products (store 10) ----
INSERT INTO products (store_id, name, sku, unit_price, selling_price, stock, category_id, created_at)
  VALUES (10, 'Sting Energy Drink', 'SEED-STING', 15.00, 20.00, 100, @c_bev, '2026-06-19 08:10:00');
SET @p_sting := LAST_INSERT_ID();
INSERT INTO products (store_id, name, sku, unit_price, selling_price, stock, category_id, created_at)
  VALUES (10, 'Sky Flakes 101', 'SEED-SKY', 11.00, 15.00, 60, @c_snack, '2026-06-19 08:11:00');
SET @p_sky := LAST_INSERT_ID();
INSERT INTO products (store_id, name, sku, unit_price, selling_price, stock, category_id, created_at)
  VALUES (10, 'Fita', 'SEED-FITA', 7.00, 10.00, 114, @c_snack, '2026-06-19 08:12:00');
SET @p_fita := LAST_INSERT_ID();

-- ---- Suki (customers) ----
INSERT INTO customers (store_id, name, phone, notes, created_at)
  VALUES (10, 'Aling Nena', '0917-555-0101', '[seed]', '2026-06-20 09:15:00');
SET @nena := LAST_INSERT_ID();
INSERT INTO customers (store_id, name, phone, notes, created_at)
  VALUES (10, 'Mang Tonyo', '0917-555-0102', '[seed]', '2026-06-21 14:40:00');
SET @tonyo := LAST_INSERT_ID();
INSERT INTO customers (store_id, name, phone, notes, created_at)
  VALUES (10, 'Inday Rosa', '0917-555-0103', '[seed]', '2026-06-22 11:05:00');
SET @rosa := LAST_INSERT_ID();

-- ---- Utang entries + line items ----
-- Aling Nena: ₱240 across two entries, ₱100 bayad -> balance ₱140
INSERT INTO utangentries (store_id, customer_id, amount, note, source, created_by, created_at, client_mutation_id)
  VALUES (10, @nena, 150.00, 'Grocery utang', 'manual', @uid, '2026-06-23 17:30:00', 'seed-nena-1');
SET @e_nena1 := LAST_INSERT_ID();
INSERT INTO utangentryitems (entry_id, store_id, product_id, name, quantity, unit_price, line_total)
  VALUES (@e_nena1, 10, @p_sting, 'Sting Energy Drink', 5, 20.00, 100.00),
         (@e_nena1, 10, @p_fita,  'Fita',               5, 10.00,  50.00);

INSERT INTO utangentries (store_id, customer_id, amount, note, source, created_by, created_at, client_mutation_id)
  VALUES (10, @nena, 90.00, 'Snacks', 'manual', @uid, '2026-06-25 10:10:00', 'seed-nena-2');
SET @e_nena2 := LAST_INSERT_ID();
INSERT INTO utangentryitems (entry_id, store_id, product_id, name, quantity, unit_price, line_total)
  VALUES (@e_nena2, 10, @p_sky, 'Sky Flakes 101', 6, 15.00, 90.00);

-- Mang Tonyo: ₱75, no bayad -> balance ₱75
INSERT INTO utangentries (store_id, customer_id, amount, note, source, created_by, created_at, client_mutation_id)
  VALUES (10, @tonyo, 75.00, 'Pang-merienda', 'manual', @uid, '2026-06-24 16:00:00', 'seed-tonyo-1');
SET @e_tonyo1 := LAST_INSERT_ID();
INSERT INTO utangentryitems (entry_id, store_id, product_id, name, quantity, unit_price, line_total)
  VALUES (@e_tonyo1, 10, @p_sting, 'Sting Energy Drink', 1, 20.00, 20.00),
         (@e_tonyo1, 10, @p_fita,  'Fita',               2, 10.00, 20.00),
         (@e_tonyo1, 10, @p_sky,   'Sky Flakes 101',     1, 15.00, 15.00),
         (@e_tonyo1, 10, @p_sky,   'Sky Flakes 101',     1, 15.00, 15.00);
-- (Inday Rosa: suki with no open utang yet.)

-- ---- Bayad (payment) ----
INSERT INTO utangpayments (store_id, customer_id, amount, method, note, created_by, created_at, client_mutation_id)
  VALUES (10, @nena, 100.00, 'cash', 'Partial bayad', @uid, '2026-06-26 09:45:00', 'seed-pay-nena-1');

-- ---- Cash session (closed, small shortfall) ----
INSERT INTO cash_sessions
  (store_id, opened_by, closed_by, opened_at, closed_at, opening_cash, expected_cash, actual_cash, difference, status)
  VALUES (10, @uid, @uid, '2026-06-26 08:00:00', '2026-06-26 20:00:00',
          1000.00, 3420.00, 3400.00, -20.00, 'closed');

-- ---- Stock movement ledger (historical; matches the stock set above) ----
INSERT INTO stock_movements (store_id, product_id, quantity_delta, reason, source_type, note, created_by, created_at, client_mutation_id) VALUES
  (10, @p_sting, 120, 'stock_in',  'supplier_delivery',  'Initial restock', @uid, '2026-06-20 08:30:00', 'seed-mv-1'),
  (10, @p_fita,  144, 'stock_in',  'supplier_delivery',  'Case of Fita',    @uid, '2026-06-20 08:35:00', 'seed-mv-2'),
  (10, @p_sting, -20, 'sale',      'counter_sale',       NULL,              @uid, '2026-06-24 12:00:00', 'seed-mv-3'),
  (10, @p_fita,  -30, 'sale',      'counter_sale',       NULL,              @uid, '2026-06-24 15:30:00', 'seed-mv-4'),
  (10, @p_sky,   -2,  'damage',    'counter_adjustment', 'Crushed packs',   @uid, '2026-06-25 18:10:00', 'seed-mv-5'),
  (10, @p_fita,  -1,  'owner_use', 'counter_adjustment', 'Owner merienda',  @uid, '2026-06-26 10:00:00', 'seed-mv-6');
