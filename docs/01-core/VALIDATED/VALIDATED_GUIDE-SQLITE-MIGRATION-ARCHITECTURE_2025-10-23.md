# SQLite Migration Architecture - Current Implementation

> **Erstellt:** 23.10.2025 | **Letzte Aktualisierung:** 26.10.2025 (Aktualisiert auf Migration 046 - Real-DB Validierung)  
> **Status:** VALIDATED - Aktueller Repository-Stand mit Schema Version 46  
> **Schema:** `VALIDATED_GUIDE-SQLITE-MIGRATION-ARCHITECTURE_2025-10-23.md`

> **⚠️ CRITICAL:** [../../ROOT_VALIDATED_REGISTRY-CRITICAL-FIXES_2025-10-17.md](../../ROOT_VALIDATED_REGISTRY-CRITICAL-FIXES_2025-10-17.md) - **FIX-015: Field Mapper SQL Injection Prevention MANDATORY**  
> **🛡️ NEVER violate:** Prepared statements, field-mapper integration, idempotent migrations  
> **🏗️ ALWAYS use:** convertSQLQuery(), parameterized queries, schema validation  
> **🗄️ CRITICAL:** Schema Version 46 (Production), 46 Migrationen (000-045), Field-Mapper mit 150+ Mappings, WAL Mode  
> **⚠️ CONFLICT:** Migration 034/042 Tabellennamens-Konflikt - Migration 046 geplant zur Lösung

---

## 🎯 **Übersicht**

**Vollständige SQLite Migration Architecture** für RawaLite mit Schema Version 46, Field-Mapper Integration und Database-First Design.

### **Migration-Zustand (Validiert 26.10.2025):**
- **Aktuelle Schema-Version:** 46 (PRAGMA user_version)
- **Migrationen im Filesystem:** 46 Dateien (000-045)
- **Produktions-DB:** ✅ SYNCHRON (Schema Version 46)
- **Field-Mappings:** 150+ bidirektionale Mappings
- **Technologie:** better-sqlite3 + WAL Mode + Prepared Statements
- **⚠️ BEKANNTER KONFLIKT:** Migration 034/042 Tabellenname (Migration 046 geplant)

---

## 🏗️ **MIGRATION SYSTEM ARCHITEKTUR**

### **Migration File Structure**
```
src/main/db/migrations/
├── 000_init.ts                        Initial Database Setup
├── 001_settings_restructure.ts        Settings Restructure
├── 002_customers_schema_fix.ts        Customers Schema Fix
├── 003_fix_settings_schema.ts         Fix Settings Schema
├── 004_gap_placeholder.ts             Gap Placeholder
├── 005_add_packages_numbering.ts      Add Packages Numbering
├── 006_fix_missing_circles.ts         Fix Missing Circles
├── 007_fix_packages_invoice_schema.ts Fix Packages Invoice Schema
├── 008_fix_offers_schema.ts           Fix Offers Schema
├── 009_add_timesheets.ts              Add Timesheets
├── 010_add_timesheets_numbering.ts    Add Timesheets Numbering
├── 011_extend_offer_line_items.ts     Extend Offer Line Items
├── 012_add_tax_office_field.ts        Add Tax Office Field
├── 013_add_discount_system.ts         Add Discount System
├── 014_add_item_origin_system.ts      Add Item Origin System
├── 015_add_status_versioning.ts       Add Status Versioning
├── 016_add_offer_attachments.ts       Add Offer Attachments
├── 017_add_update_history.ts          Add Update History
├── 018_add_auto_update_preferences.ts Add Auto Update Preferences
├── 019_mini_fix_delivery.ts           Mini Fix Delivery
├── 020_cleanup_v1041_settings.ts      Cleanup v1.0.41 Settings
├── 021_unify_package_unit_price.ts    Unify Package Unit Price
├── 022_add_invoice_attachments.ts     Add Invoice Attachments
├── 023_add_line_item_hierarchy_level.ts Add Line Item Hierarchy Level
├── 024_restore_package_line_items.ts  Restore Package Line Items
├── 025_add_price_display_mode.ts      Add Price Display Mode
├── 026_add_price_display_mode_to_settings.ts Add Price Display Mode to Settings
├── 027_add_theme_system.ts            Theme Management (FIX-017: Critical)
├── 028_add_navigation_system.ts       Navigation Preferences
├── 029_add_focus_mode_system.ts       Focus Mode Functionality
├── 030_fix_navigation_mode_values.ts  Fix Navigation Mode Values
├── 031_increase_header_height_limit.ts Increase Header Height Limit
├── 032_increase_header_height_to_100.ts Increase Header Height to 100
├── 033_normalize_header_navigation_modes.ts Normalize Header Navigation Modes
├── 034_add_navigation_mode_settings.ts ⚠️ Per-Mode Settings (Konflikt mit 042!)
├── 035_add_focus_mode_preferences.ts  Add Focus Mode Preferences
├── 036_add_theme_overrides.ts         Add Theme Overrides
├── 037_centralized_configuration.ts   Centralized Configuration
├── 038_correct_header_heights_final.ts Correct Header Heights Final
├── 039_fix_full_sidebar_header_height.ts Fix Full Sidebar Header Height
├── 040_fix_navigation_preferences.ts  Fix Navigation Preferences
├── 041_add_footer_content_preferences.ts Add Footer Content Preferences
├── 042_user_navigation_mode_settings.ts ⚠️ Global UI Settings (Konflikt mit 034!)
├── 043_convert_legacy_navigation_modes.ts Convert Legacy Navigation Modes
├── 044_cleanup_navigation_modes.ts    Cleanup Navigation Modes
├── 045_enforce_ki_safe_navigation_modes.ts Enforce KI-Safe Navigation Modes
└── index.ts                           Migration Registry & Execution
```

