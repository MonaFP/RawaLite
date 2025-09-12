import initSqlJs, { type Database, type SqlJsStatic } from "sql.js";

const LS_KEY = "rawalite.db";
let SQL: SqlJsStatic | null = null;
let db: Database | null = null;
let persistTimer: number | undefined;

function isElectron() {
  // window.process.type ist nur in Electron vorhanden
  return typeof window !== 'undefined' && !!(window as any).rawalite && !!(window as any).rawalite.db;
}

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
  persistTimer = window.setTimeout(async () => {
    if (!db) return;
    console.log('🔄 schedulePersist: Starting database persistence...');
    const data = db.export();
    console.log('📊 Database export size:', data.length, 'bytes');
    
    if (isElectron()) {
      // Electron: persistiere als Datei
      try {
        console.log('💾 Saving database via Electron IPC...');
        const success = await window.rawalite?.db.save(data);
        console.log('✅ Electron DB save result:', success);
      } catch (err) {
        console.error('❌ Electron DB save error:', err);
        // Fallback to localStorage if Electron fails
        console.log('🔄 Falling back to localStorage...');
        localStorage.setItem(LS_KEY, base64FromU8(data));
      }
    } else {
      // Browser: persistiere in LocalStorage
      console.log('💾 Saving database to localStorage...');
      localStorage.setItem(LS_KEY, base64FromU8(data));
      console.log('✅ LocalStorage save completed');
    }
    console.log('✅ schedulePersist completed');
  }, 250);
}

