-- Production-readiness report procedures.
-- Uses orders.created_at for date filtering and paid orders for sales metrics.

DROP PROCEDURE IF EXISTS GetReportBestSellers;
DROP PROCEDURE IF EXISTS GetReportProfitBreakdown;
DROP PROCEDURE IF EXISTS GetReportPaymentSplit;
DROP PROCEDURE IF EXISTS GetReportLowStockSellingFast;
DROP PROCEDURE IF EXISTS GetReportDeadStock;
DROP PROCEDURE IF EXISTS GetReportPreviousPeriodComparison;

DELIMITER //

CREATE PROCEDURE GetReportBestSellers(
  IN p_store_id INT,
  IN p_start_utc DATETIME,
  IN p_end_utc DATETIME,
  IN p_category_id INT,
  IN p_product_id INT,
  IN p_limit INT
)
BEGIN
  DECLARE v_limit INT DEFAULT 10;
  SET v_limit = IF(p_limit IS NULL OR p_limit < 1, 10, p_limit);

  SELECT COALESCE(JSON_ARRAYAGG(
    JSON_OBJECT(
      'product_id', product_id,
      'product_name', product_name,
      'category_id', category_id,
      'category_name', category_name,
      'quantity_sold', quantity_sold,
      'total_revenue', total_revenue,
      'total_profit', total_profit,
      'current_stock', current_stock
    )
  ), JSON_ARRAY()) AS best_sellers_json
  FROM (
    SELECT
      p.product_id,
      p.name AS product_name,
      p.category_id,
      c.name AS category_name,
      CAST(SUM(oi.quantity) AS DECIMAL(12,3)) AS quantity_sold,
      CAST(SUM(oi.price * oi.quantity) AS DECIMAL(12,2)) AS total_revenue,
      CAST(SUM((oi.price - COALESCE(p.unit_price, 0)) * oi.quantity) AS DECIMAL(12,2)) AS total_profit,
      p.stock AS current_stock
    FROM orders o
    JOIN orderitems oi
      ON oi.order_id = o.order_id
    JOIN products p
      ON p.product_id = oi.product_id
     AND p.store_id = o.store_id
    LEFT JOIN categories c
      ON c.category_id = p.category_id
     AND c.store_id = p.store_id
    WHERE o.store_id = p_store_id
      AND o.status = 'paid'
      AND o.created_at >= p_start_utc
      AND o.created_at < p_end_utc
      AND (p_category_id IS NULL OR p.category_id = p_category_id)
      AND (p_product_id IS NULL OR p.product_id = p_product_id)
    GROUP BY p.product_id, p.name, p.category_id, c.name, p.stock
    ORDER BY quantity_sold DESC, total_revenue DESC, p.name ASC
    LIMIT v_limit
  ) ranked;
END//

CREATE PROCEDURE GetReportProfitBreakdown(
  IN p_store_id INT,
  IN p_start_utc DATETIME,
  IN p_end_utc DATETIME,
  IN p_category_id INT,
  IN p_product_id INT,
  IN p_limit INT
)
BEGIN
  DECLARE v_limit INT DEFAULT 50;
  SET v_limit = IF(p_limit IS NULL OR p_limit < 1, 50, p_limit);

  SELECT COALESCE(JSON_ARRAYAGG(
    JSON_OBJECT(
      'product_id', product_id,
      'product_name', product_name,
      'category_id', category_id,
      'category_name', category_name,
      'quantity_sold', quantity_sold,
      'total_revenue', total_revenue,
      'total_cost', total_cost,
      'total_profit', total_profit,
      'profit_margin', profit_margin,
      'current_stock', current_stock
    )
  ), JSON_ARRAY()) AS profit_breakdown_json
  FROM (
    SELECT
      product_id,
      product_name,
      category_id,
      category_name,
      quantity_sold,
      total_revenue,
      total_cost,
      total_profit,
      CASE
        WHEN total_revenue = 0 THEN 0
        ELSE CAST((total_profit / total_revenue) * 100 AS DECIMAL(12,2))
      END AS profit_margin,
      current_stock
    FROM (
      SELECT
        p.product_id,
        p.name AS product_name,
        p.category_id,
        c.name AS category_name,
        CAST(SUM(oi.quantity) AS DECIMAL(12,3)) AS quantity_sold,
        CAST(SUM(oi.price * oi.quantity) AS DECIMAL(12,2)) AS total_revenue,
        CAST(SUM(COALESCE(p.unit_price, 0) * oi.quantity) AS DECIMAL(12,2)) AS total_cost,
        CAST(SUM((oi.price - COALESCE(p.unit_price, 0)) * oi.quantity) AS DECIMAL(12,2)) AS total_profit,
        p.stock AS current_stock
      FROM orders o
      JOIN orderitems oi
        ON oi.order_id = o.order_id
      JOIN products p
        ON p.product_id = oi.product_id
       AND p.store_id = o.store_id
      LEFT JOIN categories c
        ON c.category_id = p.category_id
       AND c.store_id = p.store_id
      WHERE o.store_id = p_store_id
        AND o.status = 'paid'
        AND o.created_at >= p_start_utc
        AND o.created_at < p_end_utc
        AND (p_category_id IS NULL OR p.category_id = p_category_id)
        AND (p_product_id IS NULL OR p.product_id = p_product_id)
      GROUP BY p.product_id, p.name, p.category_id, c.name, p.stock
    ) totals
    ORDER BY total_profit DESC, total_revenue DESC, product_name ASC
    LIMIT v_limit
  ) ranked;
