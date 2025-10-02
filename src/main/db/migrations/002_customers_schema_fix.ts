// src/main/db/migrations/002_customers_schema_fix.ts
import type Database from 'better-sqlite3';

export const up = (db: Database.Database): void => {
  console.log('🗄️ [Migration 002] Fixing customers table schema...');

  // Create new customers table with correct schema
  db.exec(`
    CREATE TABLE IF NOT EXISTS customers_new (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      number TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      email TEXT,
      phone TEXT,
      street TEXT,
      zip TEXT,
      city TEXT,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Migrate existing data if any exists
  const existingCustomers = db.prepare('SELECT COUNT(*) as count FROM customers').get() as { count: number };
  
  if (existingCustomers.count > 0) {
    console.log(`🗄️ [Migration 002] Migrating ${existingCustomers.count} existing customers...`);
    
    // Copy data from old structure to new structure
    db.exec(`
      INSERT INTO customers_new (
        id, number, name, email, phone, street, zip, city, notes, created_at, updated_at
      )
      SELECT 
        id,
        'K-' || id as number,           -- Generate number from ID
        COALESCE(company_name, 'Kunde ' || id) as name,  -- Use company_name as name
        email,
        phone,
        address_street as street,
        address_zip as zip,
        address_city as city,
        notes,
        created_at,
        updated_at
      FROM customers;
    `);
  }

  // Drop old table and rename new one
  db.exec('DROP TABLE customers;');
  db.exec('ALTER TABLE customers_new RENAME TO customers;');

  // Recreate indexes for the new structure
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_customers_number ON customers(number);
    CREATE INDEX IF NOT EXISTS idx_customers_name ON customers(name);
  `);

  // Initialize default numbering circles for customers if not exists
  const customerCircleExists = db.prepare(`
    SELECT COUNT(*) as count FROM numbering_circles WHERE id = 'customers'
  `).get() as { count: number };

  if (customerCircleExists.count === 0) {
    console.log('🗄️ [Migration 002] Creating customers numbering circle...');
    db.exec(`
      INSERT INTO numbering_circles (id, name, prefix, digits, current, resetMode, createdAt, updatedAt)
      VALUES ('customers', 'Kunden', 'K-', 4, 0, 'never', datetime('now'), datetime('now'));
    `);
  }

  console.log('🗄️ [Migration 002] Customers schema fixed successfully');
};

export const down = (db: Database.Database): void => {
  console.log('🗄️ [Migration 002] Reverting customers table schema...');

  // Create old customers table structure
  db.exec(`
    CREATE TABLE IF NOT EXISTS customers_old (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      company_name TEXT NOT NULL,
      contact_person TEXT,
      email TEXT,
      phone TEXT,
      address_street TEXT,
      address_city TEXT,
      address_zip TEXT,
      address_country TEXT DEFAULT 'Deutschland',
      tax_number TEXT,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Migrate data back if any exists
  const existingCustomers = db.prepare('SELECT COUNT(*) as count FROM customers').get() as { count: number };
  
  if (existingCustomers.count > 0) {
    db.exec(`
      INSERT INTO customers_old (
        id, company_name, contact_person, email, phone, address_street, address_city, address_zip, notes, created_at, updated_at
      )
      SELECT 
        id,
        name as company_name,
        NULL as contact_person,
        email,
        phone,
        street as address_street,
        city as address_city,
        zip as address_zip,
        notes,
        created_at,
        updated_at
      FROM customers;
    `);
  }

  // Drop new table and rename old one back
  db.exec('DROP TABLE customers;');
  db.exec('ALTER TABLE customers_old RENAME TO customers;');

  // Recreate old indexes
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_customers_company ON customers(company_name);
  `);

  // Remove customers numbering circle
  db.exec(`DELETE FROM numbering_circles WHERE id = 'customers';`);

  console.log('🗄️ [Migration 002] Customers schema reverted');
};