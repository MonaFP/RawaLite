# 🔄 KNOWLEDGE_ONLY: Field-Mapper System - Historical Architecture Knowledge

> **⚠️ KI-USAGE WARNING:** This document is from Knowledge Archive  
> **Status:** KNOWLEDGE_ONLY - Historical field mapping insights  
> **Created:** 26.10.2025 | **Source:** Multiple LESSON_FIX field-mapping documents  
> **System Validity:** ✅ VERIFIED - Field-mapper patterns verified across codebase  
> **Scope:** camelCase ↔ snake_case transformation system

## 📋 **KI-SAFE USAGE RULES**

**✅ SAFE to reference:**
- Field-mapper architecture patterns and design principles
- camelCase ↔ snake_case transformation strategies  
- Database-Application interface design patterns
- Field-mapping integration points across system layers

**⚠️ VERIFY BEFORE USE:**
- Current field-mapper implementation in src/lib/field-mapper.ts
- Specific mapping functions and their signatures
- Import paths and module structure
- Field naming conventions in current schema

**🚫 DO NOT USE for:**
- Direct field-mapper code implementation without verification
- Assuming specific field names or mappings without schema check
- Import statements without current module structure verification

---

## 🎯 **HISTORICAL FIELD-MAPPER OVERVIEW**

**System Purpose:** Universal camelCase ↔ snake_case transformation for Database-Application boundary  
**Architecture:** Central transformation layer preventing field naming inconsistencies  
**Integration Points:** SQLiteAdapter, PDF generation, IPC layer, Settings system  

### **Core Problem Solved:**
Database uses `snake_case` (SQL standard), Application uses `camelCase` (JavaScript standard), requiring consistent transformation across all data flow points.

### **Critical Integration Pattern:**
```typescript
// Historical Pattern: Universal field-mapper usage
import { mapFromSQL, mapToSQL, convertSQLQuery } from '../lib/field-mapper';

// READ operations: snake_case → camelCase
const rows = await database.query(sql);
const entities = mapFromSQLArray(rows);

// WRITE operations: camelCase → snake_case  
const mappedData = mapToSQL(applicationData);
await database.exec(sql, mappedData);
```

---

## 🏗️ **FIELD-MAPPER ARCHITECTURE INSIGHTS**

### **Core Transformation Functions:**
```typescript
// Historical Pattern: Primary field-mapper API
interface FieldMapper {
  mapFromSQL(dbRow: any): any;           // snake_case → camelCase
  mapToSQL(appData: any): any;           // camelCase → snake_case
  mapFromSQLArray(rows: any[]): any[];   // Batch transformation
  convertSQLQuery(query: string, params?: any[]): string; // SQL safety
}
```

### **Database Schema Patterns:**
```sql
-- Historical Pattern: Database schema (snake_case)
CREATE TABLE offers (
  id INTEGER PRIMARY KEY,
  offer_number TEXT NOT NULL,           -- snake_case
  customer_id INTEGER,                  -- snake_case
  valid_until TEXT,                     -- snake_case
  created_at TEXT,                      -- snake_case
  updated_at TEXT                       -- snake_case
);
```

### **Application Interface Patterns:**
```typescript
// Historical Pattern: Application interfaces (camelCase)
interface Offer {
  id: number;
  offerNumber: string;                  // camelCase
  customerId: number;                   // camelCase
  validUntil: string;                   // camelCase
  createdAt: string;                    // camelCase
  updatedAt: string;                    // camelCase
}
```

---

## 🔄 **INTEGRATION POINT PATTERNS**

### **SQLiteAdapter Integration:**
```typescript
// Historical Pattern: Adapter layer field-mapping
class SQLiteAdapter {
  async listOffers(): Promise<Offer[]> {
    const query = convertSQLQuery('SELECT * FROM offers ORDER BY created_at DESC');
    const rows = await this.client.query(query);
    return mapFromSQLArray(rows) as Offer[];  // snake_case → camelCase
  }
  
  async createOffer(data: CreateOfferData): Promise<Offer> {
    const mappedData = mapToSQL(data);          // camelCase → snake_case
    const result = await this.client.exec(sql, mappedData);
    return this.getOffer(result.lastInsertRowid);
  }
}
```

### **PDF Generation Integration:**
```typescript
// Historical Pattern: PDF template field-mapping
async function handlePdfGenerate(options) {
  // Import field-mapper for template data transformation
  const { mapFromSQL } = await import('../src/lib/field-mapper');
  
  // Transform database entity for template consumption
  const mappedEntity = mapFromSQL(rawDatabaseEntity);
  
  // Template can now access camelCase properties
  // entity.offerNumber instead of entity.offer_number
  // entity.validUntil instead of entity.valid_until
}
```

### **IPC Layer Integration:**
```typescript
// Historical Pattern: IPC data transformation
// Main Process → Renderer Process communication
ipcMain.handle('offers:list', async () => {
  const offers = await sqliteAdapter.listOffers();
  // Data already transformed by SQLiteAdapter field-mapping
  return offers; // camelCase for renderer consumption
});
```

### **Settings System Integration:**
```typescript
// Historical Pattern: Settings field-mapping
class SettingsAdapter {
  async getSettings(): Promise<Settings> {
    const query = convertSQLQuery('SELECT * FROM settings');
    const rows = await this.client.query(query);
    
    // Transform database rows to application format
    const mappedSettings = mapFromSQL(rows[0]);
    return mappedSettings as Settings;
  }
}
```

---

