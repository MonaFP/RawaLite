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

### **FIX-005: Offer & Invoice Foreign Key Constraint Fix**
- **ID:** `offer-invoice-foreign-key-constraint-fix`
- **Files:** `src/adapters/SQLiteAdapter.ts`, `src/main/db/migrations/011_extend_offer_line_items.ts`, `src/components/OfferForm.tsx`, `src/components/InvoiceForm.tsx`
- **Pattern:** ID mapping system for parent-child relationships + database schema extension
- **Location:** SQLiteAdapter updateOffer/updateInvoice/createOffer/createInvoice methods, Migration 011, OfferForm & InvoiceForm parent-child rendering
- **First Implemented:** v1.0.13 (OfferForm), v1.0.37 (InvoiceForm)
- **Last Verified:** v1.0.37
- **Status:** ✅ ACTIVE

**Problem Details:**
- **Scope:** Offer & Invoice line item updates causing FOREIGN KEY constraint failures
- **Root Cause:** Parent-child relationship violations in offer/invoice line items - negative temporary IDs conflicting with database auto-increment
- **Impact:** Complete inability to save offers/invoices with line items
- **Symptoms:** "FOREIGN KEY constraint failed" errors during offer/invoice creation/update operations

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

**Required Frontend Structure (OfferForm & InvoiceForm):**
```typescript
// ID mapping in handleSubmit to prevent FOREIGN KEY constraints
const idMapping: Record<number, number> = {};
const processedLineItems = offer.lineItems.map(item => {
  if (item.id < 0) {
    const newId = Math.abs(item.id);
    idMapping[item.id] = newId;
    return { ...item, id: newId };
  }
  return item;
}).map(item => ({
  ...item,
  parentItemId: item.parentItemId && item.parentItemId < 0 
    ? idMapping[item.parentItemId] 
    : item.parentItemId
}));

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

### **FIX-008: Update Manager Sidebar Integration**
- **ID:** `update-manager-sidebar-integration`
- **Files:** `src/components/NavigationOnlySidebar.tsx`, `electron/ipc/updates.ts`, `electron/preload.ts`
- **Pattern:** IPC-based UpdateManager integration instead of legacy UpdateDialog component
- **Location:** NavigationOnlySidebar update click handler, IPC updates:openManager handler, preload updates API
- **First Implemented:** v1.0.37
- **Last Verified:** v1.0.37
- **Status:** ✅ ACTIVE

**Problem Details:**
- **Scope:** Sidebar update button opening legacy UpdateDialog instead of modern UpdateManager
- **Root Cause:** NavigationOnlySidebar using deprecated UpdateDialog component instead of IPC-based UpdateManager
- **Impact:** Inconsistent update experience - modern update checking but legacy update installation UI
- **Symptoms:** Update button in sidebar opens old dialog instead of UpdateManager window

**Required IPC Integration (NavigationOnlySidebar.tsx):**
```typescript
// ✅ Modern IPC-based UpdateManager integration
const handleUpdateClick = () => {
  window.rawalite.updates.openManager();
};

// ✅ Button with IPC handler
<button 
  onClick={handleUpdateClick}
  className="update-button"
>
  Update installieren
</button>
```

**Required IPC Handler (electron/ipc/updates.ts):**
```typescript
// ✅ IPC handler for opening UpdateManager
ipcMain.handle('updates:openManager', async () => {
  // UpdateManager opening logic
  return true;
});
```

**Required Preload API (electron/preload.ts):**
```typescript
// ✅ Exposed updates API with openManager
updates: {
  openManager: () => ipcRenderer.invoke('updates:openManager'),
  // ... other update methods
}
```

**FORBIDDEN Patterns:**
```typescript
// ❌ Direct UpdateDialog component usage in sidebar
import { UpdateDialog } from '../components/UpdateDialog';
<UpdateDialog />

// ❌ Mixed update paradigms
// Using both UpdateDialog and UpdateManager in same context

// ❌ Missing IPC integration
// Direct component rendering instead of IPC-based window management
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

### **FIX-014: UpdateManager Asset Validation**
- **ID:** `updatemanager-asset-validation`
- **File:** `src/main/services/UpdateManagerService.ts`
- **Pattern:** Mandatory asset validation before creating UpdateInfo
- **Location:** ~Line 642 in `createUpdateInfo()` method and ~Line 940 in `getCurrentUpdateInfo()` method
- **First Implemented:** v1.0.33
- **Last Verified:** v1.0.33
- **Status:** ✅ ACTIVE

