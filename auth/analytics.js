/**
 * Analytics queries for the admin Analytics page. Phase 3d.
 *
 * Pure read-side. No aggregation tables — we query view_sessions,
 * deck_viewers, section_views directly. At our scale (single-deck,
 * low-hundreds of sessions) this is plenty fast. If a deck ever
 * sees thousands of sessions per day we'd add rollups; until then
 * the simpler code path wins.
 *
 * Date range filters are always expressed as inclusive ISO-8601
 * start..end on view_sessions.started_at. A null from/to means
 * "no bound on that side."
 *
 * Percentiles are computed in JS (sorted-array index pick) rather
 * than in SQL — SQLite ships without percentile_cont and our data
 * volume doesn't justify adding an extension. The p50/p90 calls
 * load at most ~200 rows of active_seconds, sort, index.
 */

const { db } = require('../db');

function quote(s) { return s == null ? null : String(s); }

/** Build a `WHERE` fragment + args for a deck/email/from/to filter.
 *  Returns { where, args } where `where` is "" or "WHERE ...". */
function buildWhere({ deck = null, email = null, from = null, to = null } = {}) {
  const parts = [];
  const args = [];
  if (deck)  { parts.push('vs.deck_slug = ?'); args.push(deck); }
  if (email) { parts.push('vs.email LIKE ? COLLATE NOCASE'); args.push('%' + email + '%'); }
  if (from)  { parts.push('vs.started_at >= ?'); args.push(from); }
  if (to)    { parts.push('vs.started_at <= ?'); args.push(to); }
  return { where: parts.length ? 'WHERE ' + parts.join(' AND ') : '', args };
}

function pct(arr, p) {
  if (!arr.length) return 0;
  const sorted = arr.slice().sort((a, b) => a - b);
  const idx = Math.min(sorted.length - 1, Math.floor((p / 100) * sorted.length));
  return sorted[idx];
}

/** Per-deck rollup card: for the requested deck + date range, returns
 *  unique viewers, total sessions, total opens, avg/p50/p90 duration,
 *  most-viewed section. If deck is null, returns one row per deck. */
function deckSummary({ deck = null, from = null, to = null } = {}) {
  const { where, args } = buildWhere({ deck, from, to });
  /* Pull the session rows in-range once, bucket by deck in JS. One
     pass is cheaper than four aggregate queries and lets us compute
     percentiles client-side. */
  const rows = db.prepare(`
    SELECT vs.deck_slug, vs.email, vs.active_seconds, vs.started_at, vs.ended_at
    FROM view_sessions vs
    ${where}
    ORDER BY vs.started_at ASC
  `).all(...args);

  const bySlug = new Map();
  for (const r of rows) {
    let b = bySlug.get(r.deck_slug);
    if (!b) { b = { deckSlug: r.deck_slug, sessions: 0, emails: new Set(), durations: [], activeNow: 0 }; bySlug.set(r.deck_slug, b); }
    b.sessions++;
    b.emails.add(r.email.toLowerCase());
    b.durations.push(r.active_seconds || 0);
    if (!r.ended_at) b.activeNow++;
  }

  /* total_opens comes from deck_viewers (authoritative counter) —
     scoped by email presence in the filtered window. */
  const openArgs = [];
  const openFrag = [];
  if (deck) { openFrag.push('dv.deck_slug = ?'); openArgs.push(deck); }
  const opensBySlug = new Map();
  const openQ = `
    SELECT dv.deck_slug, SUM(dv.total_opens) AS opens
    FROM deck_viewers dv
    ${openFrag.length ? 'WHERE ' + openFrag.join(' AND ') : ''}
    GROUP BY dv.deck_slug
  `;
  for (const row of db.prepare(openQ).all(...openArgs)) opensBySlug.set(row.deck_slug, row.opens);

  /* Top section per deck — sum active_seconds across section_views
     joined to the filtered session set. */
  const sectionByDeck = new Map();
  if (bySlug.size) {
    const inSlugs = Array.from(bySlug.keys()).map(() => '?').join(',');
    const sectionArgs = [...args, ...bySlug.keys()];
    const sectionRows = db.prepare(`
      SELECT vs.deck_slug, sv.section_id, SUM(sv.active_seconds) AS secs
      FROM view_sessions vs
      JOIN section_views sv ON sv.session_id = vs.id
      ${where ? where + ' AND' : 'WHERE'} vs.deck_slug IN (${inSlugs})
      GROUP BY vs.deck_slug, sv.section_id
      ORDER BY secs DESC
    `).all(...sectionArgs);
    for (const r of sectionRows) {
      if (!sectionByDeck.has(r.deck_slug)) {
        sectionByDeck.set(r.deck_slug, { sectionId: r.section_id, activeSeconds: r.secs });
      }
    }
  }

  const out = [];
  for (const [slug, b] of bySlug) {
    const durations = b.durations;
    const avg = durations.length ? Math.round(durations.reduce((a, c) => a + c, 0) / durations.length) : 0;
    out.push({
      deckSlug: slug,
      uniqueViewers: b.emails.size,
      totalSessions: b.sessions,
      totalOpens: opensBySlug.get(slug) || 0,
      activeNow: b.activeNow,
      avgSessionSeconds: avg,
      p50SessionSeconds: pct(durations, 50),
      p90SessionSeconds: pct(durations, 90),
      mostViewedSection: sectionByDeck.get(slug) || null,
    });
  }
  /* If a specific deck was requested but had zero sessions in-range,
     still return a row with zeros so the UI renders "no activity" cleanly. */
  if (deck && !bySlug.has(deck)) {
    out.push({
      deckSlug: deck,
      uniqueViewers: 0, totalSessions: 0,
      totalOpens: opensBySlug.get(deck) || 0,
      activeNow: 0, avgSessionSeconds: 0, p50SessionSeconds: 0, p90SessionSeconds: 0,
      mostViewedSection: null,
    });
  }
  return out.sort((a, b) => a.deckSlug.localeCompare(b.deckSlug));
}

