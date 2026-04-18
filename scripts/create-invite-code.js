#!/usr/bin/env node
/**
 * Usage:
 *   node scripts/create-invite-code.js <role> [note] [--expires-days=N] [--max-uses=N]
 *
 * Issues a fresh invite code that a teammate can use at /signup?code=…
 * to create their Hub account. Role is baked into the code at creation.
 *
 * Admin attribution: the script is run from the server shell (Railway
 * console or a local dev box), so there's no authed user context — the
 * issuer is stored as 'cli'. For audit-clean issuance, use the web UI at
 * /invite-codes when possible.
 *
 * Examples:
 *   node scripts/create-invite-code.js viewer
 *   node scripts/create-invite-code.js editor "For Sarah @ marketing"
 *   node scripts/create-invite-code.js admin --expires-days=7 --max-uses=1
 */

const role = process.argv[2];
if (!role) {
  console.error('Usage: node scripts/create-invite-code.js <role> [note] [--expires-days=N] [--max-uses=N]');
  console.error('Roles: admin | editor | viewer');
  process.exit(1);
}

const flags = process.argv.slice(3);
const nonFlagArgs = flags.filter(a => !a.startsWith('--'));
const note = nonFlagArgs.join(' ') || null;
const expiresFlag = flags.find(a => a.startsWith('--expires-days='));
const maxUsesFlag = flags.find(a => a.startsWith('--max-uses='));
const expiresInDays = expiresFlag ? parseInt(expiresFlag.split('=')[1], 10) : undefined;
const maxUses       = maxUsesFlag ? parseInt(maxUsesFlag.split('=')[1], 10) : undefined;

const { createInviteCode } = require('../auth/invites');
const r = createInviteCode({ role, note, createdBy: 'cli', expiresInDays, maxUses });
if (r.error) {
  console.error('Failed:', r.error);
  process.exit(1);
}

console.log('Issued code:', r.code);
console.log('Role:      ', role);
if (note) console.log('Note:      ', note);
if (expiresInDays) console.log('Expires in:', expiresInDays, 'days');
if (maxUses && maxUses > 1) console.log('Max uses:  ', maxUses);
console.log('');
console.log('Share this signup link with the teammate:');
console.log('  https://hub.<your-domain>/signup?code=' + r.code);
