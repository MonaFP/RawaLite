# CRITICAL FIXES REGISTRY

**NEVER REMOVE OR MODIFY THESE FIXES WITHOUT EXPLICIT APPROVAL**

This registry contains all critical fixes that must be preserved across ALL versions.
Any KI session MUST validate these patterns before making changes.

---

## 🚨 ACTIVE CRITICAL FIXES (Status: PROTECTED)

### **FIX-001: WriteStream Race Condition**
- **ID:** `writestream-race-condition`
- **File:** `src/main/services/GitHubApiService.ts`
- **Pattern:** Promise-based `writeStream.end()` completion
- **Location:** ~Line 156 in `downloadAsset()` method
- **First Implemented:** v1.0.11
- **Last Verified:** v1.0.13
- **Status:** ✅ ACTIVE

**Required Code Pattern:**
```typescript
// Ensure WriteStream is properly closed with Promise-based completion
await new Promise<void>((resolve, reject) => {
  writeStream.end((error?: Error) => {
    if (error) {
      reject(error);
    } else {
      resolve();
    }
  });
});
```

**FORBIDDEN Pattern:**
```typescript
writeStream.end(); // ❌ RACE CONDITION - NEVER USE
```

---

### **FIX-002: File System Flush Delay**
- **ID:** `file-system-flush-delay`
- **File:** `src/main/services/UpdateManagerService.ts`
- **Pattern:** 100ms delay before `fs.stat()` in `verifyDownload()`
- **Location:** ~Line 488 in `verifyDownload()` method
- **First Implemented:** v1.0.11
- **Last Verified:** v1.0.13
- **Status:** ✅ ACTIVE

**Required Code Pattern:**
```typescript
// Wait for file system to flush WriteStream to disk
// This prevents race condition between WriteStream.end() and fs.stat()
await new Promise(resolve => setTimeout(resolve, 100));
debugLog('UpdateManagerService', 'file_system_flush_delay_complete', { delayMs: 100 });

const stats = await fs.stat(filePath);
```

**FORBIDDEN Pattern:**
```typescript
const stats = await fs.stat(filePath); // ❌ WITHOUT DELAY - RACE CONDITION
```

---

### **FIX-003: Installation Event Handler Race Condition**
- **ID:** `installation-event-handler-race`
- **File:** `src/main/services/UpdateManagerService.ts`
- **Pattern:** Single `close` event handler with timeout cleanup
- **Location:** ~Line 583 in `runInstaller()` method
- **First Implemented:** v1.0.12
- **Last Verified:** v1.0.13
- **Status:** ✅ ACTIVE

**Required Code Pattern:**
```typescript
process.on('close', (code) => {
  clearTimeout(timeout); // Cleanup first
  if (code === 0) {
    resolve();
  } else {
    reject(new Error(`Installation failed with exit code ${code}: ${stderr}`));
  }
});
```

**FORBIDDEN Pattern:**
```typescript
process.on('close', (code) => { /* handler 1 */ });
// ... other code ...
process.on('close', () => clearTimeout(timeout)); // ❌ DOUBLE HANDLER
```

---

### **FIX-004: Port Consistency**
- **ID:** `port-consistency-5174`
- **Files:** `vite.config.mts`, `electron/main.ts`
- **Pattern:** Unified port 5174 for dev environment
- **Location:** vite.config.mts line 20, main.ts line 33
- **First Implemented:** v1.0.12
- **Last Verified:** v1.0.13
- **Status:** ✅ ACTIVE

**Required Code Pattern:**
```typescript
// vite.config.mts
server: { port: 5174 },

// electron/main.ts
win.loadURL('http://localhost:5174')
```

### **FIX-005: Offer Foreign Key Constraint Fix**
- **ID:** `offer-foreign-key-constraint-fix`
- **Files:** `src/adapters/SQLiteAdapter.ts`, `src/main/db/migrations/011_extend_offer_line_items.ts`, `src/components/OfferForm.tsx`
- **Pattern:** ID mapping system for parent-child relationships + database schema extension
- **Location:** SQLiteAdapter updateOffer/createOffer methods, Migration 011, OfferForm parent-child rendering
- **First Implemented:** v1.0.13
- **Last Verified:** v1.0.13
- **Status:** ✅ ACTIVE

