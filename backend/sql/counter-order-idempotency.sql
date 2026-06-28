-- Offline retry idempotency for POS/counter sales.
-- Apply after the existing orders/orderitems schema and ProcessOrderPOS proc.
--
-- This migration assumes the existing order item table is named `orderitems`,
-- matching the repo's historical naming convention. If production uses a
-- different line-item table name, adjust the two INSERT statements below.

ALTER TABLE orders
    ADD COLUMN IF NOT EXISTS client_mutation_id varchar(100) DEFAULT NULL,
    ADD COLUMN IF NOT EXISTS device_id varchar(100) DEFAULT NULL,
    ADD COLUMN IF NOT EXISTS local_id varchar(100) DEFAULT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS uq_orders_store_mutation
    ON orders (store_id, client_mutation_id);

DELIMITER $$

DROP PROCEDURE IF EXISTS ProcessOrderPOS $$
CREATE PROCEDURE ProcessOrderPOS(
    IN p_store_id INT,
    IN p_payload JSON
)
BEGIN
    DECLARE v_order_id INT;
    DECLARE v_items_len INT DEFAULT 0;
    DECLARE v_idx INT DEFAULT 0;

    DECLARE v_product_id INT;
    DECLARE v_name VARCHAR(255);
    DECLARE v_price DECIMAL(12,2);
    DECLARE v_quantity DECIMAL(10,3);
    DECLARE v_category_id INT;
    DECLARE v_client_mutation_id VARCHAR(100);
    DECLARE v_device_id VARCHAR(100);
    DECLARE v_local_id VARCHAR(100);

    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;

    SET v_client_mutation_id = NULLIF(JSON_UNQUOTE(JSON_EXTRACT(p_payload, '$.client_mutation_id')), 'null');
    SET v_device_id = NULLIF(JSON_UNQUOTE(JSON_EXTRACT(p_payload, '$.device_id')), 'null');
    SET v_local_id = NULLIF(JSON_UNQUOTE(JSON_EXTRACT(p_payload, '$.local_id')), 'null');

    START TRANSACTION;

    INSERT INTO orders (
        store_id,
        sub_total,
        tax,
        total,
        discount,
        discount_amount,
        discount_type,
        payment_method,
        status,
        client_mutation_id,
        device_id,
        local_id
    ) VALUES (
        p_store_id,
        CAST(JSON_UNQUOTE(JSON_EXTRACT(p_payload, '$.sub_total')) AS DECIMAL(12,2)),
        CAST(COALESCE(JSON_UNQUOTE(JSON_EXTRACT(p_payload, '$.tax')), '0') AS DECIMAL(12,2)),
        CAST(JSON_UNQUOTE(JSON_EXTRACT(p_payload, '$.total')) AS DECIMAL(12,2)),
        CAST(COALESCE(JSON_UNQUOTE(JSON_EXTRACT(p_payload, '$.discount')), '0') AS DECIMAL(12,2)),
        CAST(COALESCE(JSON_UNQUOTE(JSON_EXTRACT(p_payload, '$.discount_amount')), '0') AS DECIMAL(12,2)),
        NULLIF(JSON_UNQUOTE(JSON_EXTRACT(p_payload, '$.discount_type')), 'null'),
        JSON_UNQUOTE(JSON_EXTRACT(p_payload, '$.payment_method')),
        'paid',
        v_client_mutation_id,
        v_device_id,
        v_local_id
    )
    ON DUPLICATE KEY UPDATE order_id = LAST_INSERT_ID(order_id);

    SET v_order_id = LAST_INSERT_ID();

    IF ROW_COUNT() = 1 THEN
        IF JSON_EXTRACT(p_payload, '$.items') IS NOT NULL
           AND JSON_TYPE(JSON_EXTRACT(p_payload, '$.items')) = 'ARRAY' THEN
            SET v_items_len = JSON_LENGTH(JSON_EXTRACT(p_payload, '$.items'));
        END IF;

        WHILE v_idx < v_items_len DO
            SET v_product_id = CAST(JSON_UNQUOTE(JSON_EXTRACT(p_payload, CONCAT('$.items[', v_idx, '].product_id'))) AS SIGNED);
            SET v_name = JSON_UNQUOTE(JSON_EXTRACT(p_payload, CONCAT('$.items[', v_idx, '].name')));
            SET v_price = CAST(JSON_UNQUOTE(JSON_EXTRACT(p_payload, CONCAT('$.items[', v_idx, '].price'))) AS DECIMAL(12,2));
            SET v_quantity = CAST(JSON_UNQUOTE(JSON_EXTRACT(p_payload, CONCAT('$.items[', v_idx, '].quantity'))) AS DECIMAL(10,3));
            SET v_category_id = CAST(JSON_UNQUOTE(JSON_EXTRACT(p_payload, CONCAT('$.items[', v_idx, '].category_id'))) AS SIGNED);

            INSERT INTO orderitems (
                order_id,
                product_id,
                name,
                price,
                quantity,
                category_id
            ) VALUES (
                v_order_id,
                v_product_id,
                v_name,
                v_price,
                v_quantity,
                v_category_id
            );

            UPDATE products
               SET stock = stock - v_quantity
             WHERE store_id = p_store_id
               AND product_id = v_product_id;

            INSERT INTO stock_movements (
                store_id,
                product_id,
                quantity_delta,
                reason,
                source_type,
                source_id,
                note,
                client_mutation_id
            ) VALUES (
                p_store_id,
                v_product_id,
                -v_quantity,
                'sale',
                'order',
                v_order_id,
                'Counter sale',
                CASE
                    WHEN v_client_mutation_id IS NULL THEN NULL
                    ELSE CONCAT(v_client_mutation_id, ':', v_product_id)
                END
            )
            ON DUPLICATE KEY UPDATE movement_id = LAST_INSERT_ID(movement_id);

            SET v_idx = v_idx + 1;
        END WHILE;
    END IF;

    COMMIT;

    SELECT v_order_id AS order_id;
END $$

DELIMITER ;
