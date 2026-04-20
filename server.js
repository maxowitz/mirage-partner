/**
 * Mirage Studios — hostname-routed Express app.
 *
 * Routing (by Host header → getScope()):
 *   miragestudios.io / www.*    → public/ (Vite build of concept-k-synthesis)
 *   admin.miragestudios.io      → admin/ (ADMIN_PASSWORD gate)
 *   <slug>.miragestudios.io     → proposal slug (per-slug password, bcrypt)
 *
 * Proposal types (stored in DATA_DIR/proposals/<slug>/meta.json):
 *   "simple"  — single AI-generated self-contained HTML file
 *               draft.html / published.html in DATA_DIR/proposals/<slug>/
 *   "deck"    — template + structured overrides (content.json model)
 *               overrides.draft.json / overrides.published.json + proposal template
 *
 * Local dev subdomains (no /etc/hosts needed):
 *   http://localhost:3009               → main site
 *   http://admin.localhost:3009         → admin
 *   http://demo.localhost:3009          → proposal "demo"
 */

const express      = require('express');
const cookieParser = require('cookie-parser');
const multer       = require('multer');
const path         = require('path');
const fs           = require('fs');
const crypto       = require('crypto');

const {
  listDecks, getDeck,
  setDeckPassword, setDeckName, verifyDeckPassword,
  createDeck, duplicateDeck,
} = require('./auth/decks');
const {
  createSession, isAuthedSession,
  heartbeat: sessionHeartbeat, endSession, hashIp,
} = require('./auth/sessions');
const analytics = require('./auth/analytics');
const ai        = require('./lib/ai');

const app = express();
app.set('trust proxy', 1);

/* ── Anthropic client (singleton) ──────────────────────────────────────────── */
const Anthropic = require('@anthropic-ai/sdk');
let _anthropic = null;
function getAnthropicClient() {
  if (!_anthropic) _anthropic = new Anthropic({ apiKey: ANTHROPIC_API_KEY });
  return _anthropic;
}

const SESSION_SECRET    = process.env.SESSION_SECRET || 'dev-secret-change-me';
const ADMIN_PASSWORD    = process.env.ADMIN_PASSWORD || 'dev-admin';
const ROOT_DOMAIN       = (process.env.ROOT_DOMAIN || 'miragestudios.io').toLowerCase();
const DATA_DIR          = process.env.DATA_DIR || path.join(__dirname, 'data');
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

const BUILD_ID = (process.env.RAILWAY_GIT_COMMIT_SHA || '').slice(0, 7) ||
                 ('dev-' + Math.floor(Date.now() / 1000));

/* ── Data-dir helpers ──────────────────────────────────────────────────────── */

function ensureDir(p) {
  try { fs.mkdirSync(p, { recursive: true }); } catch (_) {}
}
ensureDir(DATA_DIR);

function proposalDir(slug)    { return path.join(DATA_DIR, 'proposals', slug); }
function uploadsDir(slug)     { return path.join(proposalDir(slug), 'uploads'); }
function metaPath(slug)       { return path.join(proposalDir(slug), 'meta.json'); }
function overridesPath(slug, kind) { return path.join(proposalDir(slug), `overrides.${kind}.json`); }
function htmlPath(slug, kind)      { return path.join(proposalDir(slug), `${kind}.html`); }

function ensureProposalDir(slug) {
  ensureDir(uploadsDir(slug));
}

/* meta.json holds the proposal type and display metadata */
function readMeta(slug) {
  try {
    const p = metaPath(slug);
    if (!fs.existsSync(p)) return null;
    return JSON.parse(fs.readFileSync(p, 'utf8'));
  } catch (_) { return null; }
}
function writeMeta(slug, data) {
  ensureProposalDir(slug);
  const p = metaPath(slug);
  const tmp = p + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(data, null, 2));
  fs.renameSync(tmp, p);
}

