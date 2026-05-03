-- dr.t Database Schema
-- Run this in your Supabase SQL Editor to set up the database.

-- ─── Users identified via Telegram ───────────────────────────────────────────

CREATE TABLE telegram_users (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  telegram_id   BIGINT      UNIQUE NOT NULL,   -- Telegram from.id — stable forever
  first_name    TEXT        NOT NULL,
  last_name     TEXT,
  username      TEXT,                           -- nullable; user can change this
  language_code TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- The bot uses the service-role key which bypasses RLS.
-- No user-facing policies needed here.
ALTER TABLE telegram_users ENABLE ROW LEVEL SECURITY;

-- ─── Daily food / sugar log ───────────────────────────────────────────────────

CREATE TABLE sugar_logs (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID        NOT NULL REFERENCES telegram_users(id) ON DELETE CASCADE,
  food_name     TEXT,
  sugar_grams   NUMERIC,
  image_url     TEXT,
  ai_suggestion TEXT,
  logged_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE sugar_logs ENABLE ROW LEVEL SECURITY;

-- Index for fast per-user log queries
CREATE INDEX sugar_logs_user_id_idx ON sugar_logs (user_id);
CREATE INDEX sugar_logs_logged_at_idx ON sugar_logs (user_id, logged_at DESC);
