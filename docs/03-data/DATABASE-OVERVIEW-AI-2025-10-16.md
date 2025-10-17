# 🗄️ Database & Data Overview für KI - RawaLite v1.0.42.5

> **Letzte Aktualisierung:** 16. Oktober 2025 | **Zweck:** KI-Navigation für Database Operations

---

## 🎯 **Database-System Übersicht**

**SQLite v26** mit **better-sqlite3** native bindings + **Field-Mapping System** für camelCase ↔ snake_case Transformationen.

### **Kritische Architektur-Komponenten:**
- **Database Engine:** better-sqlite3 (native C++ bindings)
- **Schema Version:** v26 (Oktober 2025)
- **Journal Mode:** WAL (Write-Ahead Logging)
- **Location:** `%APPDATA%\Roaming\Electron\database\rawalite.db`
- **Field Mapping:** Zentrale Abstraction für JS ↔ SQL Kompatibilität

---

## 📁 **Code-Navigation für Database Tasks**

### **🔌 Database Layer (CRITICAL PATHS):**
```
src/main/db/
├── Database.ts                # SQLite Singleton [ENTRY POINT]
├── MigrationService.ts        # Schema Migrations (v000-v026+)
├── BackupService.ts           # Hot Backup System with Integrity
└── migrations/                # 25+ Migration Files
    ├── 000_init.ts           # Initial Schema
    ├── 014_*.ts              # Sub-Item Hierarchy (IMPLEMENTED)
    ├── 021_*.ts              # Package Price Unification (IMPLEMENTED) 
    ├── 023_*.ts              # Sub-Item Extended (IMPLEMENTED)
    └── 024_*.ts              # Field Mapping Extended (IMPLEMENTED)

electron/ipc/
├── database.ts               # Core IPC Handlers [CRITICAL FIX-012]
└── backup.ts                 # Backup IPC Operations

src/lib/
└── field-mapper.ts           # Central Field Mapping [CRITICAL - USE ALWAYS]
```

### **🔄 Field-Mapping System (CRITICAL):**
```typescript
// MUST USE for all database operations
import { mapToSQL, mapFromSQL, convertSQLQuery } from '../lib/field-mapper';

// Query Transformation (REQUIRED)
const sql = convertSQLQuery(`
  SELECT {id}, {companyName}, {createdAt} 
  FROM customers 
  WHERE {id} = ?
`);
// Result: "SELECT id, company_name, created_at FROM customers WHERE id = ?"

// Data Transformation (REQUIRED)
const jsData = { companyName: "Test GmbH", createdAt: "2025-10-16" };
const sqlData = mapToSQL(jsData);  // → { company_name: "Test GmbH", created_at: "2025-10-16" }
const result = mapFromSQL(sqlRow); // snake_case → camelCase
```

### **🗄️ Database Access Pattern:**
```typescript
// ✅ CORRECT: Via SQLiteAdapter + Field Mapping
const adapter = usePersistence(); // → SQLiteAdapter instance
const customers = await adapter.listCustomers(); // Auto field-mapping

// ✅ CORRECT: Direct IPC with Field Mapping  
const sql = convertSQLQuery(`SELECT {id}, {companyName} FROM customers`);
const result = await window.rawalite.db.query(sql);

// ❌ FORBIDDEN: Raw SQL without field mapping
const result = await window.rawalite.db.query("SELECT id, company_name FROM customers");
```

---

## 🗄️ **Database Schema (Current State v26)**

### **Business Entities (8 Core Tables):**
```sql
-- Core Business Data
customers              # Customer Master (17 fields)
offers                 # Angebote with Status Workflow (23 fields) 
offer_line_items       # Hierarchical Line Items (12 fields)
invoices               # Rechnungen with Payment Tracking (25 fields)
invoice_line_items     # Invoice Line Items (12 fields)
packages               # Service Package Templates (8 fields)
package_line_items     # Package Line Items (12 fields)

-- Time Tracking 
activities             # Activity Templates (8 fields)
timesheets             # Time Logging + Billing (15 fields)

-- System Tables
settings               # Company + Preferences (20+ fields)
numbering_circles      # Auto-Numbering System (6 fields)
migrations             # Schema Version Control (4 fields)
```

