# 🔄 KNOWLEDGE_ONLY: Migration System Implementation - Historical Archive
CAVE:  **🤖 KI-AUTO-DETECTION SYSTEM NEEDED. KI HAS TO READ HANDBOOK FIRST**
> **⚠️ KI-USAGE WARNING:** This document is from Knowledge Archive  
> **Status:** KNOWLEDGE_ONLY - Historical migration system insights  
> **Created:** 26.10.2025 | **Source:** Multiple COMPLETED_IMPL migration documents  
> **Code Validity:** ✅ VERIFIED - Migration system patterns verified  
> **Focus:** Database schema evolution and migration architecture

## 📋 **KI-SAFE USAGE RULES**

**✅ SAFE to reference:**
- Migration system architecture patterns
- Schema evolution strategies
- Field-mapper integration with migrations
- Database backup and rollback approaches

**⚠️ VERIFY BEFORE USE:**
- Specific migration file implementations
- SQL syntax and column definitions
- Migration version numbers and sequencing
- Backup file naming and restoration procedures

**🚫 DO NOT USE for:**
- Creating new migrations without verification
- Schema modification without current system check
- Migration rollback without proper testing

---

## 🎯 **HISTORICAL MIGRATION SYSTEM OVERVIEW**

**Migration Examples Analyzed:**
- **Migration 009**: Timesheet system (3 new tables)
- **Migration 010**: Timesheet numbering circles
- **Migration 011**: Offer line items extension
- **Migration 013**: Discount system implementation

### **Migration System Architecture:**
- **Version-Based**: Sequential numbering (009, 010, 011, 013, etc.)
- **Atomic Operations**: Each migration is self-contained and reversible
- **Backup Integration**: Automatic backup creation before schema changes
- **Field-Mapper Compatible**: All new columns integrate with camelCase ↔ snake_case system

---

## 🗄️ **MIGRATION ARCHITECTURE PATTERNS**

### **Standard Migration Structure:**
```typescript
// Historical Pattern: Migration File Structure
export const up = (db: Database): void => {
  console.log('🗄️ [Migration XXX] Description...');
  
  // 1. Schema changes
  db.exec(`ALTER TABLE table_name ADD COLUMN new_column TYPE DEFAULT value;`);
  
  // 2. Data transformations (if needed)
  db.exec(`UPDATE table_name SET new_column = calculated_value WHERE condition;`);
  
  // 3. Index creation
  db.exec(`CREATE INDEX idx_table_column ON table_name(column);`);
  
  console.log('✅ Migration XXX completed successfully');
};

export const down = (db: Database): void => {
  // Reverse operations for rollback
  db.exec(`DROP INDEX IF EXISTS idx_table_column;`);
  db.exec(`ALTER TABLE table_name DROP COLUMN new_column;`);
};
```

### **Schema Evolution Patterns:**

#### **1. Column Addition Pattern (Migration 013 - Discount System):**
```sql
-- Historical Pattern: Nullable columns with defaults
ALTER TABLE offers ADD COLUMN discount_type TEXT DEFAULT NULL;
ALTER TABLE offers ADD COLUMN discount_value REAL DEFAULT NULL;
ALTER TABLE offers ADD COLUMN discount_amount REAL DEFAULT 0;
ALTER TABLE offers ADD COLUMN subtotal_before_discount REAL DEFAULT 0;

-- Benefit: Existing data remains valid, new features optional
```

#### **2. Table Creation Pattern (Migration 009 - Timesheet System):**
```sql
-- Historical Pattern: Complete table with relationships
CREATE TABLE timesheets (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  timesheet_number TEXT NOT NULL UNIQUE,
  customer_id INTEGER NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  -- ... additional columns
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

-- Index creation for performance
CREATE INDEX idx_timesheets_customer ON timesheets(customer_id);
CREATE INDEX idx_timesheets_status ON timesheets(status);
```

#### **3. Junction Table Pattern (Migration 009 - Timesheet Activities):**
```sql
-- Historical Pattern: Many-to-many relationship table
CREATE TABLE timesheet_activities (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  timesheet_id INTEGER NOT NULL REFERENCES timesheets(id) ON DELETE CASCADE,
  activity_id INTEGER REFERENCES activities(id) ON DELETE SET NULL,
  -- Activity-specific data
  title TEXT NOT NULL,
  description TEXT,
  date TEXT NOT NULL,
  hours REAL NOT NULL DEFAULT 0,
  total REAL NOT NULL DEFAULT 0
);
```

---

## 🔧 **FIELD-MAPPER INTEGRATION PATTERNS**

### **Migration-Compatible Schema Design:**
```sql
-- Historical Pattern: snake_case in database, camelCase in application
-- Field-mapper automatically handles conversion

-- Database Schema (snake_case)
discount_type TEXT DEFAULT NULL
subtotal_before_discount REAL DEFAULT 0

-- Application Interface (camelCase)
discountType: string | null
subtotalBeforeDiscount: number
```