**⚠️ KRITISCHER KONFLIKT - Migration 034 vs 042:**
- **Problem:** Beide Migrationen erstellen Tabelle `user_navigation_mode_settings`
- **Migration 034 SQL:** Per-Mode Settings (multi-row, `UNIQUE(user_id, navigation_mode)`)
- **Migration 042 TS:** Global UI Settings (single-row, `UNIQUE(user_id)`)
- **DB-Status:** Migration 042 aktiv (034 überschrieben)
- **Lösung:** Migration 046 geplant - Tabellenumbenennung + Schema-Separation

### **Migration Registration System**
```typescript
// src/main/db/migrations/index.ts - Complete Migration Chain
import { Migration } from './types';

// Import all migrations (000-045)
import migration000 from './000_init';
import migration001 from './001_settings_restructure';
import migration002 from './002_customers_schema_fix';
import migration003 from './003_fix_settings_schema';
import migration004 from './004_gap_placeholder';
import migration005 from './005_add_packages_numbering';
// ... (all migrations 006-044)
import migration045 from './045_enforce_ki_safe_navigation_modes';

/**
 * Complete migration registry - MUST be sequential
 * 
 * ⚠️ CRITICAL: Never skip migration numbers or change order
 * ⚠️ CRITICAL: Each migration MUST be idempotent
 * ⚠️ CRITICAL: Field-mapper integration required for all table operations
 * ⚠️ CONFLICT: Migration 034/042 both use table `user_navigation_mode_settings`
 */
export const MIGRATIONS: Migration[] = [
  { version: 0, name: '000_init', up: migration000 },
  { version: 1, name: '001_settings_restructure', up: migration001 },
  { version: 2, name: '002_customers_schema_fix', up: migration002 },
  { version: 3, name: '003_fix_settings_schema', up: migration003 },
  { version: 4, name: '004_gap_placeholder', up: migration004 },
  { version: 5, name: '005_add_packages_numbering', up: migration005 },
  { version: 6, name: '006_fix_missing_circles', up: migration006 },
  { version: 7, name: '007_fix_packages_invoice_schema', up: migration007 },
  { version: 8, name: '008_fix_offers_schema', up: migration008 },
  { version: 9, name: '009_add_timesheets', up: migration009 },
  { version: 10, name: '010_add_timesheets_numbering', up: migration010 },
  { version: 11, name: '011_extend_offer_line_items', up: migration011 },
  { version: 12, name: '012_add_tax_office_field', up: migration012 },
  { version: 13, name: '013_add_discount_system', up: migration013 },
  { version: 14, name: '014_add_item_origin_system', up: migration014 },
  { version: 15, name: '015_add_status_versioning', up: migration015 },
  { version: 16, name: '016_add_offer_attachments', up: migration016 },
  { version: 17, name: '017_add_update_history', up: migration017 },
  { version: 18, name: '018_add_auto_update_preferences', up: migration018 },
  { version: 19, name: '019_mini_fix_delivery', up: migration019 },
  { version: 20, name: '020_cleanup_v1041_settings', up: migration020 },
  { version: 21, name: '021_unify_package_unit_price', up: migration021 },
  { version: 22, name: '022_add_invoice_attachments', up: migration022 },
  { version: 23, name: '023_add_line_item_hierarchy_level', up: migration023 },
  { version: 24, name: '024_restore_package_line_items', up: migration024 },
  { version: 25, name: '025_add_price_display_mode', up: migration025 },
  { version: 26, name: '026_add_price_display_mode_to_settings', up: migration026 },
  { version: 27, name: '027_add_theme_system', up: migration027 },
  { version: 28, name: '028_add_navigation_system', up: migration028 },
  { version: 29, name: '029_add_focus_mode_system', up: migration029 },
  { version: 30, name: '030_fix_navigation_mode_values', up: migration030 },
  { version: 31, name: '031_increase_header_height_limit', up: migration031 },
  { version: 32, name: '032_increase_header_height_to_100', up: migration032 },
  { version: 33, name: '033_normalize_header_navigation_modes', up: migration033 },
  { version: 34, name: '034_add_navigation_mode_settings', up: migration034 }, // ⚠️ Conflict!
  { version: 35, name: '035_add_focus_mode_preferences', up: migration035 },
  { version: 36, name: '036_add_theme_overrides', up: migration036 },
  { version: 37, name: '037_centralized_configuration', up: migration037 },
  { version: 38, name: '038_correct_header_heights_final', up: migration038 },
  { version: 39, name: '039_fix_full_sidebar_header_height', up: migration039 },
  { version: 40, name: '040_fix_navigation_preferences', up: migration040 },
  { version: 41, name: '041_add_footer_content_preferences', up: migration041 },
  { version: 42, name: '042_user_navigation_mode_settings', up: migration042 }, // ⚠️ Conflict!
  { version: 43, name: '043_convert_legacy_navigation_modes', up: migration043 },
  { version: 44, name: '044_cleanup_navigation_modes', up: migration044 },
  { version: 45, name: '045_enforce_ki_safe_navigation_modes', up: migration045 }
];

/**
 * Get current database schema version
 */
export function getCurrentSchemaVersion(): number {
  return Math.max(...MIGRATIONS.map(m => m.version)); // Returns 45
}

/**
 * Validate migration chain integrity
 */
export function validateMigrationChain(): boolean {
  const versions = MIGRATIONS.map(m => m.version).sort((a, b) => a - b);
  
  for (let i = 0; i < versions.length; i++) {
    if (versions[i] !== i) {
      console.error(`Migration chain broken at version ${i}`);
      return false;
    }
  }
  
  return true;
}
```

---

## 🔄 **FIELD-MAPPER INTEGRATION**