END//

CREATE PROCEDURE GetReportPaymentSplit(
  IN p_store_id INT,
  IN p_start_utc DATETIME,
  IN p_end_utc DATETIME,
  IN p_category_id INT,
  IN p_product_id INT
)
BEGIN
  WITH scoped_lines AS (
    SELECT
      o.order_id,
      LOWER(COALESCE(o.payment_method, 'unknown')) AS payment_method,
      oi.price * oi.quantity AS line_revenue
    FROM orders o
    JOIN orderitems oi
      ON oi.order_id = o.order_id
    JOIN products p
      ON p.product_id = oi.product_id
     AND p.store_id = o.store_id
    WHERE o.store_id = p_store_id
      AND o.status = 'paid'
      AND o.created_at >= p_start_utc
      AND o.created_at < p_end_utc
      AND (p_category_id IS NULL OR p.category_id = p_category_id)
      AND (p_product_id IS NULL OR p.product_id = p_product_id)
  ),
  grouped AS (
    SELECT
      payment_method,
      COUNT(DISTINCT order_id) AS order_count,
      CAST(SUM(line_revenue) AS DECIMAL(12,2)) AS total_revenue
    FROM scoped_lines
    GROUP BY payment_method
  ),
  total AS (
    SELECT COALESCE(SUM(total_revenue), 0) AS grand_total
    FROM grouped
  )
  SELECT COALESCE(JSON_ARRAYAGG(
    JSON_OBJECT(
      'method', payment_method,
      'order_count', order_count,
      'total_revenue', total_revenue,
      'share_percent',
        CASE
          WHEN grand_total = 0 THEN 0
          ELSE CAST((total_revenue / grand_total) * 100 AS DECIMAL(12,2))
        END
    )
  ), JSON_ARRAY()) AS payment_split_json
  FROM (
    SELECT g.*, t.grand_total
    FROM grouped g
    CROSS JOIN total t
    ORDER BY g.total_revenue DESC, g.payment_method ASC
  ) ranked;
END//

CREATE PROCEDURE GetReportLowStockSellingFast(
  IN p_store_id INT,
  IN p_start_utc DATETIME,
  IN p_end_utc DATETIME,
  IN p_category_id INT,
  IN p_product_id INT,
  IN p_low_stock_threshold INT,
  IN p_limit INT
)
BEGIN
  DECLARE v_limit INT DEFAULT 10;
  DECLARE v_threshold INT DEFAULT 10;
  DECLARE v_days DECIMAL(12,4) DEFAULT 1;

  SET v_limit = IF(p_limit IS NULL OR p_limit < 1, 10, p_limit);
  SET v_threshold = IF(p_low_stock_threshold IS NULL OR p_low_stock_threshold < 0, 10, p_low_stock_threshold);
  SET v_days = GREATEST(TIMESTAMPDIFF(SECOND, p_start_utc, p_end_utc) / 86400, 1);

  SELECT COALESCE(JSON_ARRAYAGG(
    JSON_OBJECT(
      'product_id', product_id,
      'product_name', product_name,
      'category_id', category_id,
      'category_name', category_name,
      'current_stock', current_stock,
      'quantity_sold', quantity_sold,
      'avg_daily_quantity', avg_daily_quantity,
      'days_to_stockout', days_to_stockout,
      'total_revenue', total_revenue
    )
  ), JSON_ARRAY()) AS low_stock_selling_fast_json
  FROM (
    SELECT
      p.product_id,
      p.name AS product_name,
      p.category_id,
      c.name AS category_name,
      p.stock AS current_stock,
      CAST(SUM(oi.quantity) AS DECIMAL(12,3)) AS quantity_sold,
      CAST(SUM(oi.quantity) / v_days AS DECIMAL(12,3)) AS avg_daily_quantity,
      CASE
        WHEN SUM(oi.quantity) <= 0 THEN NULL
        ELSE CAST(p.stock / (SUM(oi.quantity) / v_days) AS DECIMAL(12,2))
      END AS days_to_stockout,
      CAST(SUM(oi.price * oi.quantity) AS DECIMAL(12,2)) AS total_revenue
    FROM products p
    JOIN orderitems oi
      ON oi.product_id = p.product_id
    JOIN orders o
      ON o.order_id = oi.order_id
     AND o.store_id = p.store_id
    LEFT JOIN categories c
      ON c.category_id = p.category_id
     AND c.store_id = p.store_id
    WHERE p.store_id = p_store_id
      AND p.stock <= v_threshold
      AND o.status = 'paid'
      AND o.created_at >= p_start_utc
      AND o.created_at < p_end_utc
      AND (p_category_id IS NULL OR p.category_id = p_category_id)
      AND (p_product_id IS NULL OR p.product_id = p_product_id)
    GROUP BY p.product_id, p.name, p.category_id, c.name, p.stock
    HAVING quantity_sold > 0
    ORDER BY quantity_sold DESC, days_to_stockout ASC, product_name ASC
    LIMIT v_limit
  ) ranked;
