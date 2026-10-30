-- Run this entire file in your Supabase SQL editor before first deploy

-- ─── Announcements ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS announcements (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  ticker          TEXT NOT NULL,
  exchange        TEXT DEFAULT 'NSE',
  title           TEXT,
  category        TEXT DEFAULT 'unclassified',
  summary         TEXT,
  priority        INT  DEFAULT 9,
  is_material     BOOL DEFAULT FALSE,
  attachment_url  TEXT,
  enrichment      JSONB,
  ann_timestamp   TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (ticker, attachment_url)
);
CREATE INDEX IF NOT EXISTS idx_ann_ticker    ON announcements (ticker);
CREATE INDEX IF NOT EXISTS idx_ann_ts        ON announcements (ann_timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_ann_category  ON announcements (category);
CREATE INDEX IF NOT EXISTS idx_ann_material  ON announcements (is_material);

-- ─── Price Alerts ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS price_alerts (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  ticker      TEXT NOT NULL,
  alert_type  TEXT,
  value       FLOAT,
  direction   TEXT,
  severity    TEXT,
  message     TEXT,
  alert_date  DATE DEFAULT CURRENT_DATE,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (ticker, alert_type, alert_date)
);
CREATE INDEX IF NOT EXISTS idx_alert_ticker ON price_alerts (ticker);
CREATE INDEX IF NOT EXISTS idx_alert_date   ON price_alerts (alert_date DESC);

-- ─── Documents (chunks for research) ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS documents (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  ticker      TEXT NOT NULL,
  doc_type    TEXT NOT NULL,    -- annual_report | concall_transcript | screener_financials
  label       TEXT,
  chunk_index INT  DEFAULT 0,
  content     TEXT NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_doc_ticker   ON documents (ticker);
CREATE INDEX IF NOT EXISTS idx_doc_type     ON documents (ticker, doc_type);
CREATE INDEX IF NOT EXISTS idx_doc_chunk    ON documents (ticker, chunk_index);

-- ─── Research Cache ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS research_cache (
  ticker          TEXT PRIMARY KEY,
  result          JSONB,
  last_refreshed  TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Alert Config ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS alert_config (
  id                    INT PRIMARY KEY DEFAULT 1,
  price_threshold_pct   FLOAT DEFAULT 5.0,
  volume_multiplier     FLOAT DEFAULT 2.0,
  alert_categories      TEXT[] DEFAULT ARRAY['results','M&A','management_change','litigation','credit_rating'],
  updated_at            TIMESTAMPTZ DEFAULT NOW(),
  CHECK (id = 1)         -- single-row table
);
INSERT INTO alert_config (id) VALUES (1) ON CONFLICT DO NOTHING;
