/**
 * View-session CRUD. Phase 3c.
 *
 * Source of truth for pitch-scope auth after 3c: a request is authed iff
 * its signed sessionId cookie resolves to a `view_sessions` row with
 * `ended_at IS NULL`. Password rotation in auth/decks.js::setDeckPassword
 * calls endAllSessionsForDeck() to bulk-terminate active sessions, which
 * (a) invalidates every previously-issued cookie for that deck and (b)
 * leaves an audit trail ("rotated on T, ended N sessions at T").
 *
 * Heartbeats:
 *   • Client fires every 15s while tab is visible.
 *   • Server trusts the declared activeSeconds delta but caps it to
 *     HEARTBEAT_MAX_DELTA (25s) — defends against a pathological client
 *     claiming hours of activity in one POST.
 *   • Server updates last_heartbeat_at, view_sessions.active_seconds,
 *     section_views[activeSectionId].active_seconds, and
 *     deck_viewers.total_seconds in a single transaction per heartbeat.
 *
 * Privacy:
 *   • Raw IP is never stored. We sha256 the IP with SESSION_SECRET as
 *     salt and keep only the hex digest. Enough to notice "these two
 *     sessions came from the same network" without being a reversible
 *     address.
 *   • User-Agent + Referer truncated to 255 chars.
 */

const crypto = require('crypto');
const { db } = require('../db');
const { normalizeEmail, isValidEmailFormat } = require('./domain');

const HEARTBEAT_MAX_DELTA_SECONDS = 25;  // cap per-heartbeat accrual
const UA_MAX_CHARS                = 255;

function newSessionId() {
  return crypto.randomUUID();
}

function hashIp(rawIp, secret) {
  if (!rawIp) return null;
  return crypto.createHash('sha256').update(String(secret || '') + ':' + String(rawIp)).digest('hex');
}

function truncate(str, n) {
  if (str == null) return null;
  const s = String(str);
  return s.length > n ? s.slice(0, n) : s;
}

/** Create a session row + optionally upsert the deck_viewers counter.
 *  email is optional — omit for anonymous proposal viewers.
 *  Returns { session } on success, { error } on failure. */
function createSession({ deckSlug, email = null, ipHash = null, userAgent = null, referrer = null } = {}) {
  if (!deckSlug) return { error: 'Missing deck slug.' };
  const e = email ? normalizeEmail(email) : '';
  if (e && !isValidEmailFormat(e)) return { error: 'Please enter a valid email address.' };

  const now = new Date().toISOString();
  const id  = newSessionId();

  const tx = db.transaction(() => {
    db.prepare(`
      INSERT INTO view_sessions
        (id, deck_slug, email, started_at, last_heartbeat_at, ended_at,
         ip_hash, user_agent, referrer, active_seconds)
      VALUES (?, ?, ?, ?, ?, NULL, ?, ?, ?, 0)
    `).run(id, deckSlug, e, now, now, ipHash, truncate(userAgent, UA_MAX_CHARS), truncate(referrer, UA_MAX_CHARS));

    if (e) {
      const existing = db.prepare('SELECT 1 FROM deck_viewers WHERE deck_slug = ? AND email = ?').get(deckSlug, e);
      if (existing) {
        db.prepare(`
          UPDATE deck_viewers
          SET last_seen_at = ?, total_opens = total_opens + 1
          WHERE deck_slug = ? AND email = ?
        `).run(now, deckSlug, e);
      } else {
        db.prepare(`
          INSERT INTO deck_viewers
            (deck_slug, email, first_seen_at, last_seen_at, total_opens, total_seconds)
          VALUES (?, ?, ?, ?, 1, 0)
        `).run(deckSlug, e, now, now);
      }
    }
  });
  tx();

  return { session: { id, deckSlug, email: e, startedAt: now } };
}

/** Fetch a session. Returns row or null. */
function getSession(sessionId) {
  if (!sessionId) return null;
  return db.prepare('SELECT * FROM view_sessions WHERE id = ?').get(sessionId) || null;
}

/** Middleware helper: a session is "authed" iff it exists AND ended_at IS NULL
 *  AND its deck_slug matches the requested deck. */
function isAuthedSession(sessionId, deckSlug) {
  if (!sessionId || !deckSlug) return false;
  const row = db.prepare(
    'SELECT 1 FROM view_sessions WHERE id = ? AND deck_slug = ? AND ended_at IS NULL'
  ).get(sessionId, deckSlug);
  return !!row;
}

/** Heartbeat: accrue activeSeconds onto the session, a section row, and the
 *  per-email total. sectionId may be null (visitor between sections).
 *  Returns { ok, activeSeconds } or { error }. */
function heartbeat({ sessionId, activeSeconds, activeSectionId = null } = {}) {
  if (!sessionId) return { error: 'Missing sessionId.' };
  const s = getSession(sessionId);
  if (!s || s.ended_at) return { error: 'Session not active.' };

  const delta = Math.max(0, Math.min(HEARTBEAT_MAX_DELTA_SECONDS, Math.floor(Number(activeSeconds) || 0)));
  const now = new Date().toISOString();

  const tx = db.transaction(() => {
    db.prepare(`
      UPDATE view_sessions
      SET last_heartbeat_at = ?, active_seconds = active_seconds + ?
      WHERE id = ?
    `).run(now, delta, sessionId);

    if (delta > 0) {
      db.prepare(`
        UPDATE deck_viewers
        SET last_seen_at = ?, total_seconds = total_seconds + ?
        WHERE deck_slug = ? AND email = ?
      `).run(now, delta, s.deck_slug, s.email);
    }

    if (activeSectionId && delta > 0) {
      const sid = String(activeSectionId).slice(0, 120);
      const existing = db.prepare(
        'SELECT active_seconds FROM section_views WHERE session_id = ? AND section_id = ?'
      ).get(sessionId, sid);
      if (existing) {
        db.prepare(`
          UPDATE section_views SET active_seconds = active_seconds + ?
          WHERE session_id = ? AND section_id = ?
        `).run(delta, sessionId, sid);
      } else {
        db.prepare(`
          INSERT INTO section_views (session_id, section_id, active_seconds)
          VALUES (?, ?, ?)
        `).run(sessionId, sid, delta);
      }
    }
  });
  tx();

  return { ok: true, activeSeconds: delta };
}

/** Stamp ended_at on an active session. No-op if already ended. */
function endSession(sessionId) {
  if (!sessionId) return { error: 'Missing sessionId.' };
  const now = new Date().toISOString();
  const r = db.prepare(
    'UPDATE view_sessions SET ended_at = ? WHERE id = ? AND ended_at IS NULL'
  ).run(now, sessionId);
  return { ok: true, changed: r.changes };
}

/** Bulk-end every active session for a deck. Called by setDeckPassword so
 *  that a password rotation explicitly terminates every active viewer —
 *  auditable (count returned) and consistent with the 3b "rotate = sign
 *  everyone out" property. */
function endAllSessionsForDeck(deckSlug) {
  if (!deckSlug) return { error: 'Missing deckSlug.' };
  const now = new Date().toISOString();
  const r = db.prepare(
    'UPDATE view_sessions SET ended_at = ? WHERE deck_slug = ? AND ended_at IS NULL'
  ).run(now, deckSlug);
  return { ok: true, ended: r.changes };
}

module.exports = {
  HEARTBEAT_MAX_DELTA_SECONDS,
  hashIp,
  createSession,
  getSession,
  isAuthedSession,
  heartbeat,
  endSession,
  endAllSessionsForDeck,
};
