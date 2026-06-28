-- Store settings, role management support, and audit log foundation.

CREATE TABLE IF NOT EXISTS store_settings (
  store_id INT NOT NULL PRIMARY KEY,
  receipt_name VARCHAR(255) DEFAULT NULL,
  receipt_address VARCHAR(500) DEFAULT NULL,
  receipt_phone VARCHAR(100) DEFAULT NULL,
  receipt_footer VARCHAR(500) DEFAULT NULL,
  tax_enabled TINYINT(1) NOT NULL DEFAULT 0,
  tax_rate DECIMAL(8,4) NOT NULL DEFAULT 0,
  tax_label VARCHAR(64) NOT NULL DEFAULT 'Tax',
  require_cash_session TINYINT(1) NOT NULL DEFAULT 0,
  allow_negative_stock TINYINT(1) NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_store_settings_store
    FOREIGN KEY (store_id) REFERENCES stores (store_id)
    ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS audit_logs (
  audit_log_id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  store_id INT NOT NULL,
  user_id INT DEFAULT NULL,
  action VARCHAR(80) NOT NULL,
  entity_type VARCHAR(80) NOT NULL,
  entity_id VARCHAR(80) DEFAULT NULL,
  metadata JSON DEFAULT NULL,
  ip_address VARCHAR(64) DEFAULT NULL,
  user_agent VARCHAR(500) DEFAULT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_audit_logs_store_created (store_id, created_at),
  KEY idx_audit_logs_entity (store_id, entity_type, entity_id),
  KEY idx_audit_logs_user (store_id, user_id, created_at),
  CONSTRAINT fk_audit_logs_store
    FOREIGN KEY (store_id) REFERENCES stores (store_id)
    ON DELETE CASCADE,
  CONSTRAINT fk_audit_logs_user
    FOREIGN KEY (user_id) REFERENCES users (user_id)
    ON DELETE SET NULL
);