function readOverrides(slug, kind) {
  try {
    const p = overridesPath(slug, kind);
    if (!fs.existsSync(p)) return null;
    return JSON.parse(fs.readFileSync(p, 'utf8'));
  } catch (_) { return null; }
}
function writeOverrides(slug, kind, data) {
  ensureProposalDir(slug);
  const p = overridesPath(slug, kind);
  const tmp = p + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(data, null, 2));
  fs.renameSync(tmp, p);
}
function readHtml(slug, kind) {
  try {
    const p = htmlPath(slug, kind);
    if (!fs.existsSync(p)) return null;
    return fs.readFileSync(p, 'utf8');
  } catch (_) { return null; }
}
function writeHtml(slug, kind, html) {
  ensureProposalDir(slug);
  const p = htmlPath(slug, kind);
  const tmp = p + '.tmp';
  fs.writeFileSync(tmp, html);
  fs.renameSync(tmp, p);
}

/* ── Preview tokens ────────────────────────────────────────────────────────── */

const PREVIEW_TTL_MS = 60 * 60 * 1000; // 1h

function signPreviewToken(slug) {
  const ts = Date.now().toString();
  const payload = `${slug}.${ts}`;
  const sig = crypto.createHmac('sha256', SESSION_SECRET).update(payload).digest('hex');
  return Buffer.from(`${payload}.${sig}`).toString('base64url');
}
function verifyPreviewToken(slug, token) {
  try {
    const decoded = Buffer.from(token, 'base64url').toString('utf8');
    const parts = decoded.split('.');
    if (parts.length !== 3) return false;
    const [tokSlug, ts, sig] = parts;
    if (tokSlug !== slug) return false;
    if (Date.now() - Number(ts) > PREVIEW_TTL_MS) return false;
    const expect = crypto.createHmac('sha256', SESSION_SECRET).update(`${tokSlug}.${ts}`).digest('hex');
    const a = Buffer.from(sig, 'hex'), b = Buffer.from(expect, 'hex');
    if (a.length !== b.length) return false;
    return crypto.timingSafeEqual(a, b);
  } catch (_) { return false; }
}
function hasPreviewCookie(req, slug) {
  const cookie = req.signedCookies['mp_preview_' + slug];
  return !!(cookie && verifyPreviewToken(slug, cookie));
}

/* ── Scope detection ───────────────────────────────────────────────────────── */

function getScope(req) {
  const host = (req.headers.host || '').split(':')[0].toLowerCase();
  for (const suffix of ['.localhost', '.lvh.me', '.' + ROOT_DOMAIN]) {
    if (host.endsWith(suffix)) {
      const sub = host.slice(0, -suffix.length);
      if (!sub || sub === 'www') return { kind: 'main' };
      if (sub === 'admin')       return { kind: 'admin' };
      return { kind: 'proposal', slug: sub };
    }
  }
  return { kind: 'main' };
}

function cookieName(scope) {
  if (scope.kind === 'proposal') return 'mp_' + scope.slug;
  if (scope.kind === 'admin')    return 'mp_admin';
  return 'mp_main';
}

function deckExists(slug) {
  try { return !!getDeck(slug); } catch (_) { return false; }
}

/* ── Login page ────────────────────────────────────────────────────────────── */

