# 🔄 SQLite Migration Architecture - Database Migration Reference

> **Erstellt:** 29.09.2025 | **Letzte Aktualisierung:** 27.10.2025 (Schema Version 46, KI-PRÄFIX Schema compliance)  
> **Status:** Reference | **Typ:** Migration Architecture Documentation  
> **Schema:** `VALIDATED_REFERENCE-SQLITE-MIGRATION-ARCHITECTURE_2025-10-26.md`

## 📋 **SCHEMA-ÜBERSICHT nach KI-PRÄFIX-ERKENNUNGSREGELN**

### **STATUS-PRÄFIX:** `VALIDATED_`
- **Bedeutung:** Validierte, stabile Dokumentation (verlässliche Quelle)
- **KI-Verhalten:** Behandelt als verlässliche Quelle für Migration-Architektur

### **TYP-KATEGORIE:** `REFERENCE-`
- **Verwendung:** SQLite migration architecture und database upgrade patterns
- **Purpose:** Database migration system documentation und architecture overview

> **⚠️ CRITICAL:** [../../ROOT_VALIDATED_REGISTRY-CRITICAL-FIXES_2025-10-17.md](../../ROOT_VALIDATED_REGISTRY-CRITICAL-FIXES_2025-10-17.md) - **MANDATORY READ vor Database work**  
> **🛡️ NEVER violate:** Siehe [../../ROOT_VALIDATED_GUIDE-KI-INSTRUCTIONS_2025-10-17.md](../../ROOT_VALIDATED_GUIDE-KI-INSTRUCTIONS_2025-10-17.md) - Essential database patterns  
> **📚 ALWAYS:** `pnpm validate:critical-fixes` vor Database-Änderungen  

**Current Schema Version**: 46 (verified 27.10.2025)  
**Migration Status**: ✅ 046 Migrationen aktiv  

## 🔄 **MIGRATION ARCHITECTURE: SQL.js → better-sqlite3**

RawaLite ist von der ursprünglichen SQL.js WebAssembly-Implementierung auf ein natives better-sqlite3 System migriert worden.

## Neue Architektur-Diagramme

### Process Architecture (Updated)
```mermaid
sequenceDiagram
    participant R as Renderer Process
    participant M as Main Process  
    participant DB as SQLite Database (Native)
    participant FS as File System
    
    R->>M: ipc('db:query', sql, params)
    M->>DB: db.prepare(sql).all(params)
    DB-->>M: query results
    M-->>R: Promise<Array<Row>>
    
    R->>M: ipc('backup:hot', path)
    M->>DB: db.backup(destination)
    M->>FS: write backup to disk
    FS-->>M: backup file created
    M-->>R: {success: true, backupPath, checksum}
```

### Layer Architecture (Updated)
```
┌─────────────────────────────────────────────────────────────┐
│                   RENDERER PROCESS                         │
├─────────────────────────────────────────────────────────────┤
│  UI Layer        │ React Components, Pages, Forms          │
├─────────────────────────────────────────────────────────────┤
│  Service Layer   │ DbClient.ts, BackupClient.ts           │
├─────────────────────────────────────────────────────────────┤
│  IPC Bridge      │ contextBridge (preload.ts)             │
├─────────────────────────────────────────────────────────────┤
│                     MAIN PROCESS                           │
├─────────────────────────────────────────────────────────────┤
│  IPC Handlers    │ db:query, db:exec, backup:*            │
├─────────────────────────────────────────────────────────────┤
│  Business Logic  │ Database.ts, MigrationService.ts       │
│                  │ BackupService.ts                        │
├─────────────────────────────────────────────────────────────┤
│  Native Layer    │ better-sqlite3 (C++ Bindings)          │
├─────────────────────────────────────────────────────────────┤
│  Storage Layer   │ SQLite File + WAL + Backups            │
└─────────────────────────────────────────────────────────────┘
```

## Komponenten-Details

### Database.ts (Singleton Pattern)
```typescript
// Zentrale Database-Instanz mit optimierten PRAGMAs
class DatabaseSingleton {
  private static instance: Database.Database | null = null;
  
  // PRAGMAs für Production-Optimierung
  // foreign_keys=ON, journal_mode=WAL, synchronous=FULL
}
```

### Migration System
```typescript
// Schema Evolution mit Backup-Sicherheit
interface Migration {
  version: number;
  up(): void;    // Vorwärts-Migration
  down(): void;  // Rollback-Fähigkeit
}
```

### IPC Security Layer
```typescript
// Whitelisted, sichere Database-Operationen
const secureIPC = {
  'db:query':       // SELECT operations
  'db:exec':        // INSERT/UPDATE/DELETE operations  
  'db:transaction': // Atomic multi-operation
  'backup:*':       // Backup-related operations
}
```

## Performance-Charakteristika