/** Per-viewer breakdown for the given filter. Returns one row per
 *  (deck, email) with totals + per-section active_seconds. */
function viewers({ deck = null, email = null, from = null, to = null } = {}) {
  const { where, args } = buildWhere({ deck, email, from, to });

  /* Aggregate per (deck, email) in-range. */
  const sessionRows = db.prepare(`
    SELECT vs.deck_slug, vs.email,
           MIN(vs.started_at)        AS first_session_in_range,
           MAX(vs.last_heartbeat_at) AS last_heartbeat_in_range,
           COUNT(*)                  AS session_count,
           SUM(vs.active_seconds)    AS active_seconds_in_range,
           SUM(CASE WHEN vs.ended_at IS NULL THEN 1 ELSE 0 END) AS active_now
    FROM view_sessions vs
    ${where}
    GROUP BY vs.deck_slug, vs.email
    ORDER BY last_heartbeat_in_range DESC
  `).all(...args);

  if (!sessionRows.length) return [];

  /* Pull per-section roll-up for only the sessions in the filtered set.
     We build a temp `IN (…)` list of session ids. Given the filter
     already capped at <= ~200 viewers × average handful of sessions,
     the IN list stays small. For prod-scale safety we bucket in 500s. */
  const allSessionIds = db.prepare(`
    SELECT vs.id, vs.deck_slug, vs.email FROM view_sessions vs ${where}
  `).all(...args);
  const sectionAcc = new Map();  // key = deck|email → { sectionId: secs }
  if (allSessionIds.length) {
    const CHUNK = 500;
    for (let i = 0; i < allSessionIds.length; i += CHUNK) {
      const slice = allSessionIds.slice(i, i + CHUNK);
      const placeholders = slice.map(() => '?').join(',');
      const ids = slice.map(s => s.id);
      const sectionRows = db.prepare(`
        SELECT vs.deck_slug, vs.email, sv.section_id, SUM(sv.active_seconds) AS secs
        FROM section_views sv
        JOIN view_sessions vs ON vs.id = sv.session_id
        WHERE sv.session_id IN (${placeholders})
        GROUP BY vs.deck_slug, vs.email, sv.section_id
      `).all(...ids);
      for (const r of sectionRows) {
        const k = r.deck_slug + '|' + r.email.toLowerCase();
        let m = sectionAcc.get(k);
        if (!m) { m = {}; sectionAcc.set(k, m); }
        m[r.section_id] = (m[r.section_id] || 0) + r.secs;
      }
    }
  }

  /* Lifetime deck_viewers data (total_opens, first_seen, last_seen) —
     these are lifetime, not in-range. We join to give the UI both
     "opens in this window" (harder — we'd need a table of open events;
     deferred) and "opens lifetime." For now we expose totalOpensLifetime
     and sessionCountInRange separately so the UI can label them clearly. */
  const dvRows = db.prepare(`
    SELECT deck_slug, email, first_seen_at, last_seen_at, total_opens, total_seconds
    FROM deck_viewers
  `).all();
  const dvByKey = new Map();
  for (const r of dvRows) dvByKey.set(r.deck_slug + '|' + r.email.toLowerCase(), r);

  return sessionRows.map(r => {
    const key = r.deck_slug + '|' + r.email.toLowerCase();
    const dv = dvByKey.get(key);
    return {
      deckSlug: r.deck_slug,
      email: r.email,
      firstSeenLifetime: dv ? dv.first_seen_at : r.first_session_in_range,
      lastSeenLifetime:  dv ? dv.last_seen_at  : r.last_heartbeat_in_range,
      totalOpensLifetime: dv ? dv.total_opens : 0,
      totalSecondsLifetime: dv ? dv.total_seconds : 0,
      sessionsInRange: r.session_count,
      activeSecondsInRange: r.active_seconds_in_range || 0,
      activeNow: r.active_now > 0,
      sectionActiveSeconds: sectionAcc.get(key) || {},
    };
  });
}

