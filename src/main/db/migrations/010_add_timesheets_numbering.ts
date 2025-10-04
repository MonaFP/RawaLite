// Migration 010: Add timesheets numbering circle
import type { Database } from 'better-sqlite3';

export const up = (db: Database): void => {
  console.log('🗄️ [Migration 010] Adding timesheets numbering circle...');
  
  // Add numbering circle for timesheets
  console.log('🔢 Adding timesheets numbering circle...');
  
  db.exec(`
    INSERT OR IGNORE INTO numbering_circles (id, name, prefix, digits, current, resetMode, lastResetYear, updated_at)
    VALUES ('timesheets', 'Leistungsnachweise', 'LN-', 4, 0, 'yearly', NULL, datetime('now'));
  `);
  
  console.log('✅ Timesheets numbering circle added');
  console.log('🗄️ [Migration 010] Completed successfully');
};

export const down = (db: Database): void => {
  console.log('🗄️ [Migration 010] Reverting timesheets numbering circle...');
  
  // Remove numbering circle
  db.exec(`DELETE FROM numbering_circles WHERE id = 'timesheets';`);
  
  console.log('🗄️ [Migration 010] Reverted');
};