# Mirage Studios — Partner Platform

Express backend + Vite frontend for creating and sharing proposal microsites. Two proposal types: AI-generated self-contained HTML proposals, or structured deck-based proposals.

## Architecture

```
miragestudios.io              → concept-k-synthesis Vite build (main site)
admin.miragestudios.io        → proposal dashboard + editor (password-gated)
<slug>.miragestudios.io       → per-client proposal (own password, analytics)
```

## Proposal Types

### AI Proposal (`simple`)
Describe your client + project, Claude generates a full self-contained HTML microsite. Edit and republish any time from the admin editor.

**Features:**
- Full streaming generation with live progress
- Code editor with HTML preview in iframe
- One-click publish to go live
- Visitor analytics + session tracking

### Deck Proposal (`deck`)
Structured template-based proposal with content fields. Good for reusable formats.

**Features:**
- Content overrides (JSON-based)
- Template rendering with dynamic sections
- Same analytics + session tracking as AI proposals

## Local Development

### Setup

```bash
npm install
cd frontend && npm install
```

### Environment Variables

Copy `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```

Edit `.env.local`:
```
ROOT_DOMAIN=miragestudios.io  (or leave blank for .localhost dev)
SESSION_SECRET=dev-secret-change-me
ADMIN_PASSWORD=dev-admin
ANTHROPIC_API_KEY=sk-ant-...
```

### Run

Terminal 1 — Frontend dev server:
```bash
cd frontend
npm run dev
# http://localhost:3008
```

Terminal 2 — Express backend:
```bash
npm start
# http://localhost:3009
```

Access via subdomains:
- **Main site:** http://localhost:3009
- **Admin:** http://admin.localhost:3009 (password: from `.env.local`)
- **Demo proposal:** http://demo.localhost:3009 (after you create one)

Browsers treat `*.localhost` as loopback, no `/etc/hosts` needed.

## Admin Dashboard

`/admin/` — Create, edit, and publish proposals.

### Create a Proposal

1. Click **"New Proposal"**
2. Choose type: **AI Proposal** or **Deck**
3. Fill in details:
   - **Slug** (URL identifier, e.g. `client-name`)
   - **Name** (display name)
   - **Client Name** (optional)
   - **Password** (optional, can set later)
   - For AI: **Project Description** (Claude uses this to generate)
4. Click create

For **AI proposals**: redirects to editor where generation starts immediately.
For **Deck proposals**: you edit the content overrides.

### Proposal Editor

Split panel — code/JSON on left, live preview on right.

**AI Proposal:**
- Full HTML editor (textarea)
- Click **"Generate AI"** to stream new version
- **"Save Draft"** (Ctrl+S) saves without publishing
- **"Publish"** (Ctrl+Shift+P) makes it live
- Preview refreshes after every save

**Deck Proposal:**
- JSON editor for overrides
- Same save/publish workflow

**Actions:**
- **Preview**: Opens proposal in new tab (with preview token, shows draft)
- **Password**: Set/change proposal password
- **⧉**: Opens published version in new tab

## Proposal URLs

Once published:
- **Live site:** `https://<slug>.<ROOT_DOMAIN>` (password-gated)
- **Admin preview:** same URL with preview token (internal use)
- **Password reset:** admin can set new password anytime

## Analytics

Admin dashboard shows:
- Total proposals
- Visitor sessions per proposal
- Session duration + active sections viewed
- Export CSV for deeper analysis

Visitor tracking is automatic — each unique session gets a signed cookie. Sessions end when the visitor closes the tab or after 7 days (whichever comes first).

## Deployment

### Railway

This repo is configured for Railway deployment.

1. **Connect GitHub repo** in Railway dashboard
2. **Set environment variables:**
   - `ROOT_DOMAIN` = `miragestudios.io`
   - `SESSION_SECRET` = (long random string, ~32 chars)
   - `ADMIN_PASSWORD` = (your password)
   - `ANTHROPIC_API_KEY` = (your Claude API key)
   - `DATA_DIR` = `/data` (if using persistent volume)
3. **Add Persistent Volume** (optional, for analytics data):
   - Mount at `/data`
   - Size: 1GB
4. **Add custom domains:**
   - `miragestudios.io`
   - `*.miragestudios.io` (wildcard for proposal subdomains)
5. **Update DNS** at registrar → Railway's CNAME

Railway will automatically:
- Run the build script: `npm run build` (builds frontend Vite → `public/`)
- Start the Express server: `node server.js`
- Watch GitHub repo for pushes and redeploy

## Project Structure