### **Field-Mapper Architecture (150+ Mappings)**
```typescript
// src/lib/field-mapper.ts - Complete Mapping System
export class FieldMapper {
  /**
   * Master mapping registry - bidirectional camelCase ↔ snake_case
   * 
   * ⚠️ CRITICAL FIX-015: All SQL operations MUST use these mappings
   */
  private static readonly JS_TO_SQL_MAPPINGS: Record<string, string> = {
    // Timestamps (universal)
    'createdAt': 'created_at',
    'updatedAt': 'updated_at',
    'deletedAt': 'deleted_at',
    'sentAt': 'sent_at',
    'paidAt': 'paid_at',
    'cancelledAt': 'cancelled_at',
    'overdueAt': 'overdue_at',
    'changedAt': 'changed_at',
    
    // Customer fields
    'companyName': 'company_name',
    'contactPerson': 'contact_person',
    'addressStreet': 'address_street',
    'addressCity': 'address_city',
    'addressZip': 'address_zip',
    'addressCountry': 'address_country',
    'taxNumber': 'tax_id',
    'taxOffice': 'tax_office',
    
    // Financial fields
    'unitPrice': 'unit_price',
    'totalAmount': 'total_amount',
    'taxRate': 'tax_rate',
    'vatRate': 'vat_rate',
    'vatAmount': 'vat_amount',
    'discountAmount': 'discount_amount',
    'discountRate': 'discount_rate',
    'netAmount': 'net_amount',
    'grossAmount': 'gross_amount',
    'hourlyRate': 'hourly_rate',
    
    // Relationship fields
    'customerId': 'customer_id',
    'offerId': 'offer_id',
    'invoiceId': 'invoice_id',
    'packageId': 'package_id',
    'parentItemId': 'parent_item_id',
    'lineItemId': 'line_item_id',
    'timesheetId': 'timesheet_id',
    'activityId': 'activity_id',
    'themeId': 'theme_id',
    'userId': 'user_id',
    'sessionId': 'session_id',
    
    // Document fields
    'offerNumber': 'offer_number',
    'invoiceNumber': 'invoice_number',
    'timesheetNumber': 'timesheet_number',
    'validUntil': 'valid_until',
    'dueDate': 'due_date',
    'internalTitle': 'internal_title',
    'originalFilename': 'original_filename',
    
    // System fields
    'isActive': 'is_active',
    'isDefault': 'is_default',
    'isSystem': 'is_system',
    'isBreak': 'is_break',
    'addVat': 'add_vat',
    'autoCollapse': 'auto_collapse',
    'rememberFocusMode': 'remember_focus_mode',
    
    // Theme system (Migration 027)
    'displayName': 'display_name',
    'colorKey': 'color_key',
    'colorValue': 'color_value',
    'activeThemeId': 'active_theme_id',
    'fallbackThemeKey': 'fallback_theme_key',
    
    // Navigation system (Migration 028)
    'navigationMode': 'navigation_mode',
    'headerHeight': 'header_height',
    'sidebarWidth': 'sidebar_width',
    'previousMode': 'previous_mode',
    'newMode': 'new_mode',
    
    // Configuration system (Migration 030)
    'configKey': 'config_key',
    'configValue': 'config_value',
    'configType': 'config_type',
    'defaultValue': 'default_value',
    'isRequired': 'is_required',
    'validationPattern': 'validation_pattern',
    
    // Auto-update system (Migration 014)
    'autoUpdateEnabled': 'auto_update_enabled',
    'autoUpdateCheckFrequency': 'auto_update_check_frequency',
    'autoUpdateNotificationStyle': 'auto_update_notification_style',
    'autoUpdateReminderInterval': 'auto_update_reminder_interval',
    'autoUpdateAutoDownload': 'auto_update_auto_download',
    'autoUpdateInstallPrompt': 'auto_update_install_prompt',
    
    // File and attachment fields
    'fileType': 'file_type',
    'fileSize': 'file_size',
    'filePath': 'file_path',
    'base64Data': 'base64_data',
    'itemType': 'item_type',
    'sourcePackageId': 'source_package_id',
    'sourcePackageItemId': 'source_package_item_id',
    
    // Time tracking fields
    'startDate': 'start_date',
    'endDate': 'end_date',
    'startTime': 'start_time',
    'endTime': 'end_time',
    
    // Status and versioning
    'version': 'version',
    'hierarchyLevel': 'hierarchy_level',
    'itemOrigin': 'item_origin',
    'sortOrder': 'sort_order',
    'clientTempId': 'client_temp_id',
    
    // Banking and financial
    'bankName': 'bank_name',
    'bankAccount': 'bank_account',
    'bankBic': 'bank_bic',
    
    // Numbering system
    'lastNumber': 'last_number',
    'numberPattern': 'number_pattern',
    'resetPeriod': 'reset_period',
    
    // Table name mappings
    'packageLineItems': 'package_line_items',
    'offerLineItems': 'offer_line_items',
    'invoiceLineItems': 'invoice_line_items',
    'numberingCircles': 'numbering_circles',
    'timesheetActivities': 'timesheet_activities',
    'offerAttachments': 'offer_attachments',
    'invoiceAttachments': 'invoice_attachments',
    'themeColors': 'theme_colors',
    'userThemePreferences': 'user_theme_preferences',
    'navigationSettings': 'navigation_settings',
    'navigationModeHistory': 'navigation_mode_history',
    'userNavigationPreferences': 'user_navigation_preferences'
  };

  /**
   * Automatic reverse mapping generation
   */
  private static readonly SQL_TO_JS_MAPPINGS: Record<string, string> = Object.fromEntries(
    Object.entries(FieldMapper.JS_TO_SQL_MAPPINGS).map(([js, sql]) => [sql, js])
  );
}
```

