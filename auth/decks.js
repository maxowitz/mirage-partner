/**
 * Deck CRUD + gate-password hash/verify. Phase 3b.
 *
 * Replaces the plaintext PITCH_AUTH env var. Passwords are bcrypt-hashed
 * at rest (12 rounds, matches users). Rotation is a first-class admin
 * action — it updates password_hash + stamps gate_password_set_at.
 *
 * Cookie strategy (Phase 3b design note):
 *   Pre-3b, the pitch-gate cookie value WAS the plaintext password, and
 *   the middleware compared `cookie === expected`. Rotating the password
 *   invalidated every existing cookie as a side effect.
 *
 *   In 3b we don't want to keep plaintext in the cookie (unnecessary
 *   exposure) and we can't do bcrypt.compare on every request (too slow).
 *   The new cookie value is `HMAC(SESSION_SECRET, slug + ':' + password_hash)`.
 *   Rotating the password rotates the hash, which rotates the HMAC, which
 *   invalidates every existing cookie. Same property, no plaintext, no
 *   per-request bcrypt. See server.js deckCookieValue() / verifyDeckCookie().
 */

const bcrypt = require('bcrypt');
const fs = require('fs');
const path = require('path');
const { db } = require('../db');

const BCRYPT_ROUNDS = 12;
const MIN_PASSWORD_LENGTH = 4; // pitch-gate is lower-stakes than Hub; kept low to match Canyon Spirit's current "canyon"
const VALID_STATUSES = ['active', 'accepted', 'declined'];
const VALID_DECK_TYPES = ['pitch', 'hub', 'other'];
const RESERVED_SLUGS = ['admin', 'hub', 'www', 'mail', 'ftp', 'api'];

function listDecks() {
  return db.prepare(`
    SELECT slug, name, deck_type, default_status,
           password_hash IS NOT NULL AS has_password,
           gate_password_set_at, created_at
    FROM decks
    ORDER BY created_at ASC
  `).all().map(row => ({
    slug: row.slug,
    name: row.name,
    deckType: row.deck_type,
    defaultStatus: row.default_status,
    hasPassword: !!row.has_password,
    gatePasswordSetAt: row.gate_password_set_at,
    createdAt: row.created_at,
  }));
}

function getDeck(slug) {
  if (!slug) return null;
  return db.prepare('SELECT * FROM decks WHERE slug = ?').get(slug) || null;
}

function getDeckPasswordHash(slug) {
  const row = db.prepare('SELECT password_hash FROM decks WHERE slug = ?').get(slug);
  return row ? row.password_hash : null;
}

