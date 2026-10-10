-- ============================================================
--  Skema database Cloudflare D1 (SQLite) untuk temp-mail
-- ============================================================
-- Jalankan sekali saat setup:
--   npx wrangler d1 execute temp_mail_db --remote --file=./schema.sql
-- (ganti --remote dengan --local untuk testing lokal)

-- Tabel alamat email sementara yang dibuat user
CREATE TABLE IF NOT EXISTS addresses (
  id        INTEGER PRIMARY KEY AUTOINCREMENT,
  email     TEXT NOT NULL UNIQUE,
  username  TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_addresses_email ON addresses(email);

-- Tabel email masuk
CREATE TABLE IF NOT EXISTS emails (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  address_email TEXT NOT NULL,
  sender        TEXT NOT NULL,
  subject       TEXT,
  body          TEXT,
  html_body     TEXT,
  received_at   TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_emails_address ON emails(address_email);
CREATE INDEX IF NOT EXISTS idx_emails_received ON emails(received_at);