function renderLogin(req, res, scope) {
  const deck = scope.kind === 'proposal' ? getDeck(scope.slug) : null;
  const label = scope.kind === 'admin' ? 'Admin' : (deck?.name || scope.slug);
  const error = req.query.error
    ? '<p style="color:#C5534C;font-size:12px;text-align:center">Incorrect password.</p>'
    : '';
  res.type('html').send(`<!DOCTYPE html>
<html lang="en"><head>
<meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>${label} — Mirage Studios</title>
<link rel="preconnect" href="https://fonts.googleapis.com"/>
<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;1,300&family=JetBrains+Mono:wght@400&display=swap" rel="stylesheet"/>
<style>
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
html,body{height:100%;background:#030201;display:flex;align-items:center;justify-content:center}
form{display:flex;flex-direction:column;gap:1rem;width:min(300px,88vw);padding:2.5rem;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.07);border-radius:4px}
.brand{font-family:"Cormorant Garamond",serif;font-size:1.4rem;font-weight:300;color:rgba(240,230,210,0.75);text-align:center;letter-spacing:-0.01em}
.sub{font-size:9px;color:rgba(185,140,55,0.6);letter-spacing:0.2em;text-transform:uppercase;text-align:center;margin-bottom:0.5rem}
input{background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.1);border-radius:3px;padding:0.6rem 0.8rem;color:rgba(240,230,210,0.9);font-size:13px;font-family:"JetBrains Mono",monospace;outline:none;transition:border-color 0.2s}
input:focus{border-color:rgba(185,140,55,0.45)}
button{padding:0.6rem;background:rgba(185,140,55,0.1);color:rgba(185,140,55,0.8);border:1px solid rgba(185,140,55,0.28);border-radius:3px;font-size:9px;letter-spacing:0.2em;text-transform:uppercase;cursor:pointer;font-family:"JetBrains Mono",monospace;transition:all 0.2s}
button:hover{background:rgba(185,140,55,0.2);border-color:rgba(185,140,55,0.55)}
</style></head><body>
<form method="POST" action="/auth/login">
  <div class="brand">Mirage Studios</div>
  <div class="sub">${label}</div>
  <input type="password" name="password" placeholder="Password" autofocus required/>
  <button type="submit">Enter →</button>
  ${error}
</form></body></html>`);
}

/* ── Middleware ────────────────────────────────────────────────────────────── */

app.use(cookieParser(SESSION_SECRET));
app.use(express.urlencoded({ extended: false }));
app.use(express.json({ limit: '8mb' }));

app.use((req, res, next) => {
  const scope = getScope(req);
  res.set('X-Content-Type-Options', 'nosniff');
  res.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  if (scope.kind === 'proposal') {
    res.set('Content-Security-Policy', [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline'",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com data:",
      "img-src 'self' data: blob: https:",
      "connect-src 'self'",
      `frame-ancestors https://${ROOT_DOMAIN} https://www.${ROOT_DOMAIN} https://admin.${ROOT_DOMAIN}`,
    ].join('; '));
    res.set('Cross-Origin-Resource-Policy', 'cross-origin');
  } else {
    res.set('X-Frame-Options', 'SAMEORIGIN');
    res.set('Content-Security-Policy', [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com data:",
      "img-src 'self' data: blob: https:",
      "connect-src 'self'",
      "worker-src 'self' blob:",
      "frame-ancestors 'self'",
    ].join('; '));
  }
  next();
});

/* ── Public routes ─────────────────────────────────────────────────────────── */

app.get('/healthz', (req, res) => res.type('text/plain').send('ok'));

app.post('/auth/login', async (req, res) => {
  const scope    = getScope(req);
  const password = req.body.password || '';

  if (scope.kind === 'admin') {
    if (password !== ADMIN_PASSWORD) return res.redirect('/?error=1');
    res.cookie(cookieName(scope), 'admin-authenticated', {
      httpOnly: true, secure: !!process.env.ROOT_DOMAIN,
      sameSite: 'lax', maxAge: 30 * 24 * 60 * 60 * 1000, signed: true,
    });
    return res.redirect('/');
  }

  if (scope.kind === 'proposal') {
    if (!deckExists(scope.slug)) return res.status(404).send('Not found');
    if (!(await verifyDeckPassword(scope.slug, password))) {
      return res.redirect('/?error=1');
    }
    const { session, error: sessionErr } = createSession({ deckSlug: scope.slug, ipHash: hashIp(req.ip || '', process.env.SESSION_SECRET), userAgent: req.headers['user-agent'] || '' });
    if (sessionErr) return res.status(500).send('Session error');
    res.cookie(cookieName(scope), session.id, {
      httpOnly: true, secure: !!process.env.ROOT_DOMAIN,
      sameSite: 'lax', maxAge: 7 * 24 * 60 * 60 * 1000, signed: true,
    });
    return res.redirect('/');
  }
  res.redirect('/');
});

