# 🛠️ MIGRATION PLAN: Navigation Grid & CSS-Entkopplung (DEPRECATED)
CAVE:  **🤖 KI-AUTO-DETECTION SYSTEM NEEDED. KI HAS TO READ HANDBOOK FIRST**
> **Erstellt:** 24.10.2025 | **Letzte Aktualisierung:** 25.10.2025 (DEPRECATED - Überkomplexer Ansatz für einfaches Problem)  
> **Status:** 🗑️ DEPRECATED - Ersetzt durch einfachen Database Schema Fix  
> **Schema:** `DEPRECATED_PLAN-NAV-GRID-REFACTOR_2025-10-24.md`  
> **🛡️ ROOT-PROTECTED:** Dieses Dokument NIEMALS aus /docs Root verschieben!

> **⚠️ DEPRECATION NOTICE:** Komplexe Grid-Refactoring war Overengineering für einfaches Database Schema Problem  
> **🎯 REPLACEMENT:** [ROOT_VALIDATED_PLAN-FOOTER-VISIBILITY-FIX_2025-10-25.md](ROOT_VALIDATED_PLAN-FOOTER-VISIBILITY-FIX_2025-10-25.md)  
> **📋 REASON:** Footer-Visibility Problem löst sich mit Migration 044 (Database CHECK constraints cleanup)

> **⚠️ SAFE MIGRATION PROMPT - Navigation Grid & CSS-Entkopplung (v3)**  
> **🎯 Gesamtziel:** Footer-Fix + Grid-Entkopplung + KI-sichere Mode-Namen (🎉 **62% Legacy Cleanup COMPLETED**)  
> **🚨 Zwingende Vorgabe:** Bestehende Strukturen wiederverwenden, nicht neu bauen

> **✅ LEGACY ISOLATION ACHIEVEMENT:**  
> **Original:** 69 Legacy Violations → **Aktuell:** 26 Violations (-43 = 62% Reduktion)  
> **Strategy Success:** Legacy darf nicht "mitlaufen" - erfolgreich auf Kompatibilitäts-/Migrationsrand isoliert

---

## 📋 **ARCHITEKTUR-SCAN ERGEBNISSE + LEGACY CLEANUP STATUS**

### **🎉 LEGACY ISOLATION ERFOLG (62% Reduktion)**

#### **✅ COMPLETED: Systematischer Legacy Cleanup (Option A)**
```bash
# Legacy Guard Script Results:
Original Violations: 69 (19 files)
Current Violations:  26 (8 files) 
Reduction:          -43 violations (62% improvement)

# Status by Category:
✅ Core UI Components: NavigationContext, NavigationModeSelector, ThemeSelector (CLEAN)
✅ Service Layer: DatabaseThemeService (VOLLSTÄNDIG CLEAN)
✅ Migration Files: 028-042 zu allowedFiles whitelisted (ERWARTUNGSGEMÄSS)
🔄 Service Layer Rest: DatabaseNavigationService lookup tables (4 violations)
🔄 IPC Layer: NavigationIpcService.ts + electron/ipc (13 violations)
� CSS Classes: header-statistics, header-navigation in className (9 violations)
```

#### **📊 Verbleibende 26 Violations (8 Files)**
```typescript
// CSS Classes (9 violations) - STABLE, können bleiben für CSS-Kompatibilität
src/App.tsx:                        3 violations (CSS className)
src/components/HeaderNavigation.tsx: 4 violations (CSS className)
src/components/HeaderStatistics.tsx: 1 violation (CSS className)
src/components/footer/FooterStatus.tsx: 1 violation (CSS className)

// Service Layer Rest (4 violations) - Lookup tables für DB-Kompatibilität
src/services/DatabaseConfigurationService.ts: 1 violation
src/services/DatabaseFooterService.ts:        3 violations
src/services/DatabaseNavigationService.ts:    1 violation (NAVIGATION_MODES array)

// IPC Layer (13 violations) - Legacy Type definitions und IPC bridges
src/services/ipc/NavigationIpcService.ts: 31→0 violations (COMPLETED)
electron/ipc/configuration.ts:        6 violations
electron/ipc/navigation.ts:          12 violations
electron/ipc/themes.ts:               5 violations
```

