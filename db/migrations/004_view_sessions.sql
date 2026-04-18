-- Phase 3c: Email-gated pitch view + per-session / per-section tracking.
--
-- Three tables:
--   1. deck_viewers  — one row per (deck, email) pair. Lifetime counters.
--   2. view_sessions — one row per login "open". Auth source of truth:
--                      a request is authed iff its signed sessionId cookie
--                      maps to a session with ended_at IS NULL.
--   3. section_views — per-session accumulator of active_seconds per
--                      manifest-defined section id.
--
-- Design notes:
--   • Email is stored lowercase-normalized; NOCASE collation makes the
--     unique index forgiving of whatever case the user types.
--   • ip_hash = sha256(SESSION_SECRET + raw IP) — never store raw IP.
--   • password rotation on the decks table triggers a bulk
--     UPDATE view_sessions SET ended_at = now() WHERE deck_id = :slug
--     AND ended_at IS NULL, giving an explicit audit trail of "rotate
--     killed N sessions" (see auth/decks.js setDeckPassword).
--   • section_views uses (session_id, section_id) PK — one row per
--     section per session, active_seconds accumulates on heartbeat.

CREATE TABLE deck_viewers (
  deck_slug      TEXT NOT NULL,
  email          TEXT NOT NULL COLLATE NOCASE,
  first_seen_at  TEXT NOT NULL,   -- ISO-8601 UTC
  last_seen_at   TEXT NOT NULL,   -- updated on every new session create
  total_opens    INTEGER NOT NULL DEFAULT 0,  -- +1 per successful login POST
  total_seconds  INTEGER NOT NULL DEFAULT 0,  -- active time, summed across sessions
  PRIMARY KEY (deck_slug, email)
);
CREATE INDEX idx_deck_viewers_email ON deck_viewers (email);

CREATE TABLE view_sessions (
  id                  TEXT PRIMARY KEY,     -- uuid v4
  deck_slug           TEXT NOT NULL,
  email               TEXT NOT NULL COLLATE NOCASE,
  started_at          TEXT NOT NULL,        -- ISO-8601 UTC
  last_heartbeat_at   TEXT NOT NULL,        -- updated on each heartbeat
  ended_at            TEXT,                 -- ISO-8601 UTC; set on beacon or rotation
  ip_hash             TEXT,                 -- sha256(SESSION_SECRET || raw_ip); nullable
  user_agent          TEXT,                 -- raw UA, truncated 255 chars
  referrer            TEXT,                 -- referer header, truncated 255; nullable
  active_seconds      INTEGER NOT NULL DEFAULT 0  -- accumulates from heartbeat deltas
);
CREATE INDEX idx_view_sessions_deck      ON view_sessions (deck_slug, started_at);
CREATE INDEX idx_view_sessions_email     ON view_sessions (email, started_at);
CREATE INDEX idx_view_sessions_active    ON view_sessions (deck_slug, ended_at);

CREATE TABLE section_views (
  session_id      TEXT NOT NULL,
  section_id      TEXT NOT NULL,      -- manifest-defined ('hero','intro',…)
  active_seconds  INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (session_id, section_id),
  FOREIGN KEY (session_id) REFERENCES view_sessions(id) ON DELETE CASCADE
);
CREATE INDEX idx_section_views_section ON section_views (section_id);