## 🔍 **COMMON FIELD-MAPPING ISSUES PATTERNS**

### **"undefined" Value Symptoms:**
```typescript
// Historical Pattern: Missing field-mapping causes undefined values
// Problem: Direct database access without transformation
const offer = db.prepare('SELECT * FROM offers WHERE id = ?').get(id);
console.log(offer.offerNumber); // ❌ undefined (field is offer_number)

// Solution: Field-mapper transformation
const offerRow = db.prepare('SELECT * FROM offers WHERE id = ?').get(id);
const offer = mapFromSQL(offerRow);
console.log(offer.offerNumber); // ✅ "AN-0001"
```

### **"Invalid Date" Symptoms:**
```typescript
// Historical Pattern: Date field mapping issues  
// Problem: snake_case date fields not transformed
const offer = rawDatabaseRow; // { valid_until: "2025-12-31" }
new Date(offer.validUntil);   // ❌ Invalid Date (field doesn't exist)

// Solution: Field-mapper handles date fields
const offer = mapFromSQL(rawDatabaseRow);
new Date(offer.validUntil);   // ✅ Valid Date object
```

### **SQL Query Safety Patterns:**
```typescript
// Historical Pattern: convertSQLQuery for SQL injection prevention
// Problem: Dynamic SQL construction
const sql = `SELECT * FROM offers WHERE customer_id = ${customerId}`;

// Solution: Parameter binding with convertSQLQuery
const query = convertSQLQuery('SELECT * FROM offers WHERE customer_id = ?', [customerId]);
```

---

## 📊 **FIELD-MAPPING COVERAGE ANALYSIS**

### **System-Wide Integration Points:**
```
Historical Pattern: Field-mapper usage coverage
✅ SQLiteAdapter (100% coverage)
✅ PDF Generation (IPC layer transformation)
✅ Settings System (SettingsAdapter)
✅ Migration System (schema evolution compatibility)
✅ Timesheet System (TimesheetService integration)
✅ Activity Templates (activity operations)
✅ Numbering Circles (numbering system)
```

### **Transformation Consistency:**
```
Historical Pattern: Naming convention mapping
Database        Application     Notes
offer_number    offerNumber     Primary key fields
customer_id     customerId      Foreign key fields
valid_until     validUntil      Date fields
created_at      createdAt       Timestamp fields
updated_at      updatedAt       Timestamp fields
discount_type   discountType    Enum fields
hourly_rate     hourlyRate      Decimal fields
is_active       isActive        Boolean fields
```

---

## 🔍 **LESSONS LEARNED (Historical Context)**

### **Field-Mapper Design Success Factors:**
1. **Central Transformation**: Single source of truth for field mapping
2. **Bidirectional Mapping**: Both camelCase → snake_case and reverse
3. **Type Safety**: TypeScript interfaces enforce correct usage
4. **SQL Safety**: convertSQLQuery prevents injection attacks

### **Integration Best Practices:**
1. **Adapter Layer**: Always use field-mapper in data access layer
2. **Template Generation**: Transform data before template consumption
3. **IPC Communication**: Ensure consistent data format across processes
4. **Migration Compatibility**: Field-mapper works with schema evolution

### **Common Pitfalls Avoided:**
1. **Direct Database Access**: Bypassing field-mapper causes undefined values
2. **Mixed Naming Conventions**: Inconsistent field names across layers
3. **SQL Injection**: Dynamic SQL construction without parameter binding
4. **Template Errors**: snake_case fields in camelCase template contexts

---

## ⚠️ **CURRENT VERIFICATION STATUS**

**✅ VERIFIED (2025-10-26):**
- ✅ Field-mapper exists at src/lib/field-mapper.ts
- ✅ SQLiteAdapter uses field-mapper throughout
- ✅ PDF generation includes field-mapping transformation
- ✅ Settings system integrated with field-mapper
- ✅ convertSQLQuery function prevents SQL injection

**📍 SOURCE TRUTH:** For current field-mapper implementation:
- `src/lib/field-mapper.ts` (core implementation)
- `src/adapters/SQLiteAdapter.ts` (primary usage)
- `electron/ipc/pdf-core.ts` (PDF integration)
- `src/adapters/SettingsAdapter.ts` (settings integration)

---

## 📚 **KNOWLEDGE ARCHIVE METADATA**

**Original Documents:** Multiple LESSON_FIX field-mapping documents  
**Archive Date:** 2025-10-26  
**Archive Reason:** Field-mapper system central to all data operations  
**Verification Scope:** Field-mapping patterns across SQLite, PDF, IPC, Settings  
**Next Review:** When database schema or field-mapper implementation changes  

**Cross-References:**
- [KNOWLEDGE_ONLY_IMPL-SQLITE-ADAPTER-COMPLETE](KNOWLEDGE_ONLY_IMPL-SQLITE-ADAPTER-COMPLETE_2025-10-26.md)
- [KNOWLEDGE_ONLY_IMPL-PDF-ANHANG-SYSTEM-COMPLETE](KNOWLEDGE_ONLY_IMPL-PDF-ANHANG-SYSTEM-COMPLETE_2025-10-26.md)
- [KNOWLEDGE_ONLY_IMPL-MIGRATION-SYSTEM-COMPLETE](KNOWLEDGE_ONLY_IMPL-MIGRATION-SYSTEM-COMPLETE_2025-10-26.md)

---

**🧠 KI RECOGNITION:** This document uses `KNOWLEDGE_ONLY_FIX-` prefix for safe historical field-mapping system reference without current implementation assumptions.