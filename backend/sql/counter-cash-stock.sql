-- Counter AI stock movements and cash sessions.
-- Apply after the base store/user/product schema.

CREATE TABLE IF NOT EXISTS stock_movements (
    movement_id int(11) NOT NULL AUTO_INCREMENT,
    store_id int(11) NOT NULL,
    product_id int(11) NOT NULL,
    quantity_delta decimal(10,3) NOT NULL,
    reason varchar(30) NOT NULL,
    source_type varchar(50) DEFAULT NULL,
    source_id int(11) DEFAULT NULL,
    note varchar(500) DEFAULT NULL,
    created_by int(11) DEFAULT NULL,
    created_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
    client_mutation_id varchar(100) DEFAULT NULL,
    PRIMARY KEY (movement_id),
    KEY idx_stock_movements_store_created (store_id, created_at),
    KEY idx_stock_movements_product (store_id, product_id, created_at),
    UNIQUE KEY uq_stock_movements_mutation (store_id, client_mutation_id),
    CONSTRAINT fk_stock_movements_store
        FOREIGN KEY (store_id) REFERENCES stores (store_id),
    CONSTRAINT fk_stock_movements_product
        FOREIGN KEY (product_id) REFERENCES products (product_id),
    CONSTRAINT fk_stock_movements_created_by
        FOREIGN KEY (created_by) REFERENCES users (user_id)
);

CREATE TABLE IF NOT EXISTS cash_sessions (
    cash_session_id int(11) NOT NULL AUTO_INCREMENT,
    store_id int(11) NOT NULL,
    opened_by int(11) DEFAULT NULL,
    closed_by int(11) DEFAULT NULL,
    opened_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
    closed_at timestamp NULL DEFAULT NULL,
    opening_cash decimal(12,2) NOT NULL DEFAULT 0.00,
    expected_cash decimal(12,2) DEFAULT NULL,
    actual_cash decimal(12,2) DEFAULT NULL,
    difference decimal(12,2) DEFAULT NULL,
    status varchar(20) NOT NULL DEFAULT 'open',
    PRIMARY KEY (cash_session_id),
    KEY idx_cash_sessions_store_status (store_id, status, opened_at),
    CONSTRAINT fk_cash_sessions_store
        FOREIGN KEY (store_id) REFERENCES stores (store_id),
    CONSTRAINT fk_cash_sessions_opened_by
        FOREIGN KEY (opened_by) REFERENCES users (user_id),
    CONSTRAINT fk_cash_sessions_closed_by
        FOREIGN KEY (closed_by) REFERENCES users (user_id)
);

DELIMITER $$

DROP PROCEDURE IF EXISTS CreateStockMovement $$
CREATE PROCEDURE CreateStockMovement(
    IN p_store_id INT,
    IN p_product_id INT,
    IN p_quantity_delta DECIMAL(10,3),
    IN p_reason VARCHAR(30),
    IN p_source_type VARCHAR(50),
    IN p_source_id INT,
    IN p_note VARCHAR(500),
    IN p_created_by INT,
    IN p_client_mutation_id VARCHAR(100)
)
BEGIN
    INSERT INTO stock_movements (
        store_id,
        product_id,
        quantity_delta,
        reason,
        source_type,
        source_id,
        note,
        created_by,
        client_mutation_id
    ) VALUES (
        p_store_id,
        p_product_id,
        p_quantity_delta,
        p_reason,
        p_source_type,
        p_source_id,
        p_note,
        p_created_by,
        p_client_mutation_id
    )
    ON DUPLICATE KEY UPDATE movement_id = LAST_INSERT_ID(movement_id);

    SELECT LAST_INSERT_ID() AS id;
END $$

DROP PROCEDURE IF EXISTS ListStockMovements $$
CREATE PROCEDURE ListStockMovements(
    IN p_store_id INT,
    IN p_product_id INT,
    IN p_from DATETIME,
    IN p_to DATETIME
)
BEGIN
    SELECT
        JSON_ARRAYAGG(
            JSON_OBJECT(
                'movement_id', movement_id,
                'product_id', product_id,
                'quantity_delta', quantity_delta,
                'reason', reason,
                'source_type', source_type,
                'source_id', source_id,
                'note', note,
                'created_by', created_by,
                'created_at', created_at,
                'client_mutation_id', client_mutation_id
            )
        ) AS movements_json
    FROM stock_movements
    WHERE store_id = p_store_id
      AND (p_product_id IS NULL OR product_id = p_product_id)
      AND (p_from IS NULL OR created_at >= p_from)
      AND (p_to IS NULL OR created_at < p_to)
    ORDER BY created_at DESC;
END $$

DROP PROCEDURE IF EXISTS OpenCashSession $$
CREATE PROCEDURE OpenCashSession(
    IN p_store_id INT,
    IN p_opening_cash DECIMAL(12,2),
    IN p_opened_by INT
)
BEGIN
    INSERT INTO cash_sessions (store_id, opening_cash, opened_by, status)
    VALUES (p_store_id, p_opening_cash, p_opened_by, 'open');

    SELECT LAST_INSERT_ID() AS id;
END $$

DROP PROCEDURE IF EXISTS CloseCashSession $$
CREATE PROCEDURE CloseCashSession(
    IN p_store_id INT,
    IN p_cash_session_id INT,
    IN p_expected_cash DECIMAL(12,2),
    IN p_actual_cash DECIMAL(12,2),
    IN p_closed_by INT
)
BEGIN
    UPDATE cash_sessions
       SET expected_cash = p_expected_cash,
           actual_cash = p_actual_cash,
           difference = p_actual_cash - p_expected_cash,
           closed_by = p_closed_by,
           closed_at = NOW(),
           status = 'closed'
     WHERE cash_session_id = p_cash_session_id
       AND store_id = p_store_id
       AND status = 'open';

    SELECT ROW_COUNT() AS affected;
END $$

DROP PROCEDURE IF EXISTS GetCashSessions $$
CREATE PROCEDURE GetCashSessions(
    IN p_store_id INT,
    IN p_status VARCHAR(20)
)
BEGIN
    SELECT
        JSON_ARRAYAGG(
            JSON_OBJECT(
                'cash_session_id', cash_session_id,
                'opened_by', opened_by,
                'closed_by', closed_by,
                'opened_at', opened_at,
                'closed_at', closed_at,
                'opening_cash', opening_cash,
                'expected_cash', expected_cash,
                'actual_cash', actual_cash,
                'difference', difference,
                'status', status
            )
        ) AS cash_sessions_json
    FROM cash_sessions
    WHERE store_id = p_store_id
      AND (p_status IS NULL OR status = p_status)
    ORDER BY opened_at DESC;
END $$

DROP PROCEDURE IF EXISTS GetOpenCashSession $$
CREATE PROCEDURE GetOpenCashSession(
    IN p_store_id INT
)
BEGIN
    SELECT
        JSON_OBJECT(
            'cash_session_id', cash_session_id,
            'opened_by', opened_by,
            'opened_at', opened_at,
            'opening_cash', opening_cash,
            'status', status
        ) AS cash_session_json
    FROM cash_sessions
    WHERE store_id = p_store_id
      AND status = 'open'
    ORDER BY opened_at DESC
    LIMIT 1;
END $$

DELIMITER ;
