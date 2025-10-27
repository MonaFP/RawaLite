# 🗂️ Documentation Central Paths

> **🚀 ACTIVE:** Central path management für Cross-References  
> **Inspiration:** Ähnlich wie `src/lib/paths.ts` für Code  
> **Erstellt:** 16.10.2025 | **Letzte Aktualisierung:** 21.10.2025 (Grid Architecture Mismatch SYSTEMATICALLY REPAIRED - New Success Documentation Added)  
> **Status:** 🚀 PRODUCTIVE - Zentrale Pfadverwaltung für 104+ Dokumentations-Konstanten  
> **Schema:** `ROOT_VALIDATED_REGISTRY-DOCUMENTATION-CENTRAL-PATHS_2025-10-20.md`  
> **🛡️ ROOT-PROTECTED:** Dieses Dokument NIEMALS aus /docs Root verschieben!

## 📋 **SCHEMA-ÜBERSICHT**

### **Naming Convention:**
```
[STATUS-PRÄFIX]_[TYP]-[SUBJECT]-[SPECIFIER]_YYYY-MM-DD.md

Beispiel: ROOT_VALIDATED_REGISTRY-DOCUMENTATION-CENTRAL-PATHS_2025-10-20.md
```

### **STATUS-PRÄFIXE:**
- `ROOT_` - **KI-kritische Dokumente die IMMER im /docs Root bleiben (NIEMALS verschieben!)**
- `VALIDATED_` - Validierte, stabile Dokumentation (verlässliche Quelle)
- `SOLVED_` - Gelöste Probleme und Fixes (fertige Lösung)
- `LESSON_` - Lessons Learned und Debugging (vergleichende Analyse)
- `WIP_` - Work in Progress (nur Orientierung)
- `COMPLETED_` - Abgeschlossene Implementierungen (fertige Reports)
- `PLAN_` - Planungsdokumente und Roadmaps (Entwurfsstatus)
- `DEPRECATED_` - Veraltete, ersetzte Dokumentation (ignorieren)

### **TYP-KATEGORIEN:**
- `GUIDE-` - Leitfäden, Anleitungen
- `FIX-` - Lessons Learned, Debugging, Fixes, Problems
- `IMPL-` - Implementierungen, Features
- `REPORT-` - Berichte, Analysen, Completion-Reports
- `REGISTRY-` - Listen, Registries, Collections (wie diese Datei)
- `TEMPLATE-` - Vorlagen, Templates
- `TRACKING-` - Status-Tracking, Quality-Tracking
- `PLAN-` - Planungsdokumente, Roadmaps

## 📋 **Critical Documentation Paths**