**Required Code Pattern:**
```typescript
// createUpdateInfo() method - MUST validate asset exists
private createUpdateInfo(release: any): UpdateInfo {
  const asset = release.assets.find((a: any) => 
    a.name.includes('.exe') && a.name.includes('Setup')
  );

  // ✅ CRITICAL FIX: Validate asset exists before creating UpdateInfo
  if (!asset || !asset.browser_download_url) {
    throw new Error(`No valid setup asset found in release ${release.tag_name}. Assets: ${release.assets.map((a: any) => a.name).join(', ')}`);
  }

  return {
    version: release.tag_name.replace(/^v/, ''),
    name: release.name,
    releaseNotes: release.body,
    publishedAt: release.published_at,
    downloadUrl: asset.browser_download_url, // ✅ Never empty string
    assetName: asset.name,
    fileSize: asset.size,
    isPrerelease: release.prerelease
  };
}

// getCurrentUpdateInfo() method - MUST return null if no valid asset
getCurrentUpdateInfo(): UpdateInfo | null {
  // ... existing checks ...
  
  const asset = release.assets?.find((a: any) => 
    a.name.includes('.exe') && a.name.includes('Setup')
  ) || release.assets?.[0];

  // ✅ CRITICAL FIX: Return null if no valid asset found instead of empty URL
  if (!asset || !asset.browser_download_url) {
    debugLog('UpdateManagerService', 'getCurrentUpdateInfo_no_asset', { 
      releaseTag: release.tag_name,
      assetsFound: release.assets?.length || 0,
      assetNames: release.assets?.map((a: any) => a.name) || []
    });
    return null;
  }

  return {
    // ... other fields ...
    downloadUrl: asset.browser_download_url, // ✅ Never empty string
    assetName: asset.name,
    fileSize: asset.size,
    // ... other fields ...
  };
}
```

**FORBIDDEN Patterns:**
```typescript
// ❌ Using fallback empty strings for URLs
downloadUrl: asset?.browser_download_url || '',

// ❌ Missing asset validation before URL usage
return {
  downloadUrl: asset?.browser_download_url || '', // CAUSES "Failed to parse URL from" ERROR
  assetName: asset?.name || '',
  fileSize: asset?.size || 0
};

// ❌ Not checking asset existence
const asset = release.assets?.[0]; // No .find() with proper filter
```

**Problem Solved:**
- Previous code used empty string (`''`) as fallback for missing download URLs
- Empty URLs caused "Failed to parse URL from" errors in fetch() calls
- Missing asset validation led to runtime errors during download attempts
- Solution: Mandatory asset validation with descriptive error messages, proper asset filtering for .exe Setup files, and null returns instead of invalid data

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
2. **Verify:** All 16 fixes are present and functional
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

| Version | WriteStream Fix | File Flush Fix | Event Handler Fix | Port Fix | Offer FK Fix | Discount Schema | PDF Theme Fix | CSS Dropdown Fix | Status Updates | ABI Management | Asset Validation | Universal Assets | GitHub Actions | Status |
|---------|----------------|----------------|-------------------|----------|--------------|-----------------|---------------|------------------|----------------|----------------|------------------|------------------|----------------|---------|
| v1.0.11 | ✅ Added | ✅ Added | ❌ Missing | ❌ Missing | ❌ Missing | ❌ Missing | ❌ Missing | ❌ Missing | ❌ Missing | ❌ Missing | ❌ Missing | ❌ Missing | ❌ Missing | Partial |
| v1.0.33 | ✅ Present | ✅ Present | ✅ Present | ✅ Present | ✅ Present | ✅ Present | ✅ Present | ✅ Present | ✅ Present | ✅ Present | ✅ Added | ❌ Missing | ❌ Missing | Near Complete |
| v1.0.38 | ✅ Present | ✅ Present | ✅ Present | ✅ Present | ✅ Present | ✅ Present | ✅ Present | ✅ Present | ✅ Present | ✅ Present | ✅ Present | ✅ Present | ❌ Missing | Near Complete |
| v1.0.39 | ✅ Present | ✅ Present | ✅ Present | ✅ Present | ✅ Present | ✅ Present | ✅ Present | ✅ Present | ✅ Present | ✅ Present | ✅ Present | ✅ Present | ✅ Added | Complete |

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

