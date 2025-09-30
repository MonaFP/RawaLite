// src/main/db/migrations/000_init.ts
import type Database from 'better-sqlite3';

export const up = (db: Database.Database): void => {
  // Settings table
  db.exec(`
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Customers table  
  db.exec(`
    CREATE TABLE IF NOT EXISTS customers (
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

  // Numbering circles table
  db.exec(`
    CREATE TABLE IF NOT EXISTS numbering_circles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT NOT NULL, -- 'offer', 'invoice'
      year INTEGER NOT NULL,
      last_number INTEGER DEFAULT 0,
      prefix TEXT DEFAULT '',
      suffix TEXT DEFAULT '',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(type, year)
    );
  `);

  // Offers table
  db.exec(`
    CREATE TABLE IF NOT EXISTS offers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      number TEXT NOT NULL UNIQUE,
      customer_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      total_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
      tax_rate DECIMAL(5,2) NOT NULL DEFAULT 19.00,
      status TEXT NOT NULL DEFAULT 'draft', -- 'draft', 'sent', 'accepted', 'rejected'
      valid_until DATE,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE
    );
  `);

  // Invoices table
  db.exec(`
    CREATE TABLE IF NOT EXISTS invoices (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      number TEXT NOT NULL UNIQUE,
      customer_id INTEGER NOT NULL,
      offer_id INTEGER,
      title TEXT NOT NULL,
      description TEXT,
      total_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
      tax_rate DECIMAL(5,2) NOT NULL DEFAULT 19.00,
      status TEXT NOT NULL DEFAULT 'draft', -- 'draft', 'sent', 'paid', 'overdue'
      due_date DATE,
      paid_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
      FOREIGN KEY (offer_id) REFERENCES offers(id) ON DELETE SET NULL
    );
  `);

  // Packages table
  db.exec(`
    CREATE TABLE IF NOT EXISTS packages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT,
      price DECIMAL(10,2) NOT NULL DEFAULT 0.00,
      unit TEXT DEFAULT 'Stück',
      active BOOLEAN DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Create indexes for performance
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_customers_company ON customers(company_name);
    CREATE INDEX IF NOT EXISTS idx_offers_customer ON offers(customer_id);
    CREATE INDEX IF NOT EXISTS idx_offers_status ON offers(status);
    CREATE INDEX IF NOT EXISTS idx_invoices_customer ON invoices(customer_id);
    CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
    CREATE INDEX IF NOT EXISTS idx_invoices_due_date ON invoices(due_date);
  `);

  console.log('🗄️ [Migration 000] Initial schema created');
};

export const down = (db: Database.Database): void => {
  // Drop tables in reverse order due to foreign keys
  db.exec('DROP INDEX IF EXISTS idx_invoices_due_date;');
  db.exec('DROP INDEX IF EXISTS idx_invoices_status;');
  db.exec('DROP INDEX IF EXISTS idx_invoices_customer;');
  db.exec('DROP INDEX IF EXISTS idx_offers_status;');
  db.exec('DROP INDEX IF EXISTS idx_offers_customer;');
  db.exec('DROP INDEX IF EXISTS idx_customers_company;');
  
  db.exec('DROP TABLE IF EXISTS packages;');
  db.exec('DROP TABLE IF EXISTS invoices;');
  db.exec('DROP TABLE IF EXISTS offers;');
  db.exec('DROP TABLE IF EXISTS numbering_circles;');
  db.exec('DROP TABLE IF EXISTS customers;');
  db.exec('DROP TABLE IF EXISTS settings;');

  console.log('🗄️ [Migration 000] Schema dropped');
};