### **�🔍 Aktuelle Code-Architektur (Post-Legacy-Cleanup)**

#### **Navigation Modi (aktuell - PARTIALLY MIGRATED)**
```typescript
// ✅ CLEAN: navigation-safe.ts Implementation erfolgreich
// Primary Types: src/types/navigation-safe.ts
export type KiSafeNavigationMode = 'mode-dashboard-view' | 'mode-data-panel' | 'mode-compact-focus';
export type NavigationMode = KiSafeNavigationMode;  // Primary alias
export const NAVIGATION_MODES_SAFE: readonly KiSafeNavigationMode[] = [
  'mode-dashboard-view', 'mode-data-panel', 'mode-compact-focus'
] as const;

// ✅ LEGACY ISOLATION: Legacy nur in Kompatibilitäts-/Migrationsrand
// Legacy exists ONLY in: 
// - src/types/navigation-safe.ts (conversion functions)
// - src/services/DatabaseNavigationService.ts (DB compatibility lookup tables)
// - src/main/db/migrations/028-042 (allowlisted für DB-Kompatibilität)

// 🔄 REMAINING WORK: Vollständige CSS className Migration
// ❌ CSS Classes noch Legacy: 'header-statistics', 'header-navigation', 'full-sidebar'
// ✅ Logic/Types bereits KI-safe: 'mode-dashboard-view', 'mode-data-panel', 'mode-compact-focus'
```

#### **Grid-Template-Areas (aktuell - READY FOR 4-ROW EXTENSION)**
```typescript
// ✅ DatabaseNavigationService.ts - SYSTEM_DEFAULTS (Saubere KI-safe Implementation)
// Current: Korrekte 3-Row Grid Structure (FIX-010 geschützt)
GRID_TEMPLATE_AREAS: {
  'mode-dashboard-view': '"sidebar header" "sidebar focus-bar" "sidebar main"',
  'mode-data-panel': '"sidebar header" "sidebar focus-bar" "sidebar main"',
  'mode-compact-focus': '"sidebar header" "sidebar focus-bar" "sidebar main"'
}

// ✅ LEGACY ISOLATION SUCCESS: CSS className mapping funktioniert
// CSS: [data-navigation-mode="mode-dashboard-view"] → .header-statistics styles
// CSS: [data-navigation-mode="mode-data-panel"] → .header-navigation styles  
// CSS: [data-navigation-mode="mode-compact-focus"] → .full-sidebar styles

// 🎯 NEXT TARGET: 4-Row Extension für dedizierte Footer Area
// GEPLANT: '"sidebar header" "sidebar focus-bar" "sidebar main" "sidebar footer"'
// STATUS: Grid Extension ready, Footer-Fix pending
```

#### **CSS Grid Import-Struktur**
```css
/* src/index.css - Hierarchical Import Order */
@import url('./styles/fallback-grid.css');    /* 1. Emergency Fallback */
@import url('./styles/layout-grid.css');      /* 2. Database-First Layout */

/* Gefunden: 1 primärer Import von layout-grid.css */
/* Status: Zentrale CSS-Datei definiert alle Grid-Templates */
```

#### **Datenbank-Schema (Migration Status)**
```sql
-- Migration 028: user_navigation_preferences (Basis-Navigation)
-- Migration 034: user_navigation_mode_settings (Per-Mode Settings)
-- Migration 035: user_focus_mode_preferences (Focus Mode)
-- Migration 041: user_footer_content_preferences (Footer Preferences)

-- AKTUELLER ZUSTAND: 4 Navigation-Tabellen aktiv
-- PROBLEM: Footer-Preferences ohne Grid-Integration
```

