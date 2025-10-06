// Migration 015: Add status versioning and history tracking for offers, invoices, and timesheets
import type { Database } from 'better-sqlite3';

export const up = (db: Database): void => {
  console.log('🗄️ [Migration 015] Adding status versioning and history tracking...');
  
  // 1. Add version and updated_at columns to offers table
  console.log('🔧 Adding version and timestamp tracking to offers...');
  
  const offersInfo = db.prepare(`PRAGMA table_info(offers)`).all() as Array<{
    cid: number;
    name: string;
    type: string;
    notnull: number;
    dflt_value: any;
    pk: number;
  }>;
  
  const hasVersion = offersInfo.some(col => col.name === 'version');
  const hasUpdatedAt = offersInfo.some(col => col.name === 'updated_at');
  const hasSentAt = offersInfo.some(col => col.name === 'sent_at');
  const hasAcceptedAt = offersInfo.some(col => col.name === 'accepted_at');
  const hasRejectedAt = offersInfo.some(col => col.name === 'rejected_at');
  
  if (!hasVersion) {
    db.exec(`ALTER TABLE offers ADD COLUMN version INTEGER NOT NULL DEFAULT 0;`);
    console.log('✅ Added version column to offers');
  }
  
  if (!hasUpdatedAt) {
    db.exec(`ALTER TABLE offers ADD COLUMN updated_at TEXT NOT NULL DEFAULT (datetime('now'));`);
    console.log('✅ Added updated_at column to offers');
  }
  
  if (!hasSentAt) {
    db.exec(`ALTER TABLE offers ADD COLUMN sent_at TEXT;`);
    console.log('✅ Added sent_at column to offers');
  }
  
  if (!hasAcceptedAt) {
    db.exec(`ALTER TABLE offers ADD COLUMN accepted_at TEXT;`);
    console.log('✅ Added accepted_at column to offers');
  }
  
  if (!hasRejectedAt) {
    db.exec(`ALTER TABLE offers ADD COLUMN rejected_at TEXT;`);
    console.log('✅ Added rejected_at column to offers');
  }
  
  // 2. Add version and timestamp tracking to invoices table
  console.log('🔧 Adding version and timestamp tracking to invoices...');
  
  const invoicesInfo = db.prepare(`PRAGMA table_info(invoices)`).all() as Array<{
    cid: number;
    name: string;
    type: string;
    notnull: number;
    dflt_value: any;
    pk: number;
  }>;
  
  const invoicesHasVersion = invoicesInfo.some(col => col.name === 'version');
  const invoicesHasUpdatedAt = invoicesInfo.some(col => col.name === 'updated_at');
  const invoicesHasSentAt = invoicesInfo.some(col => col.name === 'sent_at');
  const invoicesHasPaidAt = invoicesInfo.some(col => col.name === 'paid_at');
  const invoicesHasOverdueAt = invoicesInfo.some(col => col.name === 'overdue_at');
  const invoicesHasCancelledAt = invoicesInfo.some(col => col.name === 'cancelled_at');
  
  if (!invoicesHasVersion) {
    db.exec(`ALTER TABLE invoices ADD COLUMN version INTEGER NOT NULL DEFAULT 0;`);
    console.log('✅ Added version column to invoices');
  }
  
  if (!invoicesHasUpdatedAt) {
    db.exec(`ALTER TABLE invoices ADD COLUMN updated_at TEXT NOT NULL DEFAULT (datetime('now'));`);
    console.log('✅ Added updated_at column to invoices');
  }
  
  if (!invoicesHasSentAt) {
    db.exec(`ALTER TABLE invoices ADD COLUMN sent_at TEXT;`);
    console.log('✅ Added sent_at column to invoices');
  }
  
  if (!invoicesHasPaidAt) {
    db.exec(`ALTER TABLE invoices ADD COLUMN paid_at TEXT;`);
    console.log('✅ Added paid_at column to invoices');
  }
  
  if (!invoicesHasOverdueAt) {
    db.exec(`ALTER TABLE invoices ADD COLUMN overdue_at TEXT;`);
    console.log('✅ Added overdue_at column to invoices');
  }
  
  if (!invoicesHasCancelledAt) {
    db.exec(`ALTER TABLE invoices ADD COLUMN cancelled_at TEXT;`);
    console.log('✅ Added cancelled_at column to invoices');
  }
  
  // 3. Add version and timestamp tracking to timesheets table
  console.log('🔧 Adding version and timestamp tracking to timesheets...');
  
  const timesheetsInfo = db.prepare(`PRAGMA table_info(timesheets)`).all() as Array<{
    cid: number;
    name: string;
    type: string;
    notnull: number;
    dflt_value: any;
    pk: number;
  }>;
  
  const timesheetsHasVersion = timesheetsInfo.some(col => col.name === 'version');
  const timesheetsHasUpdatedAt = timesheetsInfo.some(col => col.name === 'updated_at');
  
  if (!timesheetsHasVersion) {
    db.exec(`ALTER TABLE timesheets ADD COLUMN version INTEGER NOT NULL DEFAULT 0;`);
    console.log('✅ Added version column to timesheets');
  }
  
  if (!timesheetsHasUpdatedAt) {
    db.exec(`ALTER TABLE timesheets ADD COLUMN updated_at TEXT NOT NULL DEFAULT (datetime('now'));`);
    console.log('✅ Added updated_at column to timesheets');
  }
  
  // 4. Create status history tables
  console.log('🔧 Creating status history tables...');
  
  // Offer status history
  const offerStatusHistoryExists = db.prepare(`
    SELECT name FROM sqlite_master 
    WHERE type='table' AND name='offer_status_history'
  `).get();
  
  if (!offerStatusHistoryExists) {
    db.exec(`
      CREATE TABLE offer_status_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        offer_id INTEGER NOT NULL REFERENCES offers(id) ON DELETE CASCADE,
        old_status TEXT,
        new_status TEXT NOT NULL CHECK (new_status IN ('draft','sent','accepted','rejected')),
        changed_at TEXT NOT NULL DEFAULT (datetime('now')),
        changed_by TEXT DEFAULT 'system'
      );
    `);
    
    db.exec(`CREATE INDEX idx_offer_status_history_offer_id ON offer_status_history(offer_id);`);
    db.exec(`CREATE INDEX idx_offer_status_history_changed_at ON offer_status_history(changed_at);`);
    
    console.log('✅ Created offer_status_history table');
  }
  
  // Invoice status history
  const invoiceStatusHistoryExists = db.prepare(`
    SELECT name FROM sqlite_master 
    WHERE type='table' AND name='invoice_status_history'
  `).get();
  
  if (!invoiceStatusHistoryExists) {
    db.exec(`
      CREATE TABLE invoice_status_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        invoice_id INTEGER NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
        old_status TEXT,
        new_status TEXT NOT NULL CHECK (new_status IN ('draft','sent','paid','overdue','cancelled')),
        changed_at TEXT NOT NULL DEFAULT (datetime('now')),
        changed_by TEXT DEFAULT 'system'
      );
    `);
    
    db.exec(`CREATE INDEX idx_invoice_status_history_invoice_id ON invoice_status_history(invoice_id);`);
    db.exec(`CREATE INDEX idx_invoice_status_history_changed_at ON invoice_status_history(changed_at);`);
    
    console.log('✅ Created invoice_status_history table');
  }
  
  // Timesheet status history
  const timesheetStatusHistoryExists = db.prepare(`
    SELECT name FROM sqlite_master 
    WHERE type='table' AND name='timesheet_status_history'
  `).get();
  
  if (!timesheetStatusHistoryExists) {
    db.exec(`
      CREATE TABLE timesheet_status_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        timesheet_id INTEGER NOT NULL REFERENCES timesheets(id) ON DELETE CASCADE,
        old_status TEXT,
        new_status TEXT NOT NULL CHECK (new_status IN ('draft','sent','accepted','rejected')),
        changed_at TEXT NOT NULL DEFAULT (datetime('now')),
        changed_by TEXT DEFAULT 'system'
      );
    `);
    
    db.exec(`CREATE INDEX idx_timesheet_status_history_timesheet_id ON timesheet_status_history(timesheet_id);`);
    db.exec(`CREATE INDEX idx_timesheet_status_history_changed_at ON timesheet_status_history(changed_at);`);
    
    console.log('✅ Created timesheet_status_history table');
  }
  
  // 5. Create triggers for automatic status history logging
  console.log('🔧 Creating status change triggers...');
  
  // Drop existing triggers if they exist
  db.exec(`DROP TRIGGER IF EXISTS trg_offers_status_log;`);
  db.exec(`DROP TRIGGER IF EXISTS trg_invoices_status_log;`);
  db.exec(`DROP TRIGGER IF EXISTS trg_timesheets_status_log;`);
  
  // Offer status change trigger
  db.exec(`
    CREATE TRIGGER trg_offers_status_log
    AFTER UPDATE OF status ON offers
    FOR EACH ROW
    WHEN NEW.status <> OLD.status
    BEGIN
      INSERT INTO offer_status_history (offer_id, old_status, new_status)
      VALUES (OLD.id, OLD.status, NEW.status);
    END;
  `);
  
  // Invoice status change trigger
  db.exec(`
    CREATE TRIGGER trg_invoices_status_log
    AFTER UPDATE OF status ON invoices
    FOR EACH ROW
    WHEN NEW.status <> OLD.status
    BEGIN
      INSERT INTO invoice_status_history (invoice_id, old_status, new_status)
      VALUES (OLD.id, OLD.status, NEW.status);
    END;
  `);
  
  // Timesheet status change trigger
  db.exec(`
    CREATE TRIGGER trg_timesheets_status_log
    AFTER UPDATE OF status ON timesheets
    FOR EACH ROW
    WHEN NEW.status <> OLD.status
    BEGIN
      INSERT INTO timesheet_status_history (timesheet_id, old_status, new_status)
      VALUES (OLD.id, OLD.status, NEW.status);
    END;
  `);
  
  console.log('✅ Created status change triggers');
  
  // 6. Add CHECK constraints for status values (idempotent)
  console.log('🔧 Ensuring status CHECK constraints...');
  
  // Note: SQLite doesn't support adding CHECK constraints to existing columns easily
  // The constraints will be enforced at application level and in the history tables
  
  console.log('🗄️ [Migration 015] Status versioning and history tracking completed successfully');
};

export const down = (db: Database): void => {
  console.log('🗄️ [Migration 015] Reverting status versioning and history tracking...');
  
  // Drop triggers
  db.exec(`DROP TRIGGER IF EXISTS trg_offers_status_log;`);
  db.exec(`DROP TRIGGER IF EXISTS trg_invoices_status_log;`);
  db.exec(`DROP TRIGGER IF EXISTS trg_timesheets_status_log;`);
  
  // Drop status history tables
  db.exec('DROP TABLE IF EXISTS offer_status_history;');
  db.exec('DROP TABLE IF EXISTS invoice_status_history;');
  db.exec('DROP TABLE IF EXISTS timesheet_status_history;');
  
  // Note: We don't drop the version and timestamp columns as they might be referenced
  // This is a design choice for data safety in production environments
  console.warn('⚠️ Version and timestamp columns are preserved for data safety');
  
  console.log('🗄️ [Migration 015] Status versioning reverted (partial)');
};