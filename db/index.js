/**
 * SQLite connection + migration runner.
 *
 * Opens DATA_DIR/vslpartner.sqlite. Applies any un-run migrations from
 * db/migrations/*.sql in filename order. Migrations are idempotent (tracked
 * in the _migrations table). Never rolls back automatically — a bad
 * migration must be fixed forward.
 */

const path = require('path');
const fs = require('fs');
const Database = require('better-sqlite3');

const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, '..', 'data');
const DB_PATH = path.join(DATA_DIR, 'mirage.sqlite');

function ensureDataDir() {
  try { fs.mkdirSync(DATA_DIR, { recursive: true }); } catch (e) {
    console.error('Failed to create DATA_DIR', DATA_DIR, e);
  }
}

ensureDataDir();

const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');    // concurrent readers, single writer
db.pragma('foreign_keys = ON');

function runMigrations() {
  db.exec(`CREATE TABLE IF NOT EXISTS _migrations (
    name       TEXT PRIMARY KEY,
    applied_at TEXT NOT NULL
  )`);

  const migrationsDir = path.join(__dirname, 'migrations');
  if (!fs.existsSync(migrationsDir)) return;

  const applied = new Set(
    db.prepare('SELECT name FROM _migrations').all().map(r => r.name)
  );

  const pending = fs.readdirSync(migrationsDir)
    .filter(f => f.endsWith('.sql'))
    .sort()
    .filter(f => !applied.has(f));

  if (!pending.length) return;

  const insertMigration = db.prepare(
    'INSERT INTO _migrations (name, applied_at) VALUES (?, ?)'
  );

  for (const file of pending) {
    const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
    const tx = db.transaction(() => {
      db.exec(sql);
      insertMigration.run(file, new Date().toISOString());
    });
    try {
      tx();
      console.log(`[db] applied migration ${file}`);
    } catch (e) {
      console.error(`[db] migration ${file} failed:`, e.message);
      throw e;
    }
  }
}

runMigrations();

module.exports = { db, DB_PATH };