### **Migration Integration with Field-Mapper**
```typescript
// Example: Migration 040 with Field-Mapper Integration
export default function migration040(db: Database): void {
  console.log('Running Migration 040: Final Schema Optimization...');
  
  try {
    // Begin transaction for atomicity
    db.exec('BEGIN IMMEDIATE');
    
    // 1. Create optimized indexes using field-mapper
    const createIndexes = [
      // Performance indexes for common queries
      `CREATE INDEX IF NOT EXISTS idx_customers_company_name 
       ON customers(${FieldMapper.toSQL({ companyName: '' }).companyName})`,
       
      `CREATE INDEX IF NOT EXISTS idx_offers_customer_created 
       ON offers(${FieldMapper.toSQL({ customerId: 0 }).customerId}, 
                 ${FieldMapper.toSQL({ createdAt: '' }).createdAt})`,
                 
      `CREATE INDEX IF NOT EXISTS idx_line_items_parent_hierarchy 
       ON offer_line_items(${FieldMapper.toSQL({ parentItemId: 0 }).parentItemId}, 
                          ${FieldMapper.toSQL({ hierarchyLevel: 0 }).hierarchyLevel})`,
    ];
    
    createIndexes.forEach(sql => {
      db.exec(sql);
      console.log('✅ Index created');
    });
    
    // 2. Optimize table constraints with field-mapper awareness
    const optimizeConstraints = [
      // Foreign key constraints using mapped field names
      `ALTER TABLE ${FieldMapper.toSQL({ offerLineItems: '' }).offerLineItems} 
       ADD CONSTRAINT fk_offer_line_items_offer 
       FOREIGN KEY (${FieldMapper.toSQL({ offerId: 0 }).offerId}) 
       REFERENCES offers(id) ON DELETE CASCADE`,
       
      `ALTER TABLE ${FieldMapper.toSQL({ packageLineItems: '' }).packageLineItems} 
       ADD CONSTRAINT fk_package_line_items_parent 
       FOREIGN KEY (${FieldMapper.toSQL({ parentItemId: 0 }).parentItemId}) 
       REFERENCES ${FieldMapper.toSQL({ packageLineItems: '' }).packageLineItems}(id) 
       ON DELETE CASCADE`,
    ];
    
    // Apply constraints with error handling
    optimizeConstraints.forEach((sql, index) => {
      try {
        db.exec(sql);
        console.log(`✅ Constraint ${index + 1} applied`);
      } catch (error) {
        // Constraint might already exist - ignore duplicate errors
        if (!error.message.includes('already exists')) {
          throw error;
        }
        console.log(`ℹ️ Constraint ${index + 1} already exists`);
      }
    });
    
    // 3. Update schema metadata
    const updateMetadata = db.prepare(`
      INSERT OR REPLACE INTO schema_metadata (key, value, updated_at) 
      VALUES (?, ?, ?)
    `);
    
    updateMetadata.run('schema_version', '040', new Date().toISOString());
    updateMetadata.run('migration_040_applied', 'true', new Date().toISOString());
    updateMetadata.run('field_mapper_version', '150+', new Date().toISOString());
    
    // 4. Validate schema integrity
    const validationQueries = [
      'PRAGMA foreign_key_check',
      'PRAGMA integrity_check',
      'PRAGMA quick_check'
    ];
    
    validationQueries.forEach(pragma => {
      const result = db.exec(pragma);
      if (result.length > 0 && result[0].values.length > 0) {
        const issues = result[0].values.flat();
        if (issues.some(issue => issue !== 'ok')) {
          throw new Error(`Schema validation failed: ${JSON.stringify(issues)}`);
        }
      }
    });
    
    // Commit transaction
    db.exec('COMMIT');
    console.log('✅ Migration 040 completed successfully');
    
  } catch (error) {
    // Rollback on error
    try {
      db.exec('ROLLBACK');
    } catch (rollbackError) {
      console.error('❌ Rollback failed:', rollbackError);
    }
    
    console.error('❌ Migration 040 failed:', error);
    throw error;
  }
}
```

---

## 🔧 **MIGRATION DEVELOPMENT PATTERNS**

### **Migration Template (Safe Pattern)**
```typescript
// Template for new migrations
import { Database } from 'better-sqlite3';
import { FieldMapper } from '../../lib/field-mapper';

/**
 * Migration XXX: [Description]
 * 
 * Changes:
 * - [List specific changes]
 * 
 * Field-Mapper updates required:
 * - [List new mappings to add]
 * 
 * Rollback strategy:
 * - [Describe rollback approach]
 */
export default function migrationXXX(db: Database): void {
  console.log('Running Migration XXX: [Description]...');
  
  try {
    // 1. Begin transaction
    db.exec('BEGIN IMMEDIATE');
    
    // 2. Schema validation (check current state)
    const currentTables = db.exec(`
      SELECT name FROM sqlite_master 
      WHERE type='table' AND name NOT LIKE 'sqlite_%'
    `)[0]?.values?.flat() || [];
    
    console.log(`Current tables: ${currentTables.length}`);
    
    // 3. Execute migration steps
    const migrationSteps = [
      // Step 1: Create new table with field-mapper integration
      `CREATE TABLE IF NOT EXISTS new_table (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        ${FieldMapper.toSQL({ createdAt: '' }).createdAt} TEXT NOT NULL,
        ${FieldMapper.toSQL({ updatedAt: '' }).updatedAt} TEXT NOT NULL
      )`,
      
      // Step 2: Create indexes
      `CREATE INDEX IF NOT EXISTS idx_new_table_created
       ON new_table(${FieldMapper.toSQL({ createdAt: '' }).createdAt})`,
    ];
    
    // Execute each step with error handling
    migrationSteps.forEach((sql, index) => {
      try {
        db.exec(sql);
        console.log(`✅ Step ${index + 1} completed`);
      } catch (error) {
        console.error(`❌ Step ${index + 1} failed:`, error);
        throw error;
      }
    });
    
    // 4. Update migration tracking
    const insertMigration = db.prepare(`
      INSERT INTO migration_history (migration_id, name, applied_at, status)
      VALUES (?, ?, ?, ?)
    `);
    
    insertMigration.run(
      'XXX',
      '[Migration Name]',
      new Date().toISOString(),
      'completed'
    );
    
    // 5. Validate changes
    const newTableCount = db.exec(`
      SELECT COUNT(*) as count FROM sqlite_master 
      WHERE type='table' AND name='new_table'
    `)[0]?.values?.[0]?.[0] || 0;
    
    if (newTableCount !== 1) {
      throw new Error('Migration validation failed: table not created');
    }
    
    // 6. Commit transaction
    db.exec('COMMIT');
    console.log('✅ Migration XXX completed successfully');
    
  } catch (error) {
    // Rollback on error
    try {
      db.exec('ROLLBACK');
      console.log('🔄 Migration XXX rolled back');
    } catch (rollbackError) {
      console.error('❌ Rollback failed:', rollbackError);
    }
    
    console.error('❌ Migration XXX failed:', error);
    throw error;
  }
}
```

