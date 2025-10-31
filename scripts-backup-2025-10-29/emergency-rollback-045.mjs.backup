#!/usr/bin/env node

/**
 * EMERGENCY: Rollback Migration 045 und Restore Migration 034
 * 
 * Migration 045 hat die richtige Per-Mode-Architektur ZERSTÖRT.
 * Dieses Script stellt die originale Migration 034 Struktur wieder her.
 */

import initSqlJs from 'sql.js';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';

console.log('🚨 EMERGENCY: Rollback Migration 045\n');

const dbPath = join(process.env.APPDATA || '', 'Electron', 'database', 'rawalite.db');
if (!existsSync(dbPath)) {
  console.error('❌ Database not found:', dbPath);
  process.exit(1);
}

console.log('✅ Database found:', dbPath);

try {
  // Backup erstellen
  const backupPath = dbPath + '.backup-before-045-rollback-' + Date.now();
  const dbData = readFileSync(dbPath);
  writeFileSync(backupPath, dbData);
  console.log('✅ Backup created:', backupPath);
  
  // Lade SQL.js
  const SQL = await initSqlJs();
  const db = new SQL.Database(dbData);
  
  console.log('\n=== STEP 1: Drop broken Migration 045 table ===');
  
  try {
    db.exec('DROP TABLE IF EXISTS user_navigation_mode_settings');
    console.log('✅ Dropped broken Migration 045 table');
  } catch (error) {
    console.log('⚠️ Table already not exists or error:', error.message);
  }
  
  console.log('\n=== STEP 2: Recreate original Migration 034 table ===');
  
  const migration034SQL = `
    CREATE TABLE IF NOT EXISTS user_navigation_mode_settings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL,
      navigation_mode TEXT NOT NULL CHECK (navigation_mode IN ('mode-dashboard-view', 'mode-data-panel', 'mode-compact-focus')),
      
      -- Mode-specific Layout Configuration
      header_height INTEGER NOT NULL DEFAULT 160 CHECK (header_height >= 60 AND header_height <= 220),
      sidebar_width INTEGER NOT NULL DEFAULT 280 CHECK (sidebar_width >= 180 AND sidebar_width <= 320),
      
      -- Mode-specific Behavior Settings
      auto_collapse_mobile BOOLEAN NOT NULL DEFAULT 0,
      auto_collapse_tablet BOOLEAN NOT NULL DEFAULT 0,
      remember_dimensions BOOLEAN NOT NULL DEFAULT 1,
      
      -- Responsive Design Configuration
      mobile_breakpoint INTEGER NOT NULL DEFAULT 768 CHECK (mobile_breakpoint >= 480 AND mobile_breakpoint <= 1024),
      tablet_breakpoint INTEGER NOT NULL DEFAULT 1024 CHECK (tablet_breakpoint >= 768 AND tablet_breakpoint <= 1440),
      
      -- CSS Grid Template Overrides (JSON format for flexibility)
      grid_template_columns TEXT NULL,
      grid_template_rows TEXT NULL,
      grid_template_areas TEXT NULL,
      
      -- Metadata
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      
      -- Constraints (THE CRITICAL PART FOR DESKTOP APP!)
      UNIQUE(user_id, navigation_mode),
      FOREIGN KEY (user_id) REFERENCES user_navigation_preferences(user_id) ON DELETE CASCADE
    );
  `;
  
  db.exec(migration034SQL);
  console.log('✅ Created original Migration 034 table with Per-Mode architecture');
  
  console.log('\n=== STEP 3: Create indexes ===');
  
  const indexSQL = `
    CREATE INDEX IF NOT EXISTS idx_navigation_mode_settings_user_mode 
    ON user_navigation_mode_settings(user_id, navigation_mode);

    CREATE INDEX IF NOT EXISTS idx_navigation_mode_settings_mode 
    ON user_navigation_mode_settings(navigation_mode);
  `;
  
  db.exec(indexSQL);
  console.log('✅ Created indexes');
  
  console.log('\n=== STEP 4: Insert default settings for all 3 modes ===');
  
  const defaultDataSQL = `
    INSERT OR IGNORE INTO user_navigation_mode_settings 
    (user_id, navigation_mode, header_height, sidebar_width, auto_collapse_mobile, auto_collapse_tablet, remember_dimensions, mobile_breakpoint, tablet_breakpoint)
    VALUES 
    -- mode-dashboard-view: Dashboard/Statistics view
    ('default', 'mode-dashboard-view', 160, 240, 1, 0, 1, 768, 1024),
    -- mode-data-panel: Navigation-heavy data view  
    ('default', 'mode-data-panel', 160, 280, 0, 0, 1, 768, 1024),
    -- mode-compact-focus: Minimal/focused view
    ('default', 'mode-compact-focus', 60, 240, 1, 1, 1, 768, 1024);
  `;
  
  db.exec(defaultDataSQL);
  console.log('✅ Inserted default settings for all 3 navigation modes');
  
  console.log('\n=== STEP 5: Create trigger for updated_at ===');
  
  const triggerSQL = `
    CREATE TRIGGER IF NOT EXISTS trigger_navigation_mode_settings_updated_at 
    AFTER UPDATE ON user_navigation_mode_settings
    FOR EACH ROW
    BEGIN
      UPDATE user_navigation_mode_settings 
      SET updated_at = CURRENT_TIMESTAMP 
      WHERE id = NEW.id;
    END;
  `;
  
  db.exec(triggerSQL);
  console.log('✅ Created updated_at trigger');
  
  console.log('\n=== STEP 6: Verify restoration ===');
  
  const verifyResult = db.exec("SELECT user_id, navigation_mode, header_height, sidebar_width FROM user_navigation_mode_settings ORDER BY navigation_mode");
  
  if (verifyResult.length && verifyResult[0].values.length) {
    console.log('✅ Verification successful:');
    const columns = verifyResult[0].columns;
    verifyResult[0].values.forEach(row => {
      const setting = {};
      columns.forEach((col, idx) => setting[col] = row[idx]);
      console.log(`   ${setting.navigation_mode}: ${setting.header_height}px header, ${setting.sidebar_width}px sidebar`);
    });
  } else {
    throw new Error('Verification failed - no data found!');
  }
  
  console.log('\n=== STEP 7: Save repaired database ===');
  
  const repairedData = db.export();
  writeFileSync(dbPath, repairedData);
  console.log('✅ Database repaired and saved');
  
  db.close();
  
  console.log('\n🎉 EMERGENCY REPAIR SUCCESSFUL!');
  console.log('✅ Migration 045 rollback completed');
  console.log('✅ Original Migration 034 Per-Mode architecture restored');
  console.log('✅ All 3 navigation modes ready for switching');
  console.log('✅ UNIQUE(user_id, navigation_mode) constraint restored');
  console.log('\n🎯 Desktop App Mode-Switching should now work again!');
  
} catch (error) {
  console.error('\n❌ EMERGENCY REPAIR FAILED:', error.message);
  console.error(error.stack);
  process.exit(1);
}