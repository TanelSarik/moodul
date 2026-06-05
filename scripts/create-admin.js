import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import db from '../src/db.js';

dotenv.config();

const email = process.env.ADMIN_EMAIL;
const password = process.env.ADMIN_PASSWORD;

if (!email || !password) {
  console.error('Set ADMIN_EMAIL and ADMIN_PASSWORD in .env before creating an admin.');
  process.exit(1);
}

if (password.length < 8) {
  console.error('ADMIN_PASSWORD must be at least 8 characters long.');
  process.exit(1);
}

const passwordHash = await bcrypt.hash(password, 12);

db.prepare(`
  INSERT INTO admins (email, password_hash)
  VALUES (?, ?)
  ON CONFLICT(email) DO UPDATE SET password_hash = excluded.password_hash
`).run(email.toLowerCase(), passwordHash);

console.log(`Admin user saved: ${email.toLowerCase()}`);