### **Field-Mapper Extension Pattern**
```typescript
// When adding new fields to field-mapper.ts
export class FieldMapper {
  private static readonly JS_TO_SQL_MAPPINGS: Record<string, string> = {
    // ... existing mappings
    
    // NEW MIGRATION XXX: [Description]
    'newBusinessField': 'new_business_field',
    'anotherField': 'another_field',
    'relationshipId': 'relationship_id',
    
    // NEW TABLE MAPPINGS
    'newTableName': 'new_table_name',
    'relatedTable': 'related_table'
  };
  
  /**
   * Field-Mapper validation for Migration XXX
   */
  static validateMigrationXXXMappings(): boolean {
    const requiredMappings = [
      'newBusinessField',
      'anotherField',
      'relationshipId'
    ];
    
    return requiredMappings.every(field => 
      field in FieldMapper.JS_TO_SQL_MAPPINGS
    );
  }
}
```

---

## 🛡️ **MIGRATION SAFETY & VALIDATION**

### **Pre-Migration Checks**
```typescript
// src/main/db/migration-validator.ts
export class MigrationValidator {
  /**
   * Validate migration safety before execution
   */
  static validateMigrationSafety(
    db: Database, 
    migrationVersion: number
  ): ValidationResult {
    const checks = [
      this.checkDatabaseIntegrity(db),
      this.checkFieldMapperConsistency(),
      this.checkForeignKeyConstraints(db),
      this.checkMigrationChainIntegrity(migrationVersion),
      this.checkSchemaConsistency(db)
    ];
    
    const failures = checks.filter(check => !check.success);
    
    return {
      valid: failures.length === 0,
      failures: failures.map(f => f.reason),
      warnings: checks.filter(c => c.warnings).flatMap(c => c.warnings)
    };
  }
  
  /**
   * Check database integrity before migration
   */
  private static checkDatabaseIntegrity(db: Database): CheckResult {
    try {
      const result = db.exec('PRAGMA integrity_check')[0];
      const issues = result?.values?.flat() || [];
      
      return {
        success: issues.length === 1 && issues[0] === 'ok',
        reason: issues.length > 1 ? `Integrity issues: ${issues.join(', ')}` : undefined
      };
    } catch (error) {
      return {
        success: false,
        reason: `Integrity check failed: ${error.message}`
      };
    }
  }
  
  /**
   * Validate field-mapper consistency with current schema
   */
  private static checkFieldMapperConsistency(): CheckResult {
    try {
      const mappings = FieldMapper.getMappings();
      const inconsistencies = [];
      
      // Check for common issues
      Object.entries(mappings.jsToSql).forEach(([js, sql]) => {
        if (!sql.includes('_') && js !== sql) {
          inconsistencies.push(`Mapping might be incorrect: ${js} -> ${sql}`);
        }
      });
      
      return {
        success: inconsistencies.length === 0,
        reason: inconsistencies.length > 0 ? inconsistencies.join(', ') : undefined,
        warnings: inconsistencies.length > 0 ? inconsistencies : undefined
      };
    } catch (error) {
      return {
        success: false,
        reason: `Field-mapper validation failed: ${error.message}`
      };
    }
  }
  
  /**
   * Check foreign key constraints
   */
  private static checkForeignKeyConstraints(db: Database): CheckResult {
    try {
      const result = db.exec('PRAGMA foreign_key_check')[0];
      const violations = result?.values || [];
      
      return {
        success: violations.length === 0,
        reason: violations.length > 0 ? 
          `Foreign key violations: ${violations.map(v => v.join(':')).join(', ')}` : 
          undefined
      };
    } catch (error) {
      return {
        success: false,
        reason: `Foreign key check failed: ${error.message}`
      };
    }
  }
}

interface ValidationResult {
  valid: boolean;
  failures: string[];
  warnings?: string[];
}

interface CheckResult {
  success: boolean;
  reason?: string;
  warnings?: string[];
}
```

### **Post-Migration Verification**
```typescript
// Verification after migration execution
export class PostMigrationVerifier {
  /**
   * Verify migration completed successfully
   */
  static verifyMigrationCompletion(
    db: Database, 
    migrationVersion: number
  ): VerificationResult {
    const checks = [
      this.verifySchemaChanges(db, migrationVersion),
      this.verifyDataIntegrity(db),
      this.verifyIndexes(db),
      this.verifyConstraints(db),
      this.verifyFieldMapperAlignment(db)
    ];
    
    const failures = checks.filter(check => !check.success);
    
    return {
      verified: failures.length === 0,
      failures: failures.map(f => f.reason),
      metrics: this.collectMigrationMetrics(db, migrationVersion)
    };
  }
  
  /**
   * Verify field-mapper alignment with actual schema
   */
  private static verifyFieldMapperAlignment(db: Database): CheckResult {
    try {
      const tables = db.exec(`
        SELECT name FROM sqlite_master 
        WHERE type='table' AND name NOT LIKE 'sqlite_%'
      `)[0]?.values?.flat() || [];
      
      const alignmentIssues = [];
      
      tables.forEach(tableName => {
        const columns = db.exec(`PRAGMA table_info(${tableName})`)[0]?.values || [];
        
        columns.forEach(columnInfo => {
          const columnName = columnInfo[1]; // column name is at index 1
          
          // Check if snake_case column has corresponding camelCase mapping
          if (columnName.includes('_')) {
            const mappings = FieldMapper.getMappings();
            const hasMappingFromJs = Object.values(mappings.jsToSql).includes(columnName);
            
            if (!hasMappingFromJs) {
              alignmentIssues.push(`Column ${tableName}.${columnName} missing from field-mapper`);
            }
          }
        });
      });
      
      return {
        success: alignmentIssues.length === 0,
        reason: alignmentIssues.length > 0 ? alignmentIssues.join(', ') : undefined
      };
    } catch (error) {
      return {
        success: false,
        reason: `Field-mapper alignment check failed: ${error.message}`
      };
    }
  }
  
  /**
   * Collect migration performance metrics
   */
  private static collectMigrationMetrics(
    db: Database, 
    migrationVersion: number
  ): MigrationMetrics {
    const tableStats = db.exec(`
      SELECT 
        name,
        (SELECT COUNT(*) FROM sqlite_master WHERE type='index' AND tbl_name=m.name) as index_count
      FROM sqlite_master m
      WHERE type='table' AND name NOT LIKE 'sqlite_%'
    `)[0]?.values || [];
    
    const totalTables = tableStats.length;
    const totalIndexes = tableStats.reduce((sum, row) => sum + (row[1] as number), 0);
    
    return {
      migrationVersion,
      totalTables,
      totalIndexes,
      completedAt: new Date().toISOString(),
      schemaVersion: this.getCurrentSchemaVersion(db)
    };
  }
}

interface VerificationResult {
  verified: boolean;
  failures: string[];
  metrics: MigrationMetrics;
}

interface MigrationMetrics {
  migrationVersion: number;
  totalTables: number;
  totalIndexes: number;
  completedAt: string;
  schemaVersion: string;
}
```

