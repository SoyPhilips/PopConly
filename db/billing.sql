-- Módulo 4 — Suscripciones y Pagos (MySQL)
-- Ejecutar en Oracle/local cuando toque (mysql < db/billing.sql).
-- La app funciona sin esta base (modo visual); se activa sola con MYSQL_URL.

CREATE TABLE IF NOT EXISTS plans (
  code VARCHAR(32) PRIMARY KEY,
  name VARCHAR(64) NOT NULL,
  price_cents INT NOT NULL,
  currency VARCHAR(8) NOT NULL DEFAULT 'COP',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT IGNORE INTO plans (code, name, price_cents) VALUES
  ('essential', 'Pop Essential', 19900),
  ('plus',      'Pop Plus',      36900),
  ('ultra',     'Pop Ultra',     52900);

CREATE TABLE IF NOT EXISTS subscriptions (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(64) NOT NULL,
  plan_code VARCHAR(32) NOT NULL,
  status ENUM('pending','active','past_due','cancelled') NOT NULL DEFAULT 'pending',
  wompi_reference VARCHAR(128) NULL,
  wompi_transaction_id VARCHAR(128) NULL,
  current_period_start DATETIME NULL,
  current_period_end DATETIME NULL,
  pay_method VARCHAR(16) NULL,
  pay_brand VARCHAR(32) NULL,
  pay_last4 VARCHAR(8) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_sub_user (user_id),
  INDEX idx_sub_status (status),
  CONSTRAINT fk_sub_plan FOREIGN KEY (plan_code) REFERENCES plans(code)
);

CREATE TABLE IF NOT EXISTS payments (
  id VARCHAR(36) PRIMARY KEY,
  subscription_id VARCHAR(36) NULL,
  user_id VARCHAR(64) NOT NULL,
  amount_cents INT NOT NULL,
  currency VARCHAR(8) NOT NULL DEFAULT 'COP',
  status VARCHAR(32) NOT NULL DEFAULT 'pending',
  wompi_id VARCHAR(128) NULL,
  raw_json JSON NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_pay_user (user_id),
  INDEX idx_pay_wompi (wompi_id),
  CONSTRAINT fk_pay_sub FOREIGN KEY (subscription_id) REFERENCES subscriptions(id) ON DELETE SET NULL
);
