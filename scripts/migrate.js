import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import db from '../src/db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const migrationsDir = path.join(__dirname, '..', 'db', 'migrations');

db.exec(`
  CREATE TABLE IF NOT EXISTS migrations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    filename TEXT NOT NULL UNIQUE,
    applied_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
`);

const applied = new Set(
  db.prepare('SELECT filename FROM migrations').all().map((migration) => migration.filename),
);

const files = fs
  .readdirSync(migrationsDir)
  .filter((filename) => filename.endsWith('.sql'))
  .sort();

const applyMigration = db.transaction((filename, sql) => {
  db.exec(sql);
  db.prepare('INSERT INTO migrations (filename) VALUES (?)').run(filename);
});

for (const filename of files) {
  if (applied.has(filename)) {
    continue;
  }

  const sql = fs.readFileSync(path.join(migrationsDir, filename), 'utf8');
  applyMigration(filename, sql);
  console.log(`Applied ${filename}`);
}

console.log('Database is up to date.');
