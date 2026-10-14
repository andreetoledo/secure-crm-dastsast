import Database from 'better-sqlite3';
import path from 'node:path';
import fs from 'node:fs';

const dataDir = path.join(__dirname, '..', 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true, mode: 0o777 });
}
try {
  fs.chmodSync(dataDir, 0o777);
} catch {
  // Ignorar error si el sistema operativo no permite chmod
}

const dbPath = path.join(dataDir, 'crm.db');

export const db = new Database(dbPath);
db.pragma('journal_mode = WAL');

export function initSchema() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      email TEXT NOT NULL,
      full_name TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'viewer',
      password_hash TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS tickets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'open',
      priority TEXT NOT NULL DEFAULT 'medium',
      customer_name TEXT NOT NULL,
      customer_email TEXT NOT NULL,
      assignee_id INTEGER,
      created_by_id INTEGER NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);
}