---

### **FIX-015: Universal UpdateManager Asset Compatibility**
- **ID:** `updatemanager-universal-asset-compatibility`
- **File:** `src/main/services/UpdateManagerService.ts`
- **Pattern:** Multi-pattern asset matching for backward/forward compatibility
- **Location:** ~Line 648 in `createUpdateInfo()` and ~Line 959 in `getCurrentUpdateInfo()`
- **First Implemented:** v1.0.36
- **Last Verified:** v1.0.36
- **Status:** ✅ ACTIVE

**Problem Solved:** v1.0.32 → v1.0.36 update failures due to asset naming mismatch
- **v1.0.32 Asset Pattern:** `RawaLite.Setup.1.0.32.exe` (dots)
- **v1.0.35+ Asset Pattern:** `RawaLite-Setup-1.0.35.exe` (dashes)
- **Root Cause:** v1.0.32 UpdateManager couldn't find v1.0.35+ assets → downloads never started

**Required Code Pattern:**
```typescript
// 🔄 UNIVERSAL ASSET COMPATIBILITY: Support both old (v1.0.32) and new naming patterns
const asset = release.assets.find((a: any) => 
  // Legacy pattern: RawaLite.Setup.1.0.32.exe (v1.0.32 and earlier)
  a.name.match(/RawaLite\.Setup\.\d+\.\d+\.\d+\.exe$/i) ||
  // Current pattern: RawaLite-Setup-1.0.35.exe (v1.0.34+)
  a.name.match(/RawaLite-Setup-\d+\.\d+\.\d+\.exe$/i) ||
  // Fallback patterns for any Setup.exe
  (a.name.includes('.exe') && a.name.includes('Setup')) ||
  a.name.match(/RawaLite.*Setup.*\.exe$/i)
);
```

**FORBIDDEN Pattern:**
```typescript
// ❌ SINGLE PATTERN ONLY - BREAKS BACKWARD COMPATIBILITY
const asset = release.assets.find((a: any) => 
  a.name.includes('.exe') && a.name.includes('Setup')
);
```

**Additional Configuration Fix:**
```yaml
# electron-builder.yml - Force consistent asset naming
nsis:
  artifactName: "RawaLite-Setup-${version}.${ext}"
```

**Impact:**
- ✅ v1.0.32 users can now update to v1.0.36+
- ✅ All future versions maintain compatibility
- ✅ No breaking changes for existing update mechanisms
- ✅ Robust asset detection across all release formats

**Validation:**
- Tested with mock releases: v1.0.32, v1.0.35, v1.0.36
- Cross-version compatibility confirmed
- GitHub release v1.0.36 successfully created with correct asset name

---

### **FIX-014: GitHub Release Asset Validation**
- **ID:** `github-release-asset-validation`
- **Files:** Release workflows, GitHub Actions, all release procedures
- **Pattern:** Mandatory asset validation before release completion
- **Location:** All release procedures and workflows
- **First Implemented:** v1.0.37
- **Last Verified:** v1.0.37
- **Status:** ✅ ACTIVE

**Required Validation Pattern:**
```bash
# MANDATORY after every release creation:
gh release view vX.X.X --json assets

# REQUIRED response (assets MUST exist):
{
  "assets": [
    {
      "name": "RawaLite-Setup-X.X.X.exe",
      "size": 106000000  // Must be >100MB
    }
  ]
}

# FORBIDDEN response (triggers "Failed to parse URL from" error):
{
  "assets": []
}
```

**Required Emergency Response:**
```bash
# If assets: [] detected - IMMEDIATE action required:
gh release delete vX.X.X --yes
pnpm clean && pnpm build && pnpm dist
gh release create vX.X.X --generate-notes dist-release/RawaLite-Setup-X.X.X.exe
```

**FORBIDDEN Patterns:**
```bash
# ❌ Ignoring empty assets
gh release create vX.X.X --generate-notes  # Without asset verification

# ❌ Assuming GitHub Actions worked
# Always verify: gh release view vX.X.X --json assets

# ❌ Releasing without assets causes UpdateManager failure
# "Failed to parse URL from" error in production
```

---

