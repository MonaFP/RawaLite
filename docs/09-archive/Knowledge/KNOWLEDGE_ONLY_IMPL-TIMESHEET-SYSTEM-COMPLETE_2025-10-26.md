# 🕒 KNOWLEDGE_ONLY: Timesheet-System Implementation - Historical Archive
CAVE:  **🤖 KI-AUTO-DETECTION SYSTEM NEEDED. KI HAS TO READ HANDBOOK FIRST**
> **⚠️ KI-USAGE WARNING:** This document is from Knowledge Archive  
> **Status:** KNOWLEDGE_ONLY - Historical implementation insights  
> **Created:** 26.10.2025 | **Source:** COMPLETED_IMPL-TIMESHEET-SYSTEM-2025-10-15.md  
> **Code Validity:** ✅ VERIFIED - Implementation matches current codebase (src/)  
> **Migration:** Verified against Migration 009/010, SQLiteAdapter, TimesheetService

## 📋 **KI-SAFE USAGE RULES**

**✅ SAFE to reference:**
- Architecture patterns and design decisions
- Database schema design (Migration 009+010)
- Integration approaches with other systems
- Implementation lessons learned

**⚠️ VERIFY BEFORE USE:**
- Specific code snippets (may have evolved)
- File paths and import statements
- Configuration details
- API signatures

**🚫 DO NOT USE for:**
- Copy-paste code implementation
- Current system troubleshooting
- Active development decisions without verification

---

## 🎯 **HISTORICAL IMPLEMENTATION OVERVIEW**

**Original Status:** ✅ VOLLSTÄNDIG IMPLEMENTIERT  
**Version Context:** v1.0.13  
**Database Schema Context:** v10  
**Implementation Date:** 2025-10-03  

### **Core Architecture Insights:**
- **Database-First Pattern**: Migration 009 (3 tables) + Migration 010 (numbering)
- **Service Layer Pattern**: TimesheetService → SQLiteAdapter → Field-Mapper
- **Activity Templates System**: 6 default activities with hourly rates
- **IPC Integration**: Renderer ↔ Main process communication
- **PDF Integration**: Native PDF export with theme support

### **Critical Dependencies Documented:**
- **Migration Chain**: 009 (timesheets, activities, timesheet_activities) → 010 (numbering circles)
- **Field-Mapper Integration**: camelCase ↔ snake_case conversion
- **Numbering System**: LN-xxxx format with yearly reset
- **Customer Relations**: Foreign key constraints to customers table

---

## 🗄️ **DATABASE SCHEMA KNOWLEDGE (Migration 009+010)**

### **Table Structure Insights:**
```sql
-- Core Timesheet Entity (Migration 009)
CREATE TABLE timesheets (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  timesheet_number TEXT NOT NULL UNIQUE,        -- LN-0001 format
  customer_id INTEGER NOT NULL REFERENCES customers(id),
  title TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft',         -- draft|sent|accepted|rejected
  start_date TEXT NOT NULL,                     -- ISO date format
  end_date TEXT NOT NULL,
  subtotal REAL NOT NULL DEFAULT 0,
  vat_rate REAL NOT NULL DEFAULT 19,           -- German default
  vat_amount REAL NOT NULL DEFAULT 0,
  total REAL NOT NULL DEFAULT 0,
  notes TEXT,                                   -- Markdown support
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

-- Activity Templates for Reuse
CREATE TABLE activities (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,                         -- e.g., "Beratung", "Entwicklung"
  description TEXT,
  hourly_rate REAL NOT NULL DEFAULT 0,         -- €85, €95, etc.
  is_active INTEGER NOT NULL DEFAULT 1,        -- Boolean flag
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

-- Junction Table for Timesheet Line Items  
CREATE TABLE timesheet_activities (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  timesheet_id INTEGER NOT NULL REFERENCES timesheets(id) ON DELETE CASCADE,
  activity_id INTEGER REFERENCES activities(id) ON DELETE SET NULL,
  title TEXT NOT NULL,                         -- Activity title (can override template)
  description TEXT,                            -- Specific work description
  date TEXT NOT NULL,                          -- Work date
  start_time TEXT NOT NULL,                    -- HH:MM format
  end_time TEXT NOT NULL,                      -- HH:MM format
  hours REAL NOT NULL DEFAULT 0,               -- Calculated duration
  hourly_rate REAL NOT NULL DEFAULT 0,         -- Rate for this activity
  total REAL NOT NULL DEFAULT 0,               -- hours * hourly_rate
  is_break INTEGER NOT NULL DEFAULT 0          -- Break time flag
);
```

### **Numbering Circle Integration (Migration 010):**
```sql
-- LN-xxxx Numbering for Timesheets
INSERT OR IGNORE INTO numbering_circles (
  id, name, prefix, digits, current, resetMode, lastResetYear, updated_at
) VALUES (
  'timesheets', 'Leistungsnachweise', 'LN-', 4, 0, 'yearly', NULL, datetime('now')
);
```

