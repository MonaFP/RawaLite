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
- **Files:** `vite.config.mts`, `electron/windows/main-window.ts`
- **Pattern:** Unified port 5174 for dev environment
- **Location:** vite.config.mts line 20, main-window.ts line ~44
- **First Implemented:** v1.0.12
- **Last Verified:** v1.0.42.5 (Updated in refactor Step 1)
- **Status:** ✅ ACTIVE

**Required Code Pattern:**
```typescript
// vite.config.mts
server: { port: 5174 },

// electron/windows/main-window.ts (moved from main.ts in refactor)
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

### **FIX-008: StatusControl Component & Responsive Design**
- **ID:** `status-control-responsive-design`
- **Files:** `src/index.css`, `src/components/StatusControl.tsx`, `src/pages/AngebotePage.tsx`, `src/pages/RechnungenPage.tsx`, `src/pages/TimesheetsPage.tsx`
- **Pattern:** Portal-based StatusControl component with responsive design and proper CSS isolation
- **Location:** StatusControl component, responsive CSS media queries, Card-layout for mobile
- **First Implemented:** v1.0.13
- **Last Verified:** v1.0.13
- **Status:** ✅ ACTIVE

**Required StatusControl CSS Classes (index.css):**
```css
/* StatusControl Component Styles */
.status-control-button {
  background: var(--card-bg);
  color: var(--text-primary);
  border: 1px solid var(--accent);
  border-radius: 4px;
  padding: 8px 12px;
  font-size: 12px;
  font-weight: 500;
  transition: all 0.2s ease;
  min-width: 120px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.status-control-dropdown {
  background: var(--card-bg);
  border: 1px solid var(--accent);
  border-radius: 6px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
  backdrop-filter: blur(8px);
  padding: 4px;
  z-index: 9999;
}

.status-control-option {
  display: block;
  width: 100%;
  padding: 8px 12px;
  border: none;
  background: transparent;
  color: var(--text-primary);
  text-align: left;
  cursor: pointer;
  font-size: 12px;
  font-family: inherit;
  border-radius: 3px;
  margin: 1px 0;
  transition: all 0.15s ease;
}

/* Touch-optimized mobile styles */
@media (max-width: 768px) {
  .status-control-button {
    min-height: 44px; /* Touch-friendly height */
    min-width: 100px;
    padding: 10px 12px;
    font-size: 14px;
  }
  
  .status-control-option {
    min-height: 44px; /* Touch-friendly height */
    padding: 12px 16px;
    font-size: 14px;
    margin: 2px 0;
  }
}
```

**Required Responsive Design CSS (index.css):**
```css
/* Card Layout für sehr kleine Bildschirme */
@media (max-width: 480px) {
  .table-card-view {
    display: block;
  }
  
  .table-card-view .table {
    display: none; /* Verstecke normale Tabelle */
  }
}

/* Desktop und Tablet: Verstecke Card-View komplett */
@media (min-width: 481px) {
  .table-card-view {
    display: none !important;
  }
}
```

**Required Frontend Pattern:**
```tsx
// Portal-based StatusControl Component
<StatusControl
  kind="offer" // "offer" | "invoice" | "timesheet"
  row={{ ...entity, version: entity.id }}
  onUpdated={() => {
    // Refresh data
    window.location.reload();
  }}
  onError={(error: Error) => showError(error.message)}
/>

// Responsive Table Layout
<div className="table-responsive">
  <div className="table-card-view">
    {/* Card Layout für Mobile */}
    <div className="table-cards">
      {data.map((item) => (
        <div key={item.id} className="table-card">
          {/* Card content */}
        </div>
      ))}
    </div>
  </div>
  
  <Table<Entity>
    columns={columns}
    data={data}
    emptyMessage="Keine Einträge gefunden."
  />
</div>
```

**FORBIDDEN Patterns:**
```tsx
// ❌ Missing StatusControl component - using old select elements
<select value={row.status} onChange={...} />

// ❌ Missing responsive wrapper
<Table columns={columns} data={data} />

// ❌ Card-view always visible (incorrect CSS)
.table-card-view { display: block; }

// ❌ Missing touch-optimized button heights
.status-control-button { min-height: 32px; } // Too small for touch

// ❌ Missing CSS isolation for Portal components
.status-dropdown { /* without !important overrides */ }
```

**Problem Solved:**
- Complete refactor from select-based status dropdowns to Portal-based StatusControl component
- Responsive design with Card-layout for mobile devices (≤480px)
- Touch-optimized interface with 44px minimum button heights
- CSS isolation through CSS classes instead of !important overrides
- Proper media queries to prevent Card-layout from showing on desktop
- Solution: Modern React component architecture with complete responsive design

---

### **FIX-009: Database-Driven Status Updates with Optimistic Locking**
- **ID:** `database-status-updates-optimistic-locking`
- **Files:** `src/main/services/EntityStatusService.ts`, `src/migrations/015_add_status_versioning.ts`, `electron/main.ts`, `electron/preload.ts`
- **Pattern:** Complete status update system using database transactions with version-based optimistic locking
- **Location:** EntityStatusService backend, Migration 015, IPC handlers for all entity types
- **First Implemented:** v1.0.13
- **Last Verified:** v1.0.13
- **Status:** ✅ ACTIVE

**Required Backend Service (EntityStatusService.ts):**
```typescript
export class EntityStatusService {
  async updateEntityStatus(params: {
    tableName: string;
    id: number;
    status: EntityStatus;
    expectedVersion: number;
  }): Promise<{ success: boolean; entity?: any; error?: string }> {
    
    return this.db.transaction(() => {
      // Version-based optimistic locking check
      const current = this.db.prepare(`
        SELECT id, status, version, updated_at FROM ${tableName} 
        WHERE id = ?
      `).get(params.id);
      
      if (!current) {
        throw new Error('Entity not found');
      }
      
      if (current.version !== params.expectedVersion) {
        throw new Error('Version conflict: Entity was modified by another user');
      }
      
      // Update with version increment and status tracking
      const result = this.db.prepare(`
        UPDATE ${tableName} 
        SET status = ?, 
            version = version + 1,
            updated_at = CURRENT_TIMESTAMP,
            ${statusField} = CURRENT_TIMESTAMP
        WHERE id = ? AND version = ?
      `).run(params.status, params.id, params.expectedVersion);
      
      if (result.changes === 0) {
        throw new Error('Update failed: Concurrent modification detected');
      }
      
      return this.db.prepare(`SELECT * FROM ${tableName} WHERE id = ?`).get(params.id);
    });
  }
}
```

**Required Database Migration (015_add_status_versioning.ts):**
```sql
-- Add version tracking and status history
ALTER TABLE offers ADD COLUMN version INTEGER DEFAULT 1;
ALTER TABLE invoices ADD COLUMN version INTEGER DEFAULT 1;
ALTER TABLE timesheets ADD COLUMN version INTEGER DEFAULT 1;

-- Status tracking fields
ALTER TABLE offers ADD COLUMN sent_at TEXT;
ALTER TABLE offers ADD COLUMN accepted_at TEXT;
ALTER TABLE offers ADD COLUMN rejected_at TEXT;

-- Triggers for automatic history tracking
CREATE TRIGGER offers_status_history 
AFTER UPDATE OF status ON offers
BEGIN
  INSERT INTO offers_status_history (offer_id, old_status, new_status, changed_at)
  VALUES (NEW.id, OLD.status, NEW.status, CURRENT_TIMESTAMP);
END;
```

**Required IPC Handlers (electron/main.ts):**
```typescript
// Status update IPC handlers for all entity types
ipcMain.handle('status:update-offer-status', async (event, params) => {
  return await entityStatusService.updateEntityStatus({
    tableName: 'offers',
    ...params
  });
});

ipcMain.handle('status:update-invoice-status', async (event, params) => {
  return await entityStatusService.updateEntityStatus({
    tableName: 'invoices', 
    ...params
  });
});

ipcMain.handle('status:update-timesheet-status', async (event, params) => {
  return await entityStatusService.updateEntityStatus({
    tableName: 'timesheets',
    ...params
  });
});
```

**Required Frontend Integration:**
```tsx
// StatusControl component using database-driven updates
const handleStatusSelect = useCallback(async (newStatus: EntityStatus) => {
  try {
    const result = await (window as any).rawalite.status.updateOfferStatus({
      id: row.id,
      status: newStatus,
      expectedVersion: row.version
    });
    
    if (result.success) {
      onUpdated?.(result.entity);
    } else {
      throw new Error(result.error || 'Status update failed');
    }
  } catch (error) {
    // Handle version conflicts and other errors
    setCurrentStatus(originalStatus); // Rollback optimistic update
    onError?.(error);
  }
}, [row, onUpdated, onError]);
```

**FORBIDDEN Patterns:**
```tsx
// ❌ Direct state mutations without database updates
setOffers(prev => prev.map(offer => 
  offer.id === id ? { ...offer, status: newStatus } : offer
));

// ❌ Missing version-based optimistic locking
const params = { id: row.id, status: newStatus }; // Missing expectedVersion

// ❌ Frontend-only status updates without persistence
const handleStatusChange = (id, status) => {
  updateLocalState(id, status); // No database call
};

// ❌ Missing error handling for version conflicts
await updateStatus(params); // No try/catch for conflicts
```

**Problem Solved:**
- Previous system used frontend-only state updates without proper persistence
- No optimistic locking led to data inconsistency in multi-user scenarios
- Status changes were not properly tracked or audited
- Race conditions could occur during concurrent status updates
- Solution: Complete database-driven system with optimistic locking, proper error handling, and audit trails

---

### **FIX-011: ABI Management System**
- **ID:** `abi-management-system`
- **Files:** `scripts/rebuild-native-electron.cjs`, `package.json`, `.npmrc`
- **Pattern:** Robust Electron ABI compilation with fallback recovery
- **Location:** Scripts directory and package.json rebuild:electron script
- **First Implemented:** v1.0.13
- **Last Verified:** v1.0.13
- **Status:** ✅ ACTIVE

**Required Code Pattern (rebuild-native-electron.cjs):**
```javascript
// Robust rebuild with fallback strategy
console.log('🚀 [Rebuild] Rebuilding better-sqlite3...');

let rebuildSuccess = false;

// First try: Standard rebuild
console.log('🔄 [Rebuild] Attempt 1: Standard rebuild...');
const r1 = spawnSync('pnpm', ['rebuild', 'better-sqlite3', '--verbose'], { stdio: 'inherit', shell: true });

if (r1.status === 0) {
  rebuildSuccess = true;
  console.log('✅ [Rebuild] Standard rebuild successful');
} else {
  console.log('⚠️ [Rebuild] Standard rebuild failed, trying reinstall...');
  
  // Second try: Remove and reinstall
  console.log('🔄 [Rebuild] Attempt 2: Remove and reinstall...');
  const r2 = spawnSync('pnpm', ['remove', 'better-sqlite3'], { stdio: 'inherit', shell: true });
  if (r2.status === 0) {
    const r3 = spawnSync('pnpm', ['add', 'better-sqlite3'], { stdio: 'inherit', shell: true });
    if (r3.status === 0) {
      rebuildSuccess = true;
      console.log('✅ [Rebuild] Reinstall successful');
    }
  }
}
```

**Required .npmrc Configuration:**
```properties
runtime=electron
target=31.7.7
disturl=https://atom.io/download/atom-shell
build_from_source=true
```

**Required package.json Script:**
```json
{
  "scripts": {
    "rebuild:electron": "node scripts/rebuild-native-electron.cjs",
    "postinstall": "node scripts/sync-npmrc.cjs && node scripts/rebuild-native-electron.cjs",
    "preinstall": "node scripts/check-electron-abi.cjs || true"
  }
}
```

**Expected Behavior:**
- ✅ better-sqlite3 compiled for Electron ABI 125
- ✅ Node.js test fails with ABI mismatch (EXPECTED)
- ✅ Electron loads better-sqlite3 successfully
- ✅ Automatic recovery from permission/lock issues

**FORBIDDEN Patterns:**
```bash
npx electron-rebuild  # ❌ Compiles for Node.js ABI instead of Electron
npm rebuild           # ❌ Uses npm instead of pnpm
```

**Problem Solved:**
- ABI mismatches between Node.js v22.18.0 (ABI 127) and Electron v31.7.7 (ABI 125)
- Permission and file lock issues during rebuild processes
- Inconsistent native module compilation across development environments
- Documentation with dangerous npx electron-rebuild commands that compile for wrong runtime
- Solution: Robust fallback strategy with proper runtime targeting and automatic recovery mechanisms

---

### **FIX-013: Vite Asset Import Pattern for Production Logo Loading**
- **ID:** `vite-asset-import-pattern`
- **Files:** `src/components/NavigationOnlySidebar.tsx`, `src/components/CompactSidebar.tsx`, `src/components/Sidebar.tsx`
- **Pattern:** Vite asset imports instead of absolute paths for production compatibility
- **Location:** Logo import statements and img src attributes
- **First Implemented:** v1.0.23
- **Last Verified:** v1.0.23
- **Status:** ✅ ACTIVE

**Required Code Pattern:**
```typescript
// NavigationOnlySidebar.tsx
import logoUrl from '../assets/rawalite-logo.png';

const NavigationOnlySidebar: React.FC<Props> = () => {
  return (
    <div className="navigation-only-sidebar">
      <div className="logo">
        <img src={logoUrl} alt="RawaLite" className="logo-image" />
      </div>
    </div>
  );
};

// CompactSidebar.tsx
import logoUrl from '../assets/rawalite-logo.png';

const CompactSidebar: React.FC<Props> = () => {
  return (
    <div className="compact-sidebar">
      <div className="logo">
        <img src={logoUrl} alt="RawaLite" className="logo-image" />
      </div>
    </div>
  );
};

// Sidebar.tsx
import rawaliteLogo from '../assets/rawalite-logo.png';

const Sidebar: React.FC<Props> = () => {
  return (
    <div className="sidebar">
      <div className="logo">
        <img src={rawaliteLogo} alt="RawaLite" className="logo-image" />
      </div>
    </div>
  );
};
```

**Vite Asset Processing Result:**
```
dist-web/assets/rawalite-logo-D3IvfwpA.png    810.30 kB
```

**FORBIDDEN Patterns:**
```typescript
// ❌ Absolute paths that fail in production Electron
<img src="/rawalite-logo.png" alt="RawaLite" />

// ❌ Direct file system access in renderer process
<img src="./public/rawalite-logo.png" alt="RawaLite" />

// ❌ require() for assets in React components  
const logoUrl = require('../assets/rawalite-logo.png');
```

**Problem Solved:**
- Logo assets not displaying in production Electron builds (v1.0.22 and earlier)
- Dev-prod discrepancy: absolute paths work in Vite dev server but fail in Electron static file loading
- Race condition between asset loading and app initialization in production
- Solution: Vite asset import system provides proper bundling, cache-busting, and production compatibility

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

| Version | WriteStream Fix | File Flush Fix | Event Handler Fix | Port Fix | Offer FK Fix | Discount Schema | PDF Theme Fix | CSS Dropdown Fix | Status Updates | ABI Management | Status |
|---------|----------------|----------------|-------------------|----------|--------------|-----------------|---------------|------------------|----------------|----------------|---------|
| v1.0.11 | ✅ Added | ✅ Added | ❌ Missing | ❌ Missing | ❌ Missing | ❌ Missing | ❌ Missing | ❌ Missing | ❌ Missing | ❌ Missing | Partial |
| v1.0.12 | ❌ LOST | ❌ LOST | ✅ Added | ✅ Added | ❌ Missing | ❌ Missing | ❌ Missing | ❌ Missing | ❌ Missing | ❌ Missing | Regression |
| v1.0.13 | ✅ Restored | ✅ Restored | ✅ Present | ✅ Present | ✅ Added | ✅ Added | ✅ Added | ✅ Added | ✅ Added | ✅ Added | Complete |

---

### **FIX-012: SQLite Parameter Binding Null Conversion**
- **ID:** `sqlite-undefined-null-binding`
- **File:** `src/main/services/UpdateHistoryService.ts`
- **Pattern:** Explicit undefined to null conversion for SQLite compatibility
- **Location:** ~Line 35 in `addEntry()` method
- **First Implemented:** v1.0.14
- **Last Verified:** v1.0.14
- **Status:** ✅ ACTIVE

**Required Code Pattern:**
```typescript
// Convert undefined values to null for SQLite binding compatibility
const stmt = this.db.prepare(`
  INSERT INTO update_history (session_id, event_type, event_data, notes, duration_ms, created_at)
  VALUES (?, ?, ?, ?, ?, ?)
`);

stmt.run(
  sessionId,
  eventType,
  eventData !== undefined ? JSON.stringify(eventData) : null,
  notes !== undefined ? notes : null,
  durationMs !== undefined ? durationMs : null,
  new Date().toISOString()
);
```

**Problem:** SQLite binding TypeError "can only bind numbers, strings, bigints, buffers, and null"
**Solution:** Explicit !== undefined checks and null conversion
**FORBIDDEN Pattern:**
```typescript
stmt.run(sessionId, eventType, eventData, notes, durationMs, timestamp); // ❌ undefined values cause TypeError
```

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

**Last Updated:** 2025-10-08 (Added FIX-013: Vite Asset Import Pattern - ensures logo assets display correctly in production builds)
**Maintained By:** GitHub Copilot KI + Development Team
**Validation Script:** `scripts/validate-critical-fixes.mjs`