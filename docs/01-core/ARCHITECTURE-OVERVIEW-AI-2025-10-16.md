# 🏗️ Architektur-Übersicht für KI - RawaLite v1.0.42.5

> **Letzte Aktualisierung:** 16. Oktober 2025 | **Zweck:** KI-Navigation & Code-Orientierung  
> **Aktualisiert:** Package Page Separation + Search/Filter System Completion

---

## 🎯 **System-Übersicht (Current State)**

**RawaLite v1.0.42.5** ist eine Electron-Desktop-App für Rechnungs- und Angebotsverwaltung mit **modularer Architektur**.

### **Tech Stack (Verified):**
- **Frontend:** React 18 + TypeScript + Vite
- **Backend:** Electron Main Process + better-sqlite3 
- **Database:** SQLite mit Field-Mapping System
- **Build:** electron-builder + NSIS Installer
- **Package Manager:** pnpm

---

## 📁 **Code-Navigation (Aktuelle Struktur)**

### **🔌 Electron Layer:**
```
electron/
├── main.ts                    # 92 Zeilen (refactored v1.0.42.5)
├── preload.ts                 # IPC Security Bridge
├── windows/                   # Window Management (4 modules)
│   ├── main-window.ts
│   ├── update-window.ts
│   └── updateManager*.ts
└── ipc/                       # IPC Handlers (12 modules)
    ├── database.ts            # Core DB Operations [CRITICAL FIX-012]
    ├── backup.ts              # Hot Backup System
    ├── pdf-core.ts            # PDF Generation [CRITICAL FIX-007]
    ├── numbering.ts           # Auto-Numbering für Angebote/Rechnungen
    ├── status.ts              # Entity Status Updates
    ├── paths.ts               # Pfad-Management
    ├── filesystem.ts          # File Operations
    ├── files.ts               # Upload/Download
    └── update-manager.ts      # Update System
```

### **🗄️ Database Layer:**
```
src/main/db/
├── Database.ts                # better-sqlite3 Singleton
├── MigrationService.ts        # Schema Migrations (025+ applied)
├── BackupService.ts           # Hot Backup with Integrity Checks
└── migrations/                # 025+ Migration Files
    ├── 014_*.ts              # Sub-Item Hierarchy (IMPLEMENTED)
    ├── 021_*.ts              # Package Price Unification (IMPLEMENTED)
    ├── 023_*.ts              # Sub-Item Extended (IMPLEMENTED)
    └── 024_*.ts              # Field Mapping Extended (IMPLEMENTED)
```

### **⚛️ React Frontend:**
```
src/
├── main.tsx                   # App Entry + Router + Provider Stack
├── App.tsx                    # Layout + Navigation Logic
├── pages/                     # 7 Main Business Pages + Package Edit Route
│   ├── DashboardPage.tsx      # KPI Dashboard with Statistics
│   ├── KundenPage.tsx         # Customer CRUD + Search/Filter ✅
│   ├── AngebotePage.tsx       # Offers CRUD + Status Management + Search/Filter ✅
│   ├── RechnungenPage.tsx     # Invoices CRUD + Payment Tracking + Search/Filter ✅
│   ├── PaketePage.tsx         # Package Templates + Search/Filter ✅
│   ├── PackageEditPage.tsx    # Package Edit Route (NEW v1.0.42.5)
│   ├── TimesheetsPage.tsx     # Time Tracking + Search/Filter ✅
│   └── EinstellungenPage.tsx  # Settings + Updates
├── components/                # Reusable UI Components
│   ├── Table.tsx              # Generic Data Table
│   ├── StatusControl.tsx      # Status Dropdown [CRITICAL FIX-012]
│   ├── SearchAndFilter/       # Universal Search/Filter System (v1.0.42.5)
│   │   ├── SearchBar.tsx      # Debounced Search Input
│   │   ├── FilterDropdown.tsx # Type-safe Filter Controls
│   │   ├── SearchAndFilterBar.tsx # Combined Component
│   │   ├── useTableSearch.ts  # Search/Filter Logic Hook
│   │   └── index.ts           # Exports
│   ├── Header*.tsx            # Navigation Components
│   └── *Form.tsx              # CRUD Forms
├── hooks/                     # Business Logic Hooks
│   ├── useCustomers.ts        # Customer Operations
│   ├── useOffers.ts           # Offer Operations + Numbering
│   ├── useInvoices.ts         # Invoice Operations + Workflow
│   └── useUnifiedSettings.ts  # Settings Access
├── contexts/                  # React Context Providers
│   ├── PersistenceContext.tsx # Database Adapter
│   ├── SettingsContext.tsx    # Settings State
│   ├── LoadingContext.tsx     # Loading States
│   └── NotificationContext.tsx # Toast Notifications
├── adapters/                  # Database Abstraction
│   ├── SQLiteAdapter.ts       # Primary DB Implementation
│   └── SettingsAdapter.ts     # Settings-Specific Logic
├── services/                  # Business Services
│   ├── DbClient.ts            # IPC Database Client
│   ├── PDFService.ts          # PDF Generation [CRITICAL FIX-007]
│   └── VersionService.ts      # Update Management
└── lib/                       # Core Libraries
    ├── field-mapper.ts        # camelCase ↔ snake_case Mapping
    ├── paths.ts               # Centralized Path Management
    └── settings.ts            # Settings Types + Defaults
```

