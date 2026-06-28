-- Offline retry idempotency for utang entries and payments.
-- Apply after backend/sql/phase1-utang.sql.

ALTER TABLE utangentries
    ADD COLUMN IF NOT EXISTS client_mutation_id varchar(100) DEFAULT NULL,
    ADD COLUMN IF NOT EXISTS device_id varchar(100) DEFAULT NULL,
    ADD COLUMN IF NOT EXISTS local_id varchar(100) DEFAULT NULL;

ALTER TABLE utangpayments
    ADD COLUMN IF NOT EXISTS client_mutation_id varchar(100) DEFAULT NULL,
    ADD COLUMN IF NOT EXISTS device_id varchar(100) DEFAULT NULL,
    ADD COLUMN IF NOT EXISTS local_id varchar(100) DEFAULT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS uq_utangentries_store_mutation
    ON utangentries (store_id, client_mutation_id);

CREATE UNIQUE INDEX IF NOT EXISTS uq_utangpayments_store_mutation
    ON utangpayments (store_id, client_mutation_id);

DELIMITER $$

DROP PROCEDURE IF EXISTS CreateUtang $$
CREATE PROCEDURE CreateUtang(
    IN p_store_id    INT,
    IN p_customer_id INT,
    IN p_amount      DECIMAL(12,2),
    IN p_note        VARCHAR(500),
    IN p_source      VARCHAR(20),
    IN p_created_by  INT,
    IN p_items_json  JSON,
    IN p_client_mutation_id VARCHAR(100),
    IN p_device_id VARCHAR(100),
    IN p_local_id VARCHAR(100)
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
        store_id,
        customer_id,
        amount,
        note,
        source,
        created_by,
        client_mutation_id,
        device_id,
        local_id
    ) VALUES (
        p_store_id,
        p_customer_id,
        p_amount,
        p_note,
        COALESCE(p_source, 'manual'),
        p_created_by,
        p_client_mutation_id,
        p_device_id,
        p_local_id
    )
    ON DUPLICATE KEY UPDATE entry_id = LAST_INSERT_ID(entry_id);

    SET v_entry_id = LAST_INSERT_ID();

    IF ROW_COUNT() = 1 THEN
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
    END IF;

    COMMIT;

    SELECT v_entry_id AS id;
END $$

DROP PROCEDURE IF EXISTS CreatePayment $$
CREATE PROCEDURE CreatePayment(
    IN p_store_id    INT,
    IN p_customer_id INT,
    IN p_amount      DECIMAL(12,2),
    IN p_method      VARCHAR(20),
    IN p_note        VARCHAR(500),
    IN p_created_by  INT,
    IN p_client_mutation_id VARCHAR(100),
    IN p_device_id VARCHAR(100),
    IN p_local_id VARCHAR(100)
)
BEGIN
    INSERT INTO utangpayments (
        store_id,
        customer_id,
        amount,
        method,
        note,
        created_by,
        client_mutation_id,
        device_id,
        local_id
    ) VALUES (
        p_store_id,
        p_customer_id,
        p_amount,
        COALESCE(p_method, 'cash'),
        p_note,
        p_created_by,
        p_client_mutation_id,
        p_device_id,
        p_local_id
    )
    ON DUPLICATE KEY UPDATE payment_id = LAST_INSERT_ID(payment_id);

    SELECT LAST_INSERT_ID() AS id;
END $$

DELIMITER ;