---

## 🏗️ **ARCHITECTURAL PATTERNS DOCUMENTED**

### **Service Layer Pattern:**
```typescript
// Historical Pattern: TimesheetService as Business Logic Layer
class TimesheetService {
  // Delegates to SQLiteAdapter for persistence
  // Handles business logic and validation
  // Manages timesheet-specific operations
}

// Historical Pattern: SQLiteAdapter Methods
class SQLiteAdapter {
  async listTimesheets(): Promise<Timesheet[]>
  async getTimesheet(id: number): Promise<Timesheet | null>
  async createTimesheet(data: CreateTimesheetData): Promise<Timesheet>
  async updateTimesheet(id: number, patch: Partial<Timesheet>): Promise<Timesheet>
  async deleteTimesheet(id: number): Promise<void>
}
```

### **Activity Templates Pattern:**
- **6 Default Activities**: Beratung (€85), Entwicklung (€95), Testing (€75), Dokumentation (€65), Meeting (€75), Support (€70)
- **Hourly Rate Inheritance**: Activities provide default rates, overrideable per timesheet entry
- **Template Reuse**: Activities serve as templates for consistent pricing

### **Field-Mapper Integration Pattern:**
```typescript
// Historical Pattern: Consistent camelCase ↔ snake_case conversion
const mappedData = mapToSQL({ ...data, createdAt: ts, updatedAt: ts });
const result = mapFromSQL(rawSQLResult);
```

---

## 📊 **INTEGRATION INSIGHTS**

### **Customer Relationship:**
- **Foreign Key Constraint**: `customer_id REFERENCES customers(id) ON DELETE CASCADE`
- **Customer Validation**: Required for timesheet creation
- **Customer Display**: Company name used in PDF generation

### **PDF Export Integration:**
- **Template System**: Uses same PDF generation as offers/invoices
- **Theme Support**: Integrates with theme system for consistent branding
- **Attachment Support**: Can include attachments in PDF output
- **Field Mapping**: Uses field-mapper for consistent data transformation

### **Numbering System Integration:**
- **Yearly Reset**: LN-0001, LN-0002, etc., resets each January 1st
- **Unique Constraint**: Prevents duplicate timesheet numbers
- **Settings Integration**: Managed through numbering circles system

---

## 🔍 **LESSONS LEARNED (Historical Context)**

### **Implementation Success Factors:**
1. **Database-First Approach**: Solid migration foundation prevented data consistency issues
2. **Field-Mapper Consistency**: Unified data transformation across all operations
3. **Activity Templates**: Reduced data entry and ensured consistent pricing
4. **Junction Table Design**: Flexible line item structure for varying timesheet content

### **Critical Dependencies Identified:**
1. **Migration Order**: 009 must complete before 010 (numbering dependency)
2. **Customer System**: Timesheets cannot exist without valid customers
3. **Field-Mapper**: All SQL operations must use field-mapper for consistency
4. **Theme System**: PDF generation depends on theme configuration

---

## ⚠️ **CURRENT VERIFICATION STATUS**

**✅ VERIFIED (2025-10-26):**
- ✅ Migration 009/010 files exist and match documentation
- ✅ SQLiteAdapter methods implemented as documented
- ✅ TimesheetService exists in src/services/
- ✅ Activity templates (6 defaults) implemented
- ✅ Field-mapper integration functional
- ✅ PDF export functionality present

**📍 SOURCE TRUTH:** For current implementation details, always verify against:
- `src/main/db/migrations/009_add_timesheets.ts`
- `src/main/db/migrations/010_add_timesheets_numbering.ts`  
- `src/services/TimesheetService.ts`
- `src/adapters/SQLiteAdapter.ts` (timesheet methods)

---

## 📚 **KNOWLEDGE ARCHIVE METADATA**

**Original Document:** `docs/03-data/final/COMPLETED_IMPL-TIMESHEET-SYSTEM-2025-10-15.md`  
**Archive Date:** 2025-10-26  
**Archive Reason:** Implementation verified current, preserved for historical insight  
**Verification Scope:** Full codebase verification against src/ implementation  
**Next Review:** When timesheet system undergoes major refactoring  

**Cross-References:**
- [COMPLETED_IMPL-TIMESHEET-MIGRATION-009-010](../../../03-data/final/COMPLETED_IMPL-TIMESHEET-MIGRATION-009-010-2025-10-15.md)
- [COMPLETED_IMPL-ACTIVITY-TEMPLATES](../../../03-data/final/COMPLETED_IMPL-ACTIVITY-TEMPLATES-2025-10-15.md)
- [COMPLETED_IMPL-SQLITE-ADAPTER](../../../03-data/final/COMPLETED_IMPL-SQLITE-ADAPTER-2025-10-15.md)

---

**🧠 KI RECOGNITION:** This document uses `KNOWLEDGE_ONLY_IMPL-` prefix for safe historical reference without current system assumptions.