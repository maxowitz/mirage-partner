#!/usr/bin/env node
/**
 * Usage:
 *   node scripts/reset-password.js <email> <new-password>
 *
 * Admin-operated password reset. Phase 1a ships without a self-serve reset
 * flow (no SMTP); this CLI covers the few cases per year it's needed.
 */

(async () => {
  const args = process.argv.slice(2);
  if (args.length < 2) {
    console.error('Usage: node scripts/reset-password.js <email> <new-password>');
    process.exit(1);
  }
  const [email, newPassword] = args;

  const { getUserByEmail, setPassword } = require('../auth/users');
  const user = getUserByEmail(email);
  if (!user) {
    console.error(`No user with email ${email}.`);
    process.exit(1);
  }
  const result = await setPassword(user.id, newPassword);
  if (result.error) {
    console.error('Failed:', result.error);
    process.exit(1);
  }
  console.log(`Reset password for ${user.email} (id ${user.id}).`);
})();