**Required Database Schema (Migration 011):**
```sql
ALTER TABLE offer_line_items ADD COLUMN item_type TEXT DEFAULT 'standalone';
ALTER TABLE offer_line_items ADD COLUMN source_package_id INTEGER;
UPDATE offer_line_items SET item_type = 'standalone' WHERE item_type IS NULL;
```

**Required ID Mapping Pattern (SQLiteAdapter):**
```typescript
// Map frontend negative IDs to database positive IDs
const idMapping: Record<number, number> = {};
offer.lineItems.forEach(item => {
  if (item.id < 0) {
    const dbItem = await createLineItem(item);
    idMapping[item.id] = dbItem.id;
  }
});

// Fix parent-child references
offer.lineItems.forEach(item => {
  if (item.parentItemId && item.parentItemId < 0) {
    item.parentItemId = idMapping[item.parentItemId];
  }
});
```

**Required Frontend Structure (OfferForm):**
```typescript
// Parent-first rendering with grouped sub-items
{lineItems
  .filter(item => !item.parentItemId)
  .map(parentItem => (
    <React.Fragment key={`parent-${parentItem.id}`}>
      {/* Parent Item */}
      {/* Sub-Items grouped under parent */}
      {lineItems
        .filter(item => item.parentItemId === parentItem.id)
        .map(subItem => (/* Sub-Item rendering */))}
    </React.Fragment>
  ))}
```

**FORBIDDEN Patterns:**
```typescript
// ❌ Direct parent-child insertion without ID mapping
parentItemId: someNegativeId  

// ❌ Mixed rendering without parent-grouping
{lineItems.map(item => /* flat rendering */)}

// ❌ Missing item_type in database operations
```

---

### **FIX-006: Discount System Database Schema**
- **ID:** `discount-system-database-schema`
- **Files:** `src/main/db/migrations/013_add_discount_system.ts`, `src/adapters/SQLiteAdapter.ts`, `src/lib/field-mapper.ts`
- **Pattern:** Complete discount field mapping and persistence
- **Location:** Migration 013, SQLiteAdapter CREATE/UPDATE operations, field-mapper bidirectional mapping
- **First Implemented:** v1.0.13
- **Last Verified:** v1.0.13
- **Status:** ✅ ACTIVE

**Required Database Schema (Migration 013):**
```sql
ALTER TABLE offers ADD COLUMN discount_type TEXT DEFAULT NULL;
ALTER TABLE offers ADD COLUMN discount_value REAL DEFAULT NULL;
ALTER TABLE offers ADD COLUMN discount_amount REAL DEFAULT NULL;
ALTER TABLE offers ADD COLUMN subtotal_before_discount REAL DEFAULT NULL;

ALTER TABLE invoices ADD COLUMN discount_type TEXT DEFAULT NULL;
ALTER TABLE invoices ADD COLUMN discount_value REAL DEFAULT NULL;
ALTER TABLE invoices ADD COLUMN discount_amount REAL DEFAULT NULL;
ALTER TABLE invoices ADD COLUMN subtotal_before_discount REAL DEFAULT NULL;
```

**Required Field Mapping (field-mapper.ts):**
```typescript
discountType: 'discount_type',
discountValue: 'discount_value',
discountAmount: 'discount_amount',
subtotalBeforeDiscount: 'subtotal_before_discount'
```

**Required Database Operations (SQLiteAdapter.ts):**
```typescript
// CREATE operations MUST include all discount fields
INSERT INTO offers (..., discount_type, discount_value, discount_amount, subtotal_before_discount)
VALUES (..., ?, ?, ?, ?)

// UPDATE operations MUST include all discount fields  
UPDATE offers SET ..., discount_type = ?, discount_value = ?, discount_amount = ?, subtotal_before_discount = ?
WHERE id = ?
```

**FORBIDDEN Patterns:**
```typescript
// ❌ Missing discount fields in CREATE/UPDATE operations
INSERT INTO offers (...) VALUES (...) // without discount fields

// ❌ Partial field mapping
// Missing any of: discountType, discountValue, discountAmount, subtotalBeforeDiscount

// ❌ Schema changes without migration
// Manual ALTER TABLE without proper migration versioning
```