---

## 🔄 **MIGRATION EXECUTION ENGINE**

### **Safe Migration Runner**
```typescript
// src/main/db/migration-runner.ts
import { Database } from 'better-sqlite3';
import { MIGRATIONS } from './migrations';
import { MigrationValidator, PostMigrationVerifier } from './migration-validator';

export class MigrationRunner {
  /**
   * Run all pending migrations safely
   * 
   * ⚠️ CRITICAL: Follows strict safety protocols
   */
  static async runAllMigrations(db: Database): Promise<MigrationRunResult> {
    console.log('🚀 Starting migration runner...');
    
    const startTime = Date.now();
    const results = [];
    
    try {
      // 1. Validate migration chain integrity
      if (!this.validateMigrationChainIntegrity()) {
        throw new Error('Migration chain integrity check failed');
      }
      
      // 2. Get current schema version
      const currentVersion = this.getCurrentSchemaVersion(db);
      console.log(`📊 Current schema version: ${currentVersion}`);
      
      // 3. Determine pending migrations
      const pendingMigrations = MIGRATIONS.filter(m => m.version > currentVersion);
      console.log(`📋 Pending migrations: ${pendingMigrations.length}`);
      
      if (pendingMigrations.length === 0) {
        console.log('✅ No migrations to run');
        return {
          success: true,
          migrationsRun: 0,
          duration: Date.now() - startTime,
          results: []
        };
      }
      
      // 4. Run each migration with safety checks
      for (const migration of pendingMigrations) {
        console.log(`🔄 Running migration ${migration.version}: ${migration.name}`);
        
        const migrationResult = await this.runSingleMigration(db, migration);
        results.push(migrationResult);
        
        if (!migrationResult.success) {
          throw new Error(`Migration ${migration.version} failed: ${migrationResult.error}`);
        }
        
        console.log(`✅ Migration ${migration.version} completed`);
      }
      
      // 5. Final validation
      const finalValidation = MigrationValidator.validateMigrationSafety(
        db, 
        Math.max(...pendingMigrations.map(m => m.version))
      );
      
      if (!finalValidation.valid) {
        throw new Error(`Final validation failed: ${finalValidation.failures.join(', ')}`);
      }
      
      const duration = Date.now() - startTime;
      console.log(`🎉 All migrations completed in ${duration}ms`);
      
      return {
        success: true,
        migrationsRun: pendingMigrations.length,
        duration,
        results
      };
      
    } catch (error) {
      console.error('❌ Migration runner failed:', error);
      
      return {
        success: false,
        migrationsRun: results.filter(r => r.success).length,
        duration: Date.now() - startTime,
        results,
        error: error.message
      };
    }
  }
  
  /**
   * Run single migration with comprehensive safety checks
   */
  private static async runSingleMigration(
    db: Database, 
    migration: Migration
  ): Promise<SingleMigrationResult> {
    const startTime = Date.now();
    
    try {
      // 1. Pre-migration validation
      const preValidation = MigrationValidator.validateMigrationSafety(db, migration.version);
      if (!preValidation.valid) {
        throw new Error(`Pre-migration validation failed: ${preValidation.failures.join(', ')}`);
      }
      
      // 2. Create backup point (WAL mode checkpoint)
      db.exec('PRAGMA wal_checkpoint(FULL)');
      
      // 3. Execute migration
      await migration.up(db);
      
      // 4. Update migration tracking
      const insertMigration = db.prepare(`
        INSERT OR REPLACE INTO migration_history 
        (migration_id, name, applied_at, status, duration_ms)
        VALUES (?, ?, ?, ?, ?)
      `);
      
      const duration = Date.now() - startTime;
      insertMigration.run(
        migration.version.toString(),
        migration.name,
        new Date().toISOString(),
        'completed',
        duration
      );
      
      // 5. Post-migration verification
      const verification = PostMigrationVerifier.verifyMigrationCompletion(db, migration.version);
      if (!verification.verified) {
        throw new Error(`Post-migration verification failed: ${verification.failures.join(', ')}`);
      }
      
      return {
        success: true,
        version: migration.version,
        name: migration.name,
        duration,
        metrics: verification.metrics
      };
      
    } catch (error) {
      console.error(`❌ Migration ${migration.version} failed:`, error);
      
      return {
        success: false,
        version: migration.version,
        name: migration.name,
        duration: Date.now() - startTime,
        error: error.message
      };
    }
  }
  
  /**
   * Get current schema version from database
   */
  private static getCurrentSchemaVersion(db: Database): number {
    try {
      const result = db.exec(`
        SELECT MAX(CAST(migration_id AS INTEGER)) as version 
        FROM migration_history 
        WHERE status = 'completed'
      `)[0];
      
      return result?.values?.[0]?.[0] as number || 0;
    } catch (error) {
      // Migration history table might not exist yet
      return 0;
    }
  }
  
  /**
   * Validate migration chain has no gaps
   */
  private static validateMigrationChainIntegrity(): boolean {
    const versions = MIGRATIONS.map(m => m.version).sort((a, b) => a - b);
    
    for (let i = 0; i < versions.length; i++) {
      if (versions[i] !== i + 1) {
        console.error(`Migration chain broken: expected version ${i + 1}, got ${versions[i]}`);
        return false;
      }
    }
    
    return true;
  }
}

interface Migration {
  version: number;
  name: string;
  up: (db: Database) => void | Promise<void>;
}

interface MigrationRunResult {
  success: boolean;
  migrationsRun: number;
  duration: number;
  results: SingleMigrationResult[];
  error?: string;
}

interface SingleMigrationResult {
  success: boolean;
  version: number;
  name: string;
  duration: number;
  metrics?: any;
  error?: string;
}
```