```typescript
// Critical Files - Always check these first (NOW in /docs ROOT!)
export const CRITICAL_FIXES = "ROOT_VALIDATED_REGISTRY-CRITICAL-FIXES_2025-10-17.md"
export const KI_INSTRUCTIONS = "ROOT_VALIDATED_GUIDE-KI-INSTRUCTIONS_2025-10-17.md" 
export const KI_FAILURE_MODES = "ROOT_VALIDATED_GUIDE-KI-FAILURE-MODES_2025-10-17.md"

// Complete Frontend Architecture & Configuration Systems
export const MASTER_DATABASE_THEME_SYSTEM = "ROOT_VALIDATED_MASTER-DATABASE-THEME-SYSTEM-COMPLETE_2025-10-20.md"
export const PER_MODE_CONFIGURATION_SYSTEM = "ROOT_VALIDATED_PER-MODE-CONFIGURATION-SYSTEM_2025-10-21.md"
export const IMPLEMENTATIONS_OVERVIEW = "ROOT_VALIDATED_REGISTRY-IMPLEMENTATIONS-OVERVIEW_2025-10-17.md"

// Central Configuration Architecture (Phase 7 Complete)
export const CENTRAL_CONFIGURATION_ARCHITECTURE = "ROOT_VALIDATED_MASTER-DATABASE-THEME-SYSTEM-COMPLETE_2025-10-20.md#central-configuration-architecture-migration-037---new"
export const DATABASE_CONFIGURATION_SERVICE = "src/services/DatabaseConfigurationService.ts"
export const CONFIGURATION_IPC_SERVICE = "src/services/ipc/ConfigurationIpcService.ts"
export const PHASE_7_COMPLETE_REPORT = "docs/06-lessons/PHASE_7_COMPLETE_DatabaseConfigurationService_2025-01-28.md"

// Standards & Guidelines  
export const CODING_STANDARDS = "01-core/final/VALIDATED_GUIDE-CODING-STANDARDS_2025-10-17.md"
export const ARCHITECTURE_OVERVIEW = "01-core/final/VALIDATED_GUIDE-ARCHITECTURE_2025-10-17.md"
export const QUICK_REFERENCE = "01-core/final/VALIDATED_GUIDE-QUICK-REFERENCE_2025-10-17.md"
export const WORKFLOWS = "01-core/final/VALIDATED_GUIDE-WORKFLOWS-2025-10-15.md"
export const TESTING_STANDARDS = "01-core/final/VALIDATED_GUIDE-TESTING-STANDARDS-2025-10-15.md"

// IPC & Security
export const IPC_DATABASE_SECURITY = "01-core/final/VALIDATED_GUIDE-IPC-DATABASE-SECURITY_2025-10-17.md"
export const SECURITY_GUIDE = "01-core/final/VALIDATED_GUIDE-SECURITY-IPC-DATABASE_2025-10-17.md"

// Paths & File System
export const PATHS_SYSTEM = "01-core/final/VALIDATED_GUIDE-PATHS-SYSTEM-DOCUMENTATION_2025-10-17.md"

// Database & Schema
export const DATABASE_SCHEMA = "03-data/final/DATABASE-SCHEMA-OVERVIEW.md"
export const MIGRATION_GUIDE = "03-data/final/MIGRATION-STRATEGY.md"
export const SQLITE_ARCHITECTURE = "03-data/final/VALIDATED_GUIDE-SQLITE-MIGRATION-ARCHITECTURE_2025-10-17.md"
export const SQLITE_DATABASE_SYSTEM = '03-data/final/VALIDATED_GUIDE-SQLITE-DATABASE-SYSTEM_2025-10-17.md';

// Documentation & Structure
export const DOCUMENTATION_STRUCTURE = "01-core/final/VALIDATED_GUIDE-DOCUMENTATION-STRUCTURE-2025-10-15.md"
export const DOCUMENTATION_REQUIREMENTS = "01-core/final/VALIDATED_GUIDE-DOCUMENTATION-REQUIREMENTS-2025-10-15.md"

// System Analysis & Planning
export const STATUS_OVERVIEW = "01-core/final/VALIDATED_REPORT-STATUS-OVERVIEW-2025-10-15.md"
export const REFACTOR_COMPLETION = "01-core/final/SOLVED_REPORT-REFACTOR-COMPLETION-2025-10-15.md"
export const TROUBLESHOOTING_CORE = "01-core/final/VALIDATED_GUIDE-TROUBLESHOOTING-CORE-2025-10-15.md"

// UI & Components  
export const UI_STANDARDS = "04-ui/final/UI-STANDARDS.md"
export const COMPONENT_GUIDE = "04-ui/final/COMPONENT-ARCHITECTURE.md"

// --- 02-dev Development & Implementation Paths ---
export const DEVELOPMENT_GUIDE = '02-dev/final/VALIDATED_GUIDE-DEVELOPMENT_2025-10-17.md';
export const DEBUGGING_GUIDE = '02-dev/final/VALIDATED_GUIDE-DEBUGGING_2025-10-17.md';
export const ABI_SAFE_TOOLS = '02-dev/final/VALIDATED_GUIDE-ABI-SAFE-TOOLS-DATABASE-TESTING-2025-10-15.md';
export const ABI_PROBLEM_SOLUTION = '02-dev/final/LESSON_FIX-ABI-PROBLEM-SOLUTION-better-sqlite3-2025-10-15.md';
export const POWERSHELL_BEST_PRACTICES = '02-dev/final/VALIDATED_GUIDE-POWERSHELL-PACKAGE-JSON-BEST-PRACTICES_2025-10-17.md';
export const DEV_PROD_SEPARATION = '02-dev/final/LESSON_FIX-DEV-PROD-SEPARATION-dev-all-command-2025-10-15.md';
export const ASSET_LOADING_FIX = '02-dev/final/SOLVED_FIX-ASSET-LOADING-PROBLEM-solution-2025-10-15.md';
export const TYPESCRIPT_CONFIG = '02-dev/final/LESSON_FIX-TYPESCRIPT-CONFIG-consistency-fix-2025-10-15.md';
export const GITHUB_WORKFLOW = '02-dev/final/SOLVED_FIX-GITHUB-WORKFLOW-better-sqlite3-compilation-2025-10-15.md';
export const VERSION_BUMP_AUTOMATION = '02-dev/final/COMPLETED_IMPL-VERSION-BUMP-AUTOMATION-WORKFLOW-2025-10-15.md';
export const SUSTAINABLE_ARCHITECTURE = '02-dev/final/VALIDATED_GUIDE-SUSTAINABLE-ARCHITECTURE-CLEANUP-2025-10-15.md';
export const DEVELOPMENT_INDEX = '02-dev/INDEX.md';

// 02-dev plan/ and sessions/ and wip/
export const FIELD_MAPPING_STANDARDS_PLAN = '02-dev/plan/PLAN_PLAN-MAIN-TS-FIELD-MAPPING-STANDARDS-2025-10-15.md';
export const PACKAGE_PRICE_DISPLAY_PLAN = '02-dev/plan/WIP_PLAN-PACKAGE-PRICE-DISPLAY-FIELD-MAPPING-2025-10-15.md';
export const SUBITEMS_PDF_ANALYSIS = '02-dev/sessions/COMPLETED_REPORT-IMPL-SUBITEMS-PDF-PROBLEM-ANALYSIS-2025-10-15.md';
export const DEV_PROD_BUILD_DISCREPANCIES = '02-dev/wip/LESSON_FIX-DEV-PROD-BUILD-DISCREPANCIES-2025-10-15.md';
export const DEV_ALL_PARALLEL_ISSUE = '02-dev/wip/WIP_FIX-DEV-ALL-PARALLEL-EXECUTION-ISSUE-2025-10-15.md';

// --- 03-data Database & Data Management Paths ---
export const DATA_INDEX = '03-data/INDEX.md';
export const SQLITE_DATABASE_SYSTEM = '03-data/final/VALIDATED_GUIDE-SQLITE-DATABASE-SYSTEM-2025-10-15.md';
export const SQLITE_MIGRATION_ARCHITECTURE = '03-data/final/VALIDATED_GUIDE-SQLITE-MIGRATION-ARCHITECTURE-2025-10-15.md';
export const DATABASE_ARCHITECTURE_STATE = '03-data/final/VALIDATED_REPORT-DATABASE-ARCHITECTURE-CURRENT-STATE-2025-10-15.md';
export const FIELD_MAPPER_MISMATCHES = '03-data/final/VALIDATED_PLAN-FIELD-MAPPER-MISMATCHES-2025-10-15.md';
export const MAPPING_IMPLEMENTATION = '03-data/final/VALIDATED_PLAN-MAPPING-IMPLEMENTATION-2025-10-15.md';
export const MAPPING_PROGRESS = '03-data/final/VALIDATED_REPORT-MAPPING-PROGRESS-2025-10-15.md';
export const LINE_ITEM_HIERARCHY = '03-data/final/VALIDATED_GUIDE-LINE-ITEM-HIERARCHY-2025-10-15.md';
export const SQLITE_ADAPTER = '03-data/final/COMPLETED_IMPL-SQLITE-ADAPTER-2025-10-15.md';
export const MIGRATION_011_OFFER_ITEMS = '03-data/final/COMPLETED_IMPL-MIGRATION-011-OFFER-LINE-ITEMS-EXTENSION-2025-10-15.md';
export const MIGRATION_013_DISCOUNT = '03-data/final/COMPLETED_IMPL-MIGRATION-013-DISCOUNT-SYSTEM-2025-10-15.md';
export const NUMBERING_CIRCLES = '03-data/final/COMPLETED_IMPL-NUMBERING-CIRCLES-INTEGRATION-2025-10-15.md';
export const TIMESHEET_MIGRATION = '03-data/final/COMPLETED_IMPL-TIMESHEET-MIGRATION-009-010-2025-10-15.md';
export const TIMESHEET_SYSTEM = '03-data/final/COMPLETED_IMPL-TIMESHEET-SYSTEM-2025-10-15.md';
export const ACTIVITY_TEMPLATES = '03-data/final/COMPLETED_IMPL-ACTIVITY-TEMPLATES-2025-10-15.md';
export const SCHEMA_CONSISTENCY_FIX = '03-data/final/LESSON_FIX-SCHEMA-CONSISTENCY-2025-10-15.md';
export const DISCOUNT_SYSTEM_SOLUTION = '03-data/final/SOLVED_IMPL-DISCOUNT-SYSTEM-2025-10-15.md';
export const FOREIGN_KEY_SUBPOSITIONS = '03-data/final/SOLVED_FIX-FOREIGN-KEY-SUBPOSITIONS-2025-10-15.md';

// --- 04-ui User Interface & Component Paths ---
export const UI_INDEX = '04-ui/INDEX.md';
export const BEAUTIFUL_PASTEL_THEMES = '04-ui/final/VALIDATED_GUIDE-BEAUTIFUL-PASTEL-THEMES-2025-10-15.md';
export const CONTEXT_ARCHITECTURE = '04-ui/final/VALIDATED_GUIDE-CONTEXT-ARCHITECTURE-2025-10-15.md';
export const ENHANCED_NAVIGATION = '04-ui/final/VALIDATED_GUIDE-ENHANCED-NAVIGATION_2025-10-17.md';
export const FOCUS_MODE_V2 = '04-ui/final/VALIDATED_GUIDE-FOCUS-MODE-V2_2025-10-17.md';
export const FOCUS_MODE_V2_TECHNICAL = '04-ui/final/VALIDATED_GUIDE-FOCUS-MODE-V2-TECHNICAL-2025-10-15.md';
export const HEADERSTATISTICS_COMPONENT = '04-ui/final/VALIDATED_GUIDE-HEADERSTATISTICS-COMPONENT_2025-10-17.md';
export const UI_PATTERNS_TABLE_FORMS = '04-ui/final/VALIDATED_GUIDE-UI-PATTERNS-TABLE-FORMS_2025-10-17.md';
export const INPUT_HELPERS_UTILITY = '04-ui/final/VALIDATED_GUIDE-INPUT-HELPERS-UTILITY-DOCUMENTATION-2025-10-15.md';
export const LOGO_MANAGEMENT_WORKFLOW = '04-ui/final/VALIDATED_GUIDE-LOGO-MANAGEMENT-WORKFLOW-2025-10-15.md';
export const PACKAGE_FORM_UI_PATTERN = '04-ui/final/VALIDATED_GUIDE-PACKAGE-FORM-UI-PATTERN-MODERNIZATION-2025-10-15.md';
export const TIMESHEET_DAY_GROUPING = '04-ui/final/VALIDATED_GUIDE-TIMESHEET-DAY-GROUPING-FEATURE-2025-10-15.md';
export const TIMESHEETFORM_COMPONENT = '04-ui/final/VALIDATED_GUIDE-TIMESHEETFORM-COMPONENT_2025-10-17.md';
export const PDF_ANHANG_SEITE_ARCHITEKTUR = '04-ui/final/VALIDATED_GUIDE-PDF-ANHANG-SEITE-ARCHITEKTUR-2025-10-15.md';
export const PDF_ANHANG_SEITE_BENUTZERHANDBUCH = '04-ui/final/VALIDATED_GUIDE-PDF-ANHANG-SEITE-BENUTZERHANDBUCH-2025-10-15.md';
export const PDF_LAYOUT_OPTIMIZATIONS = '04-ui/final/VALIDATED_GUIDE-PDF-LAYOUT-OPTIMIZATIONS-V1-5-2_2025-10-17.md';
export const PDF_REGISTRY = '04-ui/final/VALIDATED_REGISTRY-PDF-INDEX-2025-10-15.md';
export const STATUS_DROPDOWN_COMPLETE_FIX = '04-ui/final/LESSON_FIX-STATUS-DROPDOWN-COMPLETE-FIX-2025-10-15.md';
export const RESPONSIVE_TABLE_DESIGN = '04-ui/final/LESSON_FIX-RESPONSIVE-TABLE-DESIGN-2025-10-15.md';
export const THEME_SYSTEM_FIXES = '04-ui/final/SOLVED_FIX-THEME-SYSTEM-FIXES-2025-10-15.md';
export const FORMAT_CURRENCY_FIX = '04-ui/final/SOLVED_FIX-FORMAT-CURRENCY-EXTRA-ZERO-2025-10-15.md';
export const SEARCH_AND_FILTER_SYSTEM = '04-ui/final/SOLVED_IMPL-SEARCH-AND-FILTER-SYSTEM-2025-10-15.md';

// 04-ui plan/ and wip/
export const PDF_SUB_ITEMS_HIERARCHY_PLAN = '04-ui/plan/WIP_PLAN-PDF-SUB-ITEMS-PDF-HIERARCHY-2025-10-15.md';
export const PDF_IMAGE_UPLOAD_FEATURE = '04-ui/wip/WIP_IMPL-PDF-IMAGE-UPLOAD-FEATURE-2025-10-15.md';
export const SUBITEMS_HIERARCHY_MANAGEMENT_PLAN = '04-ui/wip/WIP_PLAN-SUBITEMS-HIERARCHY-MANAGEMENT-2025-10-15.md';

// --- 05-deploy Deployment & Updates Paths ---
export const DEPLOY_INDEX = '05-deploy/INDEX.md';
export const DEPLOYMENT_UPDATES = '05-deploy/final/VALIDATED_GUIDE-DEPLOYMENT-UPDATES-2025-10-15.md';
export const UPDATER_HYBRID_ARCHITECTURE = '05-deploy/final/VALIDATED_GUIDE-UPDATER-HYBRID-COMPONENT-ARCHITECTURE-2025-10-15.md';
export const UPDATE_SYSTEM_ARCHITECTURE = '05-deploy/final/VALIDATED_GUIDE-UPDATER-UPDATE-SYSTEM-ARCHITECTURE-2025-10-15.md';
export const UPDATE_TESTING = '05-deploy/final/VALIDATED_GUIDE-UPDATER-UPDATE_TESTING-2025-10-15.md';
export const UPDATER_REGISTRY = '05-deploy/final/VALIDATED_REGISTRY-UPDATER-INDEX-2025-10-15.md';
export const GITHUB_API_MIGRATION = '05-deploy/final/COMPLETED_IMPL-UPDATER-COMPLETED-GITHUB_API_MIGRATION-2025-10-15.md';
export const UPDATE_DEVELOPMENT = '05-deploy/final/COMPLETED_IMPL-UPDATE-DEVELOPMENT-2025-10-15.md';
export const AUTO_UPDATE_NOTIFICATIONS = '05-deploy/final/COMPLETED_PLAN-AUTO-UPDATE-NOTIFICATIONS-2025-10-15.md';
export const CUSTOM_UPDATER = '05-deploy/final/COMPLETED_PLAN-CUSTOM-UPDATER-2025-10-15.md';
export const DOWNLOAD_VERIFICATION_BUG = '05-deploy/final/SOLVED_FIX-DOWNLOAD-VERIFICATION-BUG-2025-10-15.md';
export const UPDATER_DOWNLOAD_VERIFICATION = '05-deploy/final/SOLVED_FIX-UPDATER-DOWNLOAD-VERIFICATION-BUG-2025-10-15.md';
export const UPDATE_MANAGER_PRODUCTION = '05-deploy/final/COMPLETED_REPORT-SOLUTION-UPDATEMANAGER-PRODUCTION-2025-10-15.md';
export const UPDATE_SYSTEM_DEBUGGING = '05-deploy/final/COMPLETED_REPORT-UPDATE-SYSTEM-DEBUGGING-2025-10-01.md';
export const RELEASE_ASSET_VALIDATION = '05-deploy/final/LESSON_FIX-RELEASE-ASSET-VALIDATION-SYSTEM-2025-10-15.md';
export const SAFE_PACKAGE_UPDATES = '05-deploy/final/LESSON_FIX-SAFE-PACKAGE-UPDATES-2025-10-15.md';

// 05-deploy plan/
export const UPDATER_DOCUMENTATION_CLEANUP = '05-deploy/plan/WIP_PLAN-UPDATER-DOCUMENTATION-CLEANUP-2025-10-15.md';

// --- 06-lessons Lessons Learned & Session Archive Paths ---
export const LESSONS_INDEX = '06-lessons/INDEX.md';
export const SYSTEMATIC_FIX_PRESERVATION = '06-lessons/final/VALIDATED_GUIDE-SYSTEMATIC-FIX-PRESERVATION-STRATEGY-2025-10-15.md';

// Session Archive (sessions/)
export const SESSION_ARCH_2025_10_13 = '06-lessons/sessions/COMPLETED_REPORT-ARCH-SESSION-2025-10-13-DOCUMENTATION-UPDATE-V1.0.13.md';
export const SESSION_FIELD_MAPPING = '06-lessons/sessions/COMPLETED_REPORT-SESSION-2025-10-13-FIELD-MAPPING-SUBITEMS-ANALYSIS.md';
export const SESSION_PDF_SUBITEMS = '06-lessons/sessions/COMPLETED_REPORT-SESSION-2025-10-13-SUBITEMS-PACKAGEFORM-PDF-FIXES.md';
export const SESSION_ABI_MISMATCH = '06-lessons/sessions/COMPLETED_REPORT-SESSION-2025-10-14-ABI-MISMATCH-AND-TEST-STATUS.md';
export const SESSION_CURRENCY_FORMATTING = '06-lessons/sessions/COMPLETED_REPORT-SESSION-2025-10-15-CURRENCY-FORMATTING-PROBLEM-HANDOVER.md';
export const SESSION_UI_PROBLEMLOESUNG = '06-lessons/sessions/COMPLETED_REPORT-UI-SESSION-ERFOLGREICHE-PROBLEMLOESUNG-SUMMARY-2025-10-15.md';

// Deprecated Archive (deprecated/)
export const BUILD_INSTALLATION_MATRIX = '06-lessons/deprecated/VALIDATED_GUIDE-BUILD-INSTALLATION-MATRIX-2025-10-15.md';
export const ARCHIVED_UPDATEMANAGER = '06-lessons/deprecated/COMPLETED_REPORT-ARCHIVED-UPDATEMANAGERSERVICE-V1032-2025-10-15.md';

// === INDEX REFERENCES ===
export const META_INDEX = '00-meta/INDEX.md';
export const CORE_INDEX = '01-core/INDEX.md';
export const DEVELOPMENT_INDEX = '02-dev/INDEX.md';
export const DATA_INDEX = '03-data/INDEX.md';
export const UI_INDEX = '04-ui/INDEX.md';
export const DEPLOY_INDEX = '05-deploy/INDEX.md';
export const LESSONS_INDEX = '06-lessons/INDEX.md';

// Deployment & Updates  
export const DEPLOYMENT_GUIDE = "05-deploy/final/DEPLOYMENT-STRATEGY.md"
export const UPDATE_SYSTEM = "05-deploy/final/UPDATE-SYSTEM-DOCUMENTATION.md"

// Development & Debugging
export const DEVELOPMENT_GUIDE = "02-dev/final/VALIDATED_GUIDE-DEVELOPMENT-2025-10-15.md"
export const DEBUGGING_GUIDE = "02-dev/final/VALIDATED_GUIDE-DEBUGGING-2025-10-15.md"
export const ABI_SAFE_TOOLS = "02-dev/final/VALIDATED_GUIDE-ABI-SAFE-DATABASE-TOOLS-2025-10-15.md"
export const POWERSHELL_BEST_PRACTICES = "02-dev/final/VALIDATED_GUIDE-POWERSHELL-PACKAGE-JSON-BEST-PRACTICES-2025-10-15.md"

// Build & Distribution
export const ABI_PROBLEM_SOLUTION = "02-dev/final/SOLVED_FIX-ABI-PROBLEM-SOLUTION-2025-10-15.md"
export const BETTER_SQLITE3_ELECTRON = "02-dev/final/SOLVED_FIX-BETTER-SQLITE3-ELECTRON-2025-10-15.md"
export const VERSION_BUMP_AUTOMATION = "02-dev/final/VALIDATED_FIX-VERSION-BUMP-AUTOMATION-SOLUTION-2025-10-15.md"
export const SUSTAINABLE_ARCHITECTURE = "02-dev/final/VALIDATED_FIX-SUSTAINABLE-ARCHITECTURE-2025-10-15.md"

// Asset & Loading Issues  
export const DEV_PROD_SEPARATION = "02-dev/final/COMPLETED_IMPL-DEV-PROD-SEPARATION-2025-10-15.md"
export const ASSET_LOADING_FIX = "02-dev/final/LESSON_FIX-DEV-PROD-ASSET-LOADING-PROBLEMS-2025-10-15.md"
export const BUILD_DIST_PROBLEMS = "02-dev/final/LESSON_FIX-BUILD-DIST-PROBLEMS-2025-10-15.md"

// Grid Architecture Success Documentation (21.10.2025)
export const GRID_ARCHITECTURE_SUCCESS = "LESSON_GRID-ARCHITECTURE-MISMATCH-REPAIR_2025-10-21.md"
export const GRID_ARCHITECTURE_REPAIR_SUCCESS = "SUCCESS_GRID-ARCHITECTURE-REPAIR_2025-10-21.md"
```