async function createDeck({ slug, name, deckType = 'pitch', defaultStatus = 'active', password = null } = {}) {
  if (!slug || !/^[a-z0-9-]+$/.test(slug)) return { error: 'Invalid slug (lowercase alphanumeric + hyphens only).' };
  if (!name) return { error: 'Name is required.' };
  if (!VALID_DECK_TYPES.includes(deckType)) return { error: `Invalid deck type: ${deckType}` };
  if (!VALID_STATUSES.includes(defaultStatus)) return { error: `Invalid default status: ${defaultStatus}` };
  if (getDeck(slug)) return { error: `Deck "${slug}" already exists.` };

  let hash = null;
  let setAt = null;
  if (password) {
    if (password.length < MIN_PASSWORD_LENGTH) return { error: `Password must be at least ${MIN_PASSWORD_LENGTH} characters.` };
    hash = await bcrypt.hash(password, BCRYPT_ROUNDS);
    setAt = new Date().toISOString();
  }

  db.prepare(`
    INSERT INTO decks (slug, name, deck_type, password_hash, gate_password_set_at, default_status, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(slug, name, deckType, hash, setAt, defaultStatus, new Date().toISOString());

  return { ok: true, deck: getDeck(slug) };
}

async function setDeckPassword(slug, newPassword) {
  if (!newPassword || newPassword.length < MIN_PASSWORD_LENGTH) {
    return { error: `Password must be at least ${MIN_PASSWORD_LENGTH} characters.` };
  }
  if (!getDeck(slug)) return { error: 'Deck not found.' };
  const hash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);
  const now = new Date().toISOString();
  db.prepare('UPDATE decks SET password_hash = ?, gate_password_set_at = ?, failed_login_count = 0 WHERE slug = ?')
    .run(hash, now, slug);

  /* Phase 3c: rotation terminates every active viewer session for this
     deck. Preserves the 3b "rotate = sign everyone out" contract now
     that auth lives on session rows instead of HMAC-of-hash cookies. */
  let sessionsEnded = 0;
  try {
    const { endAllSessionsForDeck } = require('./sessions');
    const r = endAllSessionsForDeck(slug);
    sessionsEnded = r && r.ended ? r.ended : 0;
  } catch (e) {
    // sessions table may not exist yet on a mid-migration boot; tolerate.
    console.warn('[decks] endAllSessionsForDeck skipped:', e.message);
  }

  return { ok: true, gatePasswordSetAt: now, sessionsEnded };
}

function setDeckName(slug, name) {
  const v = name ? String(name).trim().slice(0, 120) : '';
  if (!v) return { error: 'Name is required.' };
  const r = db.prepare('UPDATE decks SET name = ? WHERE slug = ?').run(v, slug);
  if (r.changes === 0) return { error: 'Deck not found.' };
  return { ok: true };
}

function setDeckDefaultStatus(slug, status) {
  if (!VALID_STATUSES.includes(status)) return { error: `Invalid status: ${status}` };
  const r = db.prepare('UPDATE decks SET default_status = ? WHERE slug = ?').run(status, slug);
  if (r.changes === 0) return { error: 'Deck not found.' };
  return { ok: true };
}

/** Compare plaintext to the deck's stored hash. Returns true on match,
 *  false otherwise. Bumps failed_login_count on miss for Phase 3c rate-
 *  limit reserved columns. */
async function verifyDeckPassword(slug, plaintext) {
  const row = db.prepare('SELECT password_hash FROM decks WHERE slug = ?').get(slug);
  if (!row || !row.password_hash) {
    // Equal-time hash to mitigate timing leak between "unknown slug" and "wrong password".
    await bcrypt.hash(plaintext || '', 1);
    return false;
  }
  const ok = await bcrypt.compare(plaintext || '', row.password_hash);
  if (!ok) {
    db.prepare('UPDATE decks SET failed_login_count = failed_login_count + 1 WHERE slug = ?').run(slug);
  } else {
    db.prepare('UPDATE decks SET failed_login_count = 0 WHERE slug = ?').run(slug);
  }
  return ok;
}

/** First-boot seed. If decks is empty AND a PITCH_AUTH JSON (and optional
 *  display-metadata map) are provided, seed one row per slug. Idempotent:
 *  subsequent boots with existing rows are no-ops. Called from server.js
 *  boot sequence AFTER migrations have run. */
async function seedDecksFromEnv({ pitchAuth = {}, pitchDisplay = {} } = {}) {
  const entries = Object.entries(pitchAuth || {});
  if (!entries.length) return { seeded: 0, reason: 'no PITCH_AUTH entries' };

  let seeded = 0;
  for (const [slug, auth] of entries) {
    if (getDeck(slug)) continue; // already in DB — don't overwrite
    const display = pitchDisplay[slug] || {};
    const plaintext = auth && auth.password;
    if (!plaintext) {
      console.warn(`[decks] seed: skipping ${slug} — no password in PITCH_AUTH entry`);
      continue;
    }
    const hash = await bcrypt.hash(plaintext, BCRYPT_ROUNDS);
    const now = new Date().toISOString();
    db.prepare(`
      INSERT INTO decks (slug, name, deck_type, password_hash, gate_password_set_at, default_status, created_at)
      VALUES (?, ?, 'pitch', ?, ?, ?, ?)
    `).run(
      slug,
      (auth.name || slug),
      hash,
      now,
      (display.defaultStatus || 'active'),
      now,
    );
    seeded++;
  }

  if (seeded > 0) {
    console.log(`[decks] seeded ${seeded} deck(s) from PITCH_AUTH env var. You can now remove PITCH_AUTH from the environment — rotate passwords via the admin UI.`);
  }
  return { seeded };
}

/* ---------------------------------------------------------------
   Phase 4: Duplicate a deck.

   Given a source slug, deep-copies the per-deck static folder
   (pitches/<src>/ → pitches/<new>/), rewrites the edit-manifest
   deckSlug reference inline, and inserts a fresh row into `decks`
   with password_hash=NULL ("not yet published" — 3b semantics).

   Deliberately NOT copied:
     - DATA_DIR/pitches/<src>/overrides.*.json  (new deck starts
       pristine against the copied content.js baseline)
     - DATA_DIR/pitches/<src>/uploads/           (empty uploads dir)

   This matches the v2.0 spec: "deep-copies content rows + prompts
   for new name + new subdomain slug. Do NOT populate new content —
   the owner will do copy separately." The owner clones the skeleton,
   then rewrites copy via the inline editor.
   --------------------------------------------------------------- */

function isValidSlug(slug) {
  if (!slug || typeof slug !== 'string') return false;
  if (!/^[a-z0-9](?:[a-z0-9-]{0,62}[a-z0-9])?$/.test(slug)) return false;  // DNS-safe
  if (RESERVED_SLUGS.includes(slug)) return false;
  return true;
}

/* Recursive directory copy. Uses fs.cpSync when available (Node 16.7+)
   which is what we're on, with fallback to manual recursion for safety. */
function copyDirRecursive(src, dest) {
  if (fs.cpSync) {
    fs.cpSync(src, dest, { recursive: true });
    return;
  }
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const sp = path.join(src, entry.name);
    const dp = path.join(dest, entry.name);
    if (entry.isDirectory()) copyDirRecursive(sp, dp);
    else if (entry.isFile()) fs.copyFileSync(sp, dp);
    /* symlinks ignored — none expected in our tree */
  }
}

/** Duplicate a deck. Returns { deck } on success, { error } on failure. */
async function duplicateDeck({ sourceSlug, newSlug, newName, pitchesRoot } = {}) {
  if (!sourceSlug) return { error: 'Source deck is required.' };
  if (!isValidSlug(newSlug)) return { error: 'Invalid new slug. Lowercase letters, digits, hyphens only (not starting/ending with a hyphen); `admin`/`hub`/`www` reserved.' };
  if (!newName || !String(newName).trim()) return { error: 'New deck name is required.' };
  if (getDeck(newSlug)) return { error: `A deck with slug "${newSlug}" already exists.` };

  const root = pitchesRoot || path.join(__dirname, '..', 'pitches');
  const srcDir = path.join(root, sourceSlug);
  const dstDir = path.join(root, newSlug);

  if (!fs.existsSync(srcDir) || !fs.statSync(srcDir).isDirectory()) {
    return { error: `Source deck folder not found: pitches/${sourceSlug}` };
  }
  if (fs.existsSync(dstDir)) {
    return { error: `Target folder already exists: pitches/${newSlug}. Remove it or pick a different slug.` };
  }

  /* Step 1: copy the folder. Do this before the DB insert so a file-
     system failure doesn't leave an orphan deck row. */
  try {
    copyDirRecursive(srcDir, dstDir);
  } catch (e) {
    return { error: `File copy failed: ${e.message}` };
  }

  /* Step 2: rewrite edit-manifest.js deckSlug reference. The manifest
     has a hardcoded `deckSlug: 'canyonspirit'` that's used by the bridge
     + server to scope editor work. Without this rewrite, the new deck's
     editor would emit changes under the old slug. */
  const manifestPath = path.join(dstDir, 'edit-manifest.js');
  if (fs.existsSync(manifestPath)) {
    try {
      let src = fs.readFileSync(manifestPath, 'utf8');
      /* Match the exact `deckSlug: '<sourceSlug>'` form (or double-quoted). */
      const pattern = new RegExp("deckSlug\\s*:\\s*(['\"])" + sourceSlug.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&') + "\\1");
      if (pattern.test(src)) {
        src = src.replace(pattern, `deckSlug: '${newSlug}'`);
        fs.writeFileSync(manifestPath, src);
      } else {
        console.warn(`[decks] duplicate: no deckSlug literal found in ${manifestPath} — editor attribution may be off until corrected manually`);
      }
    } catch (e) {
      /* Soft failure — the deck is still usable; flag it. */
      console.warn(`[decks] duplicate: manifest rewrite failed: ${e.message}`);
    }
  }

  /* Step 3: insert the deck row. password_hash=NULL means "not yet
     published" — admin rotates password to open it up. */
  const now = new Date().toISOString();
  try {
    db.prepare(`
      INSERT INTO decks (slug, name, deck_type, password_hash, gate_password_set_at, default_status, created_at)
      VALUES (?, ?, 'pitch', NULL, NULL, 'active', ?)
    `).run(newSlug, String(newName).trim().slice(0, 120), now);
  } catch (e) {
    /* DB failed after disk copy — roll back the folder so we don't leave
       a half-duplicated state. Best-effort; log if rollback fails. */
    try { fs.rmSync(dstDir, { recursive: true, force: true }); } catch (rbe) {
      console.error(`[decks] duplicate: DB insert failed AND rollback failed for ${dstDir}: ${rbe.message}`);
    }
    return { error: `Database insert failed: ${e.message}` };
  }

  return { ok: true, deck: getDeck(newSlug), copiedFrom: sourceSlug };
}

module.exports = {
  MIN_PASSWORD_LENGTH,
  VALID_STATUSES,
  VALID_DECK_TYPES,
  RESERVED_SLUGS,
  isValidSlug,
  listDecks,
  getDeck,
  getDeckPasswordHash,
  createDeck,
  setDeckPassword,
  setDeckName,
  setDeckDefaultStatus,
  verifyDeckPassword,
  seedDecksFromEnv,
  duplicateDeck,
};
