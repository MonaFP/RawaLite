/**
 * 📝 Migration 004: Gap Placeholder
 * 
 * Purpose: This migration serves as a placeholder for the missing migration 004
 * to maintain sequential numbering consistency. It performs no database changes.
 * 
 * Background: Migration numbering jumped from 003 to 005, leaving a gap.
 * This placeholder ensures database migration version tracking remains consistent.
 * 
 * Date: 2025-10-12
 * Version: v1.0.42.2 (hotfix-v1041-autoupdate)
 */

import type Database from 'better-sqlite3';

export function up(db: Database.Database): void {
  // This is a placeholder migration - no database changes needed
  console.log('⏭️  Migration 004: Gap placeholder - no changes applied');
}

export function down(db: Database.Database): void {
  // This is a placeholder migration - no rollback needed
  console.log('⏪ Migration 004: Gap placeholder - no rollback needed');
}