---

## 🔌 **IPC Architecture (Current)**

### **Sichere Process-Trennung:**
```typescript
// Main Process (Node.js + Native APIs)
ipcMain.handle('db:query', async (event, sql, params) => {
  // CRITICAL FIX-012: Parameter binding with NULL handling
  return prepare(sql).all(...params || []);
});

// Renderer Process (React + Chromium)
const result = await window.rawalite.db.query(sql, params);
// Automatic field mapping: snake_case → camelCase
```

### **Registrierte IPC Channels (12 Module):**
- `db:*` - Database Operations (query, exec, transaction)
- `backup:*` - Hot Backup System (hot, vacuumInto, restore)
- `pdf:*` - PDF Generation (generate, preview, templates)
- `numbering:*` - Auto-Numbering (getNext, update)
- `status:*` - Entity Status (update, validate)
- `paths:*` - Path Resolution (get, userData, documents)
- `files:*` - File Operations (upload, download, delete)

---

## 🗄️ **Database Schema (Current)**

### **Business Entities (8 Tables):**
```sql
-- Core Business
customers (17 fields)         # Customer Management
offers (23 fields)           # Angebote mit Line Items
offer_line_items (12 fields) # Hierarchical Items + Sub-Items
invoices (25 fields)         # Rechnungen mit Workflow
invoice_line_items (12 fields)
packages (8 fields)          # Package Templates  
package_line_items (12 fields)

-- Time Tracking
activities (8 fields)        # Activity Templates
timesheets (15 fields)       # Time Logging + Billing

-- System
settings (20+ fields)        # Company + Preferences
numbering_circles (6 fields) # Auto-Numbering
migrations (4 fields)        # Schema Version Control
```

### **Field-Mapping System (CRITICAL):**
```typescript
// Bidirectional Mapping: 130+ Field Mappings
'companyName' ↔ 'company_name'
'createdAt' ↔ 'created_at'  
'priceDisplayMode' ↔ 'price_display_mode'  // v1.0.42.5
'discountAmount' ↔ 'discount_amount'      // Discount System

// Usage in allen Database Operations:
const mappedData = mapToSQL(jsObject);    // camelCase → snake_case
const result = mapFromSQL(sqlResult);     // snake_case → camelCase
const query = convertSQLQuery(sqlString); // Field names in queries
```

---

## 🚀 **Build & Deployment (Current)**

### **Development:**
```bash
pnpm dev:all         # Parallel: Vite + Electron Development
pnpm build           # Production Build
pnpm dist            # Electron Builder → NSIS Installer
```

### **Native Dependencies:**
```yaml
# electron-builder.yml - CRITICAL für .node files
asarUnpack:
  - node_modules/better-sqlite3/**/*  # SQLite native modules
extraFiles:
  - node_modules/better-sqlite3/**/*
```

---

## 🎯 **Kritische Fixes (PRESERVE):**

### **CRITICAL FIX-007 (PDF System):**
- **Location:** `electron/ipc/pdf-core.ts` + `src/services/PDFService.ts`
- **Function:** Popup-free PDF generation with inline modal preview
- **Status:** IMPLEMENTED ✅

### **CRITICAL FIX-012 (SQLite Parameters):**
- **Location:** `electron/ipc/database.ts` + `src/lib/field-mapper.ts`
- **Function:** NULL value handling in prepared statements
- **Status:** IMPLEMENTED ✅