### **Field-Mapping Coverage (130+ Mappings):**
```typescript
// Critical Business Field Mappings
'companyName' ↔ 'company_name'           // Customer data
'createdAt' ↔ 'created_at'               // Timestamps (everywhere)
'offerId' ↔ 'offer_id'                   // Foreign keys
'unitPrice' ↔ 'unit_price'               // Price fields
'priceDisplayMode' ↔ 'price_display_mode' // Sub-item pricing (v1.0.42.5)
'parentItemId' ↔ 'parent_item_id'        // Hierarchical data
'discountAmount' ↔ 'discount_amount'     // Discount system
'vatRate' ↔ 'vat_rate'                   // Tax calculations

// Status & Workflow Fields
'sentAt' ↔ 'sent_at'                     // Offer/Invoice workflow
'acceptedAt' ↔ 'accepted_at'             // Status timestamps
'paidAt' ↔ 'paid_at'                     // Payment tracking
'overdueAt' ↔ 'overdue_at'               // Overdue handling
```

### **Hierarchical Data Patterns:**
```sql
-- Self-Referencing Foreign Keys (3 entities)
offer_line_items.parent_item_id → offer_line_items.id      # Sub-items under main items
invoice_line_items.parent_item_id → invoice_line_items.id  # Invoice item hierarchy
package_line_items.parent_item_id → package_line_items.id  # Package item hierarchy
packages.parent_package_id → packages.id                   # Package inheritance

-- Current Hierarchy Example (package_line_items):
ID 103: "Main Item" (parent_item_id: NULL)     - €180,00
├─ ID 104: "Sub Item 1" (parent_item_id: 103)  - €90,00
└─ ID 105: "Sub Item 2" (parent_item_id: 103)  - €0,00
```

---

## 🔄 **Migration System (Current v26)**

### **Migration Management:**
```typescript
// Location: src/main/db/MigrationService.ts
export async function runAllMigrations(): Promise<void> {
  // Automatic execution of pending migrations on app start
  // Idempotent: Safe to run multiple times
  // Backup-protected: Creates backup before schema changes
}

export function getUserVersion(): number {
  // Current schema version from PRAGMA user_version
  return db.pragma('user_version', { simple: true });
}
```

### **Critical Migrations (IMPLEMENTED):**
```typescript
// These migrations are FULLY APPLIED - preserve their effects!
Migration 014: // Sub-Item Hierarchy System
  - Added parent_item_id to all line_item tables
  - Added hierarchy_level, sort_order fields
  - Status: ✅ COMPLETED

Migration 021: // Package Price Schema Unification  
  - Unified amount → unit_price in package_line_items
  - Ensures consistency with offer/invoice line items
  - Status: ✅ COMPLETED

Migration 023: // Sub-Item Extended Fields
  - Added price_display_mode for sub-item pricing
  - Added client_temp_id for frontend coordination
  - Status: ✅ COMPLETED

Migration 024: // Field Mapping Extended
  - Extended field-mapper with new business fields
  - Added discount system mappings
  - Status: ✅ COMPLETED
```

### **Migration File Pattern:**
```typescript
// src/main/db/migrations/XXX_descriptive_name.ts
import type Database from 'better-sqlite3';

export const up = (db: Database.Database): void => {
  console.log('🗄️ [Migration XXX] Description...');
  
  // Schema changes (CREATE TABLE, ALTER TABLE, etc.)
  // Data migrations (INSERT, UPDATE with backups)
  // Index creation for performance
  
  console.log('✅ [Migration XXX] Completed successfully');
};

export const down = (db: Database.Database): void => {
  // Rollback logic (optional, for emergency use)
};
```

---

## 🔌 **IPC Database Operations (CRITICAL FIX-012)**

### **Sichere Database IPC Channels:**
```typescript
// electron/ipc/database.ts - PRESERVE THESE PATTERNS!

// CRITICAL FIX-012: SQLite Parameter Binding with NULL handling
ipcMain.handle('db:query', async (event, sql: string, params?: any[]) => {
  try {
    const stmt = prepare(sql)
    return params ? stmt.all(...params) : stmt.all()  // NULL-safe parameter binding
  } catch (error) {
    console.error(`Database query failed:`, error)
    throw error
  }
});

// Transaction support with proper error handling
ipcMain.handle('db:transaction', async (event, queries: Array<{ sql: string; params?: any[] }>) => {
  try {
    return tx(() => {
      const results: any[] = []
      for (const query of queries) {
        const result = exec(query.sql, query.params)  // Parameter binding consistency
        results.push(result)
      }
      return results
    })
  } catch (error) {
    console.error(`Database transaction failed:`, error)
    throw error
  }
});
```

### **Renderer Process Access:**
```typescript
// Secure access from React components
const result = await window.rawalite.db.query(sql, params);
const changes = await window.rawalite.db.exec(sql, params);
const transaction = await window.rawalite.db.transaction([
  { sql: convertSQLQuery(`INSERT INTO customers ({companyName}) VALUES (?)`), params: ['Test'] }
]);
```

---

## 📊 **Performance & Optimization**