```
.
├── admin/                       # Admin UI (dashboard + editor)
│   ├── index.html              # Dashboard (create/list proposals)
│   └── editor.html             # Proposal editor (code + preview)
├── auth/                        # Auth modules
│   ├── decks.js                # Proposal DB + crypto
│   ├── sessions.js             # Visitor session tracking
│   ├── analytics.js            # Analytics aggregation
│   └── domain.js               # Email allowlist helpers
├── db/
│   ├── index.js                # SQLite connection + migrations
│   └── migrations/             # Schema (users, decks, sessions, etc.)
├── lib/
│   └── ai.js                   # Claude API integration
├── proposals/
│   └── _deck-template/         # Deck proposal template
│       ├── index.html          # Renders content.js + overrides
│       └── content.js          # Default content (editable)
├── frontend/                    # Vite React app (concept-k-synthesis)
│   ├── src/
│   ├── public/
│   └── package.json
├── server.js                    # Express backend (main entry point)
├── package.json
├── railway.json                 # Railway build config
└── .env.example                 # Environment variables template
```

## API Routes

### Public

- `GET /healthz` — Health check (Railway)
- `POST /auth/login` — Authenticate (submit password)
- `POST /auth/logout` — Clear session cookie
- `GET /_overrides.json` — Fetch content overrides (deck type only)
- `GET /session-tracker.js` — Analytics tracker script
- `GET /uploaded/<file>` — Serve uploaded images

### Admin (`/api/proposals/*`)

All admin routes require `ADMIN_PASSWORD` cookie.

- `GET /api/proposals` — List all proposals
- `POST /api/proposals` — Create new proposal
- `GET /api/proposals/:slug/html` — Fetch draft/published HTML (simple)
- `PUT /api/proposals/:slug/html` — Save draft HTML
- `GET /api/proposals/:slug/overrides` — Fetch draft/published overrides (deck)
- `PUT /api/proposals/:slug/overrides` — Save draft overrides
- `POST /api/proposals/:slug/publish` — Publish draft (→ published)
- `POST /api/proposals/:slug/password` — Set password
- `GET /api/proposals/:slug/preview-token` — Get preview token + URL
- `POST /api/proposals/:slug/generate` — Stream AI generation (SSE)
- `POST /api/proposals/:slug/upload` — Upload image
- `GET /api/proposals/:slug/uploads` — List uploaded images
- `GET /api/analytics/summary` — Analytics dashboard data
- `GET /api/analytics/sessions?slug=<slug>` — Sessions for a proposal

### Proposal Visitor (`/api/session/*`)

- `POST /_api/session/heartbeat` — Extend session (called every 30s)
- `POST /_api/session/end` — End session (called on page unload)

## Data Persistence

SQLite database lives in `DATA_DIR` (defaults to `./data/`).

**Schema:**
- `users` — Hub user accounts (email + bcrypt password)
- `decks` — Proposals (slug, name, password hash)
- `view_sessions` — Visitor sessions (per proposal)
- `invite_codes` — Signup invite codes (if needed later)
- `_migrations` — Migration tracking

**Proposal files** (in `DATA_DIR/proposals/<slug>/`):
- `meta.json` — Proposal metadata (type, client name, created at)
- `draft.html` / `published.html` — AI proposal HTML
- `overrides.draft.json` / `overrides.published.json` — Deck content
- `uploads/` — User-uploaded images

## CLI Scripts

```bash
# Create a new invite code (for hub signup)
node scripts/create-invite-code.js <email>

# Create a new hub user
node scripts/create-user.js <email>

# Reset a user's password
node scripts/reset-password.js <email>

# Set a proposal password
node scripts/set-deck-password.js <slug> <password>
```

## Troubleshooting

### "Proposal not found" at `<slug>.miragestudios.io`

Make sure the proposal exists in the admin dashboard. If it does:
- Check that `DATA_DIR` has the proposal folder with `meta.json`
- Restart the server

### AI generation hangs

Check that `ANTHROPIC_API_KEY` is set and valid in your Railway env vars.

### Preview shows draft but live shows "coming soon"

The draft hasn't been published. Click **"Publish"** in the editor.

### Sessions not tracking

Ensure `session-tracker.js` is loaded in the proposal HTML (`<script src="/session-tracker.js"></script>`). The deck template includes this by default; AI proposals need it manually added if custom.

## Future Phases

- Hub user accounts + role-based access (editor, admin, viewer)
- Per-deck password management (currently admin-only)
- More proposal templates (case study, pricing, etc.)
- Duplicate proposal (template cloning)
- Proposal expiration (auto-lock after date)
- Share analytics via public link
- Webhook integrations (Slack notifications on new visitors)

## License

Private. Built by Mirage Studios.