### **FIX-016: GitHub Actions Release Workflow Integration**
- **ID:** `github-actions-release-workflow-integration`
- **Files:** `.github/workflows/release.yml`, Release documentation prompts
- **Pattern:** GitHub Actions as primary release method with proper tag checkout
- **Location:** GitHub Actions workflow + Release-Workflow-Prompt.md
- **First Implemented:** v1.0.39
- **Last Verified:** v1.0.39
- **Status:** ✅ ACTIVE

**Problem Solved:** CLI-first release workflow causing systematic asset failures
- **Root Cause:** `gh release create` bypassed GitHub Actions, creating releases without assets
- **Symptom:** "Failed to parse URL from" errors because releases had empty assets array
- **Impact:** Multiple failed releases requiring manual intervention and documentation confusion

**Required GitHub Actions Pattern:**
```yaml
# Correct tag checkout for workflow_dispatch
steps:
  - name: 📥 Checkout code
    uses: actions/checkout@v4
    with:
      ref: ${{ github.event.inputs.tag || github.event.release.tag_name }}
```

**Required Release Workflow Pattern:**
```bash
# PRIMARY METHOD - GitHub Actions first
git tag vX.X.X && git push --tags
gh workflow run release.yml -f tag=vX.X.X
# Monitor: gh run list --workflow=release.yml --limit=1

# FALLBACK ONLY - Manual method if Actions fail
pnpm dist
gh release create vX.X.X --generate-notes dist-release/RawaLite-Setup-X.X.X.exe
```

**FORBIDDEN Patterns:**
```bash
# ❌ CLI-first workflow (bypasses Actions)
gh release create vX.X.X --generate-notes  # Creates release without assets

# ❌ Using HEAD checkout for manual tags
# Missing: ref: ${{ github.event.inputs.tag }}

# ❌ Ignoring workflow status
# Must verify: gh run view --log for success/failure
```

**Impact:**
- ✅ Automated asset generation via GitHub Actions
- ✅ Consistent build environment and native module compilation
- ✅ Proper error handling and logging for debugging
- ✅ Eliminates "Failed to parse URL from" errors
- ✅ Clear primary/fallback workflow distinction

**Validation Commands:**
```bash
# Verify workflow triggered correctly
gh run list --workflow=release.yml --limit=1
gh run view --log

# Verify assets created
gh release view vX.X.X --json assets

# Test UpdateManager compatibility
# Should show proper download URLs and executable files
```

---

### **FIX-017: Invoice Foreign Key Constraint ID Mapping**
- **ID:** `invoice-foreign-key-id-mapping`
- **Files:** `src/adapters/SQLiteAdapter.ts`
- **Pattern:** ID mapping system for frontend negative IDs to database positive IDs
- **Locations:** 
  - `createInvoice()` method ~Line 830-870
  - `updateInvoice()` method ~Line 920-970
- **First Implemented:** v1.0.40 (Fehlerhaft)
- **Fixed Implementation:** v1.0.40 (Versuch 2 - Korrekt)
- **Last Verified:** v1.0.40
- **Status:** ✅ ACTIVE

**Problem History:**
- **Versuch 1:** Fehlerhafter Timestamp-basierter Ansatz (`Date.now() + Math.random()`)
- **Versuch 2:** Korrekte Parent-Child Sortierung mit `lastInsertRowid` (wie bei Offers)

**Required Code Pattern:**
```typescript
// createInvoice() and updateInvoice() methods - MUST implement ID mapping
const idMapping: Record<number, number> = {};

// Sort items - main items first, then sub-items to ensure parent_item_id references exist
const mainItems = data.lineItems.filter(item => !item.parentItemId);
const subItems = data.lineItems.filter(item => item.parentItemId);

// Insert main items first and build ID mapping for ALL IDs
for (const item of mainItems) {
  const mappedItem = mapToSQL(item);
  const itemResult = await this.client.exec(/*...*/);
  
  // Map ALL IDs (both negative frontend IDs AND positive existing IDs) to new database IDs
  idMapping[item.id] = Number(itemResult.lastInsertRowid);
}

// Then insert sub-items with correct parent references
for (const item of subItems) {
  const mappedItem = mapToSQL(item);

  // Resolve parent_item_id using ID mapping - CRITICAL: Look up parent's NEW database ID
  let resolvedParentId = null;
  if (item.parentItemId) {
    resolvedParentId = idMapping[item.parentItemId] || null;
  }

  const subItemResult = await this.client.exec(/*...INSERT with resolvedParentId...*/);
  idMapping[item.id] = Number(subItemResult.lastInsertRowid);
}

// Then insert sub-items with correct parent references
for (const item of subItems) {
  const mappedItem = mapToSQL(item);

  // Resolve parent_item_id using ID mapping - CRITICAL: Look up parent's NEW database ID
  let resolvedParentId = null;
  if (item.parentItemId) {
    resolvedParentId = idMapping[item.parentItemId] || null;
  }

  const subItemResult = await this.client.exec(/*...INSERT with resolvedParentId...*/);
  idMapping[item.id] = Number(subItemResult.lastInsertRowid);
}
```

