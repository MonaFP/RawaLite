// Migration 006: Fix missing offers and invoices numbering circles
import type { Database } from 'better-sqlite3';

export const up = (db: Database): void => {
  console.log('🗄️ [Migration 006] Fixing missing numbering circles...');
  
  // Check and add missing offers circle
  const offersExists = db.prepare(`
    SELECT COUNT(*) as count 
    FROM numbering_circles 
    WHERE id = 'offers'
  `).get() as { count: number };
  
  if (offersExists.count === 0) {
    console.log('🔧 Creating offers numbering circle...');
    
    db.prepare(`
      INSERT INTO numbering_circles 
      (id, name, prefix, digits, current, resetMode, lastResetYear, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
    `).run([
      'offers',
      'Angebote',
      'AN-',
      4,
      0,
      'yearly',
      null
    ]);
    
    console.log('✅ Offers numbering circle created');
  } else {
    console.log('✅ Offers numbering circle already exists');
  }

  // Check and add missing invoices circle
  const invoicesExists = db.prepare(`
    SELECT COUNT(*) as count 
    FROM numbering_circles 
    WHERE id = 'invoices'
  `).get() as { count: number };
  
  if (invoicesExists.count === 0) {
    console.log('🔧 Creating invoices numbering circle...');
    
    db.prepare(`
      INSERT INTO numbering_circles 
      (id, name, prefix, digits, current, resetMode, lastResetYear, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
    `).run([
      'invoices',
      'Rechnungen',
      'RE-',
      4,
      0,
      'yearly',
      null
    ]);
    
    console.log('✅ Invoices numbering circle created');
  } else {
    console.log('✅ Invoices numbering circle already exists');
  }

  console.log('🗄️ [Migration 006] Missing numbering circles fixed');
};

export const down = (db: Database): void => {
  console.log('🗄️ [Migration 006] Reverting missing numbering circles fix...');
  
  db.prepare(`DELETE FROM numbering_circles WHERE id IN ('offers', 'invoices')`).run();
  
  console.log('🗄️ [Migration 006] Offers and invoices numbering circles removed');
};