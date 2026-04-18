-- Phase 3a: Invite-code-based Hub signup + user management.
--
-- The invite_codes table replaces the self-serve /signup flow. An
-- admin creates a code (optionally role-scoped, expiring, or multi-
-- use) and shares it out of band. The recipient visits /signup?code=…
-- to create their account.
--
-- The users.display_name column backs the admin /users UI — lets an
-- admin label teammates with friendlier names than the email local-
-- part (which is what we fall back to when display_name is NULL).

CREATE TABLE invite_codes (
  code         TEXT PRIMARY KEY,                    -- e.g. "VSL-A3K9-MX7P"
  role         TEXT NOT NULL DEFAULT 'viewer',      -- role the created user will receive
  note         TEXT,                                -- admin's free-text note ("For Sarah @ VSL")
  created_by   TEXT NOT NULL,                       -- users.id of issuing admin
  created_at   TEXT NOT NULL,                       -- ISO-8601 UTC
  expires_at   TEXT,                                -- ISO-8601 UTC, nullable (never expires)
  used_by      TEXT,                                -- users.id after consumption
  used_at      TEXT,                                -- ISO-8601 UTC, set on consumption
  revoked_at   TEXT,                                -- ISO-8601 UTC, set if admin revokes
  max_uses     INTEGER NOT NULL DEFAULT 1,          -- 1 = single-use; >1 = reusable
  uses_count   INTEGER NOT NULL DEFAULT 0           -- incremented on each consumption
);
CREATE INDEX idx_invite_codes_created_at ON invite_codes(created_at);
CREATE INDEX idx_invite_codes_used_by    ON invite_codes(used_by);

ALTER TABLE users ADD COLUMN display_name TEXT;
ALTER TABLE users ADD COLUMN invited_by   TEXT;     -- users.id of the admin whose code was used