### **Migration System:**
- **Current Version:** 025+ migrations applied
- **Key Migrations:** 014 (Sub-Items), 021 (Price Unification), 023/024 (Field Extensions)
- **Status:** FULLY OPERATIONAL ✅

---

### **Business Logic (Current)**

### **Core Features (Implemented):**
- ✅ **Customer Management** - Full CRUD + Validation + Search/Filter
- ✅ **Offer Creation** - Auto-numbering + Line Items + Sub-Items + Search/Filter  
- ✅ **Invoice Generation** - From Offers + Payment Tracking + Status Workflow + Search/Filter
- ✅ **Package Templates** - Reusable Item Collections + Edit Route + Search/Filter
- ✅ **Time Tracking** - Activities + Timesheets + Billing + Search/Filter
- ✅ **PDF Export** - Offers/Invoices with Company Branding
- ✅ **Hot Backup System** - Integrity Checks + Restore
- ✅ **Settings Management** - Company Data + Preferences
- ✅ **Universal Search/Filter** - All 5 main pages with unified UX (v1.0.42.5)

### **Package Management Architecture (v1.0.42.5):**
```typescript
// Route Separation for Focus-Mode Compliance
/pakete                    # PaketePage.tsx - List + Create + Delete
/pakete/:id/edit          # PackageEditPage.tsx - Edit with State Restoration

// SessionStorage State Management
interface PackageListState {
  search: string;
  filters: Record<string, any>;
  scrollPosition: number;
}
```

### **Search/Filter System Architecture (v1.0.42.5):**
```typescript
// Universal Pattern for All Pages
1. searchFieldMapping - Field-to-Search mapping
2. filterConfigs - Type-safe filter definitions  
3. useTableSearch Hook - State management
4. SearchAndFilterBar - UI component
5. filteredData - Replaces raw data in tables

// Filter Types Supported
- 'select'     - Dropdown with predefined options
- 'numberRange' - Min/Max numeric filters
- 'dateRange'  - Date period filters
- 'text'       - Free text filters
```

### **Statistics & KPIs (Live):**
```typescript
// Real-time Dashboard Calculations
const stats = {
  totalCustomers: customers.length,
  pendingOffers: offers.filter(o => o.status === 'draft').length,
  paidRevenue: invoices.filter(i => i.status === 'paid').reduce((sum, i) => sum + i.total, 0),
  offerConversionRate: (acceptedOffers / totalOffers) * 100,
  // 15+ additional KPIs calculated in real-time
};
```

---

## 🔍 **Code-Suche Strategien für KI:**

### **Database Operations:**
```bash
# Field-Mapping Issues
grep -r "mapToSQL\|mapFromSQL\|convertSQLQuery" src/

# IPC Communication  
grep -r "ipcMain.handle\|ipcRenderer.invoke" electron/

# Business Logic
grep -r "useCustomers\|useOffers\|useInvoices" src/hooks/
```

### **Critical Paths:**
- **Database Layer:** `src/main/db/` + `electron/ipc/database.ts`
- **Business Logic:** `src/hooks/` + `src/adapters/`
- **UI Components:** `src/pages/` + `src/components/`
- **Field Mapping:** `src/lib/field-mapper.ts` (CRITICAL)

### **Common Patterns:**
```typescript
// Hook Pattern
const { customers, loading, error, createCustomer } = useCustomers();

// Adapter Pattern  
const adapter = usePersistence(); // SQLiteAdapter instance
const result = await adapter.listCustomers();

// IPC Pattern
const data = await window.rawalite.db.query(sql, params);

// Search/Filter Pattern (v1.0.42.5)
const { filteredData, searchTerm, setSearchTerm, filters, setFilter } = 
  useTableSearch(rawData, searchFieldMapping);
```

---

## 🏆 **Architektur-Qualität (Current State):**

- **✅ Modular:** 97% Code Reduction in main.ts (2565→92 Zeilen)
- **✅ Type-Safe:** Vollständige TypeScript-Integration
- **✅ Secure:** IPC-only database access, process isolation
- **✅ Maintainable:** Klare Trennung von Business Logic und UI
- **✅ Testable:** Hook-based architecture, dependency injection
- **✅ Performance:** Field-mapping optimization, lazy loading
- **✅ Reliable:** Hot backup system, migration management

---

*Letzte Validierung: 16. Oktober 2025 | Nächste Review: November 2025*