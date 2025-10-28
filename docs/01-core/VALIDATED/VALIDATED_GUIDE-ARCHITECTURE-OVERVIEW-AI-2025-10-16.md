# 🏗️ Architektur-Übersicht für KI - RawaLite v1.0.49

> **Erstellt:** 16.10.2025 | **Letzte Aktualisierung:** 27.10.2025 (KI-AUTO-DETECTION SYSTEM Integration)  
> **Status:** Production Ready | **Typ:** Guide - Architecture Overview for KI  
> **Schema:** `VALIDATED_GUIDE-ARCHITECTURE-OVERVIEW-AI_2025-10-16.md` ✅ **SCHEMA-COMPLIANT**  
> **Zweck:** KI-Navigation & Code-Orientierung mit intelligenter Template-Erkennung

> **🤖 KI-AUTO-DETECTION SYSTEM:**
> - **AKTUELLER STATUS:** Production Ready (automatisch durch "18 Business Services" erkannt)
> - **TEMPLATE-QUELLE:** 01-core VALIDATED Template
> - **AUTO-UPDATE:** Bei Architektur-Änderung automatisch Overview aktualisieren
> - **STATUS-KEYWORDS:** Erkannt durch "Production Ready", "v1.0.49", "Service Architecture", "Migration 029"

> **🤖 KI-VERHALTENSREGELN (AUTO-AKTIV basierend auf Status):**
> 
> **📚 STATUS = Production Ready:**
> - ✅ **Architektur-Navigation** - Verlässliche Quelle für gesamte System-Architektur
> - ✅ **Code-Orientierung** - Authoritative Landkarte für Development-Sessions
> - 🎯 **AUTO-REFERENCE:** Bei Architecture-Fragen IMMER dieses Dokument nutzen
> - 🔄 **AUTO-TRIGGER:** Bei Keywords "ARCHITECTURE BROKEN" → Overview-Update erforderlich

> **⚠️ SYSTEM ARCHITECTURE STATUS:** 18 Business Services, 029 Migrations applied (27.10.2025)  
> **Migration Status:** Theme System (027), Navigation (028), Focus Mode (029) produktionsbereit  
> **Template Integration:** KI-SESSION-BRIEFING mandatory vor Architektur-Änderungen  
> **Critical Function:** Master-Navigation für komplette System-Architektur

## 📋 **SCHEMA-ÜBERSICHT (KI-PRÄFIX-ERKENNUNGSREGELN)**

### **Document Classification:**
- **STATUS-PRÄFIX:** `VALIDATED_` ✅ **Validierte, stabile Dokumentation (verlässliche Quelle)**
- **TYP-KATEGORIE:** `GUIDE-` ✅ **Leitfäden/Anleitungen** 
- **SUBJECT:** `ARCHITECTURE-OVERVIEW-AI` ✅ **Spezifisch identifiziert**
- **DATUM:** `2025-10-16` ✅ **Gültig und aktuell**

### **KI-Interpretation:** 
- **Thema:** Architecture Overview for KI (Master-Navigation für System-Architektur)
- **Status:** VALIDATED (verlässliche Quelle für Development-Sessions)
- **Quelle:** 01-core/VALIDATED (Core Architecture Documentation)
- **Priorität:** Sehr hoch (Architektur-kritisch, verlässliche Navigation)

---

## 🎯 **MANDATORY SESSION-START PROTOCOL (KI-Template-Vorgaben)**

**ZWINGEND VOR ARCHITECTURE-DEVELOPMENT:**
- [ ] 📋 [../../06-handbook/TEMPLATE/VALIDATED_TEMPLATE-SESSION-START_2025-10-26.md](../../06-handbook/TEMPLATE/) öffnen und ausfüllen
- [ ] 📝 [../../06-handbook/TEMPLATE/VALIDATED_TEMPLATE-LESSONS-LEARNED_2025-10-26.md](../../06-handbook/TEMPLATE/) bereithalten
- [ ] 🔍 [../../../.github/prompts/KI-SESSION-BRIEFING.prompt.md](../../../.github/prompts/KI-SESSION-BRIEFING.prompt.md) befolgen
- [ ] 📋 [../../ROOT_VALIDATED_REGISTRY-DOCS-SITEMAP-NAVIGATION_2025-10-20.md](../../ROOT_VALIDATED_REGISTRY-DOCS-SITEMAP-NAVIGATION_2025-10-20.md) für Navigation konsultieren

