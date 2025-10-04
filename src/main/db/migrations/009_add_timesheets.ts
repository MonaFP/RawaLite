// Migration 009: Add timesheets and activities tables
import type { Database } from 'better-sqlite3';

export const up = (db: Database): void => {
  console.log('🗄️ [Migration 009] Adding timesheets and activities tables...');
  
  // 1. Create activities table for reusable activity templates
  console.log('🔧 Creating activities table...');
  
  db.exec(`
    CREATE TABLE activities (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT,
      hourly_rate REAL NOT NULL DEFAULT 0,
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `);
  
  console.log('✅ Activities table created');
  
  // 2. Create timesheets table
  console.log('🔧 Creating timesheets table...');
  
  db.exec(`
    CREATE TABLE timesheets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      timesheet_number TEXT NOT NULL UNIQUE,
      customer_id INTEGER NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'draft',
      start_date TEXT NOT NULL,
      end_date TEXT NOT NULL,
      subtotal REAL NOT NULL DEFAULT 0,
      vat_rate REAL NOT NULL DEFAULT 19,
      vat_amount REAL NOT NULL DEFAULT 0,
      total REAL NOT NULL DEFAULT 0,
      notes TEXT,
      sent_at TEXT,
      accepted_at TEXT,
      rejected_at TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `);
  
  console.log('✅ Timesheets table created');
  
  // 3. Create timesheet_activities junction table for timesheet line items
  console.log('🔧 Creating timesheet_activities table...');
  
  db.exec(`
    CREATE TABLE timesheet_activities (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      timesheet_id INTEGER NOT NULL REFERENCES timesheets(id) ON DELETE CASCADE,
      activity_id INTEGER REFERENCES activities(id) ON DELETE SET NULL,
      title TEXT NOT NULL,
      description TEXT,
      date TEXT NOT NULL,
      start_time TEXT NOT NULL,
      end_time TEXT NOT NULL,
      hours REAL NOT NULL DEFAULT 0,
      hourly_rate REAL NOT NULL DEFAULT 0,
      total REAL NOT NULL DEFAULT 0,
      is_break INTEGER NOT NULL DEFAULT 0
    );
  `);
  
  console.log('✅ Timesheet activities table created');
  
  // 4. Create indexes for performance
  console.log('🔧 Creating indexes...');
  
  db.exec(`
    CREATE INDEX idx_timesheets_customer ON timesheets(customer_id);
    CREATE INDEX idx_timesheets_status ON timesheets(status);
    CREATE INDEX idx_timesheets_date_range ON timesheets(start_date, end_date);
    CREATE INDEX idx_timesheet_activities_timesheet ON timesheet_activities(timesheet_id);
    CREATE INDEX idx_timesheet_activities_activity ON timesheet_activities(activity_id);
    CREATE INDEX idx_timesheet_activities_date ON timesheet_activities(date);
  `);
  
  console.log('✅ Indexes created');
  
  // 5. Add default activities
  console.log('🔧 Adding default activities...');
  
  const now = new Date().toISOString();
  
  db.exec(`
    INSERT INTO activities (title, description, hourly_rate, is_active, created_at, updated_at) VALUES
    ('Beratung', 'Allgemeine Beratungsleistungen', 85.0, 1, '${now}', '${now}'),
    ('Entwicklung', 'Softwareentwicklung und Programmierung', 95.0, 1, '${now}', '${now}'),
    ('Testing', 'Software-Tests und Qualitätssicherung', 75.0, 1, '${now}', '${now}'),
    ('Dokumentation', 'Erstellung von Dokumentationen', 65.0, 1, '${now}', '${now}'),
    ('Meeting', 'Besprechungen und Koordination', 75.0, 1, '${now}', '${now}'),
    ('Support', 'Technischer Support und Wartung', 70.0, 1, '${now}', '${now}');
  `);
  
  console.log('✅ Default activities added');
  
  // 6. Add numbering circle for timesheets
  console.log('🔧 Adding timesheets numbering circle...');
  
  db.exec(`
    INSERT OR IGNORE INTO numbering_circles (id, name, prefix, digits, current, resetMode, lastResetYear, updated_at)
    VALUES ('timesheets', 'Leistungsnachweise', 'LN-', 4, 0, 'yearly', NULL, datetime('now'));
  `);
  
  console.log('✅ Timesheets numbering circle added');

  console.log('🗄️ [Migration 009] Timesheets system completed successfully');
};

export const down = (db: Database): void => {
  console.log('🗄️ [Migration 009] Reverting timesheets system...');
  
  // Remove numbering circle first
  db.exec(`DELETE FROM numbering_circles WHERE id = 'timesheets';`);
  
  // Drop indexes first
  db.exec(`
    DROP INDEX IF EXISTS idx_timesheet_activities_date;
    DROP INDEX IF EXISTS idx_timesheet_activities_activity;
    DROP INDEX IF EXISTS idx_timesheet_activities_timesheet;
    DROP INDEX IF EXISTS idx_timesheets_date_range;
    DROP INDEX IF EXISTS idx_timesheets_status;
    DROP INDEX IF EXISTS idx_timesheets_customer;
  `);
  
  // Drop tables in reverse order due to foreign keys
  db.exec('DROP TABLE IF EXISTS timesheet_activities;');
  db.exec('DROP TABLE IF EXISTS timesheets;');
  db.exec('DROP TABLE IF EXISTS activities;');
  
  console.log('🗄️ [Migration 009] Timesheets system reverted');
};