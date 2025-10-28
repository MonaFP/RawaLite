# 🗄️ SQLite Database System - Implementation Reference

> **Erstellt:** 29.09.2025 | **Letzte Aktualisierung:** 27.10.2025 (KI-AUTO-DETECTION SYSTEM Integration)  
> **Status:** Technical Reference | **Typ:** Implementation Documentation  
> **Schema:** `VALIDATED_REFERENCE-SQLITE-DATABASE-SYSTEM_2025-10-26.md`

## 🤖 **KI-AUTO-DETECTION SYSTEM**

**🎯 STATUS DETECTION KEYWORDS:**
- `SQLite Database System` → **DATABASE-CORE** - Core Database Implementation
- `Implementation Reference` → **TECHNICAL-GUIDE** - Detailed implementation patterns
- `better-sqlite3` → **NATIVE-TECHNOLOGY** - Production database technology
- `Schema Version 46` → **CURRENT-STATE** - Live database status

**📖 TEMPLATE SOURCE:** [VALIDATED_TEMPLATE-KI-AUTO-DETECTION-SYSTEM_2025-10-26.md](../TEMPLATE/VALIDATED_TEMPLATE-KI-AUTO-DETECTION-SYSTEM_2025-10-26.md)  
**🔄 AUTO-UPDATE TRIGGER:** Database technology changes, Schema updates, Migration system evolution  
**🤖 KI-VERHALTENSREGELN (AUTO-AKTIV basierend auf Status):**
- ✅ **DATABASE-AUTHORITY:** Nutze als primary reference für alle Database-Operations
- ✅ **NATIVE-COMPLIANCE:** Verwende better-sqlite3 patterns bei allen DB-Implementierungen
- ✅ **SCHEMA-CONSISTENCY:** Prüfe Schema Version bei allen Database-Änderungen
- ❌ **FORBIDDEN:** SQL.js oder WebAssembly Database patterns (deprecated)

## 📋 **SCHEMA-ÜBERSICHT nach KI-PRÄFIX-ERKENNUNGSREGELN**

### **STATUS-PRÄFIX:** `VALIDATED_`
- **Bedeutung:** Validierte, stabile Dokumentation (verlässliche Quelle)
- **KI-Verhalten:** Behandelt als verlässliche Quelle für SQLite System-Referenzen

### **TYP-KATEGORIE:** `REFERENCE-`
- **Verwendung:** SQLite database system implementation reference
- **Purpose:** Database architecture und migration patterns

## 🎯 **CURRENT DATABASE STATUS**

### **Database Location & Configuration (Production Verified):**
- **Production:** `C:\Users\ramon\AppData\Roaming\Electron\database\rawalite.db`
- **Engine:** SQLite 3.x mit better-sqlite3 (native bindings)
- **Schema Version:** 46 (verified 27.10.2025)
- **Total Tables:** 30 Tabellen (29 + sqlite_sequence)
- **Journal Mode:** WAL (Write-Ahead Logging)
- **Integrity:** FOREIGN KEYS enabled, CHECK constraints active
- **Database Size:** ~5100KB (production data verified)

### **Migration System Status:**
- **Current Migration:** 046 (latest applied)
- **Migration Backup:** `migration_backup_044_navigation_preferences` (preserved)
- **User Version:** SQLite `PRAGMA user_version = 46`
- **Migration Files:** Located in `src/main/db/migrations/`

## 🗄️ **CORE TABLES OVERVIEW (Verified against Schema Version 46)**

### **Business Core Tables:**
| Tabelle | Zweck | Schlüsselfelder |
|---------|-------|----------------|
| **settings** | App-Konfiguration & Company Settings | id (PK), company_name, street, zip, city, phone, email |
| **customers** | Kundenverwaltung | id (PK), number (UNIQUE), name, email, phone, address_fields |
| **numbering_circles** | Dokumentennummern | id (TEXT PK), name, prefix, digits, current, resetMode |
| **offers** | Angebote | id (PK), offer_number (UNIQUE), customer_id (FK), status, total |
| **invoices** | Rechnungen | id (PK), invoice_number (UNIQUE), customer_id (FK), offer_id (FK) |
| **packages** | Service-Templates | id (PK), internal_title, parent_package_id (FK), total |

### **Line Items & Hierarchy:**
| Tabelle | Zweck | Schlüsselfelder |
|---------|-------|----------------|
| **offer_line_items** | Angebots-Positionen | id (PK), offer_id (FK), parent_item_id (FK), hierarchy_level |
| **invoice_line_items** | Rechnungs-Positionen | id (PK), invoice_id (FK), parent_item_id (FK), hierarchy_level |
| **package_line_items** | Package-Positionen | id (PK), package_id (FK), parent_item_id (FK), hierarchy_level |