**⚠️ OHNE TEMPLATE-NUTZUNG = SESSION INVALID**

---

---

## 🎯 **System-Übersicht (Current State)**

**RawaLite v1.0.49** ist eine Electron-Desktop-App für Rechnungs- und Angebotsverwaltung mit **modularer Architektur**.

### **Tech Stack (Verified):**
- **Frontend:** React 18.3.1 + TypeScript 5.5.4 + Vite 5.4.0
- **Backend:** Electron 31.2.0 Main Process + better-sqlite3 12.4.1
- **Database:** SQLite mit Field-Mapping System + Theme/Navigation Services
- **Build:** electron-builder + NSIS Installer
- **Package Manager:** pnpm

---

## 📁 **Code-Navigation (Aktuelle Struktur)**

### **🔌 Electron Layer:**
```
electron/
├── main.ts                    # 92 Zeilen (refactored v1.0.49)
├── preload.ts                 # IPC Security Bridge
├── windows/                   # Window Management (4 modules)
│   ├── main-window.ts
│   ├── update-window.ts
│   └── updateManager*.ts
└── ipc/                       # IPC Handlers (13 modules)
    ├── database.ts            # Core DB Operations [CRITICAL FIX-012]
    ├── backup.ts              # Hot Backup System
    ├── pdf-core.ts            # PDF Generation [CRITICAL FIX-007]
    ├── pdf-templates.ts       # PDF Template Management
    ├── numbering.ts           # Auto-Numbering für Angebote/Rechnungen
    ├── status.ts              # Entity Status Updates
    ├── paths.ts               # Pfad-Management
    ├── filesystem.ts          # File Operations
    ├── files.ts               # Upload/Download
    ├── themes.ts              # Theme System (Migration 027)
    ├── navigation.ts          # Navigation System (Migration 028)
    ├── updates.ts             # Update System Extended
    └── update-manager.ts      # Update System Legacy
```

