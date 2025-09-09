// src/lib/sql.ts
import initSqlJs, { Database, SqlJsStatic } from 'sql.js';

let SQL: SqlJsStatic | null = null;
let db: Database | null = null;

const locate = (file: string) =>
  // Dev: unter /public/ erreichbar, Build: von extraResources in App-Root
  (import.meta.env.DEV ? `/${file}` : `${file}`);

export async function getDb() {
  if (!SQL) {
    SQL = await initSqlJs({ locateFile: locate });
  }
  if (!db) {
    const bytes = await window.rawalite.db.load();
    db = bytes ? new SQL.Database(new Uint8Array(bytes)) : new SQL.Database();
    // Erst-Setup
    db.exec(`
      CREATE TABLE IF NOT EXISTS quotes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      );
    `);
  }
  return db!;
}

let saveTimer: any;
export async function saveDbDebounced() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(async () => {
    if (!db) return;
    const data = db.export();
    await window.rawalite.db.save(data);
  }, 400);
}