### Database Operations
| Operation | SQL.js (Vorher) | better-sqlite3 (Jetzt) | Verbesserung |
|-----------|------------------|------------------------|--------------|
| Query Time | ~10-50ms | ~1-5ms | **5-10x faster** |
| Memory Usage | Full DB in RAM | Nur Working Set | **~90% weniger** |
| Startup Time | ~2-5s (WASM load) | ~50ms | **40-100x faster** |
| Concurrency | Blocking | WAL non-blocking | **Deutlich besser** |

### Backup Performance
| Backup Type | Size (4KB DB) | Time | Use Case |
|-------------|---------------|------|----------|
| Hot Backup | 4KB → 4KB | ~1ms | Live backup während Betrieb |
| VACUUM INTO | 4KB → 3KB | ~10ms | Defragmentiertes Archiv |
| Migration Backup | 4KB → 4KB | ~1ms | Automatisch vor Schema-Änderungen |

## Dateistruktur-Evolution

### Vorher (SQL.js)
```
%APPDATA%/Electron/
└── database.sqlite    # Einzelne WASM-Export-Datei
```

### Jetzt (better-sqlite3)
```
%APPDATA%/Electron/database/
├── rawalite.db                    # Hauptdatenbank
├── rawalite.db-wal               # Write-Ahead Log
├── rawalite.db-shm               # Shared Memory
└── backups/
    ├── pre-migration-*.sqlite     # Automatische Migration-Backups
    ├── manual-backup-*.sqlite     # Benutzer-initiierte Backups
    └── vacuum-backup-*.sqlite     # Komprimierte Archiv-Backups
```

## Sicherheitsverbesserungen

### Vorher: Direkte SQL.js Nutzung
```typescript
// Renderer hatte direkten Database-Zugriff
const db = new SQL.Database(arrayBuffer);
const results = db.exec("SELECT * FROM table"); // Potentiell unsicher
```

### Jetzt: IPC-Only Security Model
```typescript
// Renderer nutzt nur sichere IPC-Kanäle
const results = await window.rawalite.db.query("SELECT * FROM table", []);
// ✅ Parameter Binding
// ✅ Whitelisted Operations
// ✅ Process Isolation
```

## Migration-Pfad

### Automatische Schema-Migration
1. **Detection**: Erkennung alter SQL.js Datenbank-Exports
2. **Conversion**: Automatische Konvertierung zu SQLite-Format
3. **Backup**: Sicherung der Original-Daten
4. **Validation**: Integritätsprüfung nach Migration

### Backward Compatibility
- Legacy Dexie-Adapter bleibt verfügbar für Übergangszeit
- Schrittweise Migration von IndexedDB → SQLite
- Benutzer-transparente Datenübertragung

## Dependency-Management

### Native Module Handling
```json
// package.json - Electron-spezifische Builds
{
  "scripts": {
    "postinstall": "electron-builder install-app-deps && pnpm run rebuild:electron"
  },
  "build": {
    "buildDependenciesFromSource": true,
    "nodeGypRebuild": true
  }
}
```

### Build-Pipeline
1. **Install**: Native Dependencies für Host-System
2. **Rebuild**: Neukompilierung für Electron's Node.js Version
3. **Bundle**: esbuild mit externe native modules
4. **Package**: electron-builder mit binary inclusion

## Testing-Strategie

### Database Tests
```typescript
// Integration Tests für Migration System
describe('MigrationService', () => {
  it('should create backup before migration');
  it('should rollback on migration failure');
  it('should maintain referential integrity');
});

// Performance Tests für Database Operations
describe('Database Performance', () => {
  it('should handle 1000 inserts in <100ms');
  it('should backup 1MB database in <10ms');
});
```

### Security Tests
```typescript
// IPC Security Validation
describe('IPC Security', () => {
  it('should reject non-whitelisted channels');
  it('should prevent SQL injection via parameters');
  it('should validate backup file paths');
});
```

## Monitoring & Observability

### Performance Metrics
- Database operation latencies
- Backup creation times  
- Migration execution duration
- Memory usage patterns

### Error Tracking
- SQLite constraint violations
- Migration failures with rollback paths
- IPC communication errors
- Native module loading issues

## Lessons Learned

### ✅ Vorteile der Migration
- **Performance**: Signifikante Geschwindigkeitsverbesserung
- **Memory**: Drastische RAM-Reduktion  
- **Security**: Robustes IPC-Security-Model
- **Reliability**: Native SQLite Stabilität
- **Features**: Advanced Backup/Restore Funktionalität

### 🔄 Herausforderungen
- **Native Dependencies**: Electron-rebuild Komplexität
- **Platform Compatibility**: Windows/Mac/Linux Builds
- **Migration Complexity**: Datenübertragung von alten Systemen

### 📊 Metriken
- **Build Time**: +30s (native compilation)
- **App Size**: +2MB (native binaries)
- **Runtime Performance**: +500% (operation speed)
- **Memory Usage**: -90% (no WASM overhead)

---

**Architecture Review**: ✅ Completed  
**Performance Validation**: ✅ Passed  
**Security Audit**: ✅ Approved  
**Documentation Status**: ✅ Complete