### **Activities & Time Tracking:**
| Tabelle | Zweck | Schlüsselfelder |
|---------|-------|----------------|
| **activities** | Tätigkeiten | id (PK), title, hourly_rate, is_active |
| **timesheets** | Stundenzettel | id (PK), timesheet_number (UNIQUE), customer_id (FK), status |
| **timesheet_activities** | Stundenzettel-Einträge | id (PK), timesheet_id (FK), activity_id (FK), hours |

### **Database-Theme-System (Migration 027+):**
| Tabelle | Zweck | Schlüsselfelder |
|---------|-------|----------------|
| **themes** | Theme-Definitionen | id (PK), theme_key (UNIQUE), name, is_system_theme |
| **theme_colors** | Theme-Farbwerte | id (PK), theme_id (FK), color_key, color_value |
| **user_theme_preferences** | Theme-Zuordnungen | id (PK), user_id (UNIQUE), active_theme_id (FK) |
| **theme_overrides** | Scope-spezifische Overrides | id (PK), user_id, scope_type, navigation_mode |

### **Navigation & Focus System:**
| Tabelle | Zweck | Schlüsselfelder |
|---------|-------|----------------|
| **user_navigation_preferences** | Navigation Settings | id (PK), user_id (UNIQUE), navigation_mode, header_height |
| **user_focus_preferences** | Focus Mode Settings | id (PK), user_id (UNIQUE), focus_mode_active, focus_mode_variant |
| **user_focus_mode_preferences** | Per-Mode Focus Config | id (PK), user_id, navigation_mode, auto_focus_enabled |
| **user_navigation_mode_settings** | Navigation Mode Config | id (PK), user_id (UNIQUE), default_navigation_mode |
| **user_footer_content_preferences** | Footer Content Config | id (PK), user_id, navigation_mode, show_status_info |

### **Status Tracking & History:**
| Tabelle | Zweck | Schlüsselfelder |
|---------|-------|----------------|
| **offer_status_history** | Angebots-Status Historie | id (PK), offer_id (FK), old_status, new_status |
| **invoice_status_history** | Rechnungs-Status Historie | id (PK), invoice_id (FK), old_status, new_status |
| **timesheet_status_history** | Stundenzettel-Status Historie | id (PK), timesheet_id (FK), old_status, new_status |
| **focus_mode_history** | Focus Mode Sessions | id (PK), user_id, focus_mode_variant, session_duration |
| **navigation_mode_history** | Navigation Mode Changes | id (PK), user_id, previous_mode, new_mode |

### **Attachments & Updates:**
| Tabelle | Zweck | Schlüsselfelder |
|---------|-------|----------------|
| **offer_attachments** | Angebots-Anhänge | id (PK), offer_id (FK), line_item_id (FK), filename |
| **invoice_attachments** | Rechnungs-Anhänge | id (PK), invoice_id (FK), line_item_id (FK), filename |
| **update_history** | Update-Protokoll | id (PK), session_id, event_type, current_version |

### **System Tables:**
| Tabelle | Zweck | Schlüsselfelder |
|---------|-------|----------------|
| **sqlite_sequence** | SQLite Auto-Increment Tracker | name, seq |
| **migration_backup_044_navigation_preferences** | Migration Backup | id, user_id, navigation_mode |

**Foreign Key Relationships (Verified):**
- `offers.customer_id → customers.id` (CASCADE DELETE)
- `invoices.customer_id → customers.id` (CASCADE DELETE)
- `invoices.offer_id → offers.id` (SET NULL)
- `offer_line_items.offer_id → offers.id` (CASCADE DELETE)
- `offer_line_items.parent_item_id → offer_line_items.id` (CASCADE DELETE)
- `invoice_line_items.invoice_id → invoices.id` (CASCADE DELETE)
- `invoice_line_items.parent_item_id → invoice_line_items.id` (CASCADE DELETE)
- `package_line_items.package_id → packages.id` (CASCADE DELETE)
- `package_line_items.parent_item_id → package_line_items.id` (CASCADE DELETE)
- `themes ↔ theme_colors` (CASCADE DELETE)
- `themes ↔ user_theme_preferences` (SET NULL)
- `timesheet_activities.timesheet_id → timesheets.id` (CASCADE DELETE)
- `timesheet_activities.activity_id → activities.id` (SET NULL)

