// Migration 035: Focus Mode Preferences (Per-Mode Focus Configuration)
// @since v1.0.46+ (Per-Mode Configuration System)

import type Database from 'better-sqlite3';
import { readFileSync } from 'fs';
import { join } from 'path';

export function up(db: Database.Database): void {
  console.log('[Migration 035] Adding focus mode preferences table...');
  
  try {
    // Read and execute the SQL migration file
    const migrationSQL = readFileSync(
      join(process.cwd(), 'migrations', '035-focus-mode-preferences.sql'), 
      'utf-8'
    );
    
    // Execute migration
    db.exec(migrationSQL);
    
    console.log('[Migration 035] Focus mode preferences table created successfully');
  } catch (error) {
    console.error('[Migration 035] Error executing migration:', error);
    throw error;
  }
}

export function down(db: Database.Database): void {
  console.log('[Migration 035] Rolling back focus mode preferences...');
  
  try {
    // Drop trigger first
    db.exec('DROP TRIGGER IF EXISTS trigger_focus_mode_preferences_updated_at;');
    
    // Drop indexes
    db.exec('DROP INDEX IF EXISTS idx_focus_mode_preferences_user_mode;');
    db.exec('DROP INDEX IF EXISTS idx_focus_mode_preferences_auto_focus;');
    
    // Drop table
    db.exec('DROP TABLE IF EXISTS user_focus_mode_preferences;');
    
    console.log('[Migration 035] Focus mode preferences rollback completed');
  } catch (error) {
    console.error('[Migration 035] Error rolling back migration:', error);
    throw error;
  }
}