app.post('/auth/logout', (req, res) => {
  res.clearCookie(cookieName(getScope(req)));
  res.redirect('/');
});

app.get('/_preview', (req, res, next) => {
  const scope = getScope(req);
  if (scope.kind !== 'proposal') return next();
  const token = req.query.t;
  if (!token || !verifyPreviewToken(scope.slug, token)) {
    return res.status(403).type('text/plain').send('Preview token expired.');
  }
  res.cookie('mp_preview_' + scope.slug, token, {
    httpOnly: true, secure: !!process.env.ROOT_DOMAIN,
    sameSite: 'none', maxAge: PREVIEW_TTL_MS, signed: true,
  });
  res.redirect('/');
});

/* ── Auth guard ────────────────────────────────────────────────────────────── */

app.use((req, res, next) => {
  const scope = getScope(req);

  if (scope.kind === 'main') { req._scope = scope; return next(); }

  if (scope.kind === 'admin') {
    const cookie = req.signedCookies[cookieName(scope)];
    if (cookie && cookie === 'admin-authenticated') { req._scope = scope; return next(); }
    if (req.path.startsWith('/api/')) return res.status(401).json({ error: 'not authenticated' });
    return renderLogin(req, res, scope);
  }

  if (scope.kind === 'proposal') {
    if (!deckExists(scope.slug)) {
      return res.status(404).type('html').send(
        `<!doctype html><html><head><meta charset="utf-8"/><title>Not found</title>` +
        `<style>body{font-family:system-ui;background:#030201;color:rgba(240,230,210,0.6);` +
        `display:grid;place-items:center;height:100vh;margin:0;text-align:center}` +
        `a{color:rgba(185,140,55,0.7)}</style></head><body>` +
        `<div><h2 style="font-weight:300">Not found</h2>` +
        `<p style="margin-top:1rem"><a href="https://${ROOT_DOMAIN}">Mirage Studios →</a></p></div>` +
        `</body></html>`
      );
    }
    if (hasPreviewCookie(req, scope.slug)) {
      req._scope = scope; req._preview = true; return next();
    }
    const sessionId = req.signedCookies[cookieName(scope)];
    if (sessionId && isAuthedSession(sessionId, scope.slug)) {
      req._scope = scope; req._sessionId = sessionId; return next();
    }
    if (req.path.startsWith('/api/')) return res.status(401).json({ error: 'not authenticated' });
    if (req.path === '/session-tracker.js') return res.status(403).type('text/plain').send('forbidden');
    return renderLogin(req, res, scope);
  }

  res.status(404).send('Not found');
});

/* ── Session tracking (proposal visitors) ──────────────────────────────────── */

app.get('/session-tracker.js', (req, res) => {
  const sid = req._sessionId || null;
  const src = `(function(){const SID=${JSON.stringify(sid)};if(!SID)return;` +
    `function hb(){fetch('/_api/session/heartbeat',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({sessionId:SID}),keepalive:true}).catch(()=>{})}` +
    `function end(){fetch('/_api/session/end',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({sessionId:SID}),keepalive:true}).catch(()=>{})}` +
    `hb();const iv=setInterval(hb,30000);window.addEventListener('beforeunload',()=>{clearInterval(iv);end();});})();`;
  res.type('text/javascript').set('Cache-Control', 'no-store').send(src);
});

app.post('/_api/session/heartbeat', (req, res) => {
  try { if (req.body?.sessionId) sessionHeartbeat(req.body.sessionId); } catch (_) {}
  res.json({ ok: true });
});
app.post('/_api/session/end', (req, res) => {
  try { if (req.body?.sessionId) endSession(req.body.sessionId); } catch (_) {}
  res.json({ ok: true });
});

