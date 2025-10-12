# RawaLite Test Structure Index

**Version:** 1.0.42.2+  
**Letzte Aktualisierung:** 12. Oktober 2025

## 📚 Test-Organisationsstruktur

### KI-Friendly Test-Organisation
Diese Struktur folgt den **RawaLite Dokumentationsstandards** für optimale KI-Navigation und thematische Kategorisierung.

## 🗂️ **Test-Kategorien**

### **critical-fixes/** - Critical Fix Preservation
**Zweck:** Regression Tests für kritische Bugfixes  
**Inhalte:** Automatisierte Pattern-Detection für geschützte Code-Fixes  
- `CriticalPatterns.test.ts` - Pattern-Validation für FIX-001 bis FIX-007

### **database/** - Database Layer Tests
**Zweck:** SQLite, Migrations, Backup System Tests  
**Inhalte:** Vollständige Datenbank-Funktionalitäts-Tests  
- `BackupService.test.ts` - Hot Backup System Tests
- `DbClient.test.ts` - Database Client Connection Tests  
- `MigrationService.test.ts` - Schema Migration Tests
- `test-sqlite3.js` - Native SQLite3 Tests
- `test-sqlite-params.js` - Parameter Binding Tests
- `test-sqljs.js` - Legacy SQL.js Tests

### **services/** - Business Logic Services
**Zweck:** Service Layer und Business Logic Tests  
**Inhalte:** UpdateManager, GitHubApi, Numbering System Tests  
- `GitHubApiService.test.ts` - GitHub API Integration Tests
- `NummernkreisService.test.ts` - Automatic Numbering System Tests

### **update-system/** - Custom Update System
**Zweck:** Update-Manager, GitHub Releases, Asset Management  
**Inhalte:** End-to-End Update Workflow Tests  
- `test-asset-matching.mjs` - Release Asset Matching Logic
- `test-no-releases.mjs` - Edge Case: No Releases Available
- `test-redirect-follow.js` - HTTP Redirect Handling

### **debug/** - Debug & Development Tools
**Zweck:** Development-time Debugging und Troubleshooting Scripts  
**Inhalte:** Debug Scripts für komplexe Probleme  
- `debug-db-alt.mjs` - Alternative Database Connections
- `debug-db-backup.mjs` - Backup System Debugging
- `debug-db-better-sqlite3.cjs.backup` - better-sqlite3 Debug Backup
- `debug-db.js` - General Database Debugging
- `debug-db.mjs` - Modern Database Debugging
- `debug-status-dropdown.js` - UI Status Dropdown Issues
- `debug-v1041-exact.js` - Version 1.0.41 Specific Issues

### **performance/** - Performance & Optimization
**Zweck:** Performance Tests, Calculation Accuracy, Optimization  
**Inhalte:** Performance Regression Tests  
- `test-subtotal-fix.mjs` - Subtotal Calculation Performance & Accuracy

### **utilities/** - Test Utilities & Helpers
**Zweck:** Utility Scripts für Test-Setup und Schema-Validation  
**Inhalte:** Helper Functions und Schema Checkers  
- `check-schema.js` - Database Schema Validation Utility

### **unit/** - Unit Tests (Reserved)
**Zweck:** Isolated Unit Tests (noch nicht befüllt)  
**Status:** Bereit für zukünftige Unit Tests

### **integration/** - Integration Tests (Reserved)
**Zweck:** Cross-Service Integration Tests  
**Status:** Bereit für E2E Integration Tests

### **e2e/** - End-to-End Tests (Reserved)
**Zweck:** Full Application E2E Tests mit Playwright  
**Status:** Bereit für Browser-basierte E2E Tests

### **fixtures/** - Test Data & Fixtures
**Zweck:** Test-Daten, Mock-Objekte, Fixture Files  
**Status:** Bereit für Test-Daten

### **mocks/** - Mock Objects & Stubs
**Zweck:** Service Mocks, API Stubs, Test Doubles  
**Status:** Bereit für Mock-Implementierungen

## 📋 **Test Framework Setup**

**Haupt-Dokumentation:** `TEST-FRAMEWORK-SETUP.md`

### **Testing Stack:**
- **Unit Tests:** Vitest 2.1.9
- **E2E Tests:** Playwright 1.56.0
- **Critical Fix Validation:** Custom Pattern Detection
- **Performance Tests:** Custom Benchmarking

### **Test Commands:**
```bash
# Alle Tests
pnpm test

# Critical Fix Regression Tests
pnpm test:critical-fixes

# E2E Tests
pnpm e2e

# Development Debug Scripts
node tests/debug/debug-*.js
```

## 🔗 **Cross-References**

### **Zu Dokumentation:**
- **Critical Fixes Registry:** `docs/00-meta/CRITICAL-FIXES-REGISTRY.md`
- **Database Documentation:** `docs/05-database/`
- **Update System Architecture:** `docs/11-deployment/UPDATE-SYSTEM-ARCHITECTURE.md`
- **Testing Strategy:** `docs/04-testing/`

### **Zu Source Code:**
- **Database Layer:** `src/main/db/`
- **Services:** `src/main/services/`
- **Update System:** `electron/ipc/updates.ts`

## 🎯 **Test Development Guidelines**

### **Neue Tests hinzufügen:**
1. **Thematische Zuordnung** - Wähle passenden Ordner basierend auf Test-Zweck
2. **Naming Convention** - Verwende `ComponentName.test.ts` für Unit Tests
3. **Debug Scripts** - Präfix `debug-` für Entwicklungs-Scripts
4. **Utilities** - Präfix `test-` für Test-Utilities ohne Assertions

### **Critical Fix Tests:**
- **Immer hinzufügen** für neue kritische Fixes
- **Pattern-Detection** für Regression-Schutz
- **Registry Update** in `docs/00-meta/CRITICAL-FIXES-REGISTRY.md`

---

**Hinweis:** Diese Test-Struktur wurde am 12. Oktober 2025 reorganisiert um **KI-friendly Navigation** und **thematische Konsistenz** gemäß RawaLite Dokumentationsstandards zu gewährleisten.