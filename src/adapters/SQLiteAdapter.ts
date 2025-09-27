import { PersistenceAdapter, Settings, Customer, Package, Offer, Invoice, Timesheet, Activity, TimesheetActivity } from "../persistence/adapter";
import initSqlJs, { type Database, type SqlJsStatic } from "sql.js";
import type { ListPreferences, EntityKey, ListPreference } from "../lib/listPreferences";

function nowIso() {
  return new Date().toISOString();
}

export class SQLiteAdapter implements PersistenceAdapter {
  private SQL: SqlJsStatic | null = null;
  private db: Database | null = null;
  private persistTimer: NodeJS.Timeout | null = null;
  
  async ready(): Promise<void> {
    console.log('🔄 [SQLiteAdapter] Initializing...');
    
    // ✨ CRITICAL FIX: Detect Electron vs Browser context
    const isElectron = typeof window !== 'undefined' && window.rawalite?.db;
    console.log(`🔍 [SQLiteAdapter] Context detection: ${isElectron ? 'Electron (IPC)' : 'Browser (LocalStorage)'}`);
    
    // Initialize sql.js
    if (!this.SQL) {
      this.SQL = await initSqlJs({
        locateFile: (_file: string) => `${import.meta.env.BASE_URL}sql-wasm.wasm`,
      });
    }
    
    if (isElectron) {
      console.log('🔧 [SQLiteAdapter] Using IPC-based file persistence');
      // Try to load database from file system via IPC
      try {
        const data = await window.rawalite.db.load();
        if (data) {
          console.log(`📄 [SQLiteAdapter] Loaded database from file (${data.length} bytes)`);
          this.db = new this.SQL.Database(data);
        } else {
          console.log('📁 [SQLiteAdapter] No file database found, checking for legacy LocalStorage data...');
          await this.migrateFromLocalStorage();
        }
      } catch (error) {
        console.error('❌ [SQLiteAdapter] Failed to load from file, checking legacy data:', error);
        await this.migrateFromLocalStorage();
      }
    } else {
      console.log('🌐 [SQLiteAdapter] Using LocalStorage persistence (Browser mode)');
      // Browser mode: use LocalStorage directly
      await this.loadFromLocalStorage();
    }
    
    if (!this.db) {
      console.log('🆕 [SQLiteAdapter] Creating completely new database');
      this.db = new this.SQL.Database();
    }

    // ✨ CRITICAL FIX: Always ensure schema exists (for new DB, migrated DB, or loaded DB)
    console.log('🔧 [SQLiteAdapter] Ensuring database schema is complete...');
    
    // ✨ SAFE SCHEMA MANAGEMENT: Following DEBUGGING_STANDARDS.md patterns
    try {
      console.log('🔍 [SQLiteAdapter] Starting comprehensive database schema analysis...');
      
      const isLegacyMigration = this.detectLegacyDatabase();
      console.log(`📊 [SQLiteAdapter] Database analysis complete. Legacy migration needed: ${isLegacyMigration}`);
      
      if (isLegacyMigration) {
        console.log('🚨 [SQLiteAdapter] LEGACY DATABASE DETECTED - Starting safe migration process...');
        
        // BACKUP: Create backup before any schema changes (MIGRATION_SYSTEM.md pattern)
        await this.createMigrationBackup();
        
        // INCREMENTAL: Apply missing schema components safely
        await this.applyIncrementalSchemaUpdate();
        
        console.log('✅ [SQLiteAdapter] Legacy schema migration completed successfully');
      } else {
        console.log('🔧 [SQLiteAdapter] New/Modern database - ensuring complete schema creation...');
        
        // CRITICAL FIX: Always use robust schema creation for new databases
        await this.ensureCompleteSchema();
        
        console.log('✅ [SQLiteAdapter] Complete schema creation finished successfully');
      }
    } catch (migrationError) {
      console.error('💥 [SQLiteAdapter] MIGRATION ERROR - Following emergency protocols:', migrationError);
      
      // EMERGENCY FALLBACK: Always ensure basic schema exists
      try {
        console.log('🆘 [SQLiteAdapter] Emergency schema creation...');
        this.createSchemaIfNeeded();
        console.log('✅ [SQLiteAdapter] Emergency schema creation successful');
      } catch (emergencyError) {
        console.error('☠️ [SQLiteAdapter] FATAL: Emergency schema creation failed:', emergencyError);
        const errorMessage = emergencyError instanceof Error ? emergencyError.message : String(emergencyError);
        throw new Error(`Database initialization failed: ${errorMessage}`);
      }
    }
    
    if (this.db) {
      await this.persistToDisk(); // Save schema updates
    }
    
    this.setupAutoSave();
  }

