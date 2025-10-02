// Migration 005: Add missing packages numbering circle
import type { Database } from 'better-sqlite3';

export const up = (db: Database): void => {
  console.log('🗄️ [Migration 005] Adding missing packages numbering circle...');
  
  // Check if packages numbering circle exists
  const packagesExists = db.prepare(`
    SELECT COUNT(*) as count 
    FROM numbering_circles 
    WHERE id = 'packages'
  `).get() as { count: number };
  
  if (packagesExists.count === 0) {
    console.log('🔧 Creating packages numbering circle...');
    
    db.prepare(`
      INSERT INTO numbering_circles 
      (id, name, prefix, digits, current, resetMode, lastResetYear, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
    `).run([
      'packages',
      'Pakete',
      'PAK-',
      3,
      0,
      'never',
      null
    ]);
    
    console.log('✅ Packages numbering circle created');
  } else {
    console.log('✅ Packages numbering circle already exists');
  }

  console.log('🗄️ [Migration 005] Packages numbering circle migration completed');
};

export const down = (db: Database): void => {
  console.log('🗄️ [Migration 005] Reverting packages numbering circle...');
  
  db.prepare(`DELETE FROM numbering_circles WHERE id = 'packages'`).run();
  
  console.log('🗄️ [Migration 005] Packages numbering circle removed');
};