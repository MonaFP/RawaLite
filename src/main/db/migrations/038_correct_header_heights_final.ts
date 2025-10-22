/**
 * Migration 038: Correct Header Heights Final
 * 
 * PURPOSE: Final correction of header heights to match SYSTEM_DEFAULTS
 * - header-statistics: 160px
 * - header-navigation: 160px 
 * - full-sidebar: 72px
 * 
 * CONTEXT: Previous Migration 037 set all to 72px, but this was incorrect.
 * The central configuration architecture should use:
 * - 160px for header modes (statistics + navigation)
 * - 72px for full-sidebar mode only
 * 
 * @since v1.0.47+ (Central Configuration Architecture - Final Correction)
 */

import Database from 'better-sqlite3';

export async function up(db: Database.Database): Promise<void> {
  try {
    console.log('[Migration 038] Starting header heights final correction...');

    // Get current counts before migration
    const beforeStats = db.prepare(`
      SELECT 
        navigation_mode,
        header_height,
        COUNT(*) as count
      FROM user_navigation_preferences 
      GROUP BY navigation_mode, header_height
      ORDER BY navigation_mode, header_height
    `).all();

    console.log('[Migration 038] Current header height distribution:');
    beforeStats.forEach((stat: any) => {
      console.log(`   ${stat.navigation_mode}: ${stat.header_height}px (${stat.count} users)`);
    });

    // Update user_navigation_preferences table
    const updateNavPrefs = db.prepare(`
      UPDATE user_navigation_preferences 
      SET header_height = CASE 
        WHEN navigation_mode = 'full-sidebar' THEN 72
        WHEN navigation_mode IN ('header-statistics', 'header-navigation') THEN 160
        ELSE 160
      END,
      updated_at = CURRENT_TIMESTAMP
      WHERE header_height != CASE 
        WHEN navigation_mode = 'full-sidebar' THEN 72
        WHEN navigation_mode IN ('header-statistics', 'header-navigation') THEN 160
        ELSE 160
      END
    `);

    const navPrefsUpdated = updateNavPrefs.run();
    console.log(`[Migration 038] Updated ${navPrefsUpdated.changes} navigation preferences`);

    // Update user_navigation_mode_settings table if it exists
    const modeSettingsTable = db.prepare(`
      SELECT name FROM sqlite_master 
      WHERE type='table' AND name='user_navigation_mode_settings'
    `).get();

    if (modeSettingsTable) {
      const updateModeSettings = db.prepare(`
        UPDATE user_navigation_mode_settings 
        SET header_height = CASE 
          WHEN navigation_mode = 'full-sidebar' THEN 72
          WHEN navigation_mode IN ('header-statistics', 'header-navigation') THEN 160
          ELSE 160
        END
        WHERE header_height != CASE 
          WHEN navigation_mode = 'full-sidebar' THEN 72
          WHEN navigation_mode IN ('header-statistics', 'header-navigation') THEN 160
          ELSE 160
        END
      `);

      const modeSettingsUpdated = updateModeSettings.run();
      console.log(`[Migration 038] Updated ${modeSettingsUpdated.changes} mode-specific settings`);
    }

    // Verify final state
    const afterStats = db.prepare(`
      SELECT 
        navigation_mode,
        header_height,
        COUNT(*) as count
      FROM user_navigation_preferences 
      GROUP BY navigation_mode, header_height
      ORDER BY navigation_mode, header_height
    `).all();

    console.log('[Migration 038] Final header height distribution:');
    afterStats.forEach((stat: any) => {
      console.log(`   ${stat.navigation_mode}: ${stat.header_height}px (${stat.count} users)`);
    });

    // Validation: Ensure all header heights are correct
    const invalidHeights = db.prepare(`
      SELECT COUNT(*) as count
      FROM user_navigation_preferences 
      WHERE (navigation_mode = 'full-sidebar' AND header_height != 72)
         OR (navigation_mode IN ('header-statistics', 'header-navigation') AND header_height != 160)
    `).get() as { count: number };

    if (invalidHeights.count > 0) {
      throw new Error(`Migration 038 validation failed: ${invalidHeights.count} records have incorrect header heights`);
    }

    console.log('[Migration 038] ✅ Header heights correction completed successfully');
    console.log('[Migration 038] ✅ All navigation modes now have correct header heights:');
    console.log('[Migration 038]    - header-statistics: 160px');
    console.log('[Migration 038]    - header-navigation: 160px');
    console.log('[Migration 038]    - full-sidebar: 72px');

  } catch (error) {
    console.error('[Migration 038] ❌ Error during header heights correction:', error);
    throw error;
  }
}

export async function down(db: Database.Database): Promise<void> {
  console.log('[Migration 038] Rollback: Reverting header heights to previous state');
  
  // This rollback sets all to the Migration 037 state (all 72px)
  db.prepare(`
    UPDATE user_navigation_preferences 
    SET header_height = 72,
        updated_at = CURRENT_TIMESTAMP
  `).run();

  const modeSettingsTable = db.prepare(`
    SELECT name FROM sqlite_master 
    WHERE type='table' AND name='user_navigation_mode_settings'
  `).get();

  if (modeSettingsTable) {
    db.prepare(`
      UPDATE user_navigation_mode_settings 
      SET header_height = 72
    `).run();
  }

  console.log('[Migration 038] Rollback completed - all header heights reset to 72px');
}

/**
 * MIGRATION NOTES:
 * 
 * This migration corrects the header heights to match the SYSTEM_DEFAULTS:
 * - header-statistics: 160px (was incorrectly 72px after Migration 037)
 * - header-navigation: 160px (was incorrectly 72px after Migration 037)
 * - full-sidebar: 72px (correct, maintained from Migration 037)
 * 
 * VERIFICATION:
 * After this migration runs, all frontend components should have consistent
 * header heights that match DatabaseNavigationService.SYSTEM_DEFAULTS
 * 
 * COMPATIBILITY:
 * - Works with Central Configuration Architecture (Phase 1-7)
 * - Compatible with DatabaseConfigurationService.getActiveConfig()
 * - Aligns with ConfigurationIpcService emergency fallbacks
 * - Matches NavigationContext.getModeDefaults() corrected values
 */