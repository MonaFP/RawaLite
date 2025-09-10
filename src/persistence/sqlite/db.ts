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
  
  // First, create basic schema
  db.exec(`
    PRAGMA journal_mode = WAL;

    CREATE TABLE IF NOT EXISTS settings (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      companyName TEXT, street TEXT, zip TEXT, city TEXT, 
      phone TEXT, email TEXT, website TEXT,
      taxId TEXT, vatId TEXT,
      kleinunternehmer INTEGER DEFAULT 1,
      bankName TEXT, bankAccount TEXT, bankBic TEXT,
      logo TEXT,
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

  // Handle packages table migration
  try {
    // Check if packages table exists and has language column
    const tableInfo = db.exec(`PRAGMA table_info(packages)`);
    let hasLanguageColumn = false;
    let tableExists = false;
    
    if (tableInfo.length > 0 && tableInfo[0].values) {
      tableExists = true;
      hasLanguageColumn = tableInfo[0].values.some((row: any[]) => row[1] === 'language');
    }
    
    if (!tableExists) {
      // Create new packages table
      db.exec(`
        CREATE TABLE packages (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          internalTitle TEXT NOT NULL,
          parentPackageId INTEGER REFERENCES packages(id) ON DELETE CASCADE,
          total REAL NOT NULL,
          addVat INTEGER DEFAULT 0,
          createdAt TEXT NOT NULL,
          updatedAt TEXT NOT NULL
        );
      `);
    } else if (hasLanguageColumn) {
      // Migrate existing table
      db.exec(`
        CREATE TABLE packages_new (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          internalTitle TEXT NOT NULL,
          parentPackageId INTEGER REFERENCES packages(id) ON DELETE CASCADE,
          total REAL NOT NULL,
          addVat INTEGER DEFAULT 0,
          createdAt TEXT NOT NULL,
          updatedAt TEXT NOT NULL
        );
        
        INSERT INTO packages_new (id, internalTitle, parentPackageId, total, addVat, createdAt, updatedAt)
        SELECT id, internalTitle, parentPackageId, total, addVat, createdAt, updatedAt FROM packages;
        
        DROP TABLE packages;
        ALTER TABLE packages_new RENAME TO packages;
      `);
    }
  } catch (error) {
    console.warn('Package table migration error (creating fresh table):', error);
    // If migration fails, drop and recreate
    try {
      db.exec(`DROP TABLE IF EXISTS packages;`);
      db.exec(`
        CREATE TABLE packages (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          internalTitle TEXT NOT NULL,
          parentPackageId INTEGER REFERENCES packages(id) ON DELETE CASCADE,
          total REAL NOT NULL,
          addVat INTEGER DEFAULT 0,
          createdAt TEXT NOT NULL,
          updatedAt TEXT NOT NULL
        );
      `);
    } catch (recreateError) {
      console.error('Failed to recreate packages table:', recreateError);
    }
  }

  // Continue with the rest of the schema
  db.exec(`
    CREATE TABLE IF NOT EXISTS package_line_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      packageId INTEGER NOT NULL REFERENCES packages(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      quantity INTEGER NOT NULL DEFAULT 1,
      amount REAL NOT NULL DEFAULT 0,
      parentItemId INTEGER REFERENCES package_line_items(id) ON DELETE CASCADE,
      description TEXT
    );

    CREATE INDEX IF NOT EXISTS idx_packages_parent ON packages(parentPackageId);
    CREATE INDEX IF NOT EXISTS idx_line_items_package ON package_line_items(packageId);

    CREATE TABLE IF NOT EXISTS offers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      offerNumber TEXT NOT NULL UNIQUE,
      customerId INTEGER NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'draft',
      validUntil TEXT NOT NULL,
      subtotal REAL NOT NULL DEFAULT 0,
      vatRate REAL NOT NULL DEFAULT 19,
      vatAmount REAL NOT NULL DEFAULT 0,
      total REAL NOT NULL DEFAULT 0,
      notes TEXT,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS offer_line_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      offerId INTEGER NOT NULL REFERENCES offers(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      description TEXT,
      quantity INTEGER NOT NULL DEFAULT 1,
      unitPrice REAL NOT NULL DEFAULT 0,
      total REAL NOT NULL DEFAULT 0,
      parentItemId INTEGER REFERENCES offer_line_items(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS invoices (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      invoiceNumber TEXT NOT NULL UNIQUE,
      customerId INTEGER NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
      offerId INTEGER REFERENCES offers(id) ON DELETE SET NULL,
      title TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'draft',
      dueDate TEXT NOT NULL,
      subtotal REAL NOT NULL DEFAULT 0,
      vatRate REAL NOT NULL DEFAULT 19,
      vatAmount REAL NOT NULL DEFAULT 0,
      total REAL NOT NULL DEFAULT 0,
      notes TEXT,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS invoice_line_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      invoiceId INTEGER NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      description TEXT,
      quantity INTEGER NOT NULL DEFAULT 1,
      unitPrice REAL NOT NULL DEFAULT 0,
      total REAL NOT NULL DEFAULT 0,
      parentItemId INTEGER REFERENCES invoice_line_items(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_offers_customer ON offers(customerId);
    CREATE INDEX IF NOT EXISTS idx_offers_status ON offers(status);
    CREATE INDEX IF NOT EXISTS idx_invoices_customer ON invoices(customerId);
    CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
    CREATE INDEX IF NOT EXISTS idx_offer_items_offer ON offer_line_items(offerId);
    CREATE INDEX IF NOT EXISTS idx_invoice_items_invoice ON invoice_line_items(invoiceId);
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
