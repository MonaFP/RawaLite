import initSqlJs, { type Database, type SqlJsStatic } from "sql.js";

const LS_KEY = "rawalite.db";
let SQL: SqlJsStatic | null = null;
let db: Database | null = null;
let persistTimer: number | undefined;

function u8FromBase64(b64: string) {
  const bin = atob(b64);
  const len = bin.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}
function base64FromU8(u8: Uint8Array) {
  let bin = "";
  for (let i = 0; i < u8.length; i++) bin += String.fromCharCode(u8[i]);
  return btoa(bin);
}
function schedulePersist() {
  if (persistTimer) window.clearTimeout(persistTimer);
  persistTimer = window.setTimeout(() => {
    if (!db) return;
    const data = db.export();
    localStorage.setItem(LS_KEY, base64FromU8(data));
  }, 250);
}
function createSchemaIfNeeded() {
  if (!db) return;
  db.exec(`
    PRAGMA journal_mode = WAL;

    CREATE TABLE IF NOT EXISTS settings (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      companyName TEXT, street TEXT, zip TEXT, city TEXT, taxId TEXT,
      kleinunternehmer INTEGER DEFAULT 1,
      nextCustomerNumber INTEGER DEFAULT 1,
      nextOfferNumber INTEGER DEFAULT 1,
      nextInvoiceNumber INTEGER DEFAULT 1,
      createdAt TEXT, updatedAt TEXT
    );

    INSERT INTO settings (id, createdAt, updatedAt)
    SELECT 1, datetime('now'), datetime('now')
    WHERE NOT EXISTS (SELECT 1 FROM settings WHERE id = 1);

    CREATE TABLE IF NOT EXISTS customers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      number TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      email TEXT, phone TEXT,
      street TEXT, zip TEXT, city TEXT,
      notes TEXT,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_customers_name ON customers(name);
  `);
}
export async function getDB(): Promise<Database> {
  if (db) return db;
  if (!SQL) {
    SQL = await initSqlJs({
      locateFile: (file: string) => `${import.meta.env.BASE_URL}sql-wasm.wasm`,
    });
  }
  const stored = localStorage.getItem(LS_KEY);
  db = stored ? new SQL!.Database(u8FromBase64(stored)) : new SQL!.Database();
  createSchemaIfNeeded();

  const _exec = db.exec.bind(db);
  db.exec = (...args: Parameters<Database["exec"]>) => {
    const result = _exec(...args);
    const sqlText = String(args[0] ?? "").toUpperCase();
    if (/INSERT|UPDATE|DELETE|REPLACE|CREATE|DROP|ALTER/.test(sqlText)) {
      schedulePersist();
    }
    return result;
  };
  return db;
}
export function all<T = any>(sql: string, params: any[] = []): T[] {
  if (!db) throw new Error("DB not initialized");
  const stmt = db.prepare(sql);
  try {
    stmt.bind(params);
    const rows: T[] = [];
    while (stmt.step()) rows.push(stmt.getAsObject() as T);
    return rows;
  } finally {
    stmt.free();
  }
}
export function run(sql: string, params: any[] = []): void {
  if (!db) throw new Error("DB not initialized");
  const stmt = db.prepare(sql);
  try {
    stmt.bind(params);
    stmt.step();
  } finally {
    stmt.free();
  }
}
export async function withTx<T>(fn: () => T | Promise<T>): Promise<T> {
  const d = await getDB();
  d.exec("BEGIN");
  try {
    const res = await fn();
    d.exec("COMMIT");
    return res;
  } catch (e) {
    d.exec("ROLLBACK");
    throw e;
  }
}
