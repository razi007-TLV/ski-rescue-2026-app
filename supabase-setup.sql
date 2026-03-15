-- Ski Rescue 2026: Database Setup
-- Run this ONCE in the Supabase SQL Editor:
-- https://supabase.com/dashboard/project/lxsigfnyfjgkzescymiy/sql/new

-- =====================
-- PRODUCTION TABLES
-- =====================

CREATE TABLE IF NOT EXISTS expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT now(),
  date TIMESTAMPTZ NOT NULL,
  description TEXT NOT NULL,
  amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0 AND amount <= 1000000),
  currency TEXT NOT NULL CHECK (currency IN ('NIS', 'USD', 'EUR')),
  paid_by TEXT NOT NULL CHECK (paid_by IN ('Bloch', 'Adji', 'Razi', 'Kalish')),
  splits JSONB NOT NULL,
  category TEXT
);

CREATE TABLE IF NOT EXISTS settlements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT now(),
  date TIMESTAMPTZ NOT NULL,
  from_member TEXT NOT NULL CHECK (from_member IN ('Bloch', 'Adji', 'Razi', 'Kalish')),
  to_member TEXT NOT NULL CHECK (to_member IN ('Bloch', 'Adji', 'Razi', 'Kalish')),
  amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0 AND amount <= 1000000),
  currency TEXT NOT NULL CHECK (currency IN ('NIS', 'USD', 'EUR')),
  note TEXT,
  CHECK (from_member <> to_member)
);

ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE settlements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all access to expenses" ON expenses FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to settlements" ON settlements FOR ALL USING (true) WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses (date DESC);
CREATE INDEX IF NOT EXISTS idx_settlements_date ON settlements (date DESC);

-- =====================
-- DEV TABLES (for local development)
-- =====================

CREATE TABLE IF NOT EXISTS dev_expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT now(),
  date TIMESTAMPTZ NOT NULL,
  description TEXT NOT NULL,
  amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0 AND amount <= 1000000),
  currency TEXT NOT NULL CHECK (currency IN ('NIS', 'USD', 'EUR')),
  paid_by TEXT NOT NULL CHECK (paid_by IN ('Bloch', 'Adji', 'Razi', 'Kalish')),
  splits JSONB NOT NULL,
  category TEXT
);

CREATE TABLE IF NOT EXISTS dev_settlements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT now(),
  date TIMESTAMPTZ NOT NULL,
  from_member TEXT NOT NULL CHECK (from_member IN ('Bloch', 'Adji', 'Razi', 'Kalish')),
  to_member TEXT NOT NULL CHECK (to_member IN ('Bloch', 'Adji', 'Razi', 'Kalish')),
  amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0 AND amount <= 1000000),
  currency TEXT NOT NULL CHECK (currency IN ('NIS', 'USD', 'EUR')),
  note TEXT,
  CHECK (from_member <> to_member)
);

ALTER TABLE dev_expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE dev_settlements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all access to dev_expenses" ON dev_expenses FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to dev_settlements" ON dev_settlements FOR ALL USING (true) WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_dev_expenses_date ON dev_expenses (date DESC);
CREATE INDEX IF NOT EXISTS idx_dev_settlements_date ON dev_settlements (date DESC);

-- =====================
-- ACTIVITY LOG (shared for prod & dev via table prefix)
-- =====================

CREATE TABLE IF NOT EXISTS activity_log (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  ts TIMESTAMPTZ DEFAULT now(),
  user_name TEXT NOT NULL,
  action TEXT NOT NULL,
  details JSONB
);

ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access to activity_log" ON activity_log FOR ALL USING (true) WITH CHECK (true);
CREATE INDEX IF NOT EXISTS idx_activity_log_ts ON activity_log (ts DESC);

CREATE TABLE IF NOT EXISTS dev_activity_log (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  ts TIMESTAMPTZ DEFAULT now(),
  user_name TEXT NOT NULL,
  action TEXT NOT NULL,
  details JSONB
);

ALTER TABLE dev_activity_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access to dev_activity_log" ON dev_activity_log FOR ALL USING (true) WITH CHECK (true);
CREATE INDEX IF NOT EXISTS idx_dev_activity_log_ts ON dev_activity_log (ts DESC);