**Critical Functions:**
- Prevents FOREIGN KEY constraint failures when saving invoices with sub-items
- Maps frontend negative IDs (-1, -2) to valid database positive IDs (1, 2)
- Ensures parent_item_id references always point to existing database records
- Maintains hierarchical structure of invoice line items

**Symptoms if Missing:**
```
FOREIGN KEY constraint failed
```
- Sub-items are deleted during save operations
- Invoice line items fail to save with parent-child relationships
- Database constraint violations prevent invoice persistence

**FORBIDDEN Patterns:**
```typescript
// ❌ Direct insertion without ID mapping
INSERT INTO invoice_line_items (..., parent_item_id) VALUES (..., item.parentItemId)

// ❌ Using frontend negative IDs as database foreign keys
parent_item_id: item.parentItemId // When parentItemId = -1 (frontend ID)
```

---

### **FIX-018: Package Line Items Foreign Key Constraint ID Mapping**
- **ID:** `package-foreign-key-id-mapping`
- **Files:** `src/adapters/SQLiteAdapter.ts`
- **Pattern:** Parent-Child ID mapping system for package line items
- **Locations:** 
  - `createPackage()` method ~Line 302-350
  - `updatePackage()` method ~Line 360-410
- **First Implemented:** v1.0.40
- **Last Verified:** v1.0.40
- **Status:** ✅ ACTIVE

**Problem History:**
- **Before Fix:** No ID mapping system - direct frontend negative IDs used as database foreign keys
- **After Fix:** Complete Parent-Child sorting with `lastInsertRowid` mapping (identical to Offers/Invoices)

**Required Code Pattern:**
```typescript
// createPackage() and updatePackage() methods - MUST implement ID mapping
const idMapping: Record<number, number> = {};

// Sort items - main items first, then sub-items to ensure parent_item_id references exist
const mainItems = data.lineItems.filter(item => !item.parentItemId);
const subItems = data.lineItems.filter(item => item.parentItemId);

console.log(`🔧 CREATE PACKAGE: Starting with ${data.lineItems.length} total items`);
console.log(`🔧 CREATE PACKAGE: Found ${mainItems.length} main items and ${subItems.length} sub-items`);

// Insert main items first and build ID mapping for ALL IDs
for (const item of mainItems) {
  const itemResult = await this.client.exec(/*...*/);
  idMapping[item.id] = Number(itemResult.lastInsertRowid);
}

// Then insert sub-items with correct parent references
for (const item of subItems) {
  const resolvedParentId = idMapping[item.parentItemId] || null;
  const subItemResult = await this.client.exec(/*...INSERT with resolvedParentId...*/);
  idMapping[item.id] = Number(subItemResult.lastInsertRowid);
}
```

**Critical Functions:**
- Prevents FOREIGN KEY constraint failures when saving packages with sub-items
- Maps frontend negative IDs (-1, -2) to valid database positive IDs (1, 2)
- Ensures parent_item_id references always point to existing database records
- Maintains hierarchical structure of package line items

**Symptoms if Missing:**
```
FOREIGN KEY constraint failed
```
- Sub-items are deleted during package save operations
- Package line items fail to save with parent-child relationships
- Database constraint violations prevent package persistence

**FORBIDDEN Patterns:**
```typescript
// ❌ Direct insertion without ID mapping
INSERT INTO package_line_items (..., parent_item_id) VALUES (..., item.parentItemId)

// ❌ Using frontend negative IDs as database foreign keys
parent_item_id: item.parentItemId // When parentItemId = -1 (frontend ID)
```

---

**Last Updated:** 2025-10-10 (Added FIX-018: Package Line Items Foreign Key Constraint ID Mapping - prevents FOREIGN KEY failures when saving packages with sub-items)
**Maintained By:** GitHub Copilot KI + Development Team
**Validation Script:** `scripts/validate-critical-fixes.mjs`