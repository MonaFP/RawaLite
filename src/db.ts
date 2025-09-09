import initSqlJs, { Database } from "sql.js";

// Die wasm liegt in /public, daher reicht der Pfad:
const wasmUrl = "/sql-wasm.wasm";

// kleines Debounce
function debounce<T extends (...args: any[]) => void>(fn: T, wait = 500) {
  let t: ReturnType<typeof setTimeout> | null = null;
  return (...args: Parameters<T>) => {
    if (t) clearTimeout(t);
    t = setTimeout(() => fn(...args), wait);
  };
}

function base64ToBytes(b64: string): Uint8Array {
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}
function bytesToBase64(bytes: Uint8Array): string {
  let s = "";
  for (let i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]);
  return btoa(s);
}

// sql.js initialisieren
const SQL = await initSqlJs({ locateFile: () => wasmUrl });

// DB aus localStorage laden oder neu anlegen
const LS_KEY = "rawalite.db";
const stored = localStorage.getItem(LS_KEY);
export const db: Database = stored
  ? new SQL.Database(base64ToBytes(stored))
  : new SQL.Database();

// persistieren
function saveNow() {
  const data = db.export();
  localStorage.setItem(LS_KEY, bytesToBase64(data));
}
export const saveDbDebounced = debounce(saveNow, 500);

// Schema sicherstellen
export function ensureSchema() {
  db.run(`
    CREATE TABLE IF NOT EXISTS offers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL
    );
  `);
  saveDbDebounced();
}