### **🗄️ Database Layer:**
```
src/main/db/
├── Database.ts                # better-sqlite3 Singleton
├── MigrationService.ts        # Schema Migrations (029 applied)
├── BackupService.ts           # Hot Backup with Integrity Checks
└── migrations/                # 029 Migration Files
    ├── 014_*.ts              # Sub-Item Hierarchy (IMPLEMENTED)
    ├── 021_*.ts              # Package Price Unification (IMPLEMENTED)
    ├── 023_*.ts              # Sub-Item Extended (IMPLEMENTED)
    ├── 024_*.ts              # Field Mapping Extended (IMPLEMENTED)
    ├── 025_*.ts              # Price Display Mode (IMPLEMENTED)
    ├── 026_*.ts              # Package Price Display (IMPLEMENTED)
    ├── 027_*.ts              # Theme System (IMPLEMENTED)
    ├── 028_*.ts              # Navigation System (IMPLEMENTED)
    └── 029_*.ts              # Focus Mode System (IMPLEMENTED)
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
│   ├── PackageEditPage.tsx    # Package Edit Route (Implemented v1.0.49)
│   ├── TimesheetsPage.tsx     # Time Tracking + Search/Filter ✅
│   └── EinstellungenPage.tsx  # Settings + Updates
├── components/                # Reusable UI Components
│   ├── Table.tsx              # Generic Data Table
│   ├── StatusControl.tsx      # Status Dropdown [CRITICAL FIX-012]
│   ├── SearchAndFilter/       # Universal Search/Filter System (v1.0.49)
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
├── services/                  # Business Services (18 modules)
│   ├── DbClient.ts            # IPC Database Client
│   ├── PDFService.ts          # PDF Generation [CRITICAL FIX-007]
│   ├── VersionService.ts      # Update Management
│   ├── DatabaseThemeService.ts    # Theme Database Integration
│   ├── DatabaseNavigationService.ts # Navigation Database Integration
│   ├── ThemeFallbackManager.ts    # Theme Fallback Logic
│   ├── AutoUpdateService.ts       # Enhanced Update Logic
│   ├── BackupClient.ts            # Backup Client Service
│   ├── TimesheetService.ts        # Timesheet Business Logic
│   ├── NummernkreisService.ts     # Numbering Circle Service
│   ├── CryptoService.ts           # Cryptographic Operations
│   ├── ExportService.ts           # Data Export Services
│   ├── LoggingService.ts          # Application Logging
│   ├── DebugLogger.ts             # Debug Logging Service
│   └── AutoUpdateSecurityMonitor.ts # Security Monitoring
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

### **Registrierte IPC Channels (13 Module):**
- `db:*` - Database Operations (query, exec, transaction)
- `backup:*` - Hot Backup System (hot, vacuumInto, restore)
- `pdf:*` - PDF Generation (generate, preview, templates)
- `numbering:*` - Auto-Numbering (getNext, update)
- `status:*` - Entity Status (update, validate)
- `paths:*` - Path Resolution (get, userData, documents)
- `files:*` - File Operations (upload, download, delete)
- `themes:*` - Theme System (get, set, fallback)
- `navigation:*` - Navigation System (state, preferences)
- `updates:*` - Enhanced Update System (check, download, install)

---

## 🗄️ **Database Schema (Current)**

### **Business Entities (8 Tables + System Tables):**
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

-- System (Extended)
settings (25+ fields)        # Company + Preferences + Theme/Navigation
numbering_circles (6 fields) # Auto-Numbering
migrations (4 fields)        # Schema Version Control (Migration 029)
themes (8 fields)            # Theme System Configuration
navigation_state (6 fields)  # Navigation Preferences
focus_mode (4 fields)        # Focus Mode Settings
```

### **Field-Mapping System (CRITICAL):**
```typescript
// Bidirectional Mapping: 130+ Field Mappings
'companyName' ↔ 'company_name'
'createdAt' ↔ 'created_at'  
'priceDisplayMode' ↔ 'price_display_mode'  // v1.0.49
'discountAmount' ↔ 'discount_amount'      // Discount System
'themeMode' ↔ 'theme_mode'                // Migration 027
'navigationLayout' ↔ 'navigation_layout'  // Migration 028
'focusMode' ↔ 'focus_mode'                // Migration 029

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
- **Current Version:** Migration 029 applied (Focus Mode System)
- **Key Migrations:** 014 (Sub-Items), 021 (Price Unification), 023/024 (Field Extensions), 027 (Theme System), 028 (Navigation System), 029 (Focus Mode)
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
- ✅ **Universal Search/Filter** - All 5 main pages with unified UX (v1.0.49)
- ✅ **Database Theme System** - Dynamic theming with database persistence (Migration 027)
- ✅ **Navigation System** - Advanced navigation state management (Migration 028)
- ✅ **Focus Mode** - Enhanced user experience modes (Migration 029)

### **Package Management Architecture (v1.0.49):**
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

// Theme Integration (Migration 027)
interface ThemeAwarePackage {
  package: Package;
  themeSettings: ThemeConfiguration;
  navigationState: NavigationState;
}
```

### **Search/Filter System Architecture (v1.0.49):**
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

// Theme/Navigation Integration (Migrations 027+028)
interface SearchContext {
  themeMode: 'light' | 'dark' | 'auto';
  navigationLayout: 'header' | 'sidebar' | 'full-sidebar';
  focusMode: boolean; // Migration 029
}
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