// Debug-Export für Testing
(window as any).rawaliteDebug = {
  exportDatabase: () => {
    if (!db) return null;
    const data = db.export();
    console.log('🔍 Debug: Database exported', data.length, 'bytes');
    return data;
  },
  saveDatabase: async () => {
    if (!db) return false;
    console.log('🔍 Debug: Manual database save triggered');
    schedulePersist();
    return true;
  },
  getDatabaseInfo: () => {
    const hasDB = !!db;
    const isElectronMode = isElectron();
    const lsSize = localStorage.getItem(LS_KEY)?.length || 0;
    console.log('🔍 Debug: Database info', { hasDB, isElectronMode, lsSize });
    return { hasDB, isElectronMode, lsSize };
  }
};

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
      designSettings TEXT,
      nextCustomerNumber INTEGER DEFAULT 1,
      nextOfferNumber INTEGER DEFAULT 1,
      nextInvoiceNumber INTEGER DEFAULT 1,
      nextTimesheetNumber INTEGER DEFAULT 1,
      createdAt TEXT, updatedAt TEXT
    );

    CREATE TABLE IF NOT EXISTS numbering_circles (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      prefix TEXT NOT NULL,
      digits INTEGER NOT NULL DEFAULT 4,
      current INTEGER NOT NULL DEFAULT 0,
      resetMode TEXT NOT NULL DEFAULT 'never',
      lastResetYear INTEGER,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL
    );

    INSERT INTO settings (id, createdAt, updatedAt)
    SELECT 1, datetime('now'), datetime('now')
    WHERE NOT EXISTS (SELECT 1 FROM settings WHERE id = 1);

    -- Initialize default numbering circles if they don't exist
    INSERT INTO numbering_circles (id, name, prefix, digits, current, resetMode, createdAt, updatedAt)
    SELECT 'customers', 'Kunden', 'K-', 3, 0, 'never', datetime('now'), datetime('now')
    WHERE NOT EXISTS (SELECT 1 FROM numbering_circles WHERE id = 'customers');
    
    INSERT INTO numbering_circles (id, name, prefix, digits, current, resetMode, lastResetYear, createdAt, updatedAt)
    SELECT 'offers', 'Angebote', 'AN-2025-', 4, 0, 'yearly', 2025, datetime('now'), datetime('now')
    WHERE NOT EXISTS (SELECT 1 FROM numbering_circles WHERE id = 'offers');
    
    INSERT INTO numbering_circles (id, name, prefix, digits, current, resetMode, lastResetYear, createdAt, updatedAt)
    SELECT 'invoices', 'Rechnungen', 'RE-2025-', 4, 0, 'yearly', 2025, datetime('now'), datetime('now')
    WHERE NOT EXISTS (SELECT 1 FROM numbering_circles WHERE id = 'invoices');
    
    INSERT INTO numbering_circles (id, name, prefix, digits, current, resetMode, lastResetYear, createdAt, updatedAt)
    SELECT 'packages', 'Pakete', 'PAK-', 3, 0, 'never', NULL, datetime('now'), datetime('now')
    WHERE NOT EXISTS (SELECT 1 FROM numbering_circles WHERE id = 'packages');
    
    INSERT INTO numbering_circles (id, name, prefix, digits, current, resetMode, lastResetYear, createdAt, updatedAt)
    SELECT 'timesheets', 'Leistungsnachweise', 'LN-2025-', 4, 0, 'yearly', 2025, datetime('now'), datetime('now')
    WHERE NOT EXISTS (SELECT 1 FROM numbering_circles WHERE id = 'timesheets');
  `);

  // Add migration columns with better error handling
  try {
    const settingsInfo = db.exec(`PRAGMA table_info(settings)`);
    let hasTimesheetNumberColumn = false;
    let hasDesignSettingsColumn = false;
    
    if (settingsInfo.length > 0 && settingsInfo[0].values) {
      hasTimesheetNumberColumn = settingsInfo[0].values.some((row: any[]) => row[1] === 'nextTimesheetNumber');
      hasDesignSettingsColumn = settingsInfo[0].values.some((row: any[]) => row[1] === 'designSettings');
    }
    
    if (!hasTimesheetNumberColumn) {
      db.exec(`ALTER TABLE settings ADD COLUMN nextTimesheetNumber INTEGER DEFAULT 1;`);
      console.log('✅ Added nextTimesheetNumber column to settings table');
    }
    
    if (!hasDesignSettingsColumn) {
      db.exec(`ALTER TABLE settings ADD COLUMN designSettings TEXT;`);
      console.log('✅ Added designSettings column to settings table');
      
      // ✨ KRITISCH: Nach Hinzufügung der Spalte sofort Default-Werte setzen
      const defaultDesignSettings = JSON.stringify({
        theme: 'salbeigrün',
        navigationMode: 'sidebar'
      });
      
      try {
        run(`UPDATE settings SET designSettings = ? WHERE id = 1 AND (designSettings IS NULL OR designSettings = '')`, [defaultDesignSettings]);
        console.log('✅ Initialized default design settings in database');
      } catch (updateError) {
        console.warn('⚠️ Could not initialize default design settings:', updateError);
      }
    }
  } catch (error) {
    console.warn('⚠️ Settings table migration error:', error);
  }

  db.exec(`
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
      sentAt TEXT,
      acceptedAt TEXT,
      rejectedAt TEXT,
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
      sentAt TEXT,
      paidAt TEXT,
      overdueAt TEXT,
      cancelledAt TEXT,
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

    CREATE TABLE IF NOT EXISTS timesheets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      timesheetNumber TEXT NOT NULL UNIQUE,
      customerId INTEGER NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'draft',
      startDate TEXT NOT NULL,
      endDate TEXT NOT NULL,
      subtotal REAL NOT NULL DEFAULT 0,
      vatRate REAL NOT NULL DEFAULT 19,
      vatAmount REAL NOT NULL DEFAULT 0,
      total REAL NOT NULL DEFAULT 0,
      notes TEXT,
      sentAt TEXT,
      approvedAt TEXT,
      rejectedAt TEXT,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_timesheets_customer ON timesheets(customerId);
    CREATE INDEX IF NOT EXISTS idx_timesheets_status ON timesheets(status);
    CREATE INDEX IF NOT EXISTS idx_timesheets_dates ON timesheets(startDate, endDate);

    -- Activities und Timesheet-Activities
    CREATE TABLE IF NOT EXISTS activities (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      description TEXT,
      defaultHourlyRate REAL NOT NULL DEFAULT 0,
      isActive INTEGER NOT NULL DEFAULT 1,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_activities_name ON activities(name);
    CREATE INDEX IF NOT EXISTS idx_activities_active ON activities(isActive);

    CREATE TABLE IF NOT EXISTS timesheet_activities (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      timesheetId INTEGER NOT NULL REFERENCES timesheets(id) ON DELETE CASCADE,
      activityId INTEGER NOT NULL REFERENCES activities(id) ON DELETE CASCADE,
      hours REAL NOT NULL DEFAULT 0,
      hourlyRate REAL NOT NULL DEFAULT 0,
      total REAL NOT NULL DEFAULT 0,
      description TEXT,
      position TEXT
    );

    CREATE INDEX IF NOT EXISTS idx_timesheet_activities_timesheet ON timesheet_activities(timesheetId);
    CREATE INDEX IF NOT EXISTS idx_timesheet_activities_activity ON timesheet_activities(activityId);

    -- Add position column to existing timesheet_activities table (migration)
    -- This is safe to run multiple times as it will only add the column if it doesn't exist
    PRAGMA table_info(timesheet_activities);
  `);

  // Check if position column exists and add it if not (for existing databases)
  try {
    const columns = all<any>("PRAGMA table_info(timesheet_activities)");
    const hasPositionColumn = columns.some(col => col.name === 'position');
    
    if (!hasPositionColumn) {
      run("ALTER TABLE timesheet_activities ADD COLUMN position TEXT");
      console.log('Added position column to timesheet_activities table');
    }
  } catch (error) {
    console.warn('Migration warning:', error);
  }
}
export async function getDB(): Promise<Database> {
  if (db) return db;
  if (!SQL) {
    SQL = await initSqlJs({
      locateFile: (file: string) => `${import.meta.env.BASE_URL}sql-wasm.wasm`,
    });
  }
  
  let stored: string | Uint8Array | null = null;
  if (isElectron()) {
    // Electron: lade Datei über IPC
    try {
      console.log('🔄 Loading database via Electron IPC...');
      stored = await window.rawalite?.db.load() || null;
      console.log('📊 Loaded database size:', stored ? stored.length : 0, 'bytes');
    } catch (err) {
      console.error('❌ Electron DB load error:', err);
      stored = null;
    }
    db = stored ? new SQL!.Database(stored as Uint8Array) : new SQL!.Database();
  } else {
    // Browser: lade aus LocalStorage
    console.log('🔄 Loading database from localStorage...');
    stored = localStorage.getItem(LS_KEY);
    db = stored ? new SQL!.Database(u8FromBase64(stored as string)) : new SQL!.Database();
  }
  
  // Apply persistence wrapper BEFORE schema creation
  const _exec = db.exec.bind(db);
  db.exec = (...args: Parameters<Database["exec"]>) => {
    const result = _exec(...args);
    const sqlText = String(args[0] ?? "").toUpperCase();
    if (/INSERT|UPDATE|DELETE|REPLACE|CREATE|DROP|ALTER/.test(sqlText)) {
      console.log('🔄 SQL operation triggered persistence:', sqlText.substring(0, 50) + '...');
      schedulePersist();
    }
    return result;
  };
  
  // Now create schema (this will trigger persistence)
  console.log('🔄 Creating database schema...');
  createSchemaIfNeeded();
  
  // Force initial persistence to ensure database.sqlite is created
  console.log('🔄 Forcing initial persistence...');
  schedulePersist();
  
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
    
    // 🔥 CRITICAL FIX: Persistiere nach jeder Datenänderung!
    schedulePersist();
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
    
    // 🔥 CRITICAL FIX: Persistiere nach erfolgreicher Transaktion!
    schedulePersist();
    
    return res;
  } catch (e) {
    d.exec("ROLLBACK");
    throw e;
  }
}