/* ── Uploads (proposal-scoped) ─────────────────────────────────────────────── */

app.get('/uploaded/:file', (req, res, next) => {
  const scope = req._scope;
  if (!scope || scope.kind !== 'proposal') return next();
  const file = path.basename(req.params.file);
  const fp   = path.join(uploadsDir(scope.slug), file);
  if (!fp.startsWith(uploadsDir(scope.slug)) || !fs.existsSync(fp)) return res.status(404).end();
  res.sendFile(fp);
});

/* ── Admin API ──────────────────────────────────────────────────────────────── */

function adminOnly(req, res, next) {
  if (!req._scope || req._scope.kind !== 'admin') return res.status(403).json({ error: 'forbidden' });
  next();
}

/* List all proposals */
app.get('/api/proposals', adminOnly, (req, res) => {
  const decks = listDecks();
  res.json(decks.map(d => {
    const meta  = readMeta(d.slug) || {};
    const hasDraft     = meta.type === 'simple'
      ? fs.existsSync(htmlPath(d.slug, 'draft'))
      : !!readOverrides(d.slug, 'draft');
    const hasPublished = meta.type === 'simple'
      ? fs.existsSync(htmlPath(d.slug, 'published'))
      : !!readOverrides(d.slug, 'published');
    return {
      slug: d.slug, name: d.name, type: meta.type || 'deck',
      hasPassword: d.hasPassword, defaultStatus: d.defaultStatus,
      hasDraft, hasPublished, createdAt: d.createdAt,
      clientName: meta.clientName || null,
    };
  }));
});

/* Create proposal */
app.post('/api/proposals', adminOnly, async (req, res) => {
  const { slug, name, password, type = 'deck', clientName } = req.body;
  if (!slug || !/^[a-z0-9-]+$/.test(slug)) {
    return res.status(400).json({ error: 'Slug must be lowercase letters, numbers, hyphens.' });
  }
  if (deckExists(slug)) return res.status(409).json({ error: 'Slug already in use.' });
  try {
    const result = await createDeck({ slug, name: name || slug, password: password || null });
    if (result && result.error) return res.status(400).json({ error: result.error });
    writeMeta(slug, { type, clientName: clientName || null, createdAt: new Date().toISOString() });
    res.json({ ok: true, slug });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

/* Set password */
app.post('/api/proposals/:slug/password', adminOnly, async (req, res) => {
  const { slug } = req.params;
  if (!deckExists(slug)) return res.status(404).json({ error: 'Not found' });
  await setDeckPassword(slug, req.body.password);
  res.json({ ok: true });
});

/* Preview token */
app.get('/api/proposals/:slug/preview-token', adminOnly, (req, res) => {
  const { slug } = req.params;
  if (!deckExists(slug)) return res.status(404).json({ error: 'Not found' });
  const token = signPreviewToken(slug);
  const previewUrl = process.env.ROOT_DOMAIN
    ? `https://${slug}.${ROOT_DOMAIN}/_preview?t=${token}`
    : `http://${slug}.localhost:3009/_preview?t=${token}`;
  res.json({ token, previewUrl });
});

/* ── Simple proposal HTML API ──────────────────────────────────────────────── */

app.get('/api/proposals/:slug/html', adminOnly, (req, res) => {
  const { slug } = req.params;
  if (!deckExists(slug)) return res.status(404).json({ error: 'Not found' });
  const draft     = readHtml(slug, 'draft');
  const published = readHtml(slug, 'published');
  res.json({ draft, published });
});

app.put('/api/proposals/:slug/html', adminOnly, (req, res) => {
  const { slug } = req.params;
  if (!deckExists(slug)) return res.status(404).json({ error: 'Not found' });
  const { html } = req.body;
  if (!html) return res.status(400).json({ error: 'html required' });
  writeHtml(slug, 'draft', html);
  res.json({ ok: true });
});

app.post('/api/proposals/:slug/publish', adminOnly, (req, res) => {
  const { slug } = req.params;
  if (!deckExists(slug)) return res.status(404).json({ error: 'Not found' });
  const meta = readMeta(slug) || {};
  if (meta.type === 'simple') {
    const draft = readHtml(slug, 'draft');
    if (!draft) return res.status(400).json({ error: 'No draft to publish.' });
    writeHtml(slug, 'published', draft);
  } else {
    const draft = readOverrides(slug, 'draft');
    if (!draft) return res.status(400).json({ error: 'No draft to publish.' });
    writeOverrides(slug, 'published', draft);
  }
  res.json({ ok: true });
});

/* ── Deck overrides API ─────────────────────────────────────────────────────── */

app.get('/api/proposals/:slug/overrides', adminOnly, (req, res) => {
  const { slug } = req.params;
  if (!deckExists(slug)) return res.status(404).json({ error: 'Not found' });
  res.json({
    draft:     readOverrides(slug, 'draft')     || {},
    published: readOverrides(slug, 'published') || {},
  });
});

app.put('/api/proposals/:slug/overrides', adminOnly, (req, res) => {
  const { slug } = req.params;
  if (!deckExists(slug)) return res.status(404).json({ error: 'Not found' });
  writeOverrides(slug, 'draft', req.body);
  res.json({ ok: true });
});

/* ── Upload API ─────────────────────────────────────────────────────────────── */

const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      ensureDir(uploadsDir(req.params.slug));
      cb(null, uploadsDir(req.params.slug));
    },
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname);
      cb(null, Date.now() + '-' + crypto.randomBytes(4).toString('hex') + ext);
    },
  }),
  limits: { fileSize: 20 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const ok = /^image\/(jpeg|png|gif|webp|svg\+xml)$/.test(file.mimetype);
    cb(ok ? null : new Error('Images only'), ok);
  },
});