#### **IPC Handler (Navigation)**
```typescript
// electron/ipc/navigation.ts - 19 total handlers
- navigation:get-user-preferences
- navigation:set-user-preferences
- navigation:set-navigation-mode
- navigation:get-layout-config
- navigation:getFooterContentPreferences (Footer: 4 handlers)
- navigation:setFooterContentPreferences
- navigation:getAllFooterContentPreferences  
- navigation:initializeDefaultFooterPreferences

// Status: Footer IPC vorhanden, aber ohne Grid-Integration
```

---

## 🎯 **ZIEL-ARCHITEKTUR**

### **🔧 Neue KI-sichere Mode-Namen**
```typescript
// GEPLANTE UMBENENNUNG (KI-sicher, keine Layout-Begriffe)
export type NavigationMode = 'mode-dashboard-view' | 'mode-data-panel' | 'mode-compact-focus';

// Mapping-Tabelle (alt → neu):
'header-statistics' → 'mode-dashboard-view'  // Dashboard mit Statistics im Header
'header-navigation' → 'mode-data-panel'     // Data Panel mit Navigation im Header  
'full-sidebar'      → 'mode-compact-focus'  // Compact Focus mit Full Sidebar
```

### **🏗️ Neue 4-Row Grid-Struktur**
```css
/* ZIEL: 4-Row CSS Grid Layout */
.app-grid {
  display: grid;
  grid-template-columns: 240px 1fr;
  grid-template-rows: auto auto 1fr auto;
  grid-template-areas:
    "container container"  /* Row 1: Container (Full Width) */
    "logo      header"     /* Row 2: Logo links, Header rechts */
    "sidebar   main"       /* Row 3: Sidebar links, Main rechts */
    ".         footer";    /* Row 4: Footer NUR rechte Spalte */
}

/* Component Grid Assignment */
.container { grid-area: container; }
.logo      { grid-area: logo; }
.header    { grid-area: header; }
.sidebar   { grid-area: sidebar; }
.main      { grid-area: main; }
.footer    { grid-area: footer; }   /* ✅ KORREKTUR: Footer getrennt von focus-bar */
```

### **📁 Neue Mode-spezifische CSS-Dateien**
```
src/styles/modes/
├── grid-mode-dashboard-view.css    (was: header-statistics)
├── grid-mode-data-panel.css        (was: header-navigation)
├── grid-mode-compact-focus.css     (was: full-sidebar)
└── README.md                       (Grid-Regeln Dokumentation)
```

---

## 🔄 **MIGRATION-MAPPING**

### **Mode-Namen Konvertierung**
| **Alt (Layout-basiert)** | **Neu (KI-sicher)** | **Funktion** |
|:--|:--|:--|
| `header-statistics` | `mode-dashboard-view` | Dashboard-Ansicht mit Statistics im Header |
| `header-navigation` | `mode-data-panel` | Data-Panel mit Navigation im Header |
| `full-sidebar` | `mode-compact-focus` | Compact-Focus mit voller Sidebar |

### **Grid-Template-Areas Änderung**
| **Modi** | **Alt (3-Row)** | **Neu (4-Row)** |
|:--|:--|:--|
| Alle | `"sidebar header" "sidebar focus-bar" "sidebar main"` | `"container container" "logo header" "sidebar main" ". footer"` |

### **CSS-Datei Zuordnung**
| **Mode** | **CSS-Datei** | **Grid-Spezifika** |
|:--|:--|:--|
| `mode-dashboard-view` | `grid-mode-dashboard-view.css` | Logo + Statistics Header + Compact Sidebar |
| `mode-data-panel` | `grid-mode-data-panel.css` | Logo + Navigation Header + Statistics Sidebar |
| `mode-compact-focus` | `grid-mode-compact-focus.css` | Logo + Minimal Header + Full Sidebar |

---

## 📊 **ABHÄNGIGKEITEN & RISIKO-ANALYSE**