# Theme System (Migration 027)
grep -r "DatabaseThemeService\|ThemeFallbackManager" src/services/

# Navigation System (Migration 028)
grep -r "DatabaseNavigationService\|navigation" src/services/

# Focus Mode (Migration 029)
grep -r "focus.mode\|focusMode" src/
```

### **Critical Paths:**
- **Database Layer:** `src/main/db/` + `electron/ipc/database.ts`
- **Business Logic:** `src/hooks/` + `src/adapters/`
- **UI Components:** `src/pages/` + `src/components/`
- **Field Mapping:** `src/lib/field-mapper.ts` (CRITICAL)
- **Theme System:** `src/services/DatabaseThemeService.ts` + `electron/ipc/themes.ts` (Migration 027)
- **Navigation:** `src/services/DatabaseNavigationService.ts` + `electron/ipc/navigation.ts` (Migration 028)
- **Services:** `src/services/` (18 business services)

### **Common Patterns:**
```typescript
// Hook Pattern
const { customers, loading, error, createCustomer } = useCustomers();

// Adapter Pattern  
const adapter = usePersistence(); // SQLiteAdapter instance
const result = await adapter.listCustomers();

// IPC Pattern
const data = await window.rawalite.db.query(sql, params);

// Search/Filter Pattern (v1.0.49)
const { filteredData, searchTerm, setSearchTerm, filters, setFilter } = 
  useTableSearch(rawData, searchFieldMapping);

// Theme System Pattern (Migration 027)
const themeService = new DatabaseThemeService();
const currentTheme = await themeService.getCurrentTheme();

// Navigation Pattern (Migration 028)
const navService = new DatabaseNavigationService();
const navState = await navService.getNavigationState();
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

## 📋 **ARCHITEKTUR-SITEMAP (v1.0.49)**

### **🎯 Kern-Architektur Dokumente:**
- **PROJECT_OVERVIEW.md** - Haupt-Projektdokumentation (Root Level)
- **docs/01-core/ARCHITECTURE-OVERVIEW-AI-2025-10-16.md** - Diese KI-Navigation (AKTUELL)
- **docs/01-core/final/VALIDATED_GUIDE-CORE-SYSTEM-ARCHITECTURE_2025-10-18.md** - System Architecture
- **docs/03-data/final/VALIDATED_REPORT-DATABASE-ARCHITECTURE-CURRENT-STATE-2025-10-17.md** - Database Schema

### **🎨 Frontend-Architektur:**
- **docs/ROOT_VALIDATED_MASTER-DATABASE-THEME-SYSTEM-COMPLETE_2025-10-20.md** - Theme System Master
- **src/services/** - 18 Business Services (DatabaseThemeService, DatabaseNavigationService, etc.)
- **src/components/SearchAndFilter/** - Universal Search/Filter System

### **🗄️ Database-Architektur:**
- **src/main/db/migrations/** - 029 Migrations (Theme, Navigation, Focus Mode)
- **electron/ipc/** - 13 IPC Handler Modules
- **src/lib/field-mapper.ts** - camelCase ↔ snake_case Mapping (CRITICAL)

### **📊 Aktuelle System-Metriken:**
- **Version:** v1.0.49 (Migration 040 - Navigation Preferences Constraint Fix)
- **Services:** 18 Business Services
- **IPC Channels:** 13 Handler Modules  
- **Database Tables:** 19 Business + 3 System Tables
- **Migrations:** 029 applied (Theme + Navigation + Focus Mode)
- **Field Mappings:** 130+ bidirectional mappings

### **🛡️ Critical Protection:**
- **CRITICAL FIX-007:** PDF System (Production Ready)
- **CRITICAL FIX-012:** SQLite Parameters (NULL handling)
- **Migration Integrity:** 027 (Theme) + 028 (Navigation) + 029 (Focus Mode)

---

*Letzte Validierung: 20. Oktober 2025 | Repository-Sync: 100% | Migration 029 applied | Nächste Review: November 2025*