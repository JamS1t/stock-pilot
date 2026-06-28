-- Product search/filter procedure contract update.
-- Applies the backend signature used by backend/src/db/procedures/product.proc.ts.
--
-- Required behavior:
-- - GetProducts accepts supplier_id in addition to search/category/stock status.
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
  IN p_stock_status VARCHAR(32)
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
    AND (
      p_search IS NULL
      OR p_search = ''
      OR p.name LIKE CONCAT('%', p_search, '%')
      OR p.sku LIKE CONCAT('%', p_search, '%')
      OR p.barcode LIKE CONCAT('%', p_search, '%')
    )
    AND (p_category_id IS NULL OR p.category_id = p_category_id)
    AND (p_supplier_id IS NULL OR p.supplier_id = p_supplier_id)
    AND (
      p_stock_status IS NULL
      OR p_stock_status = ''
      OR (p_stock_status = 'Out of Stock' AND p.stock = 0)
      OR (p_stock_status = 'Low Stock' AND p.stock > 0 AND p.stock <= 10)
      OR (p_stock_status = 'In Stock' AND p.stock > 10)
    )
  ORDER BY p.name;
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