END//

CREATE PROCEDURE GetReportDeadStock(
  IN p_store_id INT,
  IN p_start_utc DATETIME,
  IN p_end_utc DATETIME,
  IN p_category_id INT,
  IN p_product_id INT,
  IN p_limit INT
)
BEGIN
  DECLARE v_limit INT DEFAULT 10;
  SET v_limit = IF(p_limit IS NULL OR p_limit < 1, 10, p_limit);

  SELECT COALESCE(JSON_ARRAYAGG(
    JSON_OBJECT(
      'product_id', product_id,
      'product_name', product_name,
      'category_id', category_id,
      'category_name', category_name,
      'current_stock', current_stock,
      'unit_cost', unit_cost,
      'inventory_value', inventory_value,
      'last_sold_at', last_sold_at,
      'days_since_last_sale', days_since_last_sale
    )
  ), JSON_ARRAY()) AS dead_stock_json
  FROM (
    SELECT
      p.product_id,
      p.name AS product_name,
      p.category_id,
      c.name AS category_name,
      p.stock AS current_stock,
      COALESCE(p.unit_price, 0) AS unit_cost,
      CAST(p.stock * COALESCE(p.unit_price, 0) AS DECIMAL(12,2)) AS inventory_value,
      (
        SELECT MAX(o2.created_at)
        FROM orders o2
        JOIN orderitems oi2
          ON oi2.order_id = o2.order_id
        WHERE o2.store_id = p.store_id
          AND o2.status = 'paid'
          AND oi2.product_id = p.product_id
          AND o2.created_at < p_end_utc
      ) AS last_sold_at,
      CASE
        WHEN (
          SELECT MAX(o3.created_at)
          FROM orders o3
          JOIN orderitems oi3
            ON oi3.order_id = o3.order_id
          WHERE o3.store_id = p.store_id
            AND o3.status = 'paid'
            AND oi3.product_id = p.product_id
            AND o3.created_at < p_end_utc
        ) IS NULL THEN NULL
        ELSE TIMESTAMPDIFF(DAY, (
          SELECT MAX(o4.created_at)
          FROM orders o4
          JOIN orderitems oi4
            ON oi4.order_id = o4.order_id
          WHERE o4.store_id = p.store_id
            AND o4.status = 'paid'
            AND oi4.product_id = p.product_id
            AND o4.created_at < p_end_utc
        ), p_end_utc)
      END AS days_since_last_sale
    FROM products p
    LEFT JOIN categories c
      ON c.category_id = p.category_id
     AND c.store_id = p.store_id
    WHERE p.store_id = p_store_id
      AND p.stock > 0
      AND (p_category_id IS NULL OR p.category_id = p_category_id)
      AND (p_product_id IS NULL OR p.product_id = p_product_id)
      AND NOT EXISTS (
        SELECT 1
        FROM orders o
        JOIN orderitems oi
          ON oi.order_id = o.order_id
        WHERE o.store_id = p.store_id
          AND o.status = 'paid'
          AND o.created_at >= p_start_utc
          AND o.created_at < p_end_utc
          AND oi.product_id = p.product_id
      )
    ORDER BY last_sold_at IS NULL DESC, inventory_value DESC, p.name ASC
    LIMIT v_limit
  ) ranked;
END//