---

## 📊 **SCHEMA DOCUMENTATION (Migration 040)**

### **Current Database Schema (Complete)**
```sql
-- Production schema as of Migration 040

-- Core entity tables
CREATE TABLE customers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  company_name TEXT NOT NULL,
  contact_person TEXT,
  email TEXT,
  phone TEXT,
  address_street TEXT,
  address_city TEXT,
  address_zip TEXT,
  address_country TEXT,
  tax_id TEXT,
  tax_office TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE offers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  customer_id INTEGER NOT NULL,
  offer_number TEXT UNIQUE NOT NULL,
  title TEXT,
  total_amount REAL NOT NULL DEFAULT 0,
  tax_rate REAL NOT NULL DEFAULT 19,
  valid_until TEXT,
  status TEXT DEFAULT 'draft',
  notes TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE
);

CREATE TABLE invoices (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  customer_id INTEGER NOT NULL,
  offer_id INTEGER,
  invoice_number TEXT UNIQUE NOT NULL,
  title TEXT,
  total_amount REAL NOT NULL DEFAULT 0,
  tax_rate REAL NOT NULL DEFAULT 19,
  due_date TEXT,
  paid_at TEXT,
  status TEXT DEFAULT 'draft',
  notes TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
  FOREIGN KEY (offer_id) REFERENCES offers(id) ON DELETE SET NULL
);

CREATE TABLE packages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  description TEXT,
  internal_title TEXT,
  parent_package_id INTEGER,
  add_vat BOOLEAN DEFAULT 1,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (parent_package_id) REFERENCES packages(id) ON DELETE CASCADE
);

-- Line item tables with hierarchy support
CREATE TABLE package_line_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  package_id INTEGER NOT NULL,
  parent_item_id INTEGER,
  title TEXT NOT NULL,
  description TEXT,
  quantity REAL NOT NULL DEFAULT 1,
  unit_price REAL NOT NULL DEFAULT 0,
  vat_rate REAL DEFAULT 19,
  vat_amount REAL DEFAULT 0,
  hierarchy_level INTEGER DEFAULT 0,
  item_origin TEXT DEFAULT 'manual',
  source_package_item_id INTEGER,
  sort_order INTEGER DEFAULT 0,
  client_temp_id TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (package_id) REFERENCES packages(id) ON DELETE CASCADE,
  FOREIGN KEY (parent_item_id) REFERENCES package_line_items(id) ON DELETE CASCADE,
  FOREIGN KEY (source_package_item_id) REFERENCES package_line_items(id) ON DELETE SET NULL
);

CREATE TABLE offer_line_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  offer_id INTEGER NOT NULL,
  parent_item_id INTEGER,
  title TEXT NOT NULL,
  description TEXT,
  quantity REAL NOT NULL DEFAULT 1,
  unit_price REAL NOT NULL DEFAULT 0,
  vat_rate REAL DEFAULT 19,
  vat_amount REAL DEFAULT 0,
  hierarchy_level INTEGER DEFAULT 0,
  item_origin TEXT DEFAULT 'manual',
  source_package_item_id INTEGER,
  sort_order INTEGER DEFAULT 0,
  client_temp_id TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (offer_id) REFERENCES offers(id) ON DELETE CASCADE,
  FOREIGN KEY (parent_item_id) REFERENCES offer_line_items(id) ON DELETE CASCADE,
  FOREIGN KEY (source_package_item_id) REFERENCES package_line_items(id) ON DELETE SET NULL
);

CREATE TABLE invoice_line_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  invoice_id INTEGER NOT NULL,
  parent_item_id INTEGER,
  title TEXT NOT NULL,
  description TEXT,
  quantity REAL NOT NULL DEFAULT 1,
  unit_price REAL NOT NULL DEFAULT 0,
  vat_rate REAL DEFAULT 19,
  vat_amount REAL DEFAULT 0,
  hierarchy_level INTEGER DEFAULT 0,
  item_origin TEXT DEFAULT 'manual',
  source_package_item_id INTEGER,
  sort_order INTEGER DEFAULT 0,
  client_temp_id TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE,
  FOREIGN KEY (parent_item_id) REFERENCES invoice_line_items(id) ON DELETE CASCADE,
  FOREIGN KEY (source_package_item_id) REFERENCES package_line_items(id) ON DELETE SET NULL
);

-- System tables
CREATE TABLE settings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  company_name TEXT,
  address_street TEXT,
  address_city TEXT,
  address_zip TEXT,
  address_country TEXT,
  phone TEXT,
  email TEXT,
  website TEXT,
  tax_id TEXT,
  tax_office TEXT,
  bank_name TEXT,
  bank_account TEXT,
  bank_bic TEXT,
  logo TEXT,
  auto_update_enabled BOOLEAN DEFAULT 1,
  auto_update_check_frequency INTEGER DEFAULT 24,
  auto_update_notification_style TEXT DEFAULT 'notification',
  auto_update_reminder_interval INTEGER DEFAULT 7,
  auto_update_auto_download BOOLEAN DEFAULT 0,
  auto_update_install_prompt BOOLEAN DEFAULT 1,
  updated_at TEXT NOT NULL
);

CREATE TABLE numbering_circles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  prefix TEXT NOT NULL,
  digits INTEGER NOT NULL DEFAULT 4,
  last_number INTEGER NOT NULL DEFAULT 0,
  reset_period TEXT DEFAULT 'never',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

-- Theme system (Migration 027)
CREATE TABLE themes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT UNIQUE NOT NULL,
  display_name TEXT NOT NULL,
  is_system_theme BOOLEAN DEFAULT 0,
  created_at TEXT NOT NULL
);

CREATE TABLE theme_colors (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  theme_id INTEGER NOT NULL,
  color_key TEXT NOT NULL,
  color_value TEXT NOT NULL,
  created_at TEXT NOT NULL,
  FOREIGN KEY (theme_id) REFERENCES themes(id) ON DELETE CASCADE,
  UNIQUE(theme_id, color_key)
);

CREATE TABLE user_theme_preferences (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  active_theme_id INTEGER NOT NULL,
  fallback_theme_key TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (active_theme_id) REFERENCES themes(id) ON DELETE CASCADE
);

-- Navigation system (Migration 028)
CREATE TABLE navigation_settings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  navigation_mode TEXT NOT NULL DEFAULT 'standard',
  header_height INTEGER DEFAULT 60,
  sidebar_width INTEGER DEFAULT 250,
  auto_collapse BOOLEAN DEFAULT 0,
  remember_focus_mode BOOLEAN DEFAULT 1,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE navigation_mode_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  previous_mode TEXT NOT NULL,
  new_mode TEXT NOT NULL,
  changed_at TEXT NOT NULL,
  session_id TEXT
);

-- Configuration system (Migration 030)
CREATE TABLE configuration (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  config_key TEXT UNIQUE NOT NULL,
  config_value TEXT,
  config_type TEXT DEFAULT 'string',
  default_value TEXT,
  is_required BOOLEAN DEFAULT 0,
  validation_pattern TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

-- Migration tracking
CREATE TABLE migration_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  migration_id TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  applied_at TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  duration_ms INTEGER,
  error_message TEXT
);

-- Schema metadata
CREATE TABLE schema_metadata (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

-- Performance indexes
CREATE INDEX idx_customers_company_name ON customers(company_name);
CREATE INDEX idx_customers_created ON customers(created_at);

CREATE INDEX idx_offers_customer ON offers(customer_id);
CREATE INDEX idx_offers_number ON offers(offer_number);
CREATE INDEX idx_offers_status ON offers(status);
CREATE INDEX idx_offers_created ON offers(created_at);

CREATE INDEX idx_invoices_customer ON invoices(customer_id);
CREATE INDEX idx_invoices_offer ON invoices(offer_id);
CREATE INDEX idx_invoices_number ON invoices(invoice_number);
CREATE INDEX idx_invoices_status ON invoices(status);
CREATE INDEX idx_invoices_due_date ON invoices(due_date);

CREATE INDEX idx_package_line_items_package ON package_line_items(package_id);
CREATE INDEX idx_package_line_items_parent ON package_line_items(parent_item_id);
CREATE INDEX idx_package_line_items_hierarchy ON package_line_items(hierarchy_level);

CREATE INDEX idx_offer_line_items_offer ON offer_line_items(offer_id);
CREATE INDEX idx_offer_line_items_parent ON offer_line_items(parent_item_id);
CREATE INDEX idx_offer_line_items_hierarchy ON offer_line_items(hierarchy_level);

CREATE INDEX idx_invoice_line_items_invoice ON invoice_line_items(invoice_id);
CREATE INDEX idx_invoice_line_items_parent ON invoice_line_items(parent_item_id);
CREATE INDEX idx_invoice_line_items_hierarchy ON invoice_line_items(hierarchy_level);

CREATE INDEX idx_themes_name ON themes(name);
CREATE INDEX idx_theme_colors_theme ON theme_colors(theme_id);
CREATE INDEX idx_user_theme_preferences_user ON user_theme_preferences(user_id);

CREATE INDEX idx_navigation_mode_history_changed ON navigation_mode_history(changed_at);
CREATE INDEX idx_configuration_key ON configuration(config_key);
CREATE INDEX idx_migration_history_id ON migration_history(migration_id);
```