/** Raw session list. Limited by default to 200; set `limit` to override
 *  (hard cap 1000). Ordered newest first. */
function sessions({ deck = null, email = null, from = null, to = null, limit = 200 } = {}) {
  const { where, args } = buildWhere({ deck, email, from, to });
  const n = Math.max(1, Math.min(1000, Number(limit) || 200));

  const rows = db.prepare(`
    SELECT vs.id, vs.deck_slug, vs.email, vs.started_at, vs.last_heartbeat_at,
           vs.ended_at, vs.active_seconds, vs.user_agent, vs.referrer
    FROM view_sessions vs
    ${where}
    ORDER BY vs.started_at DESC
    LIMIT ?
  `).all(...args, n);

  /* Annotate each session with its top section (sum(active_seconds) DESC). */
  if (!rows.length) return [];
  const ids = rows.map(r => r.id);
  const placeholders = ids.map(() => '?').join(',');
  const topSections = db.prepare(`
    SELECT sv.session_id, sv.section_id, SUM(sv.active_seconds) AS secs
    FROM section_views sv
    WHERE sv.session_id IN (${placeholders})
    GROUP BY sv.session_id, sv.section_id
    ORDER BY secs DESC
  `).all(...ids);
  const topBySession = new Map();
  for (const r of topSections) {
    if (!topBySession.has(r.session_id)) topBySession.set(r.session_id, { sectionId: r.section_id, activeSeconds: r.secs });
  }

  return rows.map(r => ({
    id: r.id,
    deckSlug: r.deck_slug,
    email: r.email,
    startedAt: r.started_at,
    lastHeartbeatAt: r.last_heartbeat_at,
    endedAt: r.ended_at,
    durationSeconds: r.active_seconds || 0,
    active: !r.ended_at,
    topSection: topBySession.get(r.id) || null,
    userAgent: r.user_agent,
    referrer: r.referrer,
  }));
}

/** Build a CSV string from an array of rows + column definitions.
 *  cols: [{ key: 'email', label: 'Email', map?: (row) => string }, ...] */
function toCsv(rows, cols) {
  const esc = v => {
    if (v == null) return '';
    const s = String(v);
    if (/[",\n]/.test(s)) return '"' + s.replace(/"/g, '""') + '"';
    return s;
  };
  const header = cols.map(c => esc(c.label)).join(',');
  const body = rows.map(r => cols.map(c => esc(c.map ? c.map(r) : r[c.key])).join(',')).join('\n');
  return header + '\n' + body + '\n';
}

/** CSV export for viewers: one row per (deck, email) with per-section
 *  columns flattened. Section columns use the manifest order passed in
 *  via `sectionIds` (so column order is stable across exports). */
function viewersCsv({ viewersRows, sectionIds = [] }) {
  const baseCols = [
    { key: 'email',                label: 'Email' },
    { key: 'deckSlug',             label: 'Deck' },
    { key: 'firstSeenLifetime',    label: 'First seen' },
    { key: 'lastSeenLifetime',     label: 'Last seen' },
    { key: 'totalOpensLifetime',   label: 'Total opens (lifetime)' },
    { key: 'sessionsInRange',      label: 'Sessions in range' },
    { key: 'activeSecondsInRange', label: 'Active seconds in range' },
    { key: 'totalSecondsLifetime', label: 'Active seconds (lifetime)' },
  ];
  const sectionCols = sectionIds.map(sid => ({
    label: sid + ' (sec)',
    map: r => (r.sectionActiveSeconds && r.sectionActiveSeconds[sid]) || 0,
  }));
  return toCsv(viewersRows, baseCols.concat(sectionCols));
}

function sessionsCsv(rows) {
  return toCsv(rows, [
    { key: 'id',               label: 'Session ID' },
    { key: 'deckSlug',         label: 'Deck' },
    { key: 'email',            label: 'Email' },
    { key: 'startedAt',        label: 'Started at' },
    { key: 'endedAt',          label: 'Ended at' },
    { label: 'Duration (sec)', map: r => r.durationSeconds },
    { label: 'Top section',    map: r => r.topSection ? r.topSection.sectionId : '' },
    { key: 'userAgent',        label: 'User agent' },
    { key: 'referrer',         label: 'Referrer' },
  ]);
}

module.exports = {
  deckSummary,
  viewers,
  sessions,
  viewersCsv,
  sessionsCsv,
};
