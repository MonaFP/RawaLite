# 05-database INDEX

## 🗄️ SQLite Database & Schema Management

### 🎯 Zweck
SQLite Database, Schema-Konsistenz, Field-Mapping, Migrations und Persistierung.

### 📁 Struktur

#### 📋 Root-Dateien
- `INSTALL.md` - Installation Guide
- `INSTALLATION-GUIDE.md` - Detaillierte Installation
- `SQLITE-DATABASE-SYSTEM.md` - SQLite System Dokumentation
- ✅ **[NUMMERNKREISE.md](NUMMERNKREISE.md)** - **Nummernkreise Migration & Production Issues** 
  - Standard-Konfiguration (5 Nummernkreise inkl. Timesheets)
  - Migration History & Troubleshooting
  - IPC Integration Documentation
  - Production vs Development Database Issues
- ✅ `MAPPING_PROGRESS_REPORT.md` - **Field-Mapper Implementierung Status (100% komplett)**
- ✅ `SQLITE-ADAPTER-COMPLETION.md` - **SQLiteAdapter Vollständigkeits-Analyse (21/21 Methoden)**
- ✅ **[LESSONS-LEARNED-SCHEMA-CONSISTENCY.md](LESSONS-LEARNED-SCHEMA-CONSISTENCY.md)** - **Umfassende Schema-Konsistenz-Reparatur (13 Inkonsistenzen behoben)**
  - 4-Phasen-System: Field-Mapper → SQLiteAdapter → Services → Validation
  - Customer Creation Fehler vollständig gelöst
  - Systematische convertSQLQuery() Pattern Implementation
  - Live Database Validation mit Schema v4 erfolgreich
- **[LESSONS-LEARNED-API-PATH-COMPLIANCE.md](LESSONS-LEARNED-API-PATH-COMPLIANCE.md)** - Legacy API Cleanup & PATH System Compliance + Schema Integration
  - API Bereinigung: global.d.ts vs preload.ts Konsistenz
  - PATH Compliance: Renderer vs Main Process Isolation  
  - LoggingService PATHS Integration Wiederherstellung
  - IPC Pipeline Verifikation für PATHS System
  - **NEU:** Schema-Konsistenz & Numbering Circles Integration Dokumentation
- ✅ **[TIMESHEET-SYSTEM-IMPLEMENTATION.md](TIMESHEET-SYSTEM-IMPLEMENTATION.md)** - **Timesheet-System Vollständige Wiederherstellung (v1.0.13)**
  - Migration 009 + 010: Timesheets, Activities, Numbering Circles
  - SQLiteAdapter Timesheet CRUD Implementation
  - Frontend Components: TimesheetsPage + TimesheetForm
  - PDF Export Integration für Leistungsnachweise
- ✅ **[MIGRATION-011-offer-line-items-extension.md](MIGRATION-011-offer-line-items-extension.md)** - **Database Migration 011: Offer Line Items Extension (v1.0.13)**
  - Schema Extension: item_type + source_package_id columns
  - Dual Sub-Item System: standalone/individual_sub/package_import
  - ID Mapping System für Frontend↔Database Konsistenz
  - FOREIGN KEY Constraint Resolution
- ✅ **[LESSONS-LEARNED-migration-017-platform-default-fix.md](LESSONS-LEARNED-migration-017-platform-default-fix.md)** - **Migration 017 Platform DEFAULT Value Fix (v1.0.14)**
  - SQLite DEFAULT-Wert Constraint Problem gelöst
  - Update History System erfolgreich implementiert
  - Konstante vs komplexe DEFAULT-Werte in Migrations
  - Development Environment Recovery Workflow

#### 🔄 migration/
- **solved/**: Gelöste Migration-Probleme
  - `LESSONS-LEARNED-sqlite-nummernkreis-system.md` - Nummernkreis Migration
  - `LESSONS-LEARNED-settings-schema-migration.md` - Settings Schema key-value → structured Migration
  - **NEU:** `TIMESHEET-MIGRATION-009-010.md` - Timesheet Schema + Numbering Circle Migration
- **active/**: Bekannte offene Migration-Probleme

#### ✅ solved/
Gelöste Database-Probleme und bewährte Patterns:
- **[LESSONS-LEARNED-SCHEMA-CONSISTENCY.md](LESSONS-LEARNED-SCHEMA-CONSISTENCY.md)** - Umfassende Schema-Konsistenz-Reparatur
- **[FIELD_MAPPER_MISMATCHES_PLAN.md](solved/FIELD_MAPPER_MISMATCHES_PLAN.md)** - Field-Mapper Implementierung (abgeschlossen)
- **[NUMBERING-CIRCLES-INTEGRATION.md](solved/NUMBERING-CIRCLES-INTEGRATION.md)** - Database-driven Nummernkreise Integration
- **[TIMESHEET-CRUD-IMPLEMENTATION.md](solved/TIMESHEET-CRUD-IMPLEMENTATION.md)** - Vollständige Timesheet CRUD mit Field-Mapping
- ✅ **[LESSONS-LEARNED-offer-foreign-key-constraint-fix.md](solved/LESSONS-LEARNED-offer-foreign-key-constraint-fix.md)** - **FOREIGN KEY Constraint Fix für Offer Sub-Items**
  - Database Migration 011: Item Type System + ID Mapping
  - Frontend/Backend ID Mapping für Parent-Child Relationships  
  - Dual Sub-Item System: Individual vs Package Import
  - UI Cleanup: Parent-Child Hierarchy Display

#### ⚠️ active/
Bekannte offene Database-Probleme

### 🚀 KI-Hinweise
- **solved/** → Bewährte DB-Patterns
- **MAPPING_PROGRESS_REPORT.md** → Vollständiger Status der CamelCase↔Snake_Case Implementation
- **SQLITE-ADAPTER-COMPLETION.md** → Detaillierte Analyse der 100% Interface-Compliance
- **LESSONS-LEARNED-API-PATH-COMPLIANCE.md** → Legacy API Cleanup Dokumentation
- **active/** → Database-Risiken vermeiden
- Migration + Backup Systeme komplett implementiert
- **KRITISCH:** API Konsistenz zwischen global.d.ts und preload.ts ist Pflicht

### 🔗 Verwandte Dokumentation
- **[PATHS System](../06-paths/PATHS-SYSTEM-DOCUMENTATION.md)** - Zentrale Pfadabstraktion für Database-Pfade
- **[Debugging Standards](../03-development/debugging.md)** - Systematische Database-Problemlösung
- **[Security Guidelines](../10-security/INDEX.md)** - Sichere IPC für Database-Operationen