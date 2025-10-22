/**
 * Migration 040: Fix user_navigation_preferences constraint for 36px headers
 * 
 * Migration 039 fixed user_navigation_mode_settings but missed the main
 * user_navigation_preferences table which still has CHECK (header_height >= 60).
 * 
 * This migration corrects the constraint in user_navigation_preferences
 * to allow 36px for full-sidebar mode.
 * 
 * @version 1.0.49
 * @date 2025-01-12
 */

import { Database } from 'better-sqlite3';

export async function up(db: Database): Promise<void> {
  console.log('🔧 Migration 040: Fixing user_navigation_preferences constraint for 36px headers...');
  
  try {
    // CRITICAL: The main user_navigation_preferences table still has >= 60 constraint
    console.log('📐 Step 1: Recreating user_navigation_preferences table with updated constraint...');
    
    // 1. Create temporary table with new constraint (>= 36)
    db.exec(`
      CREATE TABLE user_navigation_preferences_temp (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id TEXT NOT NULL UNIQUE,
        navigation_mode TEXT NOT NULL CHECK (navigation_mode IN ('header-statistics', 'header-navigation', 'full-sidebar')) DEFAULT 'header-navigation',
        header_height INTEGER DEFAULT 72 CHECK (header_height >= 36 AND header_height <= 220),
        sidebar_width INTEGER DEFAULT 280 CHECK (sidebar_width >= 180 AND sidebar_width <= 320),
        auto_collapse BOOLEAN DEFAULT FALSE,
        remember_focus_mode BOOLEAN DEFAULT TRUE,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // 2. Copy all data from original table
    db.exec(`
      INSERT INTO user_navigation_preferences_temp 
      SELECT * FROM user_navigation_preferences
    `);
    
    // 3. Drop original table
    db.exec(`DROP TABLE user_navigation_preferences`);
    
    // 4. Rename temp table to original name
    db.exec(`ALTER TABLE user_navigation_preferences_temp RENAME TO user_navigation_preferences`);
    
    console.log('  ✅ Updated user_navigation_preferences constraint: header_height >= 36');

    // STEP 2: Now that constraint allows 36px, update full-sidebar entries
    console.log('📐 Step 2: Updating full-sidebar header heights to 36px...');
    const updateFullSidebar = db.prepare(`
      UPDATE user_navigation_preferences 
      SET header_height = 36,
          updated_at = CURRENT_TIMESTAMP
      WHERE navigation_mode = 'full-sidebar' 
      AND header_height != 36
    `);
    const changes = updateFullSidebar.run();
    console.log(`  ✅ Updated ${changes.changes} full-sidebar entries to 36px`);

    // STEP 3: Set any current user to appropriate heights based on their mode
    console.log('📐 Step 3: Applying correct heights for all navigation modes...');
    
    // Update header modes to 160px
    const updateHeaderModes = db.prepare(`
      UPDATE user_navigation_preferences 
      SET header_height = 160,
          updated_at = CURRENT_TIMESTAMP
      WHERE navigation_mode IN ('header-statistics', 'header-navigation') 
      AND header_height != 160
    `);
    const headerChanges = updateHeaderModes.run();
    console.log(`  ✅ Updated ${headerChanges.changes} header mode entries to 160px`);

    console.log('✅ Migration 040 completed successfully!');
    console.log('📊 Summary:');
    console.log(`   - user_navigation_preferences constraint: >= 60 → >= 36`);
    console.log(`   - full-sidebar mode: → 36px header height`);
    console.log(`   - header modes: → 160px header height`);
    console.log(`   - All navigation modes can now switch properly`);
    
  } catch (error) {
    console.error('❌ Migration 040 failed:', error);
    throw error;
  }
}

export async function down(db: Database): Promise<void> {
  console.log('🔧 Rolling back Migration 040: Restoring >= 60 constraint...');
  
  try {
    // Recreate table with old constraint
    db.exec(`
      CREATE TABLE user_navigation_preferences_temp (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id TEXT NOT NULL UNIQUE,
        navigation_mode TEXT NOT NULL CHECK (navigation_mode IN ('header-statistics', 'header-navigation', 'full-sidebar')) DEFAULT 'header-navigation',
        header_height INTEGER DEFAULT 72 CHECK (header_height >= 60 AND header_height <= 220),
        sidebar_width INTEGER DEFAULT 280 CHECK (sidebar_width >= 180 AND sidebar_width <= 320),
        auto_collapse BOOLEAN DEFAULT FALSE,
        remember_focus_mode BOOLEAN DEFAULT TRUE,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Ensure all heights are >= 60 before copying
    db.exec(`
      UPDATE user_navigation_preferences 
      SET header_height = CASE 
        WHEN header_height < 60 THEN 72 
        ELSE header_height 
      END
    `);
    
    // Copy data
    db.exec(`
      INSERT INTO user_navigation_preferences_temp 
      SELECT * FROM user_navigation_preferences
    `);
    
    // Replace table
    db.exec(`DROP TABLE user_navigation_preferences`);
    db.exec(`ALTER TABLE user_navigation_preferences_temp RENAME TO user_navigation_preferences`);

    console.log('✅ Migration 040 rollback completed');
    
  } catch (error) {
    console.error('❌ Migration 040 rollback failed:', error);
    throw error;
  }
}