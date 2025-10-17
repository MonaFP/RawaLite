# SQLite Database System (Phase 4)

> **Erstellt:** 29.09.2025 | **Letzte Aktualisierung:** 17.10.2025 (Content modernization + ROOT_ integration)  
> **Status:** VALIDATED - Reviewed and updated  
> **Schema:** `VALIDATED_GUIDE-SQLITE-DATABASE-SYSTEM_2025-10-17.md`

> **⚠️ CRITICAL:** [../../ROOT_VALIDATED_REGISTRY-CRITICAL-FIXES_2025-10-17.md](../../ROOT_VALIDATED_REGISTRY-CRITICAL-FIXES_2025-10-17.md) - **MANDATORY READ vor Database work**  
> **🛡️ NEVER violate:** Siehe [../../ROOT_VALIDATED_GUIDE-KI-INSTRUCTIONS_2025-10-17.md](../../ROOT_VALIDATED_GUIDE-KI-INSTRUCTIONS_2025-10-17.md) - Essential database patterns  
> **📚 ALWAYS:** `pnpm validate:critical-fixes` vor Database-Änderungen  

**Status**: ✅ Implementiert und getestet  
**Version**: 1.0.0  

## Übersicht

RawaLite nutzt seit Phase 4 ein vollständig implementiertes SQLite-Database-System mit better-sqlite3 als Native-Module für maximale Performance und Zuverlässigkeit.

## Architektur

### Core Components

```
src/main/db/
├── Database.ts          # Singleton DB-Connection mit PRAGMAs
├── MigrationService.ts  # Schema-Versionierung & Migrations
├── BackupService.ts     # Hot-Backup, VACUUM INTO, Restore
└── migrations/
    ├── index.ts         # Migration Registry
    └── 000_init.ts      # Initial Schema
```

### Database Connection (Database.ts)

```typescript
export function getDb(): Database.Database
export function getUserVersion(): number
export function setUserVersion(version: number): void
export function tx<T>(fn: (db: Database.Database) => T): T
export function exec(sql: string, params?: unknown[]): Database.RunResult
export function prepare(sql: string): Database.Statement
```

**PRAGMAs Konfiguration**:
- `foreign_keys = ON` - Referentielle Integrität
- `journal_mode = WAL` - Write-Ahead Logging für bessere Concurrency
- `synchronous = FULL` - Maximale Datensicherheit
- `temp_store = MEMORY` - Temporäre Daten im RAM

### Schema (Initial Migration 000_init.ts)

| Tabelle | Zweck | Schlüsselfelder |
|---------|-------|----------------|
| **settings** | App-Konfiguration | key (PK), value, updated_at |
| **customers** | Kundenverwaltung | id (PK), company_name, contact_person, address_* |
| **numbering_circles** | Dokumentennummern | id (PK), type, year, last_number, prefix, suffix |
| **offers** | Angebote | id (PK), number (UNIQUE), customer_id (FK), status |
| **invoices** | Rechnungen | id (PK), number (UNIQUE), customer_id (FK), offer_id (FK) |
| **packages** | Service-Templates | id (PK), name, price, unit, active |

**Foreign Key Relationships**:
- `offers.customer_id → customers.id` (CASCADE DELETE)
- `invoices.customer_id → customers.id` (CASCADE DELETE)
- `invoices.offer_id → offers.id` (SET NULL)

**Performance Indexes**:
- `idx_customers_company` - Firmenname-Suche
- `idx_offers_customer`, `idx_offers_status` - Angebots-Queries
- `idx_invoices_customer`, `idx_invoices_status`, `idx_invoices_due_date` - Rechnungs-Queries

## Migration System

### Konzept
- **Schema Versioning**: SQLite `user_version` PRAGMA für aktuelle Schema-Version
- **Idempotente Migrations**: Jede Migration kann sicher mehrfach ausgeführt werden
- **Cold Backup**: Automatisches Backup vor jeder Migration
- **Transactional Safety**: Alle Migrations in Transaktionen

### Migration Struktur
```typescript
export interface Migration {
  version: number;
  name: string;
  up(): void;    // Schema-Änderungen anwenden
  down(): void;  // Schema-Änderungen rückgängig (für Rollbacks)
}
```

### Migration Workflow
1. **Aktuelle Version prüfen** (`PRAGMA user_version`)
2. **Pending Migrations identifizieren** 
3. **Cold Backup erstellen** (`VACUUM INTO`)
4. **Migrations ausführen** (in Transaction)
5. **Version aktualisieren** (`PRAGMA user_version = N`)

### Rollback-Mechanismus
```typescript
// Rollback auf vorherige Version
await MigrationService.rollbackToVersion(previousVersion)
```

## Backup & Restore System

### Hot Backup (Laufende Datenbank)
```typescript
// Erstellt Backup während App läuft
const result = await BackupService.createHotBackup(targetPath?)
// → { success: true, backupPath: "...", size: 4096, checksum: "abc123", timestamp: "..." }
```

**Implementierung**: 
- Nutzt better-sqlite3 `backup()` API
- Konsistenter Snapshot ohne App-Stopp
- Automatische Checksum-Validierung

