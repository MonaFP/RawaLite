/**
 * Migration 033: Normalize Header Navigation Height to 160px
 * 
 * Addresses: Header Navigation mode uses outdated 72px while Header Statistics uses 160px
 * Solution: Update all navigation preferences to use unified 160px for both modes
 * 
 * @since Schema Version 33
 * @created 2025-10-21
 * @reason Unify header heights for consistent logo-area alignment across navigation modes
 */

import type Database from 'better-sqlite3';

export function migrate033(db: Database.Database): void {
  console.log('🔄 [Migration 033] Normalizing Header Navigation height to 160px...');
  
  try {
    // Update all header navigation mode preferences to use 160px
    const updateNavigationHeights = db.prepare(`
      UPDATE user_navigation_preferences 
      SET header_height = 160, updated_at = CURRENT_TIMESTAMP
      WHERE navigation_mode = 'header-navigation' AND header_height < 160
    `);
    
    const result = updateNavigationHeights.run();
    console.log(`✅ [Migration 033] Updated ${result.changes} navigation preferences to 160px height`);
    
    // Also ensure header-statistics entries are at least 160px (safety check)
    const updateStatisticsHeights = db.prepare(`
      UPDATE user_navigation_preferences 
      SET header_height = 160, updated_at = CURRENT_TIMESTAMP
      WHERE navigation_mode = 'header-statistics' AND header_height < 160
    `);
    
    const statisticsResult = updateStatisticsHeights.run();
    console.log(`✅ [Migration 033] Verified ${statisticsResult.changes} statistics preferences at 160px height`);
    
    console.log('✅ [Migration 033] Header height normalization completed successfully');
    
  } catch (error) {
    console.error('❌ [Migration 033] Failed to normalize header heights:', error);
    throw error;
  }
}