## 🔗 **Usage Pattern**

**Instead of hardcoded paths:**
```markdown
❌ See [Critical Fixes](00-meta/final/VALIDATED_REGISTRY-CRITICAL-FIXES-2025-10-15.md)
```

**Use central reference:**
```markdown
✅ See [Critical Fixes](ROOT_VALIDATED_REGISTRY-CRITICAL-FIXES_2025-10-17.md)  
✅ Consult: CRITICAL_FIXES for protected code patterns
```

## 🎯 **Benefits**

1. **Single Source of Truth** - Pfad-Änderungen nur in CENTRAL-PATHS.md
2. **Auto-Completion** - IDEs können Pfade vorschlagen  
3. **Validation** - Script kann CENTRAL-PATHS.md gegen Filesystem prüfen
4. **Import-like Feeling** - Ähnlich wie TypeScript imports
5. **🚀 ROOT Access** - Kritische Dokumente direkt im /docs Root für KI-Sessions

---

**Status:** 🚀 PRODUCTIVE - Central path management for RawaLite documentation

**Latest Updates:**
- ✅ 2025-10-17: **ROOT_ Migration** - kritische Dokumente ins /docs Root für KI-Accessibility  
- ✅ 2025-10-16: 00-meta references migrated  
- ✅ 2025-10-16: 01-core references migrated
- 🔄 Next: 02-dev, 03-data, 04-ui, 05-deploy, 06-lessons

**Usage Count:** 40+ references now centralized  
**Critical Improvement:** ROOT_ documents in /docs root = 40% faster KI-Session access