### **Default Value Strategy:**
```sql
-- Historical Pattern: Safe defaults for existing data
-- NULL for optional fields that should remain empty
discount_type TEXT DEFAULT NULL
discount_value REAL DEFAULT NULL

-- 0 for calculated fields that should start at zero
discount_amount REAL DEFAULT 0
subtotal_before_discount REAL DEFAULT 0
```

---

## 🔄 **BACKUP AND ROLLBACK PATTERNS**

### **Automatic Backup Strategy:**
```bash
# Historical Pattern: Pre-migration backup naming
pre-migration-YYYY-MM-DDTHH-mm-ss-{version}Z.sqlite

# Examples:
pre-migration-2025-10-03T17-54-05-013Z.sqlite
pre-migration-2025-10-15T10-30-00-009Z.sqlite
```

### **Rollback Capability:**
```typescript
// Historical Pattern: down() function implementation
export const down = (db: Database): void => {
  console.log('🔄 [Migration XXX] Rolling back...');
  
  // Reverse order of up() operations
  // Drop indexes first, then columns/tables
  db.exec(`DROP INDEX IF EXISTS idx_table_column;`);
  db.exec(`ALTER TABLE table_name DROP COLUMN new_column;`);
  
  console.log('✅ Migration XXX rollback completed');
};
```

---

## 📊 **BUSINESS LOGIC INTEGRATION**

### **Discount System Implementation (Migration 013):**
```typescript
// Historical Pattern: Business logic for discount calculations
interface DiscountData {
  discountType: 'percentage' | 'fixed' | null;
  discountValue: number | null;
  discountAmount: number;           // Calculated value
  subtotalBeforeDiscount: number;   // Pre-discount total
}

// Calculation logic preserved in field-mapper compatible format
const calculateDiscount = (subtotal: number, type: string, value: number) => {
  if (type === 'percentage') {
    return subtotal * (value / 100);
  } else if (type === 'fixed') {
    return Math.min(value, subtotal); // Cannot exceed subtotal
  }
  return 0;
};
```

### **Numbering System Integration (Migration 010):**
```sql
-- Historical Pattern: Document numbering integration
INSERT OR IGNORE INTO numbering_circles (
  id, name, prefix, digits, current, resetMode, lastResetYear, updated_at
) VALUES (
  'timesheets', 'Leistungsnachweise', 'LN-', 4, 0, 'yearly', NULL, datetime('now')
);
```

---

## 🔍 **LESSONS LEARNED (Historical Context)**

### **Migration Success Factors:**
1. **Additive Approach**: New columns with defaults preserve existing data
2. **Foreign Key Consistency**: Proper relationships maintain data integrity
3. **Index Strategy**: Performance indexes created with schema changes
4. **Field-Mapper Ready**: snake_case columns work seamlessly with existing system

### **Critical Dependencies:**
1. **Sequential Execution**: Migrations must run in proper order
2. **Backup Strategy**: Always backup before schema changes
3. **Rollback Testing**: down() functions must be tested
4. **Field-Mapper Updates**: New columns may need mapping rules

### **Performance Considerations:**
1. **Nullable Defaults**: Prevent data conversion during migration
2. **Index Creation**: Add performance indexes with new tables
3. **Batch Operations**: Large data transformations in chunks
4. **Connection Management**: Proper database locking during migrations

---

## ⚠️ **CURRENT VERIFICATION STATUS**

**✅ VERIFIED (2025-10-26):**
- ✅ Migration files exist in `src/main/db/migrations/`
- ✅ Sequential numbering system functional
- ✅ Field-mapper integration works with new columns
- ✅ Backup system operational
- ✅ up/down functions implemented in modern migrations

**📍 SOURCE TRUTH:** For current migration details, always verify against:
- `src/main/db/migrations/` (current migration files)
- `src/lib/field-mapper.ts` (mapping compatibility)
- Current database schema via PRAGMA table_info()
- Migration system executor in main process

---

## 📚 **KNOWLEDGE ARCHIVE METADATA**

**Original Documents:** Multiple COMPLETED_IMPL migration documents from `/03-data/final/`  
**Archive Date:** 2025-10-26  
**Archive Reason:** Migration system patterns preserved for schema evolution reference  
**Verification Scope:** Migration architecture verification against src/main/db/migrations/  
**Next Review:** When migration system undergoes architectural changes  

**Cross-References:**
- [KNOWLEDGE_ONLY_IMPL-TIMESHEET-SYSTEM-COMPLETE](KNOWLEDGE_ONLY_IMPL-TIMESHEET-SYSTEM-COMPLETE_2025-10-26.md)
- [KNOWLEDGE_ONLY_IMPL-SQLITE-ADAPTER-COMPLETE](KNOWLEDGE_ONLY_IMPL-SQLITE-ADAPTER-COMPLETE_2025-10-26.md)
- [Field-Mapper Integration Documentation](../../../03-data/final/LESSON_FIX-*)

---

**🧠 KI RECOGNITION:** This document uses `KNOWLEDGE_ONLY_IMPL-` prefix for safe historical migration architecture reference without current schema assumptions.