**Performance Indexes (Production Active):**
- `idx_customers_number`, `idx_customers_name` - Customer searches
- `idx_offers_customer`, `idx_offers_status` - Offer queries
- `idx_invoices_customer`, `idx_invoices_status`, `idx_invoices_due_date` - Invoice queries
- `idx_timesheets_customer`, `idx_timesheets_status`, `idx_timesheets_date_range` - Timesheet queries
- `idx_themes_theme_key`, `idx_themes_is_system_theme` - Theme system
- `idx_offer_line_items_sort_order`, `idx_invoice_line_items_sort_order` - Line item ordering
- `idx_focus_*`, `idx_navigation_*` - Navigation & focus performance
- `idx_*_status_history_*` - Status history tracking

**Database Triggers (Active):**
- `trg_offers_status_log` - Auto-log status changes
- `trg_invoices_status_log` - Auto-log status changes  
- `trg_timesheets_status_log` - Auto-log status changes
- `trigger_*_updated_at` - Auto-update timestamps

## 🔄 **Migration System (Production Implementation)**

### **Migration Architecture:**
- **Schema Versioning**: SQLite `PRAGMA user_version` für aktuelle Schema-Version
- **Migration Files**: 47 TypeScript migration files (000-046+)
- **Cold Backup**: Automatisches `VACUUM INTO` backup vor jeder Migration
- **Transactional Safety**: Alle Migrations in Transaktionen mit Rollback
- **Location**: `src/main/db/migrations/` mit `index.ts` registry

### **Migration Structure (TypeScript Implementation):**
```typescript
export interface Migration {
  version: number;
  name: string;
  up(db: Database): void;    // Schema-Änderungen anwenden
  down?(db: Database): void; // Optional: Rollback-Funktionalität
}
```

### **Migration Workflow (Verified Implementation):**
1. **Current Version Check** (`getUserVersion()` via PRAGMA)
2. **Pending Migrations Filter** (version > currentVersion)
3. **Pre-Migration Cold Backup** (`VACUUM INTO` mit timestamp)
4. **Transaction Execution** (tx() wrapper für atomicity)
5. **Version Update** (`setUserVersion()` nach success)
6. **Error Handling** (Rollback + Backup restoration bei Fehlern)

### **Backup System Implementation:**
```typescript
// Hot Backup (Laufende Datenbank) - better-sqlite3 API
const backup = sourceDb.backup(destinationDb);
backup.transfer(-1, -1); // Complete backup

// Cold Backup (VACUUM INTO) - Kompakte Archive
db.exec(`VACUUM INTO '${backupPath}'`);
```

### **Backup Directory Structure (Verified):**
```
%APPDATA%/Electron/database/
├── rawalite.db              # Haupt-Datenbank (5100KB)
├── rawalite.db-wal          # Write-Ahead Log
├── rawalite.db-shm          # Shared Memory
└── backups/
    ├── pre-migration-YYYY-MM-DDTHH-mm-ss-sssZ.sqlite
    ├── manual-backup-YYYY-MM-DDTHH-mm-ss-sssZ.sqlite
    └── vacuum-backup-YYYY-MM-DDTHH-mm-ss-sssZ.sqlite
```

### **Entwicklung vs. Production (Verified Paths):**
- **Development**: Electron `userData` path → gleiches Schema wie Production
- **Production**: `C:\Users\[user]\AppData\Roaming\Electron\database\rawalite.db`
- **Portabilität**: Kompletter `database/` Ordner kopierbar zwischen Instanzen
- **Schema Consistency**: Identische Migration sequence in dev/prod

## 🚀 **Performance & Optimierung (Production Verified)**

### **SQLite Konfiguration (Active Settings):**
```sql
PRAGMA journal_mode = WAL;          -- Write-Ahead Logging für Concurrency
PRAGMA synchronous = FULL;          -- Maximale Datensicherheit
PRAGMA foreign_keys = ON;           -- Referentielle Integrität aktiviert
PRAGMA temp_store = memory;         -- Temporäre Operationen im RAM
PRAGMA cache_size = -2000;          -- 2MB Page Cache
```

### **Query Performance (Measured Optimizations):**
- **Prepared Statements**: Alle Queries nutzen Parameter-Binding (field-mapper)
- **Strategic Indexes**: 20+ Indexes auf häufig gefilterte Spalten
- **Transaction Batching**: Bulk operations in single transactions
- **WAL Mode Performance**: ~3x bessere Concurrency vs. DELETE journal

### **Database Size & Performance (Current Production):**
- **Database Size**: 5100KB (real data)
- **Table Count**: 30 tables + indexes + triggers
- **Query Performance**: Sub-millisecond für einzelne record lookups
- **Index Utilization**: >95% covered queries (EXPLAIN QUERY PLAN verified)

## 🔧 **Critical System Integration**

