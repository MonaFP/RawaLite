import initSqlJs, { Database, SqlJsStatic } from "sql.js";
import wasmUrl from "sql.js/dist/sql-wasm.wasm?url";

const LS_KEY = "rawalite.sqlite";
const LS_MIGRATE_CUSTOMERS = "rawalite.customers";

let SQL: SqlJsStatic | null = null;
let db: Database | null = null;

function b64ToBytes(b64: string): Uint8Array{
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for(let i=0;i<bin.length;i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}
function bytesToB64(bytes: Uint8Array): string{
  let s = "";
  for (let i=0;i<bytes.length;i++) s += String.fromCharCode(bytes[i]);
  return btoa(s);
}

export async function getDB(): Promise<Database>{
  if(db) return db;
  if(!SQL){
    SQL = await initSqlJs({
      locateFile: () => wasmUrl,
    });
  }
  const stored = localStorage.getItem(LS_KEY);
  db = stored ? new SQL.Database(b64ToBytes(stored)) : new SQL.Database();
  ensureSchema(db);
  await migrateFromLocalStorage(db);
  return db;
}

export function persist(): void{
  if(!db) return;
  const data = db.export();
  localStorage.setItem(LS_KEY, bytesToB64(data));
}

function ensureSchema(d: Database){
  d.exec(`
    CREATE TABLE IF NOT EXISTS customers (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT,
      ort TEXT,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_customers_name ON customers(name);
  `);
}

async function migrateFromLocalStorage(d: Database){
  try{
    const raw = localStorage.getItem(LS_MIGRATE_CUSTOMERS);
    if(!raw) return;
    const list = JSON.parse(raw);
    if(!Array.isArray(list) || list.length === 0) return;

    const stmt = d.prepare(`INSERT OR IGNORE INTO customers (id,name,email,ort,createdAt,updatedAt) VALUES (?,?,?,?,?,?)`);
    d.run("BEGIN");
    for(const c of list){
      stmt.run([
        c.id ?? crypto.randomUUID(),
        c.name ?? "",
        c.email ?? null,
        c.ort ?? null,
        c.createdAt ?? new Date().toISOString(),
        c.updatedAt ?? new Date().toISOString(),
      ]);
    }
    d.run("COMMIT");
    stmt.free();
    persist();
    localStorage.removeItem(LS_MIGRATE_CUSTOMERS);
  }catch{
    // ignore
  }
}
