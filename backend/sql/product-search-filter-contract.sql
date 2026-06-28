-- Product search/filter procedure contract update.
-- Applies the backend signature used by backend/src/db/procedures/product.proc.ts.
--
-- Required behavior:
-- - GetProducts accepts supplier_id, no-barcode, sort, and pagination inputs.
-- - Search matches product name, SKU, and barcode.
-- - POS search returns active in-stock products by name, SKU, or barcode.

DROP PROCEDURE IF EXISTS GetProducts;
DROP PROCEDURE IF EXISTS SearchProductsPOS;

DELIMITER //

CREATE PROCEDURE GetProducts(
  IN p_store_id INT,
  IN p_search VARCHAR(255),
  IN p_category_id INT,
  IN p_supplier_id INT,
  IN p_stock_status VARCHAR(32),
  IN p_no_barcode_only BOOLEAN,
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

  SELECT COUNT(*)
    INTO v_total
  FROM products p
  LEFT JOIN categories c
    ON c.category_id = p.category_id
   AND c.store_id = p.store_id
  LEFT JOIN suppliers s
    ON s.supplier_id = p.supplier_id
   AND s.store_id = p.store_id
  WHERE p.store_id = p_store_id
    AND (
      p_search IS NULL
      OR p_search = ''
      OR p.name LIKE CONCAT('%', p_search, '%')
      OR p.sku LIKE CONCAT('%', p_search, '%')
      OR p.barcode LIKE CONCAT('%', p_search, '%')
    )
    AND (p_category_id IS NULL OR p.category_id = p_category_id)
    AND (p_supplier_id IS NULL OR p.supplier_id = p_supplier_id)
    AND (p_no_barcode_only IS NULL OR p_no_barcode_only = FALSE OR p.barcode IS NULL OR p.barcode = '')
    AND (
      p_stock_status IS NULL
      OR p_stock_status = ''
      OR (p_stock_status = 'Out of Stock' AND p.stock = 0)
      OR (p_stock_status = 'Low Stock' AND p.stock > 0 AND p.stock <= 10)
      OR (p_stock_status = 'In Stock' AND p.stock > 10)
    );

  SELECT JSON_ARRAYAGG(
    JSON_OBJECT(
      'product_id', product_id,
      'store_id', store_id,
      'name', name,
      'sku', sku,
      'unit_price', unit_price,
      'selling_price', selling_price,
      'stock', stock,
      'category_id', category_id,
      'category_name', category_name,
      'supplier_id', supplier_id,
      'supplier_name', supplier_name,
      'barcode', barcode,
      'stock_status', stock_status
    )
  ) AS products_json,
  v_total AS total_count
  FROM (
    SELECT
      p.product_id,
      p.store_id,
      p.name,
      p.sku,
      p.unit_price,
      p.selling_price,
      p.stock,
      p.category_id,
      c.name AS category_name,
      p.supplier_id,
      s.name AS supplier_name,
      p.barcode,
      CASE
        WHEN p.stock = 0 THEN 'Out of Stock'
        WHEN p.stock <= 10 THEN 'Low Stock'
        ELSE 'In Stock'
      END AS stock_status
    FROM products p
    LEFT JOIN categories c
      ON c.category_id = p.category_id
     AND c.store_id = p.store_id
    LEFT JOIN suppliers s
      ON s.supplier_id = p.supplier_id
     AND s.store_id = p.store_id
    WHERE p.store_id = p_store_id
      AND (
        p_search IS NULL
        OR p_search = ''
        OR p.name LIKE CONCAT('%', p_search, '%')
        OR p.sku LIKE CONCAT('%', p_search, '%')
        OR p.barcode LIKE CONCAT('%', p_search, '%')
      )
      AND (p_category_id IS NULL OR p.category_id = p_category_id)
      AND (p_supplier_id IS NULL OR p.supplier_id = p_supplier_id)
      AND (p_no_barcode_only IS NULL OR p_no_barcode_only = FALSE OR p.barcode IS NULL OR p.barcode = '')
      AND (
        p_stock_status IS NULL
        OR p_stock_status = ''
        OR (p_stock_status = 'Out of Stock' AND p.stock = 0)
        OR (p_stock_status = 'Low Stock' AND p.stock > 0 AND p.stock <= 10)
        OR (p_stock_status = 'In Stock' AND p.stock > 10)
      )
    ORDER BY
      CASE WHEN p_sort_by = 'name' AND p_sort_dir = 'asc' THEN p.name END ASC,
      CASE WHEN p_sort_by = 'name' AND p_sort_dir = 'desc' THEN p.name END DESC,
      CASE WHEN p_sort_by = 'category' AND p_sort_dir = 'asc' THEN c.name END ASC,
      CASE WHEN p_sort_by = 'category' AND p_sort_dir = 'desc' THEN c.name END DESC,
      CASE WHEN p_sort_by = 'sku' AND p_sort_dir = 'asc' THEN p.sku END ASC,
      CASE WHEN p_sort_by = 'sku' AND p_sort_dir = 'desc' THEN p.sku END DESC,
      CASE WHEN p_sort_by = 'barcode' AND p_sort_dir = 'asc' THEN p.barcode END ASC,
      CASE WHEN p_sort_by = 'barcode' AND p_sort_dir = 'desc' THEN p.barcode END DESC,
      CASE WHEN p_sort_by = 'selling_price' AND p_sort_dir = 'asc' THEN p.selling_price END ASC,
      CASE WHEN p_sort_by = 'selling_price' AND p_sort_dir = 'desc' THEN p.selling_price END DESC,
      CASE WHEN p_sort_by = 'stock' AND p_sort_dir = 'asc' THEN p.stock END ASC,
      CASE WHEN p_sort_by = 'stock' AND p_sort_dir = 'desc' THEN p.stock END DESC,
      CASE WHEN p_sort_by = 'stock_status' AND p_sort_dir = 'asc' THEN
        CASE
          WHEN p.stock = 0 THEN 'Out of Stock'
          WHEN p.stock <= 10 THEN 'Low Stock'
          ELSE 'In Stock'
        END
      END ASC,
      CASE WHEN p_sort_by = 'stock_status' AND p_sort_dir = 'desc' THEN
        CASE
          WHEN p.stock = 0 THEN 'Out of Stock'
          WHEN p.stock <= 10 THEN 'Low Stock'
          ELSE 'In Stock'
        END
      END DESC,
      p.name ASC
    LIMIT v_limit OFFSET v_offset
  ) product_page;
END//

CREATE PROCEDURE SearchProductsPOS(
  IN p_store_id INT,
  IN p_search VARCHAR(255),
  IN p_category_id INT,
  IN p_stock_scope VARCHAR(32)
)
BEGIN
  SELECT JSON_ARRAYAGG(
    JSON_OBJECT(
      'product_id', p.product_id,
      'store_id', p.store_id,
      'name', p.name,
      'sku', p.sku,
      'unit_price', p.unit_price,
      'selling_price', p.selling_price,
      'stock', p.stock,
      'category_id', p.category_id,
      'category_name', c.name,
      'supplier_id', p.supplier_id,
      'supplier_name', s.name,
      'barcode', p.barcode,
      'stock_status',
        CASE
          WHEN p.stock = 0 THEN 'Out of Stock'
          WHEN p.stock <= 10 THEN 'Low Stock'
          ELSE 'In Stock'
        END
    )
  ) AS products_json
  FROM products p
  LEFT JOIN categories c
    ON c.category_id = p.category_id
   AND c.store_id = p.store_id
  LEFT JOIN suppliers s
    ON s.supplier_id = p.supplier_id
   AND s.store_id = p.store_id
  WHERE p.store_id = p_store_id
    AND p.stock > 0
    AND (
      p.name LIKE CONCAT('%', p_search, '%')
      OR p.sku LIKE CONCAT('%', p_search, '%')
      OR p.barcode LIKE CONCAT('%', p_search, '%')
    )
    AND (p_category_id IS NULL OR p.category_id = p_category_id)
  ORDER BY
    CASE WHEN p.barcode = p_search THEN 0 ELSE 1 END,
    p.name
  LIMIT 50;
END//

DELIMITER ;
