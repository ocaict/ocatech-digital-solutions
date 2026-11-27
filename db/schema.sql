CREATE TABLE IF NOT EXISTS leads (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  type TEXT NOT NULL,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  course TEXT,
  service TEXT,
  mode TEXT,
  start_pref TEXT,
  message TEXT,
  source_page TEXT,
  status TEXT NOT NULL DEFAULT 'new',
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  referrer TEXT
);

-- Migration for existing databases:
-- ALTER TABLE leads ADD COLUMN utm_source TEXT;
-- ALTER TABLE leads ADD COLUMN utm_medium TEXT;
-- ALTER TABLE leads ADD COLUMN utm_campaign TEXT;
-- ALTER TABLE leads ADD COLUMN referrer TEXT;

CREATE TABLE IF NOT EXISTS usage (
  day TEXT NOT NULL,
  kind TEXT NOT NULL,
  ip_hash TEXT NOT NULL,
  count INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (day, kind, ip_hash)
);

CREATE TABLE IF NOT EXISTS events (
  day TEXT NOT NULL,
  event TEXT NOT NULL,
  page TEXT NOT NULL DEFAULT '/',
  count INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (day, event, page)
);

CREATE TABLE IF NOT EXISTS certificates (
  code TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  course TEXT NOT NULL,
  issued_on TEXT NOT NULL,
  revoked INTEGER NOT NULL DEFAULT 0
);