### **🔗 Datei-Abhängigkeiten**
```
DatabaseNavigationService.ts
├── SYSTEM_DEFAULTS.GRID_TEMPLATE_AREAS (ÄNDERUNG ERFORDERLICH)
├── NAVIGATION_MODES array (ÄNDERUNG ERFORDERLICH)
└── Mode-spezifische Methoden (ÜBERPRÜFUNG ERFORDERLICH)

NavigationContext.tsx
├── CSS Variable Setting (--db-{mode}-grid-template-*) 
└── Dynamic Mode Loading (ANPASSUNG ERFORDERLICH)

App.tsx
├── data-navigation-mode attribute (KOMPATIBEL)
└── renderSidebar/renderHeader (ÜBERPRÜFUNG ERFORDERLICH)

Database Migrations
├── Migration 028-041 (BESTEHEND - KOMPATIBEL)
└── NEUE Migration für Mode-Namen (ERFORDERLICH)
```

### **⚠️ Risiken**
| **Risiko** | **Wahrscheinlichkeit** | **Impact** | **Mitigation** |
|:--|:--|:--|:--|
| **DB-Mode-Inkonsistenz** | Hoch | Breaking | Rollback-Migration + Feature Flag |
| **CSS Grid Conflicts** | Mittel | Layout | Fallback-CSS beibehalten |
| **IPC Handler Breaking** | Niedrig | Funktion | Backward-Compatibility in IPC |
| **Component Rendering** | Mittel | UI | Stufenweise Migration |

### **🛡️ Rollback-Strategie**
```typescript
// Feature Flag Implementation
const USE_NEW_GRID_SYSTEM = false; // Default: false für Safe Rollback

// Mode-Mapping für Rollback
const MODE_MAPPING = {
  'mode-dashboard-view': 'header-statistics',
  'mode-data-panel': 'header-navigation', 
  'mode-compact-focus': 'full-sidebar'
};

// CSS Loader mit Fallback
function loadModeCSS(mode: string) {
  if (USE_NEW_GRID_SYSTEM) {
    return `styles/modes/grid-${mode}.css`;
  } else {
    return 'styles/layout-grid.css'; // Fallback zu aktueller Implementierung
  }
}
```

---

## � **PHASE 1: REMAINING LEGACY CLEANUP (26 Violations)**

> **PRIORITY:** Complete Legacy Isolation vor Grid Extension
> **STATUS:** VORBEREITET - Guard Script + navigation-safe.ts operational
> **DEADLINE:** Vor Grid 4-Row Extension

### **1.1. Service Layer Rest (4 Violations) - READY FOR CLEANUP**
```bash
# 🎯 TARGET FILES (navigation-safe.ts imports ready):
src/main/services/DatabaseNavigationService.ts (2x violations)
src/renderer/src/services/NavigationIpcService.ts (2x violations)

# ✅ SOLUTION PATTERN (bereits etabliert):
import { NavigationMode, NAVIGATION_MODES_SAFE } from '../types/navigation-safe.ts';
- Legacy type dependencies ersetzen
- navigation-safe.ts wrapper functions verwenden
```

### **1.2. IPC Layer (13 Violations) - SYSTEMATIC APPROACH**
```bash
# 🎯 TARGET FILES (standardisiertes IPC pattern):
electron/ipc/navigation.ts (8x violations)
electron/preload.ts (3x violations)  
src/renderer/src/main.tsx (2x violations)

# ✅ SOLUTION PATTERN:
- IPC channel definitions: navigation-safe.ts types
- Type conversion at IPC boundaries nur
- Preload script: type-safe wrappers
```

### **1.3. CSS Classes (9 Violations) - CSS REFACTOR INTEGRATION**
```bash
# 🎯 TARGET FILES (CSS modernization):
src/renderer/src/components/ui/layout/Sidebar.tsx (5x violations)
src/renderer/src/components/ui/layout/Header.tsx (4x violations)

# ✅ SOLUTION STRATEGY:
- CSS className mapping → data-attributes  
- Legacy class names → [data-navigation-mode] selectors
- CSS consolidation für Grid Extension vorbereiten
```

