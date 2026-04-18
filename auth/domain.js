/**
 * Email-domain allowlist. Controlled by HUB_ALLOWED_EMAIL_DOMAINS env var
 * (comma-separated, case-insensitive, no leading @). Defaults to
 * 'visitsaltlake.com' so a fresh deploy is locked down to VSL from day one.
 *
 * Future flexibility: add more domains by updating the env var; no code
 * change required. If a later phase wants per-domain roles, move this to
 * a DB table — shape is already isolated behind one function.
 */

function allowedDomains() {
  const raw = (process.env.HUB_ALLOWED_EMAIL_DOMAINS || 'visitsaltlake.com').trim();
  return raw
    .split(',')
    .map(s => s.trim().toLowerCase().replace(/^@/, ''))
    .filter(Boolean);
}

function normalizeEmail(email) {
  return (email || '').trim().toLowerCase();
}

function isEmailAllowed(email) {
  const normalized = normalizeEmail(email);
  if (!normalized.includes('@')) return false;
  const domain = normalized.split('@').pop();
  return allowedDomains().includes(domain);
}

function isValidEmailFormat(email) {
  // Deliberately permissive — mirrors browser <input type=email> semantics.
  // Strict RFC 5322 rejection isn't worth the false negatives.
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email || '');
}

module.exports = { allowedDomains, normalizeEmail, isEmailAllowed, isValidEmailFormat };
