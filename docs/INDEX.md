# RawaLite Documentation Index

**Version:** 1.0.42.5+  
**Letzte Aktualisierung:** 15. Oktober 2025

## 📚 Dokumentationsstruktur (16-Ordner System)

**Standard 4-Folder Organization:** Alle Dokumentationsordner enthalten `final/`, `wip/`, `plan/`, `sessions/`
**VALIDATED System:** Dokumente mit `VALIDATED_` Präfix haben bestätigten Status
**Schema:** `[STATUS-PRÄFIX]_[TYP]-[SUBJECT]-[SPECIFIER]_YYYY-MM-DD.md`

### **🏷️ Naming Convention Vollständig:**
- **STATUS-PRÄFIXE:** `VALIDATED_`, `SOLVED_`, `LESSON_`, `WIP_`, `COMPLETED_`, `PLAN_`, `DEPRECATED_`
- **TYP-KATEGORIEN:** `GUIDE-`, `FIX-`, `IMPL-`, `REPORT-`, `REGISTRY-`, `TEMPLATE-`, `TRACKING-`, `PLAN-`
- **Beispiel:** `VALIDATED_REGISTRY-DOCUMENTATION-CENTRAL-PATHS_2025-10-16.md`

### 00-meta/ - Meta-Dokumentation ✅ **ROOT_ MIGRATION COMPLETED (17.10.2025)**
- **Critical Registry:** [ROOT_VALIDATED_REGISTRY-CRITICAL-FIXES_2025-10-17.md](ROOT_VALIDATED_REGISTRY-CRITICAL-FIXES_2025-10-17.md) - ✅ **[15 AKTIVE FIXES]** Registry aller kritischen Fixes
- **KI Instructions:** [ROOT_VALIDATED_GUIDE-KI-INSTRUCTIONS_2025-10-17.md](ROOT_VALIDATED_GUIDE-KI-INSTRUCTIONS_2025-10-17.md) - ✅ **[VALIDATED SYSTEM]** KI-Instructions mit ROOT_ Anti-Move Protection  
- **KI Failure Modes:** [ROOT_VALIDATED_GUIDE-KI-FAILURE-MODES_2025-10-17.md](ROOT_VALIDATED_GUIDE-KI-FAILURE-MODES_2025-10-17.md) - **[MANDATORY READ]** Session-Killer-Fehler verhindern
- **PATHS.md System:** [VALIDATED_REGISTRY-DOCUMENTATION-CENTRAL-PATHS_2025-10-16.md](VALIDATED_REGISTRY-DOCUMENTATION-CENTRAL-PATHS_2025-10-16.md) - ✅ **[104+ PATH CONSTANTS]** Zentrale Pfad-Verwaltung für alle Dokumentationen

