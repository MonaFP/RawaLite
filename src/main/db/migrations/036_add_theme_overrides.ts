// Migration 036: Theme Overrides (Scoped Theme Configuration)
// @since v1.0.46+ (Per-Mode Configuration System)

import type Database from 'better-sqlite3';
import { readFileSync } from 'fs';
import { join } from 'path';

export function up(db: Database.Database): void {
  console.log('[Migration 036] Adding theme overrides table...');
  
  try {
    // Read and execute the SQL migration file
    const migrationSQL = readFileSync(
      join(process.cwd(), 'migrations', '036-theme-overrides.sql'), 
      'utf-8'
    );
    
    // Execute migration
    db.exec(migrationSQL);
    
    console.log('[Migration 036] Theme overrides table created successfully');
  } catch (error) {
    console.error('[Migration 036] Error executing migration:', error);
    throw error;
  }
}

export function down(db: Database.Database): void {
  console.log('[Migration 036] Rolling back theme overrides...');
  
  try {
    // Drop trigger first
    db.exec('DROP TRIGGER IF EXISTS trigger_theme_overrides_updated_at;');
    
    // Drop indexes
    db.exec('DROP INDEX IF EXISTS idx_theme_overrides_user_scope;');
    db.exec('DROP INDEX IF EXISTS idx_theme_overrides_active;');
    db.exec('DROP INDEX IF EXISTS idx_theme_overrides_screen_size;');
    
    // Drop table
    db.exec('DROP TABLE IF EXISTS theme_overrides;');
    
    console.log('[Migration 036] Theme overrides rollback completed');
  } catch (error) {
    console.error('[Migration 036] Error rolling back migration:', error);
    throw error;
  }
}