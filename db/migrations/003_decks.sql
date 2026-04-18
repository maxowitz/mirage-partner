-- Phase 3b: Per-deck passwords in DB.
--
-- Replaces the plaintext PITCH_AUTH env-var JSON with a SQLite-backed
-- decks table. Passwords are bcrypt-hashed at rest; rotation is a
-- first-class admin action.
--
-- First-boot seed: if this table is empty AND PITCH_AUTH env is set,
-- server.js seeds rows from the env var (hashing each plaintext) on
-- boot. PITCH_AUTH then becomes a read-only fallback until owner
-- removes it. See server.js seedDecksFromEnv().
--
-- deck_type exists now (future-flexible) even though all seeded rows
-- are kind='pitch'. Phase 4 duplication and Phase-4+ generic-content
-- decks may carry different types.

CREATE TABLE decks (
  slug                  TEXT PRIMARY KEY,           -- subdomain + folder under pitches/
  name                  TEXT NOT NULL,              -- display name ("Canyon Spirit")
  deck_type             TEXT NOT NULL DEFAULT 'pitch', -- pitch | hub | other
  password_hash         TEXT,                       -- bcrypt; NULL = deck not yet published
  gate_password_set_at  TEXT,                       -- ISO-8601 UTC, stamped on every rotate
  default_status        TEXT NOT NULL DEFAULT 'active', -- active | accepted | declined
  created_at            TEXT NOT NULL,              -- ISO-8601 UTC
  failed_login_count    INTEGER NOT NULL DEFAULT 0, -- reserved for Phase 3c rate-limit
  locked_until          TEXT                        -- reserved for Phase 3c lockout
);

CREATE INDEX idx_decks_created_at ON decks (created_at);
