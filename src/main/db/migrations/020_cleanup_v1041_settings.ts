/**
 * Migration 020: Cleanup v1.0.41 Settings für Rückwärtskompatibilität
 * 
 * Zweck: Entfernt problematische Settings aus v1.0.41 "Erweiterte Optionen"
 * 
 * Problem: 
 * - v1.0.41 ermöglichte Beta Updates ohne GitHubApiService Support
 * - update_channel='beta' führt zu "Missing MZ header" Fehlern
 * - feature_flags ohne entsprechende Backend-Implementation
 * 
 * Lösung:
 * - Reset update_channel='beta' → 'stable' 
 * - Remove feature_flags column falls vorhanden
 * - Ensure clean state für v1.0.42+ Update-System
 */

import type Database from 'better-sqlite3';

export function up(db: Database.Database): void {
  console.log('🔧 [Migration 020] Cleanup v1.0.41 problematic settings...');

  try {
    // 1. Reset Beta Channel zu Stable (KRITISCH für Update-Funktionalität)
    const updateChannelResult = db.prepare(`
      UPDATE settings 
      SET update_channel = 'stable' 
      WHERE update_channel = 'beta'
    `).run();

    if (updateChannelResult.changes > 0) {
      console.log(`✅ [Migration 020] Reset ${updateChannelResult.changes} Beta-Channel Settings zu Stable`);
    }

    // 2. Prüfe ob feature_flags Spalte existiert (robust)
    const columns = db.prepare(`PRAGMA table_info(settings)`).all();
    const hasFeatureFlags = columns.some((col: any) => col.name === 'feature_flags');
    
    if (hasFeatureFlags) {
      // Remove feature_flags column (war nie vollständig implementiert)
      console.log('🗑️ [Migration 020] Removing feature_flags column...');
      
      // SQLite ALTER TABLE DROP COLUMN workaround
      // Erstelle neue Tabelle ohne feature_flags
      const settingsColumns = columns
        .filter((col: any) => col.name !== 'feature_flags')
        .map((col: any) => `${col.name} ${col.type}`)
        .join(', ');

      db.exec(`
        -- Create new settings table without feature_flags
        CREATE TABLE settings_new (
          ${settingsColumns}
        );
        
        -- Copy all data except feature_flags
        INSERT INTO settings_new SELECT ${columns
          .filter((col: any) => col.name !== 'feature_flags')
          .map((col: any) => col.name)
          .join(', ')} FROM settings;
        
        -- Replace old table
        DROP TABLE settings;
        ALTER TABLE settings_new RENAME TO settings;
      `);
      
      console.log('✅ [Migration 020] Removed feature_flags column successfully');
    }

    // 3. Prüfe ob update_channel Spalte existiert und remove falls vorhanden
    const updatedColumns = db.prepare(`PRAGMA table_info(settings)`).all();
    const hasUpdateChannel = updatedColumns.some((col: any) => col.name === 'update_channel');
    
    if (hasUpdateChannel) {
      console.log('🗑️ [Migration 020] Removing update_channel column...');
      
      // Remove update_channel column (GitHubApiService nicht bereit)
      const finalColumns = updatedColumns
        .filter((col: any) => col.name !== 'update_channel')
        .map((col: any) => `${col.name} ${col.type}`)
        .join(', ');

      db.exec(`
        -- Create final settings table without update_channel
        CREATE TABLE settings_final (
          ${finalColumns}
        );
        
        -- Copy all data except update_channel
        INSERT INTO settings_final SELECT ${updatedColumns
          .filter((col: any) => col.name !== 'update_channel')
          .map((col: any) => col.name)
          .join(', ')} FROM settings;
        
        -- Replace table
        DROP TABLE settings;
        ALTER TABLE settings_final RENAME TO settings;
      `);
      
      console.log('✅ [Migration 020] Removed update_channel column successfully');
    }

    // 4. Validation: Ensure settings table ist in sauberem Zustand
    const finalTableInfo = db.prepare(`PRAGMA table_info(settings)`).all();
    const cleanColumnNames = finalTableInfo.map((col: any) => col.name);
    
    console.log('✅ [Migration 020] Settings table cleanup complete');
    console.log(`📊 [Migration 020] Final columns: ${cleanColumnNames.join(', ')}`);
    
    // 5. Log Migration Success für Debugging
    console.log('🎯 [Migration 020] v1.0.41 → v1.0.42 Rückwärtskompatibilität hergestellt');

  } catch (error) {
    console.error('❌ [Migration 020] Error during v1.0.41 settings cleanup:', error);
    throw error;
  }
}

export function down(db: Database.Database): void {
  // Rollback nicht sinnvoll - v1.0.41 State war problematisch
  console.log('⚠️ [Migration 020] Rollback nicht verfügbar - v1.0.41 Settings waren problematisch');
  console.log('ℹ️ [Migration 020] Verwende manuelle Database-Reparatur falls erforderlich');
}