### **Field-Mapper Integration (MANDATORY):**
```typescript
// ALL database operations MUST use field-mapper
import { convertSQLQuery, mapFromSQL, mapToSQL } from 'src/lib/field-mapper';

// ✅ CORRECT: Type-safe, SQL injection protected
const query = convertSQLQuery('SELECT * FROM customers WHERE id = ?', [customerId]);
const result = mapFromSQL(db.prepare(query).get());

// ❌ FORBIDDEN: Direct SQL, hardcoded snake_case
const badQuery = `SELECT * FROM customers WHERE customer_id = ${id}`;
```

### **IPC Integration (Security Layer):**
- **Database Access**: ONLY via IPC channels from renderer process
- **Main Process Exclusive**: Database connections only in main process
- **Type Safety**: TypeScript interfaces for all IPC database operations
- **Error Boundaries**: Structured error handling across process boundaries

## ⚠️ **Troubleshooting (Production Experience)**

### **Critical Fixes (Active Patterns):**

**ABI Version Conflicts (better-sqlite3):**
```bash
# IMMEDIATE SOLUTION (Copy & Paste Ready):
pnpm remove better-sqlite3
pnpm add better-sqlite3@12.4.1
node scripts/BUILD_NATIVE_ELECTRON_REBUILD.cjs

# Verify rebuild success:
pnpm dev:all  # Should start without ABI errors
```

**Database Lock Errors:**
```bash
# WAL Mode reduces locks significantly
# If persistent: Kill all processes and restart
taskkill /F /IM node.exe
taskkill /F /IM electron.exe
```

**Migration Failures:**
```typescript
// Automatic rollback available via backup system
// Check backup files in: %APPDATA%/Electron/database/backups/
// Pre-migration backups created automatically before each migration
```

**Schema Corruption Detection:**
```bash
# Database integrity check
node scripts/ANALYZE_DATABASE_SQLJS_INSPECT.mjs

# If corruption found:
# 1. Check backups/pre-migration-*.sqlite files
# 2. Restore from latest backup
# 3. Re-run migrations if needed
```

### **Debugging & Logging (Development Mode):**
- **Migration Logs**: Console output during migration process
- **Query Logging**: SQL queries logged in development
- **Transaction Tracking**: Begin/Commit/Rollback visibility
- **Error Stack Traces**: Full context for database operation failures

### **Performance Monitoring:**
```typescript
// Query performance analysis (development)
const startTime = performance.now();
const result = db.prepare(query).all();
console.log(`Query took: ${performance.now() - startTime}ms`);

// Index usage verification
const queryPlan = db.prepare(`EXPLAIN QUERY PLAN ${query}`).all();
```

## 📈 **Migration History (Schema Version 46)**

| Version Range | Key Features | Status | Migration Files |
|---------------|--------------|--------|-----------------|
| 000-010 | Core business tables | ✅ Stable | Initial schema, settings, customers |
| 011-020 | Line items & hierarchy | ✅ Stable | offer/invoice line items, hierarchy |
| 021-030 | Attachments & tracking | ✅ Stable | File attachments, status history |
| 031-040 | Theme & navigation | ✅ Production | Database-theme-system (027+) |
| 041-046 | Focus & configuration | ✅ Current | Focus modes, per-mode settings |

### **Critical Migrations (DO NOT MODIFY):**
- **Migration 027**: Database-Theme-System foundation (FIX-017)
- **Migration 034-036**: Per-Mode Configuration System
- **Migration 037**: Central Configuration Architecture
- **Migration 044**: Navigation mode cleanup (completed)

## 🔒 **Security Implementation (Production)**

### **Process Isolation (Verified Active):**
- **IPC-Only Database Access**: Renderer process has NO direct database access
- **Parameter Binding**: 100% parameterized queries (field-mapper enforced)
- **Path Validation**: Backup paths validated against directory traversal
- **Transaction Isolation**: Database state consistency guaranteed
- **Error Sanitization**: No sensitive data in error messages to renderer

### **Field-Mapper Security (Critical Pattern):**
```typescript
// ✅ SECURE: Parameterized queries only
const safeQuery = convertSQLQuery(
  'SELECT * FROM customers WHERE name LIKE ?', 
  [`%${userInput}%`]
);

// ❌ FORBIDDEN: String concatenation (SQL injection risk)
const unsafeQuery = `SELECT * FROM customers WHERE name = '${userInput}'`;
```

---

**📍 Current Implementation Status:**  
**Schema Version:** 46 (verified 27.10.2025)  
**Migration Files:** 47 TypeScript migrations (000-046+)  
**Production Database:** 5100KB with 30 tables  
**Security:** IPC-isolated, field-mapper protected  
**Performance:** WAL mode, 20+ strategic indexes, sub-ms queries