### **1.4. Migration Files (ALLOWLISTED - NO ACTION)**
```bash
# ✅ PERMANENT ALLOWLIST (028-042 migrations):
- scripts/GUARD_LEGACY_MODES.cjs allowedFiles configured
- Migration schema compatibility protected
- No cleanup required - Legacy types needed for DB schema
```

---

## 🚀 **PHASE 2: GRID EXTENSION VORBEREITUNG**

> **NACH:** Legacy Cleanup (26→0 violations)
> **ZIEL:** 4-Row Grid Structure Implementation
> **STATUS:** BEREIT - CSS und Database Integration

### **2.1. CSS Grid Template Modernization**
```bash
# 🎯 CURRENT: 3-Row Grid (sidebar-header-focus-main)
# 🎯 TARGET: 4-Row Grid (container-logo-header-sidebar-main-footer)

# FILES TO UPDATE:
src/main/services/DatabaseNavigationService.ts → SYSTEM_DEFAULTS.GRID_TEMPLATE_AREAS
src/styles/layout-grid.css → grid-template-rows + areas
src/renderer/src/contexts/NavigationContext.tsx → CSS variable application
```

### **2.2. Component Integration für Footer**
```bash
# 🎯 CURRENT: Footer IPC ohne Grid Integration  
# 🎯 TARGET: Footer als eigenständige Grid Area

# FILES TO UPDATE:
src/renderer/src/App.tsx → Footer Component Integration
electron/ipc/navigation.ts → Footer Grid Positioning
src/components/ui/layout/Footer.tsx → Grid-native Footer Component
```

### **2.3. Mode-specific CSS Files**
```bash
# 🎯 NEW FILE STRUCTURE:
src/styles/modes/
├── grid-mode-dashboard-view.css (was: header-statistics)
├── grid-mode-data-panel.css (was: header-navigation)  
├── grid-mode-compact-focus.css (was: full-sidebar)
└── README.md (Grid Rules Documentation)
```

## 📋 **AUSSTEHENDE ARBEITEN - ZUSAMMENFASSUNG**

### **🎯 PHASE 1: Legacy Cleanup (26 Violations) - NÄCHSTE PRIORITÄT**

**Service Layer Rest (4 Violations):**
- `src/main/services/DatabaseNavigationService.ts` (2x) → NavigationMode from navigation-safe.ts
- `src/renderer/src/services/NavigationIpcService.ts` (2x) → NAVIGATION_MODES_SAFE import

**IPC Layer (13 Violations):**
- `electron/ipc/navigation.ts` (8x) → Type definitions upgrade
- `electron/preload.ts` (3x) → Type-safe wrappers  
- `src/renderer/src/main.tsx` (2x) → navigation-safe.ts imports

**CSS Classes (9 Violations):**
- `src/renderer/src/components/ui/layout/Sidebar.tsx` (5x) → data-attributes
- `src/renderer/src/components/ui/layout/Header.tsx` (4x) → [data-navigation-mode] selectors

### **🚀 PHASE 2: Grid Extension (NACH Legacy Cleanup)**

**CSS Grid Template Modernization:**
- DatabaseNavigationService.ts → 4-Row GRID_TEMPLATE_AREAS update
- layout-grid.css → grid-template-rows extension
- NavigationContext.tsx → CSS variable application

**Footer Integration:**
- App.tsx → Footer Component Grid Integration  
- Footer.tsx → Grid-native Footer Component creation
- navigation.ts IPC → Footer Grid Positioning

**Mode-specific CSS Files:**
- Create `src/styles/modes/` directory structure
- Individual CSS files for each navigation mode
- Grid rules documentation

