// Migration 034: Navigation Mode Settings (Per-Mode Layout Configuration)
// @since v1.0.46+ (Per-Mode Configuration System)

import type Database from 'better-sqlite3';
import { readFileSync } from 'fs';
import { join } from 'path';

export function up(db: Database.Database): void {
  console.log('[Migration 034] Adding navigation mode settings table...');
  
  try {
    // Read and execute the SQL migration file
    const migrationSQL = readFileSync(
      join(process.cwd(), 'migrations', '034-navigation-mode-settings.sql'), 
      'utf-8'
    );
    
    // Execute migration
    db.exec(migrationSQL);
    
    console.log('[Migration 034] Navigation mode settings table created successfully');
  } catch (error) {
    console.error('[Migration 034] Error executing migration:', error);
    throw error;
  }
}

export function down(db: Database.Database): void {
  console.log('[Migration 034] Rolling back navigation mode settings...');
  
  try {
    // Drop trigger first
    db.exec('DROP TRIGGER IF EXISTS trigger_navigation_mode_settings_updated_at;');
    
    // Drop indexes
    db.exec('DROP INDEX IF EXISTS idx_navigation_mode_settings_user_mode;');
    db.exec('DROP INDEX IF EXISTS idx_navigation_mode_settings_mode;');
    
    // Drop table
    db.exec('DROP TABLE IF EXISTS user_navigation_mode_settings;');
    
    console.log('[Migration 034] Navigation mode settings rollback completed');
  } catch (error) {
    console.error('[Migration 034] Error rolling back migration:', error);
    throw error;
  }
}