app.post('/api/proposals/:slug/upload', adminOnly, upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file' });
  res.json({ url: '/uploaded/' + req.file.filename });
});

app.get('/api/proposals/:slug/uploads', adminOnly, (req, res) => {
  const dir = uploadsDir(req.params.slug);
  if (!fs.existsSync(dir)) return res.json([]);
  res.json(
    fs.readdirSync(dir)
      .filter(f => /\.(jpe?g|png|gif|webp|svg)$/i.test(f))
      .map(f => ({ name: f, url: '/uploaded/' + f, size: fs.statSync(path.join(dir, f)).size }))
  );
});

/* ── Analytics API ──────────────────────────────────────────────────────────── */

app.get('/api/analytics/summary', adminOnly, (req, res) => {
  try { res.json(analytics.deckSummary()); } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/analytics/sessions', adminOnly, (req, res) => {
  const slug = req.query.slug;
  try { res.json(analytics.sessionsForDeck(slug)); } catch (e) { res.status(500).json({ error: e.message }); }
});

/* ── AI: generate simple proposal ──────────────────────────────────────────── */

app.post('/api/proposals/:slug/generate', adminOnly, async (req, res) => {
  const { slug } = req.params;
  if (!deckExists(slug)) return res.status(404).json({ error: 'Not found' });

  const {
    clientName, clientDescription, projectDescription,
    sections, tone, additionalContext,
  } = req.body;

  if (!ANTHROPIC_API_KEY) return res.status(500).json({ error: 'ANTHROPIC_API_KEY not set' });
  const anthropic = getAnthropicClient();

  const systemPrompt = `You are an expert at building beautiful, self-contained HTML proposal microsites for a creative digital studio called Mirage Studios.

Mirage Studios brand:
- Background: #030201 (near-black)
- Primary text: rgba(240,230,210,0.9) (warm cream)
- Gold accent: #B98C37 and rgba(185,140,55,0.8)
- Fonts: Cormorant Garamond (display/headings), Inter (body), JetBrains Mono (labels/mono)
- Tagline: "We build exactly what you imagine."
- Email: hello@miragestudios.io

You produce a COMPLETE, SELF-CONTAINED HTML file with no external dependencies except Google Fonts.
The HTML must:
1. Be fully interactive with JS (multi-page/section navigation like a mini app)
2. Have a hub/landing page showing all sections as cards
3. Include beautiful animations and transitions (CSS + vanilla JS)
4. Look premium and specific to the client — not generic
5. Be mobile-responsive
6. Include a subtle "Prepared by Mirage Studios" footer
7. Start with <!-- MIRAGE_PROPOSAL v1 --> comment

Do not include markdown fences. Output only the HTML file, nothing else.`;

  const userPrompt = `Create a proposal microsite for:

Client: ${clientName || 'the client'}
${clientDescription ? `About the client: ${clientDescription}` : ''}
Project description: ${projectDescription || 'a custom digital solution'}
${sections ? `Sections to include: ${sections}` : ''}
${tone ? `Tone: ${tone}` : 'Tone: premium, confident, creative'}
${additionalContext ? `Additional context: ${additionalContext}` : ''}

Generate the complete self-contained HTML proposal.`;

  try {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    let fullHtml = '';

    const stream = anthropic.messages.stream({
      model: 'claude-opus-4-5',
      max_tokens: 16000,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
    });

    for await (const chunk of stream) {
      if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
        fullHtml += chunk.delta.text;
        res.write(`data: ${JSON.stringify({ delta: chunk.delta.text })}\n\n`);
      }
    }

    // Save draft
    writeHtml(slug, 'draft', fullHtml);
    res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
    res.end();
  } catch (e) {
    console.error('[generate] error:', e.message);
    if (!res.headersSent) {
      res.status(500).json({ error: e.message });
    } else {
      res.write(`data: ${JSON.stringify({ error: e.message })}\n\n`);
      res.end();
    }
  }
});

