#!/usr/bin/env node
/**
 * Usage:
 *   node scripts/set-deck-password.js <slug> <new-password>
 *
 * Break-glass: rotate a deck's gate password from the server shell.
 * The new password is bcrypt-hashed at rest. Existing cookies invalidate
 * naturally — the cookie HMAC is keyed by the stored hash.
 *
 * If the slug doesn't exist in the decks table yet but is present in
 * PITCH_AUTH, this script creates the row on the fly so the rotation
 * has somewhere to land.
 */

(async () => {
  const args = process.argv.slice(2);
  if (args.length < 2) {
    console.error('Usage: node scripts/set-deck-password.js <slug> <new-password>');
    process.exit(1);
  }
  const [slug, newPassword] = args;

  const { getDeck, setDeckPassword, createDeck } = require('../auth/decks');

  if (!getDeck(slug)) {
    // Bootstrap the row — use PITCH_AUTH for a display name if we have it.
    let pitchAuth = {};
    try {
      if (process.env.PITCH_AUTH) pitchAuth = JSON.parse(process.env.PITCH_AUTH);
    } catch { /* ignore */ }
    const name = (pitchAuth[slug] && pitchAuth[slug].name) || slug;
    const created = await createDeck({ slug, name });
    if (created.error) {
      console.error(`Could not create deck row for ${slug}: ${created.error}`);
      process.exit(1);
    }
    console.log(`Created deck row for ${slug} (name: ${name}).`);
  }

  const result = await setDeckPassword(slug, newPassword);
  if (result.error) {
    console.error('Failed:', result.error);
    process.exit(1);
  }
  console.log(`Set password for deck ${slug} (stamped ${result.gatePasswordSetAt}).`);
})();