### 01-core/ - Standards & Core Architecture ✅ **UPDATED (16.10.2025)**
- **Coding Standards:** [PATHS.md](PATHS.md#CODING_STANDARDS) - TypeScript, React, Database Standards
- **Quick Reference:** [PATHS.md](PATHS.md#QUICK_REFERENCE) - 1-Page KI-Referenz  
- **Workflows:** [PATHS.md](PATHS.md#WORKFLOWS) - Git, Release, Emergency Procedures

### 02-dev/ - Development & Implementation ✅ **UPDATED (16.10.2025)**
- **Development Guide:** [PATHS.md](PATHS.md#DEVELOPMENT_GUIDE) - Complete development setup
- **Debugging Standards:** [PATHS.md](PATHS.md#DEBUGGING_GUIDE) - Systematic troubleshooting
- **ABI Safe Tools:** [PATHS.md](PATHS.md#ABI_SAFE_TOOLS) - Safe database testing

### 03-data/ - Database & Data Management ✅ **UPDATED (16.10.2025)**
- **SQLite Database System:** [PATHS.md](PATHS.md#SQLITE_DATABASE_SYSTEM) - SQLite implementation
- **Migration Architecture:** [PATHS.md](PATHS.md#SQLITE_MIGRATION_ARCHITECTURE) - Migration system
- **Field Mapping:** [PATHS.md](PATHS.md#FIELD_MAPPER_MISMATCHES) - Mapping consistency

### 04-ui/ - User Interface & Components ✅ **UPDATED (16.10.2025)**
- **Beautiful Pastel Themes:** [PATHS.md](PATHS.md#BEAUTIFUL_PASTEL_THEMES) - Theme system
- **UI Patterns:** [PATHS.md](PATHS.md#UI_PATTERNS_TABLE_FORMS) - Table-like forms design
- **PDF Registry:** [PATHS.md](PATHS.md#PDF_REGISTRY) - Complete PDF index

### 05-deploy/ - Deployment & Updates ✅ **UPDATED (16.10.2025)**
- **Deployment Updates:** [PATHS.md](PATHS.md#DEPLOYMENT_UPDATES) - Deployment processes
- **Update System Architecture:** [PATHS.md](PATHS.md#UPDATE_SYSTEM_ARCHITECTURE) - Update architecture
- **GitHub API Migration:** [PATHS.md](PATHS.md#GITHUB_API_MIGRATION) - API integration

### 06-lessons/ - Lessons Learned & Sessions ✅ **UPDATED (16.10.2025)**
- **Fix Preservation:** [PATHS.md](PATHS.md#SYSTEMATIC_FIX_PRESERVATION) - Critical fix preservation
- **Session Archive:** [PATHS.md](PATHS.md#SESSION_CURRENCY_FORMATTING) - Recent session summaries
- **Historical Context:** [PATHS.md](PATHS.md#BUILD_INSTALLATION_MATRIX) - Archived content

### 02-architecture/ - System Architecture
- **[final/ELECTRON-BUILDER-FILE-LOCKING-VSCODE.md](02-architecture/final/ELECTRON-BUILDER-FILE-LOCKING-VSCODE.md)** - ✅ **[SOLVED]** VS Code File-Locking Problem

### 03-development/ - Development Workflows
- **[wip/VALIDATED-2025-10-15_DEV-ALL-PARALLEL-EXECUTION-ISSUE.md](03-development/wip/VALIDATED-2025-10-15_DEV-ALL-PARALLEL-EXECUTION-ISSUE.md)** - ✅ **[VALIDATED]** Dev Execution Analysis

### 04-testing/ - Testing Strategies
- Test documentation and debugging procedures

### 05-database/ - Database Design
- **[final/MIGRATION-013-DISCOUNT-SYSTEM.md](05-database/final/MIGRATION-013-DISCOUNT-SYSTEM.md)** - ✅ **[CRITICAL FIX-006]** Discount System Schema

### 06-paths/ - Path Management
- Path utilities and file system access patterns

### 07-ipc/ - IPC Communication
- Inter-process communication patterns and security

### 08-ui/ - User Interface & Components
- **[final/SUB-ITEM-VISUAL-HIERARCHY-FIX-2025-10-04.md](08-ui/final/SUB-ITEM-VISUAL-HIERARCHY-FIX-2025-10-04.md)** - ✅ **[CRITICAL FIX-005]** Sub-Item System Solution

### 09-pdf/ - PDF Generation
- **[final/THEME-SYSTEM-FIXES.md](09-pdf/final/THEME-SYSTEM-FIXES.md)** - ✅ **[CRITICAL FIX-007]** PDF Theme System

### 10-security/ - Security Concepts
- Security guidelines and authentication patterns

### 11-deployment/ - Deployment & Updates
- **[final/UPDATE_DEVELOPMENT.md](11-deployment/final/UPDATE_DEVELOPMENT.md)** - Update system implementation

### 12-lessons/ - Lessons Learned ✅ **DEPRECATED STRUCTURE**
- **[final/VALIDATED-2025-10-15_BUILD-INSTALLATION-MATRIX.md](12-lessons/deprecated/VALIDATED-2025-10-15_BUILD-INSTALLATION-MATRIX.md)** - ✅ **[VALIDATED]** Archived analysis

### 13-deprecated/ - Deprecated Content
- Legacy documentation and obsolete implementations

### 14-implementations/ - Implementation Details
- **[plan/FIXPLAN-main-ts-field-mapping-standards.md](14-implementations/plan/FIXPLAN-main-ts-field-mapping-standards.md)** - Field mapping standards

### 15-session-summary/ - Session Summaries
- **[sessions/SESSION-2025-10-14-*.md](15-session-summary/sessions/)** - Recent session documentation

## 🆕 Neue Features (Oktober 2025)

### ✅ **PATHS.md SYSTEM (16.10.2025):**
- **Revolutionäres zentrale Pfad-Management** für alle Dokumentations-Cross-References
- **104+ Pfad-Konstanten** für alle Dokumentationsdateien und Unterordner
- **Import-like Syntax** wie TypeScript: `[PATHS.md](PATHS.md#CONSTANT)`
- **Single Source of Truth** - Pfad-Änderungen nur in PATHS.md erforderlich
- **Vollständige Migration** aller 7 Dokumentations-Ordner abgeschlossen

### ✅ **VALIDATED- PRÄFIX SYSTEM (15.10.2025):**
- **KI-freundliches Status-Validierungssystem** etabliert
- Format: `VALIDATED_[TYP]-[SUBJECT]-[SPECIFIER]_YYYY-MM-DD.md`
- **5 Dokumente bereits validiert** und korrekt kategorisiert
- **Zuverlässige Status-Erkennung** für zukünftige KI-Sessions

### ✅ **DOKUMENTATIONS-STRUKTUR STANDARDISIERT (15.10.2025):**
- **16-Ordner System durchgesetzt** (00-meta bis 15-session-summary)
- **Standard 4-Folder Pattern** in allen Ordnern: final/, wip/, plan/, sessions/
- **Cross-Reference Cleanup** auf neue Struktur angepasst
- **INDEX.md Aktualisierung** auf korrekte Link-Struktur

### ✅ **CRITICAL FIXES ERWEITERT:**
- **FIX-013:** Vite Asset Import Pattern for Production Logo Loading (v1.0.23)
- **FIX-012:** SQLite Parameter Binding Null Conversion (v1.0.14)
- **13 aktive kritische Fixes** vollständig dokumentiert und geschützt

## 🎯 **KI-Navigation Quick Start**

### **🚨 Für JEDE KI-Session:**
1. ✅ **PFLICHT:** [PATHS.md](PATHS.md#CRITICAL_FIXES) - Critical Fixes Registry
2. ✅ **PFLICHT:** [PATHS.md](PATHS.md#KI_INSTRUCTIONS) - KI Instructions  
3. ✅ **PFLICHT:** [.github/instructions/copilot-instructions.md](../.github/instructions/copilot-instructions.md)
4. ✅ **NEW:** [PATHS.md](PATHS.md) - Central path management für alle Cross-References

### **🔧 Für Development:**
- **Quick Reference:** [PATHS.md](PATHS.md#QUICK_REFERENCE)
- **Coding Standards:** [PATHS.md](PATHS.md#CODING_STANDARDS)
- **Development Guide:** [PATHS.md](PATHS.md#DEVELOPMENT_GUIDE)
- **Critical Patterns:** Immer `pnpm validate:critical-fixes` vor Änderungen

### **🔄 VALIDATED System verwenden:**
- ✅ **VALIDATED- Prefix = Bestätigter Status**
- ❌ **Kein VALIDATED- Prefix = Manuelle Review erforderlich**
- 🔄 **Nutze VALIDATED- System für alle Dokumenten-Reorganisationen**

## 📊 **Dokumentations-Status**

| Bereich | Status | VALIDATED Docs | Letzte Aktualisierung |
|---------|--------|----------------|---------------------|
| **PATHS.md System** | ✅ VOLLSTÄNDIG | 104+ Constants | **16.10.2025** |
| **Meta-Documentation** | ✅ VOLLSTÄNDIG | 2/16 | **16.10.2025** |
| **Standards System** | ✅ VOLLSTÄNDIG | 0/6 | **16.10.2025** |  
| **Critical Fixes** | ✅ VOLLSTÄNDIG | 13 Fixes | **16.10.2025** |
| **7-Folder Migration** | ✅ VOLLSTÄNDIG | 7/7 Ordner | **16.10.2025** |
| **Cross-References** | ✅ PATHS.md MIGRATION | Zentral verwaltet | **16.10.2025** |

## ⚠️ **Wichtige Hinweise**

- **VALIDATED- System:** Neue Dokumente nach Developer-Review mit VALIDATED-2025-10-15_ Präfix kennzeichnen
- **4-Folder Struktur:** ALLE Inhalte in final/, wip/, plan/, sessions/ organisiert
- **Critical Fixes:** 13 aktive Fixes müssen vor jeder Code-Änderung geprüft werden
- **Cross-References:** Links auf neue Struktur angepasst, aber kontinuierliche Wartung erforderlich

---

**🚀 Latest Update:** RawaLite Documentation jetzt mit **revolutionärem PATHS.md System** (104+ Pfad-Konstanten) für zentrale Cross-Reference-Verwaltung und **vollständig standardisierte 7-Ordner-Struktur** mit Import-like Syntax für optimale KI-Navigation.

## 📚 Dokumentationsstruktur

### 00-meta/ - Meta-Dokumentation ✅ **REORGANISIERT (12.10.2025)**
**Neue thematische Struktur für enterprise-level KI-Navigation:**
- **[critical-fixes/](00-meta/critical-fixes/)** - Fix Preservation System
  - `CRITICAL-FIXES-REGISTRY.md` - **[AKTUALISIERT]** Registry aller kritischen Fixes (FIX-006, FIX-007)
  - `TROUBLESHOOTING.md` - Problem-Solving Guide
- **[workflows/](00-meta/workflows/)** - Release & Hotfix Processes
- **[project-management/](00-meta/project-management/)** - Status & Planning
- **[documentation/](00-meta/documentation/)** - Standards & Quality Guidelines
  - `VALIDATED-2025-10-15_DOCUMENTATION-STRUCTURE-GUIDE.md` - Anleitung zur Dokumentationsorganisation
  - `SCHEMA-CONSISTENCY-STANDARDS.md` - Database Standards
- **[reorganization/](00-meta/reorganization/)** - Change History & Structure Documentation
- **[templates/](00-meta/templates/)** - Standard Templates & Onboarding
- **[ki-instructions/](00-meta/ki-instructions/)** - KI Development Guidelines (vorbereitet)

### 02-architecture/ - System Architecture
- `TIMESHEETS-ARCHITECTURE.md` - **[NEU]** Vollständige Architektur-Dokumentation der TimesheetsPage

### 05-database/ - Datenbank-Design
- `MIGRATION-013-DISCOUNT-SYSTEM.md` - **[NEU]** Vollständige Dokumentation Migration 013 mit Rollback-Strategien

### 08-ui/ - User Interface & Components
- `SUB-ITEM-VISUAL-HIERARCHY-FIX-2025-10-04.md` - **[GELÖST]** Vollständige Sub-Item Visual Hierarchy Lösung
- `SUB-ITEM-IMPLEMENTATION-PLAN.md` - **[ABGESCHLOSSEN]** Implementierungsplan erfolgreich umgesetzt
- `UI-PATTERNS-table-forms.md` - **[NEU]** Table-like Forms Pattern für konsistente UI

### 09-pdf/ - PDF-Generation
- `THEME-SYSTEM-FIXES.md` - **[NEU]** Lösung der Theme-Color-Probleme für alle 6 Themes

### 15-session-summary/ - Session Summaries & Retrospectives
- Dokumentation von Chat-Sessions und wichtigen Erkenntnissen
- Thematische Lessons Learned sind in entsprechende Fachbereiche verschoben

**Thematisch reorganisierte Inhalte:**
- **Database Lessons** → `05-database/final/` (Discount System, Migrations, Schema)
- **UI Lessons** → `08-ui/final/` (Sub-Items, Timesheets, Status Dropdowns)  
- **PDF Lessons** → `09-pdf/final/` (Attachments, Themes, Field Mapping)
- **Deployment Lessons** → `11-deployment/final/` (Updates, Releases, NSIS)

## 🆕 Neue Inhalte (Oktober 2025)

### ✅ **WORKSPACE REORGANISATION (12.10.2025):**
1. **Meta-Ordner Reorganisation** - Thematische enterprise-level Struktur in `/docs/00-meta/`
2. **Tests-Ordner Reorganisation** - KI-friendly thematische Kategorisierung in `/tests/`
3. **Root-Verzeichnis Cleanup** - Scripts und Configs nach RawaLite-Strukturlogik organisiert
4. **Temp-Ordner Cleanup** - Obsolete Dateien entfernt, wertvollen Code archiviert

### ✅ TimesheetsPage VOLLSTÄNDIG ÜBERARBEITET (05.10.2025):
1. **Database Layer Fixes** - Korrekte SQL-Tabellennamen und Field-Mappings
2. **Activities Tab Restoration** - Wiederherstellung der originalen UX-Struktur in Einstellungen
3. **Zwei-Ebenen UI-System** - Leistungsnachweis erstellen vs. Positionen verwalten
4. **Table-like Forms Pattern** - Konsistente, grid-basierte Formular-Layouts
5. **Vollständige CRUD-Funktionalität** - Create, Read, Update, Delete mit proper state management

### ✅ Sub-Item System VOLLSTÄNDIG GELÖST:
1. **React.Fragment-Gruppierung** - Parent-Items mit gruppierten Sub-Items (24px Einrückung)
2. **SQLiteAdapter ID-Mapping Fix** - Vollständige Persistierung von Parent-Child-Beziehungen
3. **Visuelle Hierarchie** - Blaue Border-Left, bläulicher Hintergrund für Sub-Items
4. **User-Bestätigt** - "JAAAAAAAAAAAAAAAAAAAA perfekt!!!!!!!!!!!!!!!"

### Rabattsystem-Implementierung:
1. **Vollständige Systemdokumentation** - Technische Details von Datenbank bis UI
2. **Migration 013 Dokumentation** - Schema-Änderungen und Rollback-Strategien  
3. **Theme-System Korrekturen** - PDF-Farbdarstellung für alle 6 Themes
4. **Lessons Learned** - Erkenntnisse für zukünftige Entwicklung

### Kritische Fixes erweitert:
- **FIX-006:** Discount System Database Schema
- **FIX-007:** PDF Theme System Parameter-Based

## 🔗 Quick Navigation

### Für Entwickler:
- **✅ Sub-Item System GELÖST** → `08-ui/final/SUB-ITEM-VISUAL-HIERARCHY-FIX-2025-10-04.md`
- **Neue Features implementieren** → `05-database/final/LESSONS-LEARNED-DISCOUNT-PROJECT.md`
- **Datenbank-Änderungen** → `05-database/final/MIGRATION-013-DISCOUNT-SYSTEM.md`
- **PDF-Probleme** → `09-pdf/final/THEME-SYSTEM-FIXES.md`
- **Kritische Fixes** → [PATHS.md](PATHS.md#CRITICAL_FIXES)
- **🆕 Meta-Structure** → `00-meta/INDEX.md` - Thematische Navigation

### Für Projektmanagement:
- **Sub-Item Implementation** → `08-ui/final/SUB-ITEM-IMPLEMENTATION-PLAN.md`
- **Feature-Übersicht** → `05-database/final/DISCOUNT-SYSTEM-IMPLEMENTATION.md`
- **Projekt-Erkenntnisse** → `05-database/final/LESSONS-LEARNED-DISCOUNT-PROJECT.md`
- **System-Status** → [PATHS.md](PATHS.md#CRITICAL_FIXES)
- **🆕 Reorganisation History** → `00-meta/reorganization/` - Workspace Changes

### Für Support:
- **UI-Probleme** → `08-ui/final/SUB-ITEM-IMPLEMENTATION-PLAN.md`
- **Rabattsystem-Troubleshooting** → `05-database/final/DISCOUNT-SYSTEM-IMPLEMENTATION.md`
- **Theme-Probleme** → `09-pdf/final/THEME-SYSTEM-FIXES.md`
- **Datenbank-Recovery** → `05-database/final/MIGRATION-013-DISCOUNT-SYSTEM.md`

## ✅ Dokumentations-Status

| Bereich | Status | Letzte Aktualisierung |
|---------|--------|---------------------|
| **Workspace Organization** | ✅ **VOLLSTÄNDIG REORGANISIERT** | **12.10.2025** |
| Meta-Dokumentation | ✅ Thematisch strukturiert | 12.10.2025 |
| Sub-Item System | ✅ VOLLSTÄNDIG GELÖST | 04.10.2025 |
| Rabattsystem | ✅ Vollständig | 03.10.2025 |
| Theme-System | ✅ Vollständig | 03.10.2025 |
| Migration 013 | ✅ Vollständig | 03.10.2025 |
| Critical Fixes | ✅ Aktualisiert | 03.10.2025 |
| Lessons Learned | ✅ Vollständig | 04.10.2025 |

---

**Hinweis:** Diese Dokumentation wurde um die **vollständige Workspace-Reorganisation** (12.10.2025) erweitert, die enterprise-level thematische Struktur in Meta-Dokumentation, Tests und Root-Verzeichnis implementiert. Das Sub-Item Visual Hierarchy Problem ist **VOLLSTÄNDIG GELÖST** mit React.Fragment-Gruppierung + SQLiteAdapter ID-Mapping-Fix. Alle Inhalte sind produktionsbereit und vollständig getestet.

**🚀 Latest:** RawaLite hat jetzt **vollständig enterprise-level workspace organisation** für optimale KI-Navigation und Developer Experience.