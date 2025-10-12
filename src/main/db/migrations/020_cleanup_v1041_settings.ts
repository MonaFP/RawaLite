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
    // 1. Prüfe erst ob settings Tabelle überhaupt existiert
    const tables = db.prepare(`SELECT name FROM sqlite_master WHERE type='table' AND name='settings'`).all();
    if (tables.length === 0) {
      console.log('ℹ️ [Migration 020] Settings table does not exist, skipping migration');
      return;
    }

    // 2. Hole aktuelle Spalten der settings Tabelle
    const columns = db.prepare(`PRAGMA table_info(settings)`).all();
    const columnNames = columns.map((col: any) => col.name);
    
    console.log(`� [Migration 020] Current settings columns: ${columnNames.join(', ')}`);

    // 3. Reset Beta Channel zu Stable (nur wenn update_channel existiert)
    const hasUpdateChannel = columnNames.includes('update_channel');
    if (hasUpdateChannel) {
      const updateChannelResult = db.prepare(`
        UPDATE settings 
        SET update_channel = 'stable' 
        WHERE update_channel = 'beta'
      `).run();

      if (updateChannelResult.changes > 0) {
        console.log(`✅ [Migration 020] Reset ${updateChannelResult.changes} Beta-Channel Settings zu Stable`);
      }
    } else {
      console.log('ℹ️ [Migration 020] No update_channel column found, skipping update');
    }

    // 4. Remove problematische Spalten falls vorhanden
    const problematicColumns = ['feature_flags', 'update_channel'];
    const columnsToRemove = problematicColumns.filter(col => columnNames.includes(col));
    
    if (columnsToRemove.length > 0) {
      console.log(`🗑️ [Migration 020] Removing problematic columns: ${columnsToRemove.join(', ')}`);
      
      // Keep nur die Spalten die wir behalten wollen
      const keepColumns = columns.filter((col: any) => !problematicColumns.includes(col.name));
      
      if (keepColumns.length > 0) {
        const newTableColumns = keepColumns.map((col: any) => `${col.name} ${col.type}`).join(', ');
        const selectColumns = keepColumns.map((col: any) => col.name).join(', ');

        db.exec(`
          -- Create new settings table without problematic columns
          CREATE TABLE settings_new (
            ${newTableColumns}
          );
          
          -- Copy data without problematic columns
          INSERT INTO settings_new (${selectColumns}) 
          SELECT ${selectColumns} FROM settings;
          
          -- Replace old table
          DROP TABLE settings;
          ALTER TABLE settings_new RENAME TO settings;
        `);
        
        console.log(`✅ [Migration 020] Removed problematic columns: ${columnsToRemove.join(', ')}`);
      } else {
        console.log('⚠️ [Migration 020] All columns were problematic, keeping original table');
      }
    } else {
      console.log('ℹ️ [Migration 020] No problematic columns found, table is clean');
    }

    // 5. Final validation
    const finalColumns = db.prepare(`PRAGMA table_info(settings)`).all();
    const finalColumnNames = finalColumns.map((col: any) => col.name);
    
    console.log('✅ [Migration 020] Settings table cleanup complete');
    console.log(`📊 [Migration 020] Final columns: ${finalColumnNames.join(', ')}`);
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