#!/usr/bin/env node
/**
 * Usage:
 *   node scripts/create-user.js <email> <password> [--role=admin]
 *
 * Creates a Hub user. Intended for bootstrapping the first account on a
 * fresh deploy (so you're not locked out when HUB_AUTH_MODE=user_accounts)
 * and for provisioning new teammates without exposing a self-serve signup
 * page if HUB_SIGNUP_OPEN=false.
 *
 * The domain allowlist IS enforced by this CLI (set HUB_ALLOWED_EMAIL_DOMAINS
 * locally to match prod). Passwords are bcrypt-hashed — we never log them.
 */

(async () => {
  const args = process.argv.slice(2);
  if (args.length < 2) {
    console.error('Usage: node scripts/create-user.js <email> <password> [--role=admin]');
    process.exit(1);
  }
  const [email, password] = args;
  const roleArg = args.find(a => a.startsWith('--role='));
  const role = roleArg ? roleArg.split('=')[1] : 'admin';

  if (!['admin', 'editor', 'viewer'].includes(role)) {
    console.error(`Invalid role: ${role}. Must be admin | editor | viewer.`);
    process.exit(1);
  }

  const { createUser } = require('../auth/users');
  const result = await createUser({ email, password, role });
  if (result.error) {
    console.error('Failed:', result.error);
    process.exit(1);
  }
  console.log(`Created user ${result.user.email} (id ${result.user.id}, role ${result.user.role})`);
})();
