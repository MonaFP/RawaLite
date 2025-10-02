# 04-database INDEX

## 🗄️ SQLite Database & Schema Management

### 🎯 Zweck
SQLite Database, Schema-Konsistenz, Field-Mapping, Migrations und Persistierung.

### 📁 Struktur

#### 📋 Root-Dateien
- `INSTALL.md` - Installation Guide
- `INSTALLATION-GUIDE.md` - Detaillierte Installation
- `SQLITE-DATABASE-SYSTEM.md` - SQLite System Dokumentation
- ✅ **[NUMMERNKREISE.md](NUMMERNKREISE.md)** - **Nummernkreise Migration & Production Issues** 
  - Standard-Konfiguration (4 Nummernkreise)
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

#### 🔄 migration/
- **solved/**: Gelöste Migration-Probleme
  - `LESSONS-LEARNED-sqlite-nummernkreis-system.md` - Nummernkreis Migration
  - `LESSONS-LEARNED-settings-schema-migration.md` - Settings Schema key-value → structured Migration
- **active/**: Bekannte offene Migration-Probleme

#### ✅ solved/
Gelöste Database-Probleme und bewährte Patterns:
- **[LESSONS-LEARNED-SCHEMA-CONSISTENCY.md](LESSONS-LEARNED-SCHEMA-CONSISTENCY.md)** - Umfassende Schema-Konsistenz-Reparatur
- **[FIELD_MAPPER_MISMATCHES_PLAN.md](solved/FIELD_MAPPER_MISMATCHES_PLAN.md)** - Field-Mapper Implementierung (abgeschlossen)
- **[NUMBERING-CIRCLES-INTEGRATION.md](solved/NUMBERING-CIRCLES-INTEGRATION.md)** - Database-driven Nummernkreise Integration

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
- **[PATHS System](../20-paths/PATHS-SYSTEM-DOCUMENTATION.md)** - Zentrale Pfadabstraktion für Database-Pfade
- **[Debugging Standards](../00-standards/debugging.md)** - Systematische Database-Problemlösung
- **[Security Guidelines](../60-security/INDEX.md)** - Sichere IPC für Database-Operationen