### **SQLite Configuration (Production):**
```sql
PRAGMA foreign_keys = ON;              -- Enforce FK constraints
PRAGMA journal_mode = WAL;             -- Write-Ahead Logging for concurrency
PRAGMA synchronous = FULL;             -- Data safety for production
PRAGMA cache_size = -64000;            -- 64MB cache
PRAGMA temp_store = memory;            -- Temp tables in RAM
PRAGMA mmap_size = 268435456;          -- 256MB memory mapping
```

### **Index Strategy (Performance-Critical):**
```sql
-- Customer Search
CREATE INDEX idx_customers_name ON customers(company_name);
CREATE INDEX idx_customers_email ON customers(email);

-- Business Entity Relationships
CREATE INDEX idx_offers_customer ON offers(customer_id);
CREATE INDEX idx_invoices_customer ON invoices(customer_id);
CREATE INDEX idx_invoices_offer ON invoices(offer_id);

-- Line Item Hierarchies (CRITICAL for Sub-Items)
CREATE INDEX idx_offer_items_offer ON offer_line_items(offer_id);
CREATE INDEX idx_offer_items_parent ON offer_line_items(parent_item_id);
CREATE INDEX idx_invoice_items_invoice ON invoice_line_items(invoice_id);
CREATE INDEX idx_package_items_package ON package_line_items(package_id);

-- Status & Workflow Queries
CREATE INDEX idx_offers_status ON offers(status);
CREATE INDEX idx_invoices_status ON invoices(status);
CREATE INDEX idx_invoices_due ON invoices(due_date);

-- Time Tracking
CREATE INDEX idx_timesheets_activity ON timesheets(activity_id);
CREATE INDEX idx_timesheets_customer ON timesheets(customer_id);
CREATE INDEX idx_timesheets_start ON timesheets(start_time);
```

---

## 🛠️ **Common Database Tasks für KI**

### **1. Schema Änderungen:**
```bash
# 1. Create new migration file
touch src/main/db/migrations/027_add_new_feature.ts

# 2. Implement up() function with field mapping awareness
# 3. Update field-mapper.ts with new field mappings
# 4. Test migration with backup protection
pnpm validate:critical-fixes  # Ensure no regressions
```

### **2. Field-Mapping Erweiterungen:**
```typescript
// src/lib/field-mapper.ts - Add new mappings
private static readonly JS_TO_SQL_MAPPINGS: Record<string, string> = {
  // Add new business field mappings here
  'newBusinessField': 'new_business_field',
  // ALWAYS maintain existing mappings!
};
```

### **3. Query Optimization:**
```typescript
// Use convertSQLQuery for all business queries
const optimizedQuery = convertSQLQuery(`
  SELECT {id}, {companyName}, {createdAt}
  FROM customers 
  WHERE {companyName} LIKE ? 
  ORDER BY {createdAt} DESC
  LIMIT 50
`);

// Add appropriate indexes in migration
```

### **4. Backup Operations:**
```typescript
// Hot backup (non-blocking)
const backup = await window.rawalite.backup.hot();
// Result: { success: true, backupPath: string, checksum: string }

// Integrity check
const integrity = await window.rawalite.backup.integrityCheck();
// Result: { valid: boolean, errors: string[] }
```

---

## 🚨 **Critical Rules für Database Operations**

### **DO:**
- ✅ **ALWAYS use field-mapper** for SQL queries and data transformations
- ✅ **Test migrations** with backup protection before applying
- ✅ **Preserve CRITICAL FIX-012** parameter binding patterns
- ✅ **Use transactions** for multi-table operations  
- ✅ **Create indexes** for new query patterns
- ✅ **Follow hierarchical FK patterns** for parent-child relationships

### **DON'T:**
- ❌ **Never write raw snake_case SQL** without convertSQLQuery()
- ❌ **Never modify existing migration files** after they're applied
- ❌ **Never break foreign key constraints** in schema changes
- ❌ **Never skip backup creation** before schema migrations
- ❌ **Never modify field-mapper mappings** without checking all usages

---

## 🔍 **Debug & Troubleshooting**

### **Schema Inspection:**
```bash
# Check current schema version
node scripts/inspect-real-db.mjs

# Validate field mappings
node scripts/test-field-mapper.mjs

# Verify critical fixes preserved
pnpm validate:critical-fixes
```

### **Common Issues:**
1. **Field Mapping Mismatch:** Always check field-mapper.ts for new fields
2. **Migration Failures:** Ensure backup tables exist before schema changes
3. **FK Constraint Violations:** Check CASCADE DELETE relationships
4. **Parameter Binding Errors:** Verify NULL handling in IPC layer (FIX-012)

---

*Letzte Schema-Version: v26 | Nächste Review: November 2025 | Field-Mapping: 130+ aktive Mappings*