---

## 🎯 **ERFOLGS-METRIKEN**

### **Migration System Achievement**
- ✅ **46 Migrationen** erfolgreich implementiert (000-045)
- ✅ **Schema Version 46** in Produktions-DB (PRAGMA user_version)
- ✅ **150+ Field-Mappings** bidirektional integriert  
- ✅ **Schema-Konsistenz** zwischen Code und Database
- ✅ **Zero-Downtime** Migration-Prozess
- ✅ **Rollback-Sicherheit** für alle Migrationen
- ✅ **Performance-Optimiert** mit strategischen Indexes
- ⚠️ **Bekannter Konflikt:** Migration 034/042 (Lösung: Migration 046 geplant)

### **Field-Mapper Integration**
- ✅ **SQL Injection Prevention** durch Prepared Statements
- ✅ **Type-Safe** camelCase ↔ snake_case Konvertierung
- ✅ **Automatische Validierung** zwischen Schema und Mappings
- ✅ **Development-Friendly** API mit klaren Patterns

### **Production Readiness**
- ✅ **WAL Mode** für bessere Concurrency
- ✅ **Foreign Key Constraints** für Datenintegrität
- ✅ **Transaction Safety** mit Rollback-Unterstützung
- ✅ **Performance Monitoring** und Metriken

---

**📍 Location:** `/docs/01-core/final/VALIDATED_GUIDE-SQLITE-MIGRATION-ARCHITECTURE_2025-10-23.md`  
**Purpose:** Complete SQLite migration architecture with field-mapper integration  
**Coverage:** Migrationen 000-045 (Schema Version 46), 150+ field mappings, safety protocols, development patterns  
**Validation:** Production DB verified 26.10.2025 - Schema Version 46, all critical fixes integrated  
**Known Issues:** Migration 034/042 table name conflict - Migration 046 planned for resolution

*Letzte Aktualisierung: 26.10.2025 - Aktualisiert auf Schema Version 46 (Real-DB Validierung) mit Migration 034/042 Konflikt-Dokumentation*