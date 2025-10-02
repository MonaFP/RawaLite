// Migration 007: Fix packages and invoices schema mismatches
import type { Database } from 'better-sqlite3';

export const up = (db: Database): void => {
  console.log('🗄️ [Migration 007] Fixing packages and invoices schema mismatches...');
  
  // 1. Fix packages table - rename 'name' to 'internal_title' and add missing columns
  console.log('🔧 Fixing packages table schema...');
  
  // Check if internal_title column exists
  const packagesInfo = db.prepare(`PRAGMA table_info(packages)`).all() as Array<{
    cid: number;
    name: string;
    type: string;
    notnull: number;
    dflt_value: any;
    pk: number;
  }>;
  
  const hasInternalTitle = packagesInfo.some(col => col.name === 'internal_title');
  const hasParentPackageId = packagesInfo.some(col => col.name === 'parent_package_id');
  const hasPackageTotal = packagesInfo.some(col => col.name === 'total');
  const hasAddVat = packagesInfo.some(col => col.name === 'add_vat');
  
  if (!hasInternalTitle) {
    console.log('🔧 Creating new packages table with correct schema...');
    
    // Create new packages table with correct schema
    db.exec(`
      CREATE TABLE packages_new (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        internal_title TEXT NOT NULL,
        parent_package_id INTEGER REFERENCES packages_new(id) ON DELETE CASCADE,
        total REAL NOT NULL DEFAULT 0,
        add_vat INTEGER DEFAULT 0,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );
    `);
    
    // Migrate existing data
    db.exec(`
      INSERT INTO packages_new (id, internal_title, total, add_vat, created_at, updated_at)
      SELECT 
        id, 
        name as internal_title,
        COALESCE(price, 0) as total,
        0 as add_vat,
        created_at,
        updated_at
      FROM packages;
    `);
    
    // Drop old table and rename new one
    db.exec(`DROP TABLE packages;`);
    db.exec(`ALTER TABLE packages_new RENAME TO packages;`);
    
    console.log('✅ Packages table schema fixed');
  }
  
  // 2. Create package_line_items table if it doesn't exist
  const packageLineItemsExists = db.prepare(`
    SELECT name FROM sqlite_master 
    WHERE type='table' AND name='package_line_items'
  `).get();
  
  if (!packageLineItemsExists) {
    console.log('🔧 Creating package_line_items table...');
    
    db.exec(`
      CREATE TABLE package_line_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        package_id INTEGER NOT NULL REFERENCES packages(id) ON DELETE CASCADE,
        title TEXT NOT NULL,
        quantity INTEGER NOT NULL DEFAULT 1,
        amount REAL NOT NULL DEFAULT 0,
        parent_item_id INTEGER REFERENCES package_line_items(id) ON DELETE CASCADE,
        description TEXT
      );
    `);
    
    console.log('✅ Package line items table created');
  }
  
  // 3. Fix invoices table - add missing columns for modern invoice structure
  console.log('🔧 Fixing invoices table schema...');
  
  const invoicesInfo = db.prepare(`PRAGMA table_info(invoices)`).all() as Array<{
    cid: number;
    name: string;
    type: string;
    notnull: number;
    dflt_value: any;
    pk: number;
  }>;
  
  const hasInvoiceNumber = invoicesInfo.some(col => col.name === 'invoice_number');
  const hasSubtotal = invoicesInfo.some(col => col.name === 'subtotal');
  const hasVatRate = invoicesInfo.some(col => col.name === 'vat_rate');
  const hasVatAmount = invoicesInfo.some(col => col.name === 'vat_amount');
  const hasInvoiceTotal = invoicesInfo.some(col => col.name === 'total');
  const hasNotes = invoicesInfo.some(col => col.name === 'notes');
  
  if (!hasInvoiceNumber || !hasSubtotal) {
    console.log('🔧 Creating new invoices table with correct schema...');
    
    // Create new invoices table with correct schema
    db.exec(`
      CREATE TABLE invoices_new (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        invoice_number TEXT NOT NULL UNIQUE,
        customer_id INTEGER NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
        offer_id INTEGER REFERENCES offers(id) ON DELETE SET NULL,
        title TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'draft',
        due_date TEXT NOT NULL,
        subtotal REAL NOT NULL DEFAULT 0,
        vat_rate REAL NOT NULL DEFAULT 19,
        vat_amount REAL NOT NULL DEFAULT 0,
        total REAL NOT NULL DEFAULT 0,
        notes TEXT,
        sent_at TEXT,
        paid_at TEXT,
        overdue_at TEXT,
        cancelled_at TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );
    `);
    
    // Migrate existing data
    db.exec(`
      INSERT INTO invoices_new (
        id, invoice_number, customer_id, offer_id, title, status, 
        due_date, subtotal, vat_rate, vat_amount, total, 
        created_at, updated_at
      )
      SELECT 
        id, 
        COALESCE(number, 'RE-' || printf('%04d', id)) as invoice_number,
        customer_id,
        offer_id,
        title,
        status,
        COALESCE(due_date, date('now', '+30 days')) as due_date,
        COALESCE(total_amount, 0) as subtotal,
        COALESCE(tax_rate, 19) as vat_rate,
        ROUND(COALESCE(total_amount, 0) * COALESCE(tax_rate, 19) / 100, 2) as vat_amount,
        ROUND(COALESCE(total_amount, 0) * (1 + COALESCE(tax_rate, 19) / 100), 2) as total,
        created_at,
        updated_at
      FROM invoices;
    `);
    
    // Drop old table and rename new one
    db.exec(`DROP TABLE invoices;`);
    db.exec(`ALTER TABLE invoices_new RENAME TO invoices;`);
    
    // Recreate indexes
    db.exec(`CREATE INDEX idx_invoices_customer ON invoices(customer_id);`);
    db.exec(`CREATE INDEX idx_invoices_status ON invoices(status);`);
    db.exec(`CREATE INDEX idx_invoices_due_date ON invoices(due_date);`);
    
    console.log('✅ Invoices table schema fixed');
  }
  
  // 4. Create invoice_line_items table if it doesn't exist
  const invoiceLineItemsExists = db.prepare(`
    SELECT name FROM sqlite_master 
    WHERE type='table' AND name='invoice_line_items'
  `).get();
  
  if (!invoiceLineItemsExists) {
    console.log('🔧 Creating invoice_line_items table...');
    
    db.exec(`
      CREATE TABLE invoice_line_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        invoice_id INTEGER NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
        title TEXT NOT NULL,
        description TEXT,
        quantity INTEGER NOT NULL DEFAULT 1,
        unit_price REAL NOT NULL DEFAULT 0,
        total REAL NOT NULL DEFAULT 0,
        parent_item_id INTEGER REFERENCES invoice_line_items(id) ON DELETE CASCADE
      );
    `);
    
    console.log('✅ Invoice line items table created');
  }

  console.log('🗄️ [Migration 007] Schema mismatches fixed successfully');
};

export const down = (db: Database): void => {
  console.log('🗄️ [Migration 007] Reverting schema fixes...');
  
  // This is a complex migration that's difficult to reverse safely
  // In a production environment, you'd want to backup before running this
  console.warn('⚠️ This migration contains irreversible schema changes');
  console.warn('⚠️ Backup your database before running the down migration');
  
  // Drop the line items tables
  db.exec('DROP TABLE IF EXISTS invoice_line_items;');
  db.exec('DROP TABLE IF EXISTS package_line_items;');
  
  console.log('🗄️ [Migration 007] Schema fixes reverted (partial)');
};