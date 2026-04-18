-- Users who can log in to the Hub (and, in later phases, the admin editor).
-- Schema is intentionally future-flexible: role + status + email_verified
-- columns are present now even though Phase 1a only uses a single role.

CREATE TABLE users (
  id                  TEXT PRIMARY KEY,           -- uuid v4
  email               TEXT NOT NULL UNIQUE COLLATE NOCASE,
  email_verified      INTEGER NOT NULL DEFAULT 0, -- 0 or 1; reserved for future email-verify flow
  password_hash       TEXT NOT NULL,              -- bcrypt
  role                TEXT NOT NULL DEFAULT 'admin', -- admin | editor | viewer (future)
  status              TEXT NOT NULL DEFAULT 'active', -- active | disabled | locked
  created_at          TEXT NOT NULL,              -- ISO-8601 UTC
  last_login_at       TEXT,                       -- ISO-8601 UTC, nullable
  failed_login_count  INTEGER NOT NULL DEFAULT 0, -- rolling counter, reset on success
  locked_until        TEXT                        -- ISO-8601 UTC, nullable; reserved for rate-limit lockout
);

CREATE INDEX idx_users_email ON users (email);