  // 🔄 Migration from legacy LocalStorage-based system  
  private async migrateFromLocalStorage(): Promise<void> {
    try {
      const legacyData = localStorage.getItem("rawalite.db");
      if (legacyData) {
        console.log('📦 [MIGRATION] Found legacy LocalStorage data, migrating to file system...');
        
        // Decode Base64 -> Uint8Array (same logic as legacy db.ts)
        const bin = atob(legacyData);
        const len = bin.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) bytes[i] = bin.charCodeAt(i);
        
        // Create database from legacy data
        this.db = new this.SQL!.Database(bytes);
        console.log(`✅ [MIGRATION] Successfully loaded legacy database (${bytes.length} bytes)`);
        
        // Persist to new file system immediately
        await this.persistToDisk();
        console.log('💾 [MIGRATION] Legacy data migrated to file system');
        
        // Optionally remove from localStorage after successful migration
        // localStorage.removeItem("rawalite.db");
        // console.log('🧹 [MIGRATION] Cleaned up legacy LocalStorage data');
      } else {
        console.log('❌ [MIGRATION] No legacy LocalStorage data found');
      }
    } catch (error) {
      console.error('❌ [MIGRATION] Failed to migrate legacy data:', error);
    }
  }

  // 🌐 Browser mode: Load directly from LocalStorage
  private async loadFromLocalStorage(): Promise<void> {
    try {
      const storedData = localStorage.getItem("rawalite.db");
      if (storedData) {
        console.log('📦 [BROWSER] Found LocalStorage database data');
        
        // Decode Base64 -> Uint8Array (same logic as legacy db.ts)
        const bin = atob(storedData);
        const len = bin.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) bytes[i] = bin.charCodeAt(i);
        
        // Create database from stored data
        this.db = new this.SQL!.Database(bytes);
        console.log(`✅ [BROWSER] Successfully loaded database (${bytes.length} bytes)`);
      } else {
        console.log('❌ [BROWSER] No LocalStorage database found - will create new');
      }
    } catch (error) {
      console.error('❌ [BROWSER] Failed to load from LocalStorage:', error);
    }
  }
  
  // ✨ Unified persistence (IPC or LocalStorage based on context)
  private async persistToDisk(): Promise<void> {
    if (!this.db) return;
    
    try {
      const data = this.db.export();
      const isElectron = typeof window !== 'undefined' && window.rawalite?.db;
      
      if (isElectron) {
        console.log(`💾 [IPC] Persisting to file (${data.length} bytes)`);
        await window.rawalite.db.save(data);
        console.log('✅ [IPC] Successfully persisted to file');
      } else {
        console.log(`💾 [BROWSER] Persisting to localStorage (${data.length} bytes)`);
        // Encode Uint8Array -> Base64 for LocalStorage
        let bin = '';
        for (let i = 0; i < data.length; i++) bin += String.fromCharCode(data[i]);
        const base64Data = btoa(bin);
        localStorage.setItem("rawalite.db", base64Data);
        console.log('✅ [BROWSER] Successfully persisted to localStorage');
      }
    } catch (error) {
      console.error('❌ [SQLiteAdapter] Failed to persist:', error);
      throw error;
    }
  }
  
  // ✨ Debounced auto-save to prevent too frequent disk writes
  private schedulePersist(): void {
    if (this.persistTimer) {
      clearTimeout(this.persistTimer);
    }
    
    this.persistTimer = setTimeout(async () => {
      try {
        await this.persistToDisk();
      } catch (error) {
        console.error('❌ [SQLiteAdapter] Scheduled persist failed:', error);
      }
    }, 500); // 500ms debounce for better performance than LocalStorage's 250ms
  }
  
  // ✨ Setup automatic saving after mutations
  private setupAutoSave(): void {
    if (!this.db) return;
    
    const originalExec = this.db.exec.bind(this.db);
    this.db.exec = (...args: Parameters<Database["exec"]>) => {
      const result = originalExec(...args);
      const sqlText = String(args[0] ?? "").toUpperCase();
      if (/INSERT|UPDATE|DELETE|REPLACE|CREATE|DROP|ALTER/.test(sqlText)) {
        console.log(`🔄 [SQLiteAdapter] Mutation detected, scheduling persist`);
        this.schedulePersist();
      }
      return result;
    };
    
    // Install beforeunload handler for final save
    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', () => {
        console.log('🚨 [SQLiteAdapter] App closing - forcing final persist');
        if (this.persistTimer) {
          clearTimeout(this.persistTimer);
        }
        // Note: beforeunload should be synchronous, but we'll try our best
        this.persistToDisk().catch(console.error);
      });
    }
  }
  
  // ✨ Manual force persist (called by IPC)
  async forcePersist(): Promise<void> {
    console.log('🚨 [SQLiteAdapter] Force persist requested');
    if (this.persistTimer) {
      clearTimeout(this.persistTimer);
      this.persistTimer = null;
    }
    await this.persistToDisk();
  }
  
  // ✨ Database helper functions (replacing imports from sqlite/db)
  private all<T = any>(sql: string, params: any[] = []): T[] {
    if (!this.db) throw new Error("Database not initialized");
    const stmt = this.db.prepare(sql);
    try {
      stmt.bind(params);
      const rows: T[] = [];
      while (stmt.step()) rows.push(stmt.getAsObject() as T);
      return rows;
    } finally {
      stmt.free();
    }
  }
  
  private run(sql: string, params: any[] = []): void {
    if (!this.db) throw new Error("Database not initialized");
    const stmt = this.db.prepare(sql);
    try {
      stmt.bind(params);
      stmt.step();
    } finally {
      stmt.free();
    }
  }
  
  // Transaction state tracking to prevent nested transactions
  private inTransaction = false;
  
  private async withTx<T>(fn: () => T | Promise<T>): Promise<T> {
    if (!this.db) throw new Error("Database not initialized");
    
    // If we're already in a transaction, just execute the function
    if (this.inTransaction) {
      console.warn('⚠️ [SQLiteAdapter] Skipping nested transaction - executing directly within current transaction');
      return await fn();
    }
    
    // Start new transaction
    console.log('🔄 [SQLiteAdapter] Starting new transaction');
    this.inTransaction = true;
    this.db.exec("BEGIN");
    try {
      const res = await fn();
      this.db.exec("COMMIT");
      console.log('✅ [SQLiteAdapter] Transaction committed successfully');
      return res;
    } catch (e) {
      console.error('❌ [SQLiteAdapter] Transaction failed, rolling back:', e);
      this.db.exec("ROLLBACK");
      throw e;
    } finally {
      this.inTransaction = false;
    }
  }
  
  // ✨ LEGACY MIGRATION FIX: Detect if this is a legacy database that needs schema updates
  private detectLegacyDatabase(): boolean {
    if (!this.db) return false;
    
    try {
      const existingTables = this.all<{name: string}>(`
        SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'
      `);
      const tableNames = existingTables.map(t => t.name);
      console.log('📋 [SQLiteAdapter] Existing tables:', tableNames);
      
      const requiredTables = ['customers', 'invoices', 'offers', 'timesheets', 'packages'];
      const missingTables = requiredTables.filter(table => !tableNames.includes(table));
      
      // If we have settings but missing core business tables, it's a legacy DB
      const hasSettings = tableNames.includes('settings');
      const isLegacy = hasSettings && missingTables.length > 0;
      
      if (isLegacy) {
        console.log('🚨 [SQLiteAdapter] LEGACY DATABASE detected:');
        console.log('   ✅ Has settings table (legacy indicator)');
        console.log('   ❌ Missing required tables:', missingTables);
        return true;
      }
      
      console.log('✅ [SQLiteAdapter] Modern database schema detected');
      return false;
    } catch (error) {
      console.warn('⚠️ [SQLiteAdapter] Error detecting legacy database:', error);
      return false; // Safe fallback
    }
  }

  // 🛡️ BACKUP: Create migration backup following MIGRATION_SYSTEM.md patterns
  private async createMigrationBackup(): Promise<void> {
    if (!this.db) return;
    
    try {
      console.log('💾 [BACKUP] Creating migration backup...');
      const backupData = this.db.export();
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      
      const isElectron = typeof window !== 'undefined' && window.rawalite?.db;
      
      if (isElectron) {
        // Note: Backup via IPC might be added later - for now use localStorage fallback
        console.log('ℹ️ [BACKUP] Electron context - using localStorage fallback for backup');
        const backupKey = `rawalite.electron.backup.legacy-migration-${timestamp}`;
        let bin = '';
        for (let i = 0; i < backupData.length; i++) bin += String.fromCharCode(backupData[i]);
        localStorage.setItem(backupKey, btoa(bin));
        console.log(`✅ [BACKUP] Migration backup stored: ${backupKey}`);
      } else {
        // Browser fallback: store in localStorage with timestamp
        const backupKey = `rawalite.backup.legacy-migration-${timestamp}`;
        let bin = '';
        for (let i = 0; i < backupData.length; i++) bin += String.fromCharCode(backupData[i]);
        localStorage.setItem(backupKey, btoa(bin));
        console.log(`✅ [BACKUP] Migration backup stored in localStorage: ${backupKey}`);
      }
    } catch (error) {
      console.error('❌ [BACKUP] Failed to create migration backup:', error);
      // Don't throw - backup failure shouldn't prevent migration
    }
  }

  // 🔄 INCREMENTAL: Apply schema updates safely following MIGRATION_SYSTEM.md patterns
  private async applyIncrementalSchemaUpdate(): Promise<void> {
    if (!this.db) return;
    
    try {
      console.log('🔧 [MIGRATION] Starting incremental schema update...');
      
      // Get current table state
      const existingTables = this.all<{name: string}>(`
        SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'
      `);
      const tableNames = existingTables.map(t => t.name);
      
      // Apply each missing table incrementally with error handling
      const requiredTables = [
        'customers', 'packages', 'package_line_items', 
        'offers', 'offer_line_items', 'invoices', 'invoice_line_items',
        'timesheets', 'activities', 'timesheet_activities'
      ];
      
      for (const tableName of requiredTables) {
        if (!tableNames.includes(tableName)) {
          try {
            console.log(`📝 [MIGRATION] Adding missing table: ${tableName}`);
            await this.createTableByName(tableName);
            console.log(`✅ [MIGRATION] Successfully added table: ${tableName}`);
          } catch (tableError) {
            console.error(`❌ [MIGRATION] Failed to create table ${tableName}:`, tableError);
            // Continue with other tables - partial migration is better than total failure
          }
        } else {
          console.log(`✅ [MIGRATION] Table ${tableName} already exists`);
        }
      }
      
      // Apply indices if missing
      try {
        await this.createIndicesIfNeeded();
        console.log('✅ [MIGRATION] Indices updated successfully');
      } catch (indexError) {
        console.error('⚠️ [MIGRATION] Index creation failed (non-critical):', indexError);
      }
      
      console.log('✅ [MIGRATION] Incremental schema update completed');
      
    } catch (error) {
      console.error('💥 [MIGRATION] Incremental schema update failed:', error);
      throw error;
    }
  }

  // 🏗️ Create individual table by name (safer than bulk execution)
  private async createTableByName(tableName: string): Promise<void> {
    if (!this.db) return;
    
    const tableDefinitions: Record<string, string> = {
      customers: `
        CREATE TABLE customers (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          number TEXT NOT NULL UNIQUE,
          name TEXT NOT NULL,
          email TEXT, phone TEXT,
          street TEXT, zip TEXT, city TEXT,
          notes TEXT,
          createdAt TEXT NOT NULL,
          updatedAt TEXT NOT NULL
        )`,
      packages: `
        CREATE TABLE packages (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          internalTitle TEXT NOT NULL,
          parentPackageId INTEGER REFERENCES packages(id) ON DELETE CASCADE,
          total REAL NOT NULL,
          addVat INTEGER DEFAULT 0,
          createdAt TEXT NOT NULL,
          updatedAt TEXT NOT NULL
        )`,
      package_line_items: `
        CREATE TABLE package_line_items (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          packageId INTEGER NOT NULL REFERENCES packages(id) ON DELETE CASCADE,
          parentId INTEGER REFERENCES package_line_items(id) ON DELETE CASCADE,
          title TEXT NOT NULL,
          description TEXT,
          quantity REAL DEFAULT 1,
          unit TEXT DEFAULT 'Stück',
          unitPrice REAL DEFAULT 0,
          total REAL DEFAULT 0,
          sortOrder INTEGER DEFAULT 0,
          createdAt TEXT NOT NULL,
          updatedAt TEXT NOT NULL
        )`,
      offers: `
        CREATE TABLE offers (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          offerNumber TEXT NOT NULL UNIQUE,
          customerId INTEGER NOT NULL REFERENCES customers(id),
          title TEXT NOT NULL,
          description TEXT,
          notes TEXT,
          status TEXT NOT NULL DEFAULT 'draft',
          validUntil TEXT,
          subtotal REAL DEFAULT 0,
          taxRate REAL DEFAULT 19.0,
          taxAmount REAL DEFAULT 0,
          total REAL DEFAULT 0,
          createdAt TEXT NOT NULL,
          updatedAt TEXT NOT NULL
        )`,
      offer_line_items: `
        CREATE TABLE offer_line_items (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          offerId INTEGER NOT NULL REFERENCES offers(id) ON DELETE CASCADE,
          parentId INTEGER REFERENCES offer_line_items(id) ON DELETE CASCADE,
          title TEXT NOT NULL,
          description TEXT,
          quantity REAL DEFAULT 1,
          unit TEXT DEFAULT 'Stück',
          unitPrice REAL DEFAULT 0,
          total REAL DEFAULT 0,
          sortOrder INTEGER DEFAULT 0,
          createdAt TEXT NOT NULL,
          updatedAt TEXT NOT NULL
        )`,
      invoices: `
        CREATE TABLE invoices (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          invoiceNumber TEXT NOT NULL UNIQUE,
          customerId INTEGER NOT NULL REFERENCES customers(id),
          offerId INTEGER REFERENCES offers(id),
          title TEXT NOT NULL,
          description TEXT,
          notes TEXT,
          status TEXT NOT NULL DEFAULT 'draft',
          invoiceDate TEXT NOT NULL,
          dueDate TEXT,
          subtotal REAL DEFAULT 0,
          taxRate REAL DEFAULT 19.0,
          taxAmount REAL DEFAULT 0,
          total REAL DEFAULT 0,
          paidAt TEXT,
          createdAt TEXT NOT NULL,
          updatedAt TEXT NOT NULL
        )`,
      invoice_line_items: `
        CREATE TABLE invoice_line_items (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          invoiceId INTEGER NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
          parentId INTEGER REFERENCES invoice_line_items(id) ON DELETE CASCADE,
          title TEXT NOT NULL,
          description TEXT,
          quantity REAL DEFAULT 1,
          unit TEXT DEFAULT 'Stück',
          unitPrice REAL DEFAULT 0,
          total REAL DEFAULT 0,
          sortOrder INTEGER DEFAULT 0,
          createdAt TEXT NOT NULL,
          updatedAt TEXT NOT NULL
        )`,
      timesheets: `
        CREATE TABLE timesheets (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          timesheetNumber TEXT NOT NULL UNIQUE,
          customerId INTEGER NOT NULL REFERENCES customers(id),
          title TEXT NOT NULL,
          description TEXT,
          notes TEXT,
          status TEXT NOT NULL DEFAULT 'draft',
          startDate TEXT,
          endDate TEXT,
          totalHours REAL DEFAULT 0,
          hourlyRate REAL DEFAULT 0,
          subtotal REAL DEFAULT 0,
          taxRate REAL DEFAULT 19.0,
          taxAmount REAL DEFAULT 0,
          total REAL DEFAULT 0,
          createdAt TEXT NOT NULL,
          updatedAt TEXT NOT NULL
        )`,
      activities: `
        CREATE TABLE activities (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL UNIQUE,
          description TEXT,
          defaultHourlyRate REAL DEFAULT 0,
          isActive INTEGER DEFAULT 1,
          createdAt TEXT NOT NULL,
          updatedAt TEXT NOT NULL
        )`,
      timesheet_activities: `
        CREATE TABLE timesheet_activities (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          timesheetId INTEGER NOT NULL REFERENCES timesheets(id) ON DELETE CASCADE,
          activityId INTEGER NOT NULL REFERENCES activities(id),
          hours REAL DEFAULT 0,
          hourlyRate REAL DEFAULT 0,
          total REAL DEFAULT 0,
          description TEXT,
          position TEXT
        )`
    };
    
    const sql = tableDefinitions[tableName];
    if (!sql) {
      throw new Error(`Unknown table: ${tableName}`);
    }
    
    this.db.exec(sql);
  }

  // 📊 Create indices safely
  private async createIndicesIfNeeded(): Promise<void> {
    if (!this.db) return;
    
    const indices = [
      'CREATE INDEX IF NOT EXISTS idx_timesheets_customer ON timesheets(customerId)',
      'CREATE INDEX IF NOT EXISTS idx_timesheets_status ON timesheets(status)',
      'CREATE INDEX IF NOT EXISTS idx_timesheets_dates ON timesheets(startDate, endDate)',
      'CREATE INDEX IF NOT EXISTS idx_timesheet_activities_timesheet ON timesheet_activities(timesheetId)',
      'CREATE INDEX IF NOT EXISTS idx_timesheet_activities_activity ON timesheet_activities(activityId)'
    ];
    
    for (const indexSql of indices) {
      try {
        this.db.exec(indexSql);
      } catch (error) {
        console.warn(`⚠️ [MIGRATION] Failed to create index (non-critical):`, error);
      }
    }
  }

  // 🏗️ ROBUST SCHEMA: Complete schema creation for new databases
  private async ensureCompleteSchema(): Promise<void> {
    if (!this.db) throw new Error('Database not available for schema creation');
    
    try {
      console.log('🏗️ [SCHEMA] Starting complete schema creation...');
      
      // First: Get current table state for debugging
      const existingTables = this.all<{name: string}>(`
        SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'
      `);
      console.log('📋 [SCHEMA] Tables before creation:', existingTables.map(t => t.name));
      
      // Use the robust createSchemaIfNeeded method
      this.createSchemaIfNeeded();
      
      // Verify all required tables were created
      const finalTables = this.all<{name: string}>(`
        SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'
      `);
      const finalTableNames = finalTables.map(t => t.name);
      console.log('📋 [SCHEMA] Tables after creation:', finalTableNames);
      
      // Validate critical tables exist
      const requiredTables = ['settings', 'customers', 'packages', 'offers', 'invoices', 'timesheets', 'activities'];
      const missingTables = requiredTables.filter(table => !finalTableNames.includes(table));
      
      if (missingTables.length > 0) {
        console.error('❌ [SCHEMA] CRITICAL: Missing required tables after schema creation:', missingTables);
        
        // Emergency: Try to create missing tables individually
        for (const missingTable of missingTables) {
          try {
            console.log(`🆘 [SCHEMA] Emergency creation of table: ${missingTable}`);
            await this.createTableByName(missingTable);
          } catch (tableError) {
            console.error(`💥 [SCHEMA] Failed to create ${missingTable}:`, tableError);
          }
        }
        
        // Final verification
        const finalCheck = this.all<{name: string}>(`
          SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'
        `);
        console.log('📋 [SCHEMA] Final table verification:', finalCheck.map(t => t.name));
      } else {
        console.log('✅ [SCHEMA] All required tables created successfully');
      }
      
      // Create indices
      await this.createIndicesIfNeeded();
      
      console.log('🎯 [SCHEMA] Complete schema creation finished');
      
    } catch (error) {
      console.error('💥 [SCHEMA] Complete schema creation failed:', error);
      throw error;
    }
  }

  private createSchemaIfNeeded(): void {
    if (!this.db) return;
    
    console.log('🔧 [SQLiteAdapter] Creating database schema');
    
    // Create complete schema based on the original sqlite/db.ts implementation
    this.db.exec(`
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
        listPreferences TEXT DEFAULT '{}',
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
      
      CREATE TABLE IF NOT EXISTS packages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        internalTitle TEXT NOT NULL,
        parentPackageId INTEGER REFERENCES packages(id) ON DELETE CASCADE,
        total REAL NOT NULL,
        addVat INTEGER DEFAULT 0,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS package_line_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        packageId INTEGER NOT NULL REFERENCES packages(id) ON DELETE CASCADE,
        parentId INTEGER REFERENCES package_line_items(id) ON DELETE CASCADE,
        title TEXT NOT NULL,
        description TEXT,
        quantity REAL DEFAULT 1,
        unit TEXT DEFAULT 'Stück',
        unitPrice REAL DEFAULT 0,
        total REAL DEFAULT 0,
        sortOrder INTEGER DEFAULT 0,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS offers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        offerNumber TEXT NOT NULL UNIQUE,
        customerId INTEGER NOT NULL REFERENCES customers(id),
        title TEXT NOT NULL,
        description TEXT,
        notes TEXT,
        status TEXT NOT NULL DEFAULT 'draft',
        validUntil TEXT,
        subtotal REAL DEFAULT 0,
        taxRate REAL DEFAULT 19.0,
        taxAmount REAL DEFAULT 0,
        total REAL DEFAULT 0,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS offer_line_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        offerId INTEGER NOT NULL REFERENCES offers(id) ON DELETE CASCADE,
        parentId INTEGER REFERENCES offer_line_items(id) ON DELETE CASCADE,
        title TEXT NOT NULL,
        description TEXT,
        quantity REAL DEFAULT 1,
        unit TEXT DEFAULT 'Stück',
        unitPrice REAL DEFAULT 0,
        total REAL DEFAULT 0,
        sortOrder INTEGER DEFAULT 0,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS invoices (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        invoiceNumber TEXT NOT NULL UNIQUE,
        customerId INTEGER NOT NULL REFERENCES customers(id),
        offerId INTEGER REFERENCES offers(id),
        title TEXT NOT NULL,
        description TEXT,
        notes TEXT,
        status TEXT NOT NULL DEFAULT 'draft',
        invoiceDate TEXT NOT NULL,
        dueDate TEXT,
        subtotal REAL DEFAULT 0,
        taxRate REAL DEFAULT 19.0,
        taxAmount REAL DEFAULT 0,
        total REAL DEFAULT 0,
        paidAt TEXT,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS invoice_line_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        invoiceId INTEGER NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
        parentId INTEGER REFERENCES invoice_line_items(id) ON DELETE CASCADE,
        title TEXT NOT NULL,
        description TEXT,
        quantity REAL DEFAULT 1,
        unit TEXT DEFAULT 'Stück',
        unitPrice REAL DEFAULT 0,
        total REAL DEFAULT 0,
        sortOrder INTEGER DEFAULT 0,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS timesheets (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        timesheetNumber TEXT NOT NULL UNIQUE,
        customerId INTEGER NOT NULL REFERENCES customers(id),
        title TEXT NOT NULL,
        description TEXT,
        notes TEXT,
        status TEXT NOT NULL DEFAULT 'draft',
        startDate TEXT,
        endDate TEXT,
        totalHours REAL DEFAULT 0,
        hourlyRate REAL DEFAULT 0,
        subtotal REAL DEFAULT 0,
        taxRate REAL DEFAULT 19.0,
        taxAmount REAL DEFAULT 0,
        total REAL DEFAULT 0,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL
      );

      CREATE INDEX IF NOT EXISTS idx_timesheets_customer ON timesheets(customerId);
      CREATE INDEX IF NOT EXISTS idx_timesheets_status ON timesheets(status);
      CREATE INDEX IF NOT EXISTS idx_timesheets_dates ON timesheets(startDate, endDate);

      CREATE TABLE IF NOT EXISTS activities (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE,
        description TEXT,
        defaultHourlyRate REAL DEFAULT 0,
        isActive INTEGER DEFAULT 1,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS timesheet_activities (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        timesheetId INTEGER NOT NULL REFERENCES timesheets(id) ON DELETE CASCADE,
        activityId INTEGER NOT NULL REFERENCES activities(id),
        hours REAL DEFAULT 0,
        hourlyRate REAL DEFAULT 0,
        total REAL DEFAULT 0,
        description TEXT,
        position TEXT
      );

      CREATE INDEX IF NOT EXISTS idx_timesheet_activities_timesheet ON timesheet_activities(timesheetId);
      CREATE INDEX IF NOT EXISTS idx_timesheet_activities_activity ON timesheet_activities(activityId);
    `);
    
    console.log('✅ [SQLiteAdapter] Database schema created successfully');
  }

  // SETTINGS
  async getSettings(): Promise<Settings> {
    const rows = this.all<Settings>("SELECT * FROM settings WHERE id = 1");
    
    // Fallback: Falls keine Settings existieren, Standard-Settings zurückgeben
    if (!rows || rows.length === 0) {
      console.warn('⚠️ [SQLiteAdapter] No settings found in database, creating default settings');
      const defaultSettings: Settings = {
        id: 1,
        companyName: '',
        street: '',
        zip: '',
        city: '',
        taxId: '',
        kleinunternehmer: true,
        nextCustomerNumber: 1,
        nextOfferNumber: 1,
        nextInvoiceNumber: 1,
        nextTimesheetNumber: 1,
        createdAt: nowIso(),
        updatedAt: nowIso()
      };
      
      // Erstelle Standard-Settings in der Datenbank
      this.run(`
        INSERT INTO settings (
          id, companyName, street, zip, city, taxId, kleinunternehmer,
          nextCustomerNumber, nextOfferNumber, nextInvoiceNumber, nextTimesheetNumber,
          createdAt, updatedAt
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        1, '', '', '', '', '', 1, 1, 1, 1, 1,
        defaultSettings.createdAt, defaultSettings.updatedAt
      ]);
      
      return defaultSettings;
    }
    
    return rows[0];
  }

  async updateSettings(patch: Partial<Settings>): Promise<Settings> {
    return this.withTx(async () => {
      const updatedAt = nowIso();
      const fieldsToUpdate = Object.keys(patch).filter(key => key !== 'id' && key !== 'createdAt');
      
      this.run(
        `UPDATE settings SET ${fieldsToUpdate.map(field => `${field} = ?`).join(', ')}, updatedAt = ? WHERE id = 1`,
        [...fieldsToUpdate.map(field => (patch as any)[field]), updatedAt]
      );
      
      return this.getSettings();
    });
  }

  // CUSTOMERS
  async listCustomers(): Promise<Customer[]> {
    return this.all<Customer>(`SELECT * FROM customers ORDER BY createdAt DESC`);
  }

  async getCustomer(id: number): Promise<Customer | null> {
    const rows = this.all<Customer>(`SELECT * FROM customers WHERE id = ?`, [id]);
    return rows.length > 0 ? rows[0] : null;
  }

  async createCustomer(data: Omit<Customer, "id" | "createdAt" | "updatedAt">): Promise<Customer> {
    return this.withTx(async () => {
      const now = nowIso();
      this.run(
        `INSERT INTO customers (number, name, email, phone, street, zip, city, notes, createdAt, updatedAt) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [data.number, data.name, data.email || '', data.phone || '', 
         data.street || '', data.zip || '', data.city || '', data.notes || '', now, now]
      );
      
      const row = this.all<Customer>(`SELECT * FROM customers WHERE rowid = last_insert_rowid()`);
      return row[0];
    });
  }

  async updateCustomer(id: number, patch: Partial<Customer>): Promise<Customer> {
    return this.withTx(async () => {
      const updatedAt = nowIso();
      const fieldsToUpdate = Object.keys(patch).filter(key => 
        key !== 'id' && key !== 'createdAt' && key !== 'updatedAt'
      );
      
      this.run(
        `UPDATE customers SET ${fieldsToUpdate.map(field => `${field} = ?`).join(', ')}, updatedAt = ? WHERE id = ?`,
        [...fieldsToUpdate.map(field => (patch as any)[field]), updatedAt, id]
      );
      
      const customer = await this.getCustomer(id);
      if (!customer) throw new Error(`Customer with id ${id} not found after update`);
      return customer;
    });
  }

  async deleteCustomer(id: number): Promise<void> {
    await this.withTx(async () => {
      this.run(`DELETE FROM customers WHERE id = ?`, [id]);
    });
  }

  // PACKAGES - Simplified implementation for now
  async listPackages(): Promise<Package[]> {
    const packages = this.all<Omit<Package, "lineItems">>(`SELECT * FROM packages ORDER BY createdAt DESC`);
    
    // Load line items for each package  
    return packages.map(pkg => {
      const lineItems = this.all<any>(`SELECT * FROM package_line_items WHERE packageId = ? ORDER BY sortOrder, id`, [pkg.id]);
      
      return {
        ...pkg,
        lineItems: lineItems.map((item: any) => ({
          id: item.id,
          title: item.title,
          description: item.description || '',
          quantity: item.quantity,
          unit: item.unit,
          unitPrice: item.unitPrice,
          total: item.total,
          parentId: item.parentId,
          sortOrder: item.sortOrder,
          createdAt: item.createdAt,
          updatedAt: item.updatedAt
        }))
      };
    });
  }

  // Placeholder implementations - will be completed if needed
  async getPackage(id: number): Promise<Package | null> {
    const rows = this.all<Package>(`SELECT * FROM packages WHERE id = ?`, [id]);
    return rows.length > 0 ? rows[0] : null;
  }

  async createPackage(_data: Omit<Package, "id" | "createdAt" | "updatedAt">): Promise<Package> {
    throw new Error("Not implemented yet - will be added in Phase 2");
  }

  async updatePackage(_id: number, _patch: Partial<Package>): Promise<Package> {
    throw new Error("Not implemented yet - will be added in Phase 2");
  }

  async deletePackage(_id: number): Promise<void> {
    throw new Error("Not implemented yet - will be added in Phase 2");
  }

  // OFFERS - Placeholder implementations
  async listOffers(): Promise<Offer[]> {
    return this.all<Offer>(`SELECT * FROM offers ORDER BY createdAt DESC`);
  }

  async getOffer(id: number): Promise<Offer | null> {
    const rows = this.all<Offer>(`SELECT * FROM offers WHERE id = ?`, [id]);
    return rows.length > 0 ? rows[0] : null;
  }

  async createOffer(_data: Omit<Offer, "id" | "createdAt" | "updatedAt">): Promise<Offer> {
    throw new Error("Not implemented yet - will be added in Phase 2");
  }

  async updateOffer(_id: number, _patch: Partial<Offer>): Promise<Offer> {
    throw new Error("Not implemented yet - will be added in Phase 2");
  }

  async deleteOffer(_id: number): Promise<void> {
    throw new Error("Not implemented yet - will be added in Phase 2");
  }

  // INVOICES - Placeholder implementations  
  async listInvoices(): Promise<Invoice[]> {
    return this.all<Invoice>(`SELECT * FROM invoices ORDER BY createdAt DESC`);
  }

  async getInvoice(id: number): Promise<Invoice | null> {
    const rows = this.all<Invoice>(`SELECT * FROM invoices WHERE id = ?`, [id]);
    return rows.length > 0 ? rows[0] : null;
  }

  async createInvoice(_data: Omit<Invoice, "id" | "createdAt" | "updatedAt">): Promise<Invoice> {
    throw new Error("Not implemented yet - will be added in Phase 2");
  }

  async updateInvoice(_id: number, _patch: Partial<Invoice>): Promise<Invoice> {
    throw new Error("Not implemented yet - will be added in Phase 2");
  }

  async deleteInvoice(_id: number): Promise<void> {
    throw new Error("Not implemented yet - will be added in Phase 2");
  }

  // TIMESHEETS - Critical for the UI freeze fix
  async listTimesheets(): Promise<Timesheet[]> {
    const timesheets = this.all<Omit<Timesheet, "activities">>(`SELECT * FROM timesheets ORDER BY createdAt DESC`);
    
    return timesheets.map(timesheet => {
      const activities = this.all<TimesheetActivity>(`SELECT * FROM timesheet_activities WHERE timesheetId = ?`, [timesheet.id]);
      
      return {
        ...timesheet,
        activities
      };
    });
  }

  async getTimesheet(id: number): Promise<Timesheet | null> {
    const rows = this.all<Omit<Timesheet, "activities">>(`SELECT * FROM timesheets WHERE id = ?`, [id]);
    if (rows.length === 0) return null;
    
    const timesheet = rows[0];
    const activities = this.all<TimesheetActivity>(`SELECT * FROM timesheet_activities WHERE timesheetId = ?`, [id]);
    
    return {
      ...timesheet,
      activities
    };
  }

  async createTimesheet(data: Omit<Timesheet, "id" | "createdAt" | "updatedAt">): Promise<Timesheet> {
    return this.withTx(async () => {
      const now = nowIso();
      
      // Insert timesheet
      this.run(
        `INSERT INTO timesheets (timesheetNumber, customerId, title, description, notes, status, startDate, endDate, totalHours, hourlyRate, subtotal, taxRate, taxAmount, total, createdAt, updatedAt) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          data.timesheetNumber, data.customerId, data.title, data.description || '', data.notes || '',
          data.status, data.startDate || '', data.endDate || '', data.totalHours || 0, data.hourlyRate || 0,
          data.subtotal || 0, data.taxRate || 19.0, data.taxAmount || 0, data.total || 0, now, now
        ]
      );
      
      const timesheetRows = this.all<{id: number}>(`SELECT id FROM timesheets WHERE rowid = last_insert_rowid()`);
      const timesheetId = timesheetRows[0].id;
      
      // Insert activities if provided
      if (data.activities && data.activities.length > 0) {
        for (const activity of data.activities) {
          this.run(
            `INSERT INTO timesheet_activities (timesheetId, activityId, hours, hourlyRate, total, description, position) 
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [
              timesheetId, activity.activityId, activity.hours, activity.hourlyRate,
              activity.total, activity.description || '', activity.position || ''
            ]
          );
        }
      }
      
      const result = await this.getTimesheet(timesheetId);
      if (!result) throw new Error("Failed to retrieve created timesheet");
      return result;
    });
  }

  async updateTimesheet(id: number, patch: Partial<Timesheet>): Promise<Timesheet> {
    return this.withTx(async () => {
      const updatedAt = nowIso();
      
      // Update timesheet fields (excluding activities)
      const { activities, ...timesheetFields } = patch;
      if (Object.keys(timesheetFields).length > 0) {
        const fieldsToUpdate = Object.keys(timesheetFields).filter(key => 
          key !== 'id' && key !== 'createdAt' && key !== 'updatedAt'
        );
        
        if (fieldsToUpdate.length > 0) {
          this.run(
            `UPDATE timesheets SET ${fieldsToUpdate.map(field => `${field} = ?`).join(', ')}, updatedAt = ? WHERE id = ?`,
            [...fieldsToUpdate.map(field => (timesheetFields as any)[field]), updatedAt, id]
          );
        }
      }
      
      // Update activities if provided
      if (activities) {
        // Delete existing activities
        this.run(`DELETE FROM timesheet_activities WHERE timesheetId = ?`, [id]);
        
        // Insert new activities
        for (const activity of activities) {
          this.run(
            `INSERT INTO timesheet_activities (timesheetId, activityId, hours, hourlyRate, total, description, position) 
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [
              id, activity.activityId, activity.hours, activity.hourlyRate,
              activity.total, activity.description || '', activity.position || ''
            ]
          );
        }
      }
      
      const result = await this.getTimesheet(id);
      if (!result) throw new Error(`Timesheet with id ${id} not found after update`);
      return result;
    });
  }

  async deleteTimesheet(id: number): Promise<void> {
    await this.withTx(async () => {
      this.run(`DELETE FROM timesheet_activities WHERE timesheetId = ?`, [id]);
      this.run(`DELETE FROM timesheets WHERE id = ?`, [id]);
    });
  }

  // ACTIVITIES - Needed for timesheets
  async listActivities(): Promise<Activity[]> {
    return this.all<Activity>(`SELECT * FROM activities ORDER BY name`);
  }

  async getActivity(id: number): Promise<Activity | null> {
    const rows = this.all<Activity>(`SELECT * FROM activities WHERE id = ?`, [id]);
    return rows.length > 0 ? rows[0] : null;
  }

  async createActivity(data: Omit<Activity, "id" | "createdAt" | "updatedAt">): Promise<Activity> {
    return this.withTx(async () => {
      const now = nowIso();
      this.run(
        `INSERT INTO activities (name, description, defaultHourlyRate, isActive, createdAt, updatedAt) 
         VALUES (?, ?, ?, ?, ?, ?)`,
        [data.name, data.description || '', data.defaultHourlyRate || 0, data.isActive ? 1 : 0, now, now]
      );
      
      const row = this.all<Activity>(`SELECT * FROM activities WHERE rowid = last_insert_rowid()`);
      return row[0];
    });
  }

  async updateActivity(id: number, patch: Partial<Activity>): Promise<Activity> {
    return this.withTx(async () => {
      const updatedAt = nowIso();
      const fieldsToUpdate = Object.keys(patch).filter(key => 
        key !== 'id' && key !== 'createdAt' && key !== 'updatedAt'
      );
      
      // Handle isActive boolean to integer conversion
      const values = fieldsToUpdate.map(field => {
        const value = (patch as any)[field];
        return field === 'isActive' ? (value ? 1 : 0) : value;
      });
      
      this.run(
        `UPDATE activities SET ${fieldsToUpdate.map(field => `${field} = ?`).join(', ')}, updatedAt = ? WHERE id = ?`,
        [...values, updatedAt, id]
      );
      
      const activity = await this.getActivity(id);
      if (!activity) throw new Error(`Activity with id ${id} not found after update`);
      return activity;
    });
  }

  async deleteActivity(id: number): Promise<void> {
    await this.withTx(async () => {
      this.run(`DELETE FROM activities WHERE id = ?`, [id]);
    });
  }

  // LIST PREFERENCES - Simplified implementation
  async getListPreferences(): Promise<ListPreferences> {
    const settings = await this.getSettings();
    try {
      return settings.listPreferences ? JSON.parse(settings.listPreferences) : {};
    } catch {
      return {};
    }
  }

  async saveListPreference(entityKey: EntityKey, preference: ListPreference): Promise<void> {
    const current = await this.getListPreferences();
    current[entityKey] = preference;
    
    await this.updateSettings({ 
      listPreferences: JSON.stringify(current)
    });
  }

  async deleteListPreference(entityKey: EntityKey): Promise<void> {
    const current = await this.getListPreferences();
    delete current[entityKey];
    
    await this.updateSettings({ 
      listPreferences: JSON.stringify(current)
    });
  }

  // Legacy methods - keeping for interface compatibility
  async setListPreferences(prefs: ListPreferences): Promise<void> {
    await this.updateSettings({ 
      listPreferences: JSON.stringify(prefs)
    });
  }

  async updateListPreference(entityKey: EntityKey, preference: Partial<ListPreference>): Promise<void> {
    const current = await this.getListPreferences();
    current[entityKey] = { ...current[entityKey], ...preference };
    
    await this.updateSettings({ 
      listPreferences: JSON.stringify(current)
    });
  }
}