### **✅ COMPLETED - LEGACY ISOLATION SUCCESS**
- ✅ navigation-safe.ts implementation (KI-safe types)
- ✅ Core UI Components cleanup (NavigationContext, NavigationModeSelector, ThemeSelector)
- ✅ DatabaseThemeService type safety
- ✅ Legacy Guard Script (GUARD_LEGACY_MODES.cjs)
- ✅ Migration Files allowlist (028-042)
- ✅ 69→26 violations (-43 = 62% reduction)

---

## 🔧 **NÄCHSTE SCHRITTE (Empfehlung)**

### **1. Legacy Cleanup abschließen (26→0 violations)**
```bash
# Service Layer (4 Violations):
pnpm guard:legacy-modes  # Current violations anzeigen
# Manual cleanup: navigation-safe.ts imports in Services

# IPC Layer (13 Violations):  
# Manual cleanup: Type definitions in IPC handlers

# CSS Classes (9 Violations):
# Manual cleanup: className → data-attribute migration
```

### **2. Grid Extension starten (NACH Legacy Cleanup)**
```bash
# Grid Template Areas update:
# DatabaseNavigationService.ts → 4-Row grid structure

# Footer Component creation:
# App.tsx Footer integration

# Mode-specific CSS:
# src/styles/modes/ directory creation
```

### **3. Testing & Validation**
```bash
pnpm guard:legacy-modes     # Should show 0 violations
pnpm typecheck             # TypeScript compilation clean
pnpm test                  # Component integration tests
```

---
- [ ] Redundante Grid-Regeln aus `layout-grid.css` entfernen
- [ ] Theme- und Focus-System intakt lassen  
- [ ] SQLite ↔ Dexie Adapter-Parität prüfen
- [ ] **STOP & Freigabe**

### **🔹 Phase 8 - Tests & Guards**
- [ ] Tests für alle 3 neuen Mode-Slugs
- [ ] CI-Guards (`pnpm validate:critical-fixes`, `pnpm typecheck`, `pnpm lint`)
- [ ] Screenshot-/DOM-Vergleich: Footer nur rechte Spalte
- [ ] **STOP & Freigabe**

### **🔹 Phase 9 - Rollback-Implementation**
- [ ] Feature-Flag `NAV_GRID_V2=false` → alte Struktur
- [ ] Mode-Slugs in DB rücksetzbar per Mapping
- [ ] Keine destruktiven Migrationen
- [ ] **FINAL TESTING & DEPLOYMENT**

---

## ✅ **AKZEPTANZKRITERIEN**

| **Kategorie** | **Erwartung** | **Validation** |
|:--|:--|:--|
| **Layout** | Footer unter rechter Spalte, Logo als Row 1 | DOM-Struktur Check |
| **CSS** | Eine Mode-Datei pro Navigation-Slug | File-System Check |
| **DB-Bindung** | Alle Grid-Parameter aus DB | Service Integration Test |
| **Namen** | KI-sichere Slugs, keine Layout-Begriffe | TypeScript Interface Check |
| **Kompatibilität** | Bestehende Services/IPC wiederverwendet | Regression Tests |
| **Tests/Guards** | Alle Checks grün | CI Pipeline Check |
| **Rollback** | Möglich über Flag + Mapping-Tabelle | Rollback Test |

---

## 🚀 **NÄCHSTE SCHRITTE**

**PHASE 0 ABGESCHLOSSEN ✅**

**READY FOR PHASE 1:** Read-Only Analyse  
- Alle `grid-template-*` Vorkommen auflisten
- Alle `layout-grid.css` Dependencies erfassen  
- DB-Layout-Parameter komplett dokumentieren
- IPC-Handler Vollständigkeits-Check

**APPROVAL REQUIRED:** Phase 1 Freigabe vor Fortsetzung

---

**📍 Location:** `/docs/ROOT_MIGRATION-PLAN-NAV-GRID-REFACTOR_2025-10-24.md`  
**Purpose:** Vollständiger Migrations-Plan für Navigation Grid Refactoring  
**Status:** PHASE 0 Complete - Ready for Phase 1 Approval  
**Protection:** ROOT_ prefix prevents accidental reorganization during migration