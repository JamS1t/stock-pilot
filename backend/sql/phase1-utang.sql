-- =====================================================================
-- Phase 1 — Utang (customer credit) module
-- Target DB: MariaDB 11.4 (matches existing stockpilot schema)
-- Apply order: DDL first, then stored procedures.
-- Safe to re-run: all objects use IF NOT EXISTS / DROP IF EXISTS.
-- =====================================================================

-- Use InnoDB + utf8mb4_general_ci like the rest of the schema.
SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 1;

-- ---------------------------------------------------------------------
-- 1. Tables
-- ---------------------------------------------------------------------

-- 1.1 customers (suki profiles)
CREATE TABLE IF NOT EXISTS customers (
    customer_id int(11) NOT NULL AUTO_INCREMENT,
    store_id    int(11) NOT NULL,
    name        varchar(255) NOT NULL,
    phone       varchar(20)  DEFAULT NULL,
    photo_url   varchar(500) DEFAULT NULL,
    notes       text         DEFAULT NULL,
    created_at  datetime NOT NULL DEFAULT current_timestamp(),
    updated_at  datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
    deleted_at  datetime DEFAULT NULL,
    PRIMARY KEY (customer_id),
    KEY idx_customers_store       (store_id),
    KEY idx_customers_store_name  (store_id, name),
    KEY idx_customers_store_phone (store_id, phone),
    KEY idx_customers_deleted     (deleted_at),
    CONSTRAINT fk_customers_store
        FOREIGN KEY (store_id) REFERENCES stores (store_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- 1.2 utangentries (header)
CREATE TABLE IF NOT EXISTS utangentries (
    entry_id    int(11) NOT NULL AUTO_INCREMENT,
    store_id    int(11) NOT NULL,
    customer_id int(11) NOT NULL,
    amount      decimal(12,2) NOT NULL,
    note        varchar(500) DEFAULT NULL,
    source      enum('manual','voice','ocr') NOT NULL DEFAULT 'manual',
    created_by  int(11) DEFAULT NULL,
    created_at  datetime NOT NULL DEFAULT current_timestamp(),
    voided_at   datetime DEFAULT NULL,
    voided_by   int(11) DEFAULT NULL,
    PRIMARY KEY (entry_id),
    KEY idx_utangentries_store          (store_id),
    KEY idx_utangentries_customer       (store_id, customer_id, created_at),
    KEY idx_utangentries_created        (created_at),
    KEY idx_utangentries_created_by     (created_by),
    KEY idx_utangentries_voided_by      (voided_by),
    KEY idx_utangentries_store_voided   (store_id, voided_at),
    CONSTRAINT fk_utangentries_store
        FOREIGN KEY (store_id)    REFERENCES stores    (store_id)    ON DELETE CASCADE,
    CONSTRAINT fk_utangentries_customer
        FOREIGN KEY (customer_id) REFERENCES customers (customer_id),
    CONSTRAINT fk_utangentries_created_by
        FOREIGN KEY (created_by)  REFERENCES users     (user_id)     ON DELETE SET NULL,
    CONSTRAINT fk_utangentries_voided_by
        FOREIGN KEY (voided_by)   REFERENCES users     (user_id)     ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- 1.3 utangentryitems (line items for a given entry)
CREATE TABLE IF NOT EXISTS utangentryitems (
    entry_item_id int(11) NOT NULL AUTO_INCREMENT,
    entry_id      int(11) NOT NULL,
    store_id      int(11) NOT NULL,
    product_id    int(11) DEFAULT NULL,          -- nullable until Pro+ inventory linkage
    name          varchar(255) NOT NULL,          -- preserved even if product renamed/deleted
    quantity      decimal(10,3) NOT NULL DEFAULT 1.000, -- decimal supports "half kilo" etc.
    unit_price    decimal(12,2) DEFAULT NULL,
    line_total    decimal(12,2) DEFAULT NULL,
    created_at    datetime NOT NULL DEFAULT current_timestamp(),
    PRIMARY KEY (entry_item_id),
    KEY idx_utangentryitems_entry   (entry_id),
    KEY idx_utangentryitems_store   (store_id),
    KEY idx_utangentryitems_product (product_id),
    CONSTRAINT fk_utangentryitems_entry
        FOREIGN KEY (entry_id)   REFERENCES utangentries (entry_id)   ON DELETE CASCADE,
    CONSTRAINT fk_utangentryitems_store
        FOREIGN KEY (store_id)   REFERENCES stores       (store_id)   ON DELETE CASCADE,
    CONSTRAINT fk_utangentryitems_product
        FOREIGN KEY (product_id) REFERENCES products     (product_id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- 1.4 utangpayments
CREATE TABLE IF NOT EXISTS utangpayments (
    payment_id  int(11) NOT NULL AUTO_INCREMENT,
    store_id    int(11) NOT NULL,
    customer_id int(11) NOT NULL,
    amount      decimal(12,2) NOT NULL,
    method      enum('cash','gcash','other') NOT NULL DEFAULT 'cash',
    note        varchar(500) DEFAULT NULL,
    created_by  int(11) DEFAULT NULL,
    created_at  datetime NOT NULL DEFAULT current_timestamp(),
    voided_at   datetime DEFAULT NULL,
    voided_by   int(11) DEFAULT NULL,
    PRIMARY KEY (payment_id),
    KEY idx_utangpayments_store        (store_id),
    KEY idx_utangpayments_customer     (store_id, customer_id, created_at),
    KEY idx_utangpayments_created      (created_at),
    KEY idx_utangpayments_created_by   (created_by),
    KEY idx_utangpayments_voided_by    (voided_by),
    KEY idx_utangpayments_store_voided (store_id, voided_at),
    CONSTRAINT fk_utangpayments_store
        FOREIGN KEY (store_id)    REFERENCES stores    (store_id)    ON DELETE CASCADE,
    CONSTRAINT fk_utangpayments_customer
        FOREIGN KEY (customer_id) REFERENCES customers (customer_id),
    CONSTRAINT fk_utangpayments_created_by
        FOREIGN KEY (created_by)  REFERENCES users     (user_id)     ON DELETE SET NULL,
    CONSTRAINT fk_utangpayments_voided_by
        FOREIGN KEY (voided_by)   REFERENCES users     (user_id)     ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- =====================================================================
-- 2. Stored procedures
-- Naming mirrors existing: PascalCase, no sp_ prefix.
-- Every proc takes p_store_id as the first param for multi-tenant scoping.
-- Writes return `SELECT LAST_INSERT_ID() AS id;` or a status scalar.
-- Reads return a single `_json` column produced by JSON_ARRAYAGG/JSON_OBJECT.
-- =====================================================================

DELIMITER $$

-- ---------------------------------------------------------------------
-- 2.1 Customer CRUD
-- ---------------------------------------------------------------------

DROP PROCEDURE IF EXISTS CreateCustomer $$
CREATE PROCEDURE CreateCustomer(
    IN p_store_id  INT,
    IN p_name      VARCHAR(255),
    IN p_phone     VARCHAR(20),
    IN p_photo_url VARCHAR(500),
    IN p_notes     TEXT
)
BEGIN
    INSERT INTO customers (store_id, name, phone, photo_url, notes)
    VALUES (p_store_id, p_name, p_phone, p_photo_url, p_notes);

    SELECT LAST_INSERT_ID() AS id;
END $$

DROP PROCEDURE IF EXISTS UpdateCustomer $$
CREATE PROCEDURE UpdateCustomer(
    IN p_store_id    INT,
    IN p_customer_id INT,
    IN p_name        VARCHAR(255),
    IN p_phone       VARCHAR(20),
    IN p_photo_url   VARCHAR(500),
    IN p_notes       TEXT
)
BEGIN
    UPDATE customers
       SET name      = p_name,
           phone     = p_phone,
           photo_url = p_photo_url,
           notes     = p_notes
     WHERE customer_id = p_customer_id
       AND store_id    = p_store_id
       AND deleted_at IS NULL;

    SELECT ROW_COUNT() AS affected;
END $$

DROP PROCEDURE IF EXISTS DeleteCustomer $$
CREATE PROCEDURE DeleteCustomer(
    IN p_store_id    INT,
    IN p_customer_id INT
)
BEGIN
    -- Soft delete: preserves historical balance + audit.
    UPDATE customers
       SET deleted_at = NOW()
     WHERE customer_id = p_customer_id
       AND store_id    = p_store_id
       AND deleted_at IS NULL;

    SELECT ROW_COUNT() AS affected;
END $$

DROP PROCEDURE IF EXISTS GetCustomers $$
CREATE PROCEDURE GetCustomers(
    IN p_store_id    INT,
    IN p_customer_id INT,            -- NULL for list, value for single
    IN p_search      VARCHAR(255)    -- NULL or '' to skip
)
BEGIN
    SELECT
        JSON_ARRAYAGG(
            JSON_OBJECT(
                'customer_id', c.customer_id,
                'name',        c.name,
                'phone',       c.phone,
                'photo_url',   c.photo_url,
                'notes',       c.notes,
                'created_at',  c.created_at,
                'updated_at',  c.updated_at,
                'balance',     COALESCE(bal.balance, 0),
                'last_activity_at', bal.last_activity_at
            )
        ) AS customers_json
    FROM customers c
    LEFT JOIN (
        SELECT
            t.store_id,
            t.customer_id,
            SUM(t.delta) AS balance,
            MAX(t.ts)    AS last_activity_at
        FROM (
            SELECT store_id, customer_id, amount AS delta, created_at AS ts
              FROM utangentries
             WHERE store_id = p_store_id AND voided_at IS NULL
            UNION ALL
            SELECT store_id, customer_id, -amount AS delta, created_at AS ts
              FROM utangpayments
             WHERE store_id = p_store_id AND voided_at IS NULL
        ) t
        GROUP BY t.store_id, t.customer_id
    ) bal
      ON bal.store_id = c.store_id
     AND bal.customer_id = c.customer_id
    WHERE c.store_id = p_store_id
      AND c.deleted_at IS NULL
      AND (p_customer_id IS NULL OR c.customer_id = p_customer_id)
      AND (
            p_search IS NULL OR p_search = ''
            OR c.name  LIKE CONCAT('%', p_search, '%')
            OR c.phone LIKE CONCAT('%', p_search, '%')
          )
    ORDER BY c.name ASC;
END $$

-- ---------------------------------------------------------------------
-- 2.2 Utang entries
-- ---------------------------------------------------------------------

DROP PROCEDURE IF EXISTS CreateUtang $$
CREATE PROCEDURE CreateUtang(
    IN p_store_id    INT,
    IN p_customer_id INT,
    IN p_amount      DECIMAL(12,2),
    IN p_note        VARCHAR(500),
    IN p_source      VARCHAR(20),             -- 'manual' | 'voice' | 'ocr'
    IN p_created_by  INT,
    IN p_items_json  JSON                      -- optional: [{product_id,name,quantity,unit_price,line_total}, ...]
)
BEGIN
    DECLARE v_entry_id INT;
    DECLARE v_items_len INT DEFAULT 0;
    DECLARE v_idx INT DEFAULT 0;

    DECLARE v_product_id INT;
    DECLARE v_name       VARCHAR(255);
    DECLARE v_quantity   DECIMAL(10,3);
    DECLARE v_unit_price DECIMAL(12,2);
    DECLARE v_line_total DECIMAL(12,2);

    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;

    START TRANSACTION;

    INSERT INTO utangentries (
        store_id, customer_id, amount, note, source, created_by
    ) VALUES (
        p_store_id,
        p_customer_id,
        p_amount,
        p_note,
        COALESCE(p_source, 'manual'),
        p_created_by
    );

    SET v_entry_id = LAST_INSERT_ID();

    IF p_items_json IS NOT NULL AND JSON_TYPE(p_items_json) = 'ARRAY' THEN
        SET v_items_len = JSON_LENGTH(p_items_json);
    END IF;

    WHILE v_idx < v_items_len DO
        SET v_product_id = NULLIF(JSON_UNQUOTE(JSON_EXTRACT(p_items_json, CONCAT('$[', v_idx, '].product_id'))), 'null');
        SET v_name       = JSON_UNQUOTE(JSON_EXTRACT(p_items_json, CONCAT('$[', v_idx, '].name')));
        SET v_quantity   = COALESCE(CAST(JSON_UNQUOTE(JSON_EXTRACT(p_items_json, CONCAT('$[', v_idx, '].quantity'))) AS DECIMAL(10,3)), 1.000);
        SET v_unit_price = NULLIF(JSON_UNQUOTE(JSON_EXTRACT(p_items_json, CONCAT('$[', v_idx, '].unit_price'))), 'null');
        SET v_line_total = NULLIF(JSON_UNQUOTE(JSON_EXTRACT(p_items_json, CONCAT('$[', v_idx, '].line_total'))), 'null');

        INSERT INTO utangentryitems (
            entry_id, store_id, product_id, name, quantity, unit_price, line_total
        ) VALUES (
            v_entry_id,
            p_store_id,
            CAST(v_product_id AS SIGNED),
            v_name,
            v_quantity,
            CAST(v_unit_price AS DECIMAL(12,2)),
            CAST(v_line_total AS DECIMAL(12,2))
        );

        SET v_idx = v_idx + 1;
    END WHILE;

    COMMIT;

    SELECT v_entry_id AS id;
END $$

DROP PROCEDURE IF EXISTS ListUtang $$
CREATE PROCEDURE ListUtang(
    IN p_store_id    INT,
    IN p_customer_id INT,        -- NULL = all customers
    IN p_from        DATETIME,   -- NULL = no lower bound
    IN p_to          DATETIME    -- NULL = no upper bound
)
BEGIN
    SELECT
        JSON_ARRAYAGG(
            JSON_OBJECT(
                'entry_id',    e.entry_id,
                'customer_id', e.customer_id,
                'amount',      e.amount,
                'note',        e.note,
                'source',      e.source,
                'created_by',  e.created_by,
                'created_at',  e.created_at,
                'voided_at',   e.voided_at,
                'voided_by',   e.voided_by,
                'items',       (
                    SELECT JSON_ARRAYAGG(
                        JSON_OBJECT(
                            'entry_item_id', i.entry_item_id,
                            'product_id',    i.product_id,
                            'name',          i.name,
                            'quantity',      i.quantity,
                            'unit_price',    i.unit_price,
                            'line_total',    i.line_total
                        )
                    )
                    FROM utangentryitems i
                    WHERE i.entry_id = e.entry_id
                )
            )
        ) AS entries_json
    FROM utangentries e
    WHERE e.store_id = p_store_id
      AND (p_customer_id IS NULL OR e.customer_id = p_customer_id)
      AND (p_from IS NULL OR e.created_at >= p_from)
      AND (p_to   IS NULL OR e.created_at <  p_to)
    ORDER BY e.created_at DESC;
END $$

DROP PROCEDURE IF EXISTS VoidUtang $$
CREATE PROCEDURE VoidUtang(
    IN p_store_id  INT,
    IN p_entry_id  INT,
    IN p_voided_by INT
)
BEGIN
    UPDATE utangentries
       SET voided_at = NOW(),
           voided_by = p_voided_by
     WHERE entry_id  = p_entry_id
       AND store_id  = p_store_id
       AND voided_at IS NULL;

    SELECT ROW_COUNT() AS affected;
END $$

-- ---------------------------------------------------------------------
-- 2.3 Payments
-- ---------------------------------------------------------------------

DROP PROCEDURE IF EXISTS CreatePayment $$
CREATE PROCEDURE CreatePayment(
    IN p_store_id    INT,
    IN p_customer_id INT,
    IN p_amount      DECIMAL(12,2),
    IN p_method      VARCHAR(20),       -- 'cash' | 'gcash' | 'other'
    IN p_note        VARCHAR(500),
    IN p_created_by  INT
)
BEGIN
    INSERT INTO utangpayments (
        store_id, customer_id, amount, method, note, created_by
    ) VALUES (
        p_store_id,
        p_customer_id,
        p_amount,
        COALESCE(p_method, 'cash'),
        p_note,
        p_created_by
    );

    SELECT LAST_INSERT_ID() AS id;
END $$

DROP PROCEDURE IF EXISTS ListPayments $$
CREATE PROCEDURE ListPayments(
    IN p_store_id    INT,
    IN p_customer_id INT,
    IN p_from        DATETIME,
    IN p_to          DATETIME
)
BEGIN
    SELECT
        JSON_ARRAYAGG(
            JSON_OBJECT(
                'payment_id',  p.payment_id,
                'customer_id', p.customer_id,
                'amount',      p.amount,
                'method',      p.method,
                'note',        p.note,
                'created_by',  p.created_by,
                'created_at',  p.created_at,
                'voided_at',   p.voided_at,
                'voided_by',   p.voided_by
            )
        ) AS payments_json
    FROM utangpayments p
    WHERE p.store_id = p_store_id
      AND (p_customer_id IS NULL OR p.customer_id = p_customer_id)
      AND (p_from IS NULL OR p.created_at >= p_from)
      AND (p_to   IS NULL OR p.created_at <  p_to)
    ORDER BY p.created_at DESC;
END $$

DROP PROCEDURE IF EXISTS VoidPayment $$
CREATE PROCEDURE VoidPayment(
    IN p_store_id   INT,
    IN p_payment_id INT,
    IN p_voided_by  INT
)
BEGIN
    UPDATE utangpayments
       SET voided_at = NOW(),
           voided_by = p_voided_by
     WHERE payment_id = p_payment_id
       AND store_id   = p_store_id
       AND voided_at IS NULL;

    SELECT ROW_COUNT() AS affected;
END $$

-- ---------------------------------------------------------------------
-- 2.4 Balance helpers
-- ---------------------------------------------------------------------

DROP PROCEDURE IF EXISTS GetCustomerBalance $$
CREATE PROCEDURE GetCustomerBalance(
    IN p_store_id    INT,
    IN p_customer_id INT
)
BEGIN
    SELECT
        JSON_OBJECT(
            'customer_id',       CAST(p_customer_id AS SIGNED),
            'balance',           COALESCE(SUM(t.delta), 0),
            'last_activity_at',  MAX(t.ts)
        ) AS balance_json
    FROM (
        SELECT amount AS delta, created_at AS ts
          FROM utangentries
         WHERE store_id = p_store_id AND customer_id = p_customer_id AND voided_at IS NULL
        UNION ALL
        SELECT -amount AS delta, created_at AS ts
          FROM utangpayments
         WHERE store_id = p_store_id AND customer_id = p_customer_id AND voided_at IS NULL
    ) t;
END $$

DROP PROCEDURE IF EXISTS GetWhoOwes $$
CREATE PROCEDURE GetWhoOwes(
    IN p_store_id INT
)
BEGIN
    -- Returns every customer with positive balance, oldest-unpaid first.
    SELECT
        JSON_ARRAYAGG(
            JSON_OBJECT(
                'customer_id',      c.customer_id,
                'name',             c.name,
                'phone',            c.phone,
                'photo_url',        c.photo_url,
                'balance',          bal.balance,
                'last_activity_at', bal.last_activity_at,
                'oldest_unpaid_at', bal.oldest_unpaid_at
            )
        ) AS who_owes_json
    FROM customers c
    INNER JOIN (
        SELECT
            t.store_id,
            t.customer_id,
            SUM(t.delta) AS balance,
            MAX(t.ts)    AS last_activity_at,
            MIN(CASE WHEN t.delta > 0 THEN t.ts END) AS oldest_unpaid_at
        FROM (
            SELECT store_id, customer_id, amount AS delta, created_at AS ts
              FROM utangentries
             WHERE store_id = p_store_id AND voided_at IS NULL
            UNION ALL
            SELECT store_id, customer_id, -amount AS delta, created_at AS ts
              FROM utangpayments
             WHERE store_id = p_store_id AND voided_at IS NULL
        ) t
        GROUP BY t.store_id, t.customer_id
        HAVING SUM(t.delta) > 0
    ) bal
      ON bal.store_id    = c.store_id
     AND bal.customer_id = c.customer_id
    WHERE c.store_id   = p_store_id
      AND c.deleted_at IS NULL
    ORDER BY bal.oldest_unpaid_at ASC;
END $$

DELIMITER ;

-- =====================================================================
-- End of Phase 1 utang DDL + stored procs.
-- =====================================================================
