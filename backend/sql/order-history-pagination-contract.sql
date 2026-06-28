-- Order history pagination/sorting procedure contract update.
-- Applies the backend signature used by backend/src/db/procedures/order.proc.ts.
--
-- Required behavior:
-- - id mode returns one invoice_json object for receipt rendering.
-- - list mode accepts search, payment method, date range, sort, and pagination.
-- - total_count reflects the full filtered list before LIMIT/OFFSET.

DROP PROCEDURE IF EXISTS GetOrderHistory;

DELIMITER //

CREATE PROCEDURE GetOrderHistory(
  IN p_store_id INT,
  IN p_order_id INT,
  IN p_search VARCHAR(255),
  IN p_payment_method VARCHAR(32),
  IN p_date_from VARCHAR(10),
  IN p_date_to VARCHAR(10),
  IN p_sort_by VARCHAR(32),
  IN p_sort_dir VARCHAR(4),
  IN p_limit INT,
  IN p_offset INT
)
BEGIN
  DECLARE v_total INT DEFAULT 0;
  DECLARE v_limit INT DEFAULT 1000000;
  DECLARE v_offset INT DEFAULT 0;

  SET v_limit = IF(p_limit IS NULL OR p_limit < 1, 1000000, p_limit);
  SET v_offset = IF(p_offset IS NULL OR p_offset < 0, 0, p_offset);

  IF p_order_id IS NOT NULL THEN
    SELECT JSON_OBJECT(
      'header', JSON_OBJECT(
        'invoice_number', o.order_id,
        'date', o.created_at
      ),
      'items', COALESCE(
        (
          SELECT JSON_ARRAYAGG(
            JSON_OBJECT(
              'item', oi.name,
              'qty', oi.quantity,
              'price', oi.price,
              'total', oi.price * oi.quantity
            )
          )
          FROM orderitems oi
          WHERE oi.order_id = o.order_id
        ),
        JSON_ARRAY()
      ),
      'totals', JSON_OBJECT(
        'subtotal', o.sub_total,
        'discount', COALESCE(o.discount_amount, o.discount, 0),
        'total', o.total
      )
    ) AS invoice_json
    FROM orders o
    WHERE o.store_id = p_store_id
      AND o.order_id = p_order_id
    LIMIT 1;
  ELSE
    SELECT COUNT(*)
      INTO v_total
    FROM orders o
    WHERE o.store_id = p_store_id
      AND (p_payment_method IS NULL OR p_payment_method = '' OR LOWER(o.payment_method) = p_payment_method)
      AND (p_date_from IS NULL OR p_date_from = '' OR o.created_at >= STR_TO_DATE(p_date_from, '%Y-%m-%d'))
      AND (p_date_to IS NULL OR p_date_to = '' OR o.created_at < DATE_ADD(STR_TO_DATE(p_date_to, '%Y-%m-%d'), INTERVAL 1 DAY))
      AND (
        p_search IS NULL
        OR p_search = ''
        OR CAST(o.order_id AS CHAR) LIKE CONCAT('%', p_search, '%')
        OR EXISTS (
          SELECT 1
          FROM orderitems oi
          WHERE oi.order_id = o.order_id
            AND oi.name LIKE CONCAT('%', p_search, '%')
        )
      );

    SELECT JSON_ARRAYAGG(
      JSON_OBJECT(
        'order_id', order_id,
        'order_date', order_date,
        'sub_total', sub_total,
        'discount', discount,
        'total', total,
        'status', status,
        'payment_method', payment_method,
        'items', items
      )
    ) AS orders_json,
    v_total AS total_count
    FROM (
      SELECT
        o.order_id,
        o.created_at AS order_date,
        o.sub_total,
        COALESCE(o.discount_amount, o.discount, 0) AS discount,
        o.total,
        o.status,
        o.payment_method,
        COUNT(oi_count.order_id) AS item_count,
        COALESCE(
          (
            SELECT JSON_ARRAYAGG(
              JSON_OBJECT(
                'product', oi.name,
                'qty', oi.quantity,
                'price', oi.price,
                'total', oi.price * oi.quantity
              )
            )
            FROM orderitems oi
            WHERE oi.order_id = o.order_id
          ),
          JSON_ARRAY()
        ) AS items
      FROM orders o
      LEFT JOIN orderitems oi_count
        ON oi_count.order_id = o.order_id
      WHERE o.store_id = p_store_id
        AND (p_payment_method IS NULL OR p_payment_method = '' OR LOWER(o.payment_method) = p_payment_method)
        AND (p_date_from IS NULL OR p_date_from = '' OR o.created_at >= STR_TO_DATE(p_date_from, '%Y-%m-%d'))
        AND (p_date_to IS NULL OR p_date_to = '' OR o.created_at < DATE_ADD(STR_TO_DATE(p_date_to, '%Y-%m-%d'), INTERVAL 1 DAY))
        AND (
          p_search IS NULL
          OR p_search = ''
          OR CAST(o.order_id AS CHAR) LIKE CONCAT('%', p_search, '%')
          OR EXISTS (
            SELECT 1
            FROM orderitems oi_search
            WHERE oi_search.order_id = o.order_id
              AND oi_search.name LIKE CONCAT('%', p_search, '%')
          )
        )
      GROUP BY
        o.order_id,
        o.created_at,
        o.sub_total,
        o.discount_amount,
        o.discount,
        o.total,
        o.status,
        o.payment_method
      ORDER BY
        CASE WHEN p_sort_by = 'order_id' AND p_sort_dir = 'asc' THEN o.order_id END ASC,
        CASE WHEN p_sort_by = 'order_id' AND p_sort_dir = 'desc' THEN o.order_id END DESC,
        CASE WHEN p_sort_by = 'order_date' AND p_sort_dir = 'asc' THEN o.created_at END ASC,
        CASE WHEN p_sort_by = 'order_date' AND p_sort_dir = 'desc' THEN o.created_at END DESC,
        CASE WHEN p_sort_by = 'items' AND p_sort_dir = 'asc' THEN COUNT(oi_count.order_id) END ASC,
        CASE WHEN p_sort_by = 'items' AND p_sort_dir = 'desc' THEN COUNT(oi_count.order_id) END DESC,
        CASE WHEN p_sort_by = 'total' AND p_sort_dir = 'asc' THEN o.total END ASC,
        CASE WHEN p_sort_by = 'total' AND p_sort_dir = 'desc' THEN o.total END DESC,
        CASE WHEN p_sort_by = 'payment' AND p_sort_dir = 'asc' THEN o.payment_method END ASC,
        CASE WHEN p_sort_by = 'payment' AND p_sort_dir = 'desc' THEN o.payment_method END DESC,
        o.created_at DESC,
        o.order_id DESC
      LIMIT v_limit OFFSET v_offset
    ) order_page;
  END IF;
END//

DELIMITER ;