### VACUUM INTO Backup (Kompakte Archive)
```typescript
// Erstellt komprimiertes, defragmentiertes Backup
const result = await BackupService.createVacuumBackup(targetPath)
// → Optimierte Dateigröße, bereinigt von gelöschten Daten
```

### Restore Funktionalität
```typescript
// Datenbank aus Backup wiederherstellen
const result = await BackupService.restoreFromBackup(backupPath)
// → { success: true, restoredPath: "...", timestamp: "..." }
```

**Sicherheitsvalidierung**:
- Backup-Datei Integritätsprüfung
- SQLite-Format Validierung
- Pfad-Sicherheitsprüfung (kein Directory Traversal)

### Integrity Checking
```typescript
// Datenbank-Integrität prüfen
const result = await BackupService.checkIntegrity()
// → { valid: true, errors: [], checksums: { pragma: "ok", custom: "abc123" } }
```

**Prüfungen**:
- `PRAGMA integrity_check` - SQLite interne Validierung
- `PRAGMA foreign_key_check` - Referentielle Integrität
- Custom Checksum über alle Tabellendaten

### Backup Lifecycle Management
```typescript
// Alte Backups automatisch bereinigen
const result = await BackupService.cleanOldBackups(keepCount = 10)
// → { success: true, deletedCount: 5, deletedFiles: ["old1.sqlite", ...] }
```

## Dateipfade & Struktur

### Database Files
```
%APPDATA%/Electron/database/
├── rawalite.db              # Haupt-Datenbank
├── rawalite.db-wal          # Write-Ahead Log
├── rawalite.db-shm          # Shared Memory
└── backups/
    ├── pre-migration-YYYY-MM-DDTHH-mm-ss-sssZ.sqlite
    ├── manual-backup-YYYY-MM-DDTHH-mm-ss-sssZ.sqlite
    └── vacuum-backup-YYYY-MM-DDTHH-mm-ss-sssZ.sqlite
```

### Entwicklung vs. Production
- **Development**: Electron `userData` Pfad
- **Production**: Gleicher Pfad, aber separater App-Name
- **Portabilität**: Komplette `database/` Ordner kopierbar

## Performance & Optimierung

### SQLite Konfiguration
- **WAL Mode**: Deutlich bessere Concurrency als Rollback Journal
- **FULL Synchronous**: Maximale Datensicherheit, moderate Performance
- **Memory Temp Store**: Temporäre Operationen im RAM
- **Foreign Keys**: Aktiviert für Datenintegrität

### Query Performance
- **Prepared Statements**: Alle Queries nutzen Parameter-Binding
- **Strategische Indexes**: Auf häufig gefilterte Spalten
- **Transaction Batching**: Mehrere Operations in einer Transaction

### Backup Performance
- **Hot Backup**: ~1ms für 4KB DB, skaliert linear
- **VACUUM INTO**: Länger, aber defragmentiert und komprimiert
- **Incremental**: Geplant für große Datenbanken (zukünftig)

## Troubleshooting

### Häufige Probleme

**Native Module Build Error**:
```bash
# Lösung: Electron native dependencies rebuilden
pnpm run rebuild:electron
```

**Database Lock Error**:
```bash
# WAL Mode reduziert Locks drastisch
# Bei Problemen: App komplett beenden und neu starten
```

**Migration Failed**:
```typescript
// Rollback verfügbar
await MigrationService.rollbackToVersion(previousVersion)
// Cold Backup wird automatisch erstellt
```

**Backup Corruption**:
```typescript
// Integrity Check vor Restore
const check = await BackupService.checkIntegrity()
if (!check.valid) {
  // Backup ist korrupt, verwende alternatives Backup
}
```

### Debugging & Logging

Alle Database-Operationen loggen automatisch:
- **INFO**: Erfolgreiche Operationen
- **WARN**: Nicht-kritische Probleme
- **ERROR**: Schwerwiegende Fehler mit Stack Trace

Console-Output während Development für immediate Debugging.

## Migration History

| Version | Migration | Beschreibung | Datum |
|---------|-----------|--------------|-------|
| 0 → 1 | 000_init | Initial Schema mit allen Core-Tabellen | 29.09.2025 |

## Security Considerations

- **IPC-Only Access**: Datenbank nur über sichere IPC-Kanäle zugänglich
- **Parameter Binding**: Schutz vor SQL Injection
- **Path Validation**: Backup-Pfade werden validiert (kein Directory Traversal)
- **Transaction Isolation**: Konsistente Datenbank-States
- **Error Handling**: Keine sensiblen Daten in Error Messages

## Zukünftige Verbesserungen

### Geplante Features (Phase 5+)
- **Incremental Backups**: Für große Datenbanken
- **Backup Encryption**: AES-256 verschlüsselte Backups
- **Data Export**: JSON/CSV Export-Funktionalität
- **Query Builder**: Type-safe Query API
- **Connection Pooling**: Für High-Performance Scenarios

### Performance Optimierungen
- **Bulk Insert Optimization**: Für große Datenmengen
- **Index Tuning**: Basierend auf echten Usage Patterns
- **Vacuum Automation**: Automatische DB-Defragmentierung
- **Cache Layer**: Redis-ähnlicher Memory Cache

---

**Implementiert in**: Phase 4 - DB/Backup (SQLite + better-sqlite3, IPC-only)  
**Letzte Aktualisierung**: 29.09.2025