/* ── Static file serving ────────────────────────────────────────────────────── */

app.use((req, res, next) => {
  const scope = req._scope;
  if (!scope) return next();

  if (scope.kind === 'main') {
    const publicDir = path.join(__dirname, 'public');
    if (!fs.existsSync(publicDir)) return next();
    return express.static(publicDir, { fallthrough: true, maxAge: '1h' })(req, res, next);
  }

  if (scope.kind === 'admin') {
    return express.static(path.join(__dirname, 'admin'), { fallthrough: true, maxAge: '0' })(req, res, next);
  }

  if (scope.kind === 'proposal') {
    // Serve uploads from DATA_DIR
    if (req.path.startsWith('/uploaded/')) return next();
    // For deck type: serve static assets from deck template folder
    const meta = readMeta(scope.slug) || {};
    if (meta.type !== 'simple') {
      const tplDir = path.join(__dirname, 'proposals', '_deck-template');
      if (fs.existsSync(tplDir)) {
        return express.static(tplDir, { fallthrough: true, maxAge: '1h' })(req, res, next);
      }
    }
  }

  next();
});

/* ── Proposal: overrides for deck type ─────────────────────────────────────── */

app.get('/_overrides.json', (req, res) => {
  const scope = req._scope;
  if (!scope || scope.kind !== 'proposal') return res.status(404).json({});
  const kind = req._preview ? 'draft' : 'published';
  const data = readOverrides(scope.slug, kind) || {};
  res.set('Cache-Control', 'no-store');
  res.json(data);
});

/* ── Catch-all ──────────────────────────────────────────────────────────────── */

app.get('*', (req, res) => {
  const scope = req._scope;

  /* Main site — Vite SPA */
  if (!scope || scope.kind === 'main') {
    const indexPath = path.join(__dirname, 'public', 'index.html');
    if (!fs.existsSync(indexPath)) {
      return res.status(503).type('html').send(
        `<!doctype html><html><head><meta charset="utf-8"/><title>Mirage Studios</title></head>` +
        `<body style="background:#030201;color:rgba(240,230,210,0.4);font-family:system-ui;` +
        `display:grid;place-items:center;height:100vh">` +
        `<p>Building site...</p></body></html>`
      );
    }
    return res.sendFile(indexPath);
  }

  /* Admin */
  if (scope.kind === 'admin') {
    const isEditor    = /^\/editor\/[a-zA-Z0-9_-]+$/.test(req.path);
    const isAnalytics = req.path === '/analytics';
    const htmlFile    = isEditor ? 'editor.html' : isAnalytics ? 'analytics.html' : 'index.html';
    const adminPath   = path.join(__dirname, 'admin', htmlFile);
    if (!fs.existsSync(adminPath)) {
      return res.status(503).type('text/plain').send('Admin UI not deployed yet.');
    }
    const proposals = listDecks().map(d => {
      const meta = readMeta(d.slug) || {};
      return { slug: d.slug, name: d.name, type: meta.type || 'deck',
               hasPassword: d.hasPassword, clientName: meta.clientName || null };
    });
    const inject = `<script>
      window.__ROOT_DOMAIN__ = ${JSON.stringify(ROOT_DOMAIN)};
      window.__PROPOSALS__   = ${JSON.stringify(proposals)};
      window.__BUILD_ID__    = ${JSON.stringify(BUILD_ID)};
    </script>`;
    return res.set('Cache-Control', 'no-store').type('html')
      .send(fs.readFileSync(adminPath, 'utf8').replace('</head>', inject + '</head>'));
  }

  /* Proposal */
  if (scope.kind === 'proposal') {
    const meta = readMeta(scope.slug) || {};
    const kind = req._preview ? 'draft' : 'published';

    if (meta.type === 'simple') {
      const html = readHtml(scope.slug, kind);
      if (!html) {
        const draft = readHtml(scope.slug, 'draft');
        if (draft && kind === 'published') {
          // Draft exists but not published — show placeholder
          return res.type('html').send(
            `<!doctype html><html><head><meta charset="utf-8"/></head>` +
            `<body style="background:#030201;color:rgba(240,230,210,0.5);font-family:system-ui;` +
            `display:grid;place-items:center;height:100vh;text-align:center">` +
            `<div><p>Proposal coming soon.</p><p style="margin-top:1rem;font-size:12px;opacity:0.4">Not published yet.</p></div>` +
            `</body></html>`
          );
        }
        return res.status(404).type('text/plain').send('Proposal not found.');
      }
      // Inject session tracker
      const injected = html.replace('</body>',
        `<script src="/session-tracker.js"></script></body>`);
      return res.type('html').set('Cache-Control', 'no-store').send(injected);
    }

    /* Deck type */
    const tplPath = path.join(__dirname, 'proposals', '_deck-template', 'index.html');
    if (!fs.existsSync(tplPath)) {
      return res.status(503).type('text/plain').send('Deck template not deployed yet.');
    }
    const html = fs.readFileSync(tplPath, 'utf8');
    const inject = `<script>
      window.__ROOT_DOMAIN__ = ${JSON.stringify(ROOT_DOMAIN)};
      window.__SLUG__ = ${JSON.stringify(scope.slug)};
      window.__IS_PREVIEW__ = ${JSON.stringify(!!req._preview)};
    </script>`;
    return res.type('html').send(html.replace('</head>', inject + '</head>'));
  }

  res.status(404).send('Not found');
});

/* ── Boot ───────────────────────────────────────────────────────────────────── */

const PORT = process.env.PORT || 3009;
app.listen(PORT, () => {
  console.log(`Mirage Studios listening  :${PORT}`);
  console.log(`Root domain : ${ROOT_DOMAIN}`);
  console.log(`Data dir    : ${DATA_DIR}`);
  console.log(`Build ID    : ${BUILD_ID}`);
  const decks = listDecks();
  console.log(`Proposals   : ${decks.length ? decks.map(d => d.slug).join(', ') : '(none)'}`);
});