CREATE PROCEDURE GetReportPreviousPeriodComparison(
  IN p_store_id INT,
  IN p_start_utc DATETIME,
  IN p_end_utc DATETIME,
  IN p_previous_start_utc DATETIME,
  IN p_previous_end_utc DATETIME,
  IN p_category_id INT,
  IN p_product_id INT
)
BEGIN
  WITH scoped_lines AS (
    SELECT
      'current' AS period_key,
      o.order_id,
      oi.quantity,
      oi.price * oi.quantity AS line_revenue,
      (oi.price - COALESCE(p.unit_price, 0)) * oi.quantity AS line_profit
    FROM orders o
    JOIN orderitems oi
      ON oi.order_id = o.order_id
    JOIN products p
      ON p.product_id = oi.product_id
     AND p.store_id = o.store_id
    WHERE o.store_id = p_store_id
      AND o.status = 'paid'
      AND o.created_at >= p_start_utc
      AND o.created_at < p_end_utc
      AND (p_category_id IS NULL OR p.category_id = p_category_id)
      AND (p_product_id IS NULL OR p.product_id = p_product_id)
    UNION ALL
    SELECT
      'previous' AS period_key,
      o.order_id,
      oi.quantity,
      oi.price * oi.quantity AS line_revenue,
      (oi.price - COALESCE(p.unit_price, 0)) * oi.quantity AS line_profit
    FROM orders o
    JOIN orderitems oi
      ON oi.order_id = o.order_id
    JOIN products p
      ON p.product_id = oi.product_id
     AND p.store_id = o.store_id
    WHERE o.store_id = p_store_id
      AND o.status = 'paid'
      AND o.created_at >= p_previous_start_utc
      AND o.created_at < p_previous_end_utc
      AND (p_category_id IS NULL OR p.category_id = p_category_id)
      AND (p_product_id IS NULL OR p.product_id = p_product_id)
  ),
  summary AS (
    SELECT
      period_key,
      COUNT(DISTINCT order_id) AS total_sales,
      CAST(COALESCE(SUM(quantity), 0) AS DECIMAL(12,3)) AS total_items_sold,
      CAST(COALESCE(SUM(line_revenue), 0) AS DECIMAL(12,2)) AS total_revenue,
      CAST(COALESCE(SUM(line_profit), 0) AS DECIMAL(12,2)) AS total_profit
    FROM scoped_lines
    GROUP BY period_key
  ),
  shaped AS (
    SELECT
      COALESCE(MAX(CASE WHEN period_key = 'current' THEN total_sales END), 0) AS current_sales,
      COALESCE(MAX(CASE WHEN period_key = 'current' THEN total_items_sold END), 0) AS current_items,
      COALESCE(MAX(CASE WHEN period_key = 'current' THEN total_revenue END), 0) AS current_revenue,
      COALESCE(MAX(CASE WHEN period_key = 'current' THEN total_profit END), 0) AS current_profit,
      COALESCE(MAX(CASE WHEN period_key = 'previous' THEN total_sales END), 0) AS previous_sales,
      COALESCE(MAX(CASE WHEN period_key = 'previous' THEN total_items_sold END), 0) AS previous_items,
      COALESCE(MAX(CASE WHEN period_key = 'previous' THEN total_revenue END), 0) AS previous_revenue,
      COALESCE(MAX(CASE WHEN period_key = 'previous' THEN total_profit END), 0) AS previous_profit
    FROM summary
  )
  SELECT JSON_OBJECT(
    'current', JSON_OBJECT(
      'start_date', p_start_utc,
      'end_date', p_end_utc,
      'total_sales', current_sales,
      'total_items_sold', current_items,
      'total_revenue', current_revenue,
      'total_profit', current_profit
    ),
    'previous', JSON_OBJECT(
      'start_date', p_previous_start_utc,
      'end_date', p_previous_end_utc,
      'total_sales', previous_sales,
      'total_items_sold', previous_items,
      'total_revenue', previous_revenue,
      'total_profit', previous_profit
    ),
    'change', JSON_OBJECT(
      'sales_delta', current_sales - previous_sales,
      'items_sold_delta', current_items - previous_items,
      'revenue_delta', current_revenue - previous_revenue,
      'profit_delta', current_profit - previous_profit,
      'sales_percent',
        CASE WHEN previous_sales = 0 THEN NULL ELSE CAST(((current_sales - previous_sales) / previous_sales) * 100 AS DECIMAL(12,2)) END,
      'items_sold_percent',
        CASE WHEN previous_items = 0 THEN NULL ELSE CAST(((current_items - previous_items) / previous_items) * 100 AS DECIMAL(12,2)) END,
      'revenue_percent',
        CASE WHEN previous_revenue = 0 THEN NULL ELSE CAST(((current_revenue - previous_revenue) / previous_revenue) * 100 AS DECIMAL(12,2)) END,
      'profit_percent',
        CASE WHEN previous_profit = 0 THEN NULL ELSE CAST(((current_profit - previous_profit) / previous_profit) * 100 AS DECIMAL(12,2)) END
    )
  ) AS comparison_json
  FROM shaped;
END//

DELIMITER ;
