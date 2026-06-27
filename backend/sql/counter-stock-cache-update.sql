-- Keep cached products.stock in sync with accepted stock movements.
-- Apply after backend/sql/counter-cash-stock.sql.

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
    DECLARE v_movement_id INT;

    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;

    START TRANSACTION;

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

    SET v_movement_id = LAST_INSERT_ID();

    IF ROW_COUNT() = 1 THEN
        UPDATE products
           SET stock = stock + p_quantity_delta
         WHERE store_id = p_store_id
           AND product_id = p_product_id;
    END IF;

    COMMIT;

    SELECT v_movement_id AS id;
END $$

DELIMITER ;