---

### **FIX-007: PDF Theme System Parameter-Based**
- **ID:** `pdf-theme-system-parameter-based`
- **Files:** `src/services/PDFService.ts`, `electron/main.ts`
- **Pattern:** Parameter-based theme passing instead of DOM inspection
- **Location:** PDFService getCurrentPDFTheme() method, main.ts PDF template generation
- **First Implemented:** v1.0.13
- **Last Verified:** v1.0.13  
- **Status:** ✅ ACTIVE

**Required Theme Mapping (PDFService.ts):**
```typescript
private getThemeColor(theme: string): string {
  const themeColors: Record<string, string> = {
    'default': '#2D5016',     // Standard - Tannengrün
    'sage': '#9CAF88',        // Salbeigrün  
    'sky': '#87CEEB',         // Himmelblau
    'lavender': '#DDA0DD',    // Lavendel
    'peach': '#FFCBA4',       // Pfirsich
    'rose': '#FFB6C1'         // Rosé
  };
  return themeColors[theme] || themeColors['default'];
}
```

**Required Parameter Passing:**
```typescript
// ✅ Parameter-based theme detection
getCurrentPDFTheme(): string {
  return this.currentTheme || 'default';
}
```

**FORBIDDEN Patterns:**
```typescript
// ❌ DOM-based theme detection in PDF context
if (document.body.classList.contains('theme-lavender')) {
  return 'lavender';
}

// ❌ Incomplete theme mapping (missing any of 6 themes)
const themeColors = { 'lavender': '#DDA0DD' }; // Missing others

// ❌ Cross-process DOM access
document.body.classList // in Main Process context
```

---

## 🔍 VALIDATION RULES FOR KI

### **BEFORE ANY FILE EDIT:**
1. **Check if file is in CRITICAL-FIXES-REGISTRY.md**
2. **Verify all required patterns are preserved**
3. **Never remove Promise-based patterns**
4. **Never remove timeout/delay patterns**
5. **Never add duplicate event handlers**

### **BEFORE ANY VERSION BUMP:**
1. **Run:** `pnpm validate:critical-fixes`
2. **Verify:** All fixes are present and functional
3. **Test:** Download verification works
4. **Confirm:** No regression detected

### **FORBIDDEN OPERATIONS:**
- ❌ Removing Promise-based WriteStream completion
- ❌ Removing file system flush delays  
- ❌ Adding duplicate event handlers
- ❌ Changing established port configurations
- ❌ Bypassing pre-release validation

---

## 📊 FIX HISTORY

| Version | WriteStream Fix | File Flush Fix | Event Handler Fix | Port Fix | Offer FK Fix | Discount Schema | PDF Theme Fix | Status |
|---------|----------------|----------------|-------------------|----------|--------------|-----------------|---------------|---------|
| v1.0.11 | ✅ Added | ✅ Added | ❌ Missing | ❌ Missing | ❌ Missing | ❌ Missing | ❌ Missing | Partial |
| v1.0.12 | ❌ LOST | ❌ LOST | ✅ Added | ✅ Added | ❌ Missing | ❌ Missing | ❌ Missing | Regression |
| v1.0.13 | ✅ Restored | ✅ Restored | ✅ Present | ✅ Present | ✅ Added | ✅ Added | ✅ Added | Complete |

---

## 🚨 EMERGENCY PROCEDURES

### **If Critical Fix Lost:**
1. **STOP** all development immediately
2. **Identify** when fix was lost (git diff)
3. **Re-implement** exact pattern from this registry
4. **Test** functionality thoroughly
5. **Update** validation script if needed

### **If Registry Becomes Outdated:**
1. **Audit** all listed files against current code
2. **Update** line numbers and patterns
3. **Test** validation script
4. **Document** any changes made

---

## 🔄 MAINTENANCE

**This registry MUST be updated when:**
- New critical fixes are discovered
- File locations change significantly  
- Patterns evolve (with backward compatibility)
- New validation rules are needed

**Last Updated:** 2025-10-03 (Added FIX-006: Discount System Database Schema, FIX-007: PDF Theme System Parameter-Based)
**Maintained By:** GitHub Copilot KI + Development Team
**Validation Script:** `scripts/validate-critical-fixes.mjs`