# COMPLETED_PLAN-COMPREHENSIVE-FIX-STRATEGY-DEV-PROD-SEPARATION_2025-11-03

> **Erstellt:** 03.11.2025 | **Letzte Aktualisierung:** 03.11.2025 (Comprehensive Fix Strategy + Backup Recovery Plan Integration)  
> **Status:** READY FOR IMPLEMENTATION | **Typ:** COMPLETED_PLAN - Comprehensive Fix Strategy  
> **Schema:** `COMPLETED_PLAN-COMPREHENSIVE-FIX-STRATEGY-DEV-PROD-SEPARATION_2025-11-03.md` ✅ **SCHEMA-COMPLIANT**

> **🤖 KI-AUTO-DETECTION SYSTEM:**
> - **AKTUELLER STATUS:** READY FOR IMPLEMENTATION (automatisch durch "Comprehensive Fix Strategy" erkannt)
> - **TEMPLATE-QUELLE:** 06-handbook COMPLETED_PLAN Template
> - **AUTO-UPDATE:** Bei Fix-Strategie-Änderung automatisch Plan aktualisieren
> - **STATUS-KEYWORDS:** Erkannt durch "READY FOR IMPLEMENTATION", "Comprehensive Fix Strategy"

> **🤖 KI-VERHALTENSREGELN (AUTO-AKTIV basierend auf Status):**
> 
> **📚 STATUS = READY FOR IMPLEMENTATION:**
> - ✅ **Implementation-Plan** - Verlässliche Quelle für strukturierte Fix-Durchführung
> - ✅ **Prioritized Roadmap** - Authoritative Strategie mit 3-Phasen-Ansatz
> - 🎯 **AUTO-REFERENCE:** Bei Fix-Implementation diese Strategie als Basis nutzen
> - 🔄 **AUTO-TRIGGER:** Bei Keywords "IMPLEMENTATION PHASE" → Plan-Compliance prüfen

> **⚠️ COMPREHENSIVE FIX STRATEGY STATUS:** 3 Phasen + 6 Fixes + Backup-Recovery (03.11.2025)  
> **Registry Status:** Prioritäten basiert auf Kritikalität und Abhängigkeiten  
> **Backup Status:** Neuestes Backup identifiziert (damaged-2025-10-31), Restore-Plan vorhanden  
> **Critical Function:** Production-ready implementation roadmap für alle identifizierten Fehler

---

## 📋 **SCHEMA-ÜBERSICHT (KI-PRÄFIX-ERKENNUNGSREGELN)**

### **Document Classification:**
- **STATUS-PRÄFIX:** `COMPLETED_` ✅ **Abgeschlossenes Plan-Dokument (fertige Strategie)**
- **TYP-KATEGORIE:** `PLAN-` ✅ **Planungsdokument/Roadmap** 
- **SUBJECT:** `COMPREHENSIVE-FIX-STRATEGY-DEV-PROD-SEPARATION` ✅ **Spezifisch identifiziert**
- **DATUM:** `2025-11-03` ✅ **Gültig und aktuell**

### **KI-Interpretation:** 
- **Thema:** Comprehensive Fix Strategy (Dev/Prod Separation + Backwards Compatibility + Backup Recovery)
- **Status:** COMPLETED (fertige, umsetzungsreife Strategie)
- **Quelle:** docs/02-dev/LESSON/ (Development Planning)
- **Priorität:** HÖCHSTE (Production-ready, sofortige Umsetzung empfohlen)

---

## 🚨 **EXECUTIVE SUMMARY**

Dieses Dokument definiert den **kompletten Implementierungsplan** zur Behebung der 3 kritischen Architektur-Fehler:

1. **Dev/Prod Database Separation fehlend** (🔴 CRITICAL - Production Data at Risk)
2. **Backwards Compatibility/Rollback-System fehlend** (🔴 CRITICAL - Zero Recovery Capability)
3. **Backup Recovery UI fehlend** (🟡 HIGH - Data Recovery Manual Only)

**Total Impact:** ⏱️ **4-5 Tage Entwicklungszeit** | 💰 **6 Priority-1 Fixes** | 🛡️ **2 Priority-2 Fixes** | 📋 **2 Priority-3 Fixes**

**Backup Status:** ✅ **Produktions-Backup verfügbar** - Kann als Notfall-Recovery Option eingespielt werden

---

## 📊 **PHASE ÜBERSICHT**

### **Phase 1: EMERGENCY FIXES (Priority 1)** ⏱️ 1-2 Tage
Kritische Fehler die SOFORT behoben werden müssen BEVOR neue Versionen released werden.

| Fix | Datei | Problem | Lösung | Timeline |
|:--|:--|:--|:--|:--|
| **Fix 1.1** | `src/main/db/Database.ts` | `getDbPath()` hat NO isDev check | isDev-basierte Pfad-Differenzierung hinzufügen | 2h |
| **Fix 1.2** | `src/main/db/BackupService.ts` | Kopiert SAME problematischen Code | BackupService an Database.ts changes anpassen | 1h |
| **Fix 1.3** | `electron/main.ts` | isDev wird NICHT für Database verwendet | isDev-Check in Database-Initalisierung einbauen | 1h |
| **Fix 1.4** | `.env` + Config | Keine Umgebungs-Differenzierung | `.env.dev`, `.env.prod` erstellen + Loader | 1h |
| **Fix 1.5** | Database Init | Pre-migration backup strategy prüfen | Verify VACUUM INTO backups funktionieren | 1h |
| **Fix 1.6** | Config Validation | Dev/Prod paths nicht validiert | Startup-Validation für Pfad-Trennung | 1h |

**Ergebnis Phase 1:** ✅ Dev und Prod verwenden SEPARATE Datenbanken, keine Datenkollisionen mehr möglich

---

### **Phase 2: ROLLBACK SYSTEM (Priority 2)** ⏱️ 2-3 Tage
Backwards-Compatibility-System implementieren für Migration-Fehlerbehandlung.

| Fix | Datei | Problem | Lösung | Timeline |
|:--|:--|:--|:--|:--|
| **Fix 2.1** | `src/main/db/MigrationService.ts` | Keine `rollbackMigration()` Funktion | Rollback-System mit Transaktionen implementieren | 4h |
| **Fix 2.2** | Alle Migrations (027-046) | `down()` Methods werfen Fehler | Reversible `down()` für alle Migrations implementieren | 8h |
| **Fix 2.3** | Error Handler | Migration-Fehler silent (app.quit) | Error Dialog + Rollback-Option hinzufügen | 2h |
| **Fix 2.4** | MigrationService | Keine Pre-Migration-Validation | Validation vor Migration + Rollback-Trigger | 2h |

**Ergebnis Phase 2:** ✅ Failed migrations können automatisch zurückgerollt werden, benutzer-freundliche Fehlerbehandlung

---

### **Phase 3: RECOVERY UI (Priority 3)** ⏱️ 1 Tag
Backup-Verwaltungs-UI für Notfall-Recovery implementieren.

| Fix | Datei | Problem | Lösung | Timeline |
|:--|:--|:--|:--|:--|
| **Fix 3.1** | `electron/ipc/` | Keine IPC-Handler für Backups | `backup:list` + `backup:restore` IPC-Handler | 2h |
| **Fix 3.2** | UI Component | Keine Backup-Wiederherstellungs-UI | Settings Panel mit Restore-Dialog | 3h |
| **Fix 3.3** | BackupService | Backups haben keine Metadaten | Backup-Metadata (version, migration#, env) | 1h |
| **Fix 3.4** | Backup Storage | Backups im gleichen Ordner wie Main-DB | Separate Backup-Verzeichnis-Struktur | 1h |

**Ergebnis Phase 3:** ✅ Benutzer können via UI Backups durchsuchen und optional wiederherstellen

---

## 🔧 **DETAILED FIX SPECIFICATIONS**

### **FIX 1.1: Database Path Separation (Dev vs Prod)**

**Current Code (PROBLEMATIC):**
```typescript
// src/main/db/Database.ts
function getDbPath(): string {
  const userData = app.getPath('userData');  // ← NO isDev CHECK
  return path.join(userData, 'database', 'rawalite.db');  // ← SAME für dev+prod!
}
```

**Fixed Code (SOLUTION):**
```typescript
// src/main/db/Database.ts
function getDbPath(): string {
  const userData = app.getPath('userData');
  const isDev = !app.isPackaged;  // ← ADD isDev check
  const filename = isDev ? 'rawalite-dev.db' : 'rawalite.db';
  return path.join(userData, 'database', filename);
}
```

**Impact:** 
- ✅ Dev: `rawalite-dev.db` (separate, für Testing)
- ✅ Prod: `rawalite.db` (production data, schützt vor Überschreiben)
- ✅ Backup paths: Automatic separation durch getDbPath()

**Testing:**
```bash
# Dev mode (pnpm dev)
node -e "console.log(getDbPath())"  # Should output: rawalite-dev.db

# Prod mode (installed app)
# Should use: rawalite.db
```

---

### **FIX 1.2: BackupService Path Synchronization**

**Current Code (PROBLEMATIC):**
```typescript
// src/main/db/BackupService.ts - lines 15-20
private static getDbPath(): string {
  const userData = app.getPath('userData');  // ← DUPLICATE CODE
  return path.join(userData, 'database', 'rawalite.db');  // ← NO isDev
}
```

**Fixed Code (SOLUTION):**
```typescript
// src/main/db/BackupService.ts - lines 15-20
private static getDbPath(): string {
  // REFACTOR: Use Database.getDbPath() directly
  return Database.getDbPath();  // ← Delegation eliminates duplication
}
```

**OR (if Database.getDbPath() is private):**
```typescript
private static getDbPath(): string {
  const userData = app.getPath('userData');
  const isDev = !app.isPackaged;  // ← ADD isDev check
  const filename = isDev ? 'rawalite-dev.db' : 'rawalite.db';
  return path.join(userData, 'database', filename);
}
```

**Impact:**
- ✅ Backups automatically created in correct env-specific location
- ✅ Eliminates code duplication
- ✅ Single source of truth for DB paths

---

### **FIX 1.3: Main Process Database Initialization**

**Current Code (PROBLEMATIC):**
```typescript
// electron/main.ts - lines 27-50
const isDev = !app.isPackaged;  // ← DEFINED but NOT USED for DB!

async function createWindow() {
  // ... window creation code ...
  const db = getDb();  // ← NO isDev parameter
  await runAllMigrations();  // ← NO isDev differentiation
}
```

**Fixed Code (SOLUTION):**
```typescript
// electron/main.ts - lines 27-50
const isDev = !app.isPackaged;  // ← NOW USED

async function createWindow() {
  // ... window creation code ...
  
  // Validate database environment
  if (isDev) {
    console.log('🔧 DEV MODE: Using rawalite-dev.db');
  } else {
    console.log('🚀 PROD MODE: Using rawalite.db');
  }
  
  const db = getDb();  // ← Uses isDev via Database.getDbPath()
  await runAllMigrations();  // ← Safe: migrations use correct DB now
}
```

**Impact:**
- ✅ isDev variable properly utilized
- ✅ Logging for environment verification
- ✅ Clear separation in startup logs

---

### **FIX 1.4: Environment Configuration**

**New Files to Create:**

```typescript
// src/config/environment.ts
export const ENVIRONMENT = {
  isDev: !app.isPackaged,
  appName: 'RawaLite',
  dataPath: app.getPath('userData'),
  databasePath: isDev ? 'rawalite-dev.db' : 'rawalite.db',
  backupDir: 'database/backups',
  backupMetadataDir: 'database/backups/.metadata'
};

export const VALIDATION = {
  minHeaderHeight: 36,
  maxHeaderHeight: 220,
  minSidebarWidth: 180,
  maxSidebarWidth: 320
};
```

**Environment Detection:**
```typescript
// Unified central location for env config
// Prevents scattered isDev checks across codebase
// Single source of truth for paths
```

**Impact:**
- ✅ Centralized configuration
- ✅ Easy to test (mock ENVIRONMENT)
- ✅ Documentation of all env-specific settings

---

### **FIX 2.1: Rollback System Implementation**

**New Function to Add to MigrationService.ts:**

```typescript
export async function rollbackMigration(toVersion: number): Promise<void> {
  if (toVersion < 1 || toVersion > currentSchemaVersion) {
    throw new Error(`Invalid rollback target version: ${toVersion}`);
  }

  const db = getDb();
  const tx = createTransaction(db);

  try {
    console.log(`🔄 ROLLBACK: Starting rollback to schema version ${toVersion}...`);
    
    // Get current version
    const currentVersion = getUserVersion(db);
    console.log(`📊 Current schema version: ${currentVersion}`);
    
    // Create backup BEFORE rollback
    const backupPath = createPreMigrationBackup(db, `before-rollback-${toVersion}`);
    console.log(`💾 Rollback backup created: ${backupPath}`);

    tx(() => {
      // Rollback in REVERSE order
      for (let v = currentVersion; v > toVersion; v--) {
        const migration = migrations.find(m => m.version === v);
        if (!migration) {
          throw new Error(`Migration ${v} not found for rollback`);
        }

        if (!migration.down || !migration.down.toString().includes('reversible')) {
          throw new Error(`Migration ${v} is not reversible - rollback cancelled`);
        }

        console.log(`  ↩️  Rolling back migration ${v}...`);
        migration.down(db);
        setUserVersion(db, v - 1);
      }

      console.log(`✅ Rollback to version ${toVersion} completed successfully`);
    });

  } catch (error) {
    console.error(`❌ Rollback failed: ${error.message}`);
    throw new Error(`Rollback to version ${toVersion} failed: ${error.message}`);
  }
}
```

**Impact:**
- ✅ Automatic rollback capability
- ✅ Backup before rollback
- ✅ Transactional safety
- ✅ Clear logging

---

### **FIX 2.2: Reversible Migration Pattern**

**New Pattern for All Migrations (027-046):**

```typescript
// src/main/db/migrations/027_add_theme_system.ts - EXAMPLE
export const migration027 = {
  version: 27,
  description: 'Add theme system tables',
  
  up: (db: Database) => {
    // Create tables, add columns, etc.
    db.exec(`
      CREATE TABLE themes (
        id INTEGER PRIMARY KEY,
        name TEXT NOT NULL,
        // ... columns ...
      );
    `);
    console.log('✅ Migration 027: Theme system created');
  },

  down: (db: Database) => {
    // IMPORTANT: Must be reversible and safe
    if (!db.exec("PRAGMA table_info(themes);").length) {
      console.log('⚠️  Migration 027: Theme tables already dropped, skipping');
      return;
    }
    
    db.exec(`
      DROP TABLE IF EXISTS themes;
      DROP TABLE IF EXISTS theme_colors;
      DROP TABLE IF EXISTS user_theme_preferences;
    `);
    console.log('↩️  Migration 027: Theme system removed');
  },

  reversible: true,  // ← Flag indicating this is reversible
  downSafe: true      // ← Flag for down() safety checks
};
```

**Migration 043 Special Handling (Non-Reversible):**

```typescript
export const migration043 = {
  version: 43,
  description: 'Convert legacy navigation modes',
  reversible: false,  // ← Mark as non-reversible
  
  up: (db: Database) => {
    // Data migration: header-* → mode-*
    // This transformation cannot be undone
  },

  down: (db: Database) => {
    throw new Error(
      'Migration 043 is NOT reversible: Legacy mode conversion is data-destructive. ' +
      'Restore from backup if needed.'
    );
  }
};
```

**Impact:**
- ✅ All migrations now have reversible down() methods
- ✅ Metadata flags for safety checking
- ✅ Clear error messages for non-reversible migrations

---

### **FIX 2.3: Error Dialog + Rollback UI**

**New Error Handler (electron/main.ts):**

```typescript
async function createWindow() {
  try {
    const db = getDb();
    await runAllMigrations();
  } catch (migrationError) {
    console.error('❌ Migration failed:', migrationError.message);

    // Show error dialog to user
    const result = await dialog.showMessageBox({
      type: 'error',
      title: 'Database Update Failed',
      message: 'Failed to update the database to the latest version.',
      detail: migrationError.message,
      buttons: ['Exit App', 'Restore from Backup', 'Try Again'],
      defaultId: 0,
      cancelId: 0
    });

    switch (result.response) {
      case 1: // Restore from Backup
        await recoverFromBackup();  // → FIX 3.1
        process.exit(0);
        break;
      case 2: // Try Again
        process.exit(1);  // Signal for restart
        break;
      default:
        process.exit(1);  // Exit
    }
  }
}
```

**IPC Handler for Recovery:**

```typescript
// electron/ipc/recovery.ts
ipcMain.handle('recovery:restore-backup', async (event, backupPath: string) => {
  try {
    await BackupService.restoreFromBackup(backupPath);
    return { success: true, message: 'Backup restored successfully' };
  } catch (error) {
    return { success: false, error: error.message };
  }
});
```

**Impact:**
- ✅ User-friendly error dialogs
- ✅ Self-recovery options
- ✅ Graceful failure handling

---

### **FIX 3.1: Backup IPC Handlers**

**New File: electron/ipc/backups.ts**

```typescript
import { ipcMain, dialog } from 'electron';
import { BackupService } from '../services/BackupService';

export function setupBackupHandlers() {
  // List available backups
  ipcMain.handle('backups:list', async () => {
    try {
      const backups = await BackupService.listAvailableBackups();
      return { success: true, backups };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  // Get backup metadata
  ipcMain.handle('backups:get-metadata', async (event, backupPath: string) => {
    try {
      const metadata = await BackupService.getBackupMetadata(backupPath);
      return { success: true, metadata };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  // Restore from backup
  ipcMain.handle('backups:restore', async (event, backupPath: string) => {
    try {
      await BackupService.restoreFromBackup(backupPath);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  // Validate backup integrity
  ipcMain.handle('backups:validate', async (event, backupPath: string) => {
    try {
      const isValid = await BackupService.validateBackupIntegrity(backupPath);
      return { success: true, isValid };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });
}
```

**Impact:**
- ✅ UI can now access backup operations
- ✅ All backup operations through IPC
- ✅ Standardized error handling

---

### **FIX 3.2: Backup UI Component**

**New React Component: src/renderer/src/components/Settings/BackupPanel.tsx**

```typescript
export const BackupPanel: React.FC = () => {
  const [backups, setBackups] = useState<BackupInfo[]>([]);
  const [selectedBackup, setSelectedBackup] = useState<BackupInfo | null>(null);
  const [restoring, setRestoring] = useState(false);

  useEffect(() => {
    loadBackups();
  }, []);

  const loadBackups = async () => {
    const result = await window.electronAPI.invoke('backups:list');
    if (result.success) {
      setBackups(result.backups);
    }
  };

  const handleRestore = async (backup: BackupInfo) => {
    const confirmed = await dialog.showMessageBox({
      type: 'warning',
      message: 'Restore from Backup?',
      detail: `This will replace your current database with the backup from ${backup.metadata?.timestamp}. Continue?`,
      buttons: ['Cancel', 'Restore']
    });

    if (confirmed.response === 1) {
      setRestoring(true);
      const result = await window.electronAPI.invoke('backups:restore', backup.path);
      setRestoring(false);

      if (result.success) {
        showNotification('Backup restored. App will restart...', 'success');
        setTimeout(() => window.location.reload(), 2000);
      } else {
        showNotification(`Restore failed: ${result.error}`, 'error');
      }
    }
  };

  return (
    <div className="backup-panel">
      <h2>Database Backups</h2>
      <p>Manage and restore from previous database backups</p>
      
      <div className="backup-list">
        {backups.map(backup => (
          <div key={backup.path} className="backup-item">
            <div className="backup-info">
              <span className="timestamp">{backup.metadata?.timestamp}</span>
              <span className="version">Schema v{backup.metadata?.schemaVersion}</span>
              <span className="size">{(backup.size / 1024 / 1024).toFixed(2)} MB</span>
            </div>
            <button
              onClick={() => handleRestore(backup)}
              disabled={restoring}
              className="restore-btn"
            >
              {restoring ? 'Restoring...' : 'Restore'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
```

**Impact:**
- ✅ User-friendly backup management UI
- ✅ Visual backup metadata
- ✅ One-click restore functionality

---

### **FIX 3.3: Backup Metadata System**

**Enhanced BackupService:**

```typescript
export interface BackupMetadata {
  timestamp: string;         // ISO timestamp
  schemaVersion: number;     // Current schema version
  fromMigration: number;     // Which migration created this
  environment: 'dev' | 'prod';
  appVersion: string;        // App version at backup time
  reason: string;            // Why backup was created (pre-migration, manual, etc)
  databaseSize: number;      // Size in bytes
  checksum: string;          // For integrity validation
}

export class BackupService {
  static async createPreMigrationBackup(
    db: Database,
    reason: string = 'pre-migration'
  ): Promise<string> {
    const timestamp = new Date().toISOString();
    const schemaVersion = getUserVersion(db);
    const metadata: BackupMetadata = {
      timestamp,
      schemaVersion,
      fromMigration: schemaVersion,
      environment: isDev ? 'dev' : 'prod',
      appVersion: app.getVersion(),
      reason,
      databaseSize: fs.statSync(this.getDbPath()).size,
      checksum: await this.calculateChecksum()
    };

    const backupPath = `${this.getDbPath()}.backup-${timestamp.replace(/[:.]/g, '-')}`;
    
    // Save metadata
    const metadataPath = `${backupPath}.meta.json`;
    fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2));

    // Create backup via VACUUM INTO
    db.exec(`VACUUM INTO '${backupPath}'`);

    console.log(`✅ Backup created: ${backupPath}`);
    return backupPath;
  }

  static async getBackupMetadata(backupPath: string): Promise<BackupMetadata> {
    const metadataPath = `${backupPath}.meta.json`;
    if (!fs.existsSync(metadataPath)) {
      throw new Error(`Metadata not found for backup: ${backupPath}`);
    }
    return JSON.parse(fs.readFileSync(metadataPath, 'utf-8'));
  }

  static async validateBackupIntegrity(backupPath: string): Promise<boolean> {
    try {
      const metadata = await this.getBackupMetadata(backupPath);
      const currentChecksum = await this.calculateFileChecksum(backupPath);
      return metadata.checksum === currentChecksum;
    } catch {
      return false;
    }
  }

  private static async calculateChecksum(): Promise<string> {
    // Use crypto to generate SHA256 checksum
    // Prevents backup corruption
  }
}
```

**Impact:**
- ✅ Rich metadata for each backup
- ✅ Integrity validation
- ✅ Environment and version tracking

---

### **FIX 3.4: Backup Directory Organization**

**New Directory Structure:**

```
AppData/Roaming/Electron/database/
├── rawalite.db                           (Current production DB)
├── rawalite-dev.db                       (Development DB - NEW)
├── backups/                              (NEW - Organized backup directory)
│   ├── 2025-11-03T10-30-45.000Z.db
│   ├── 2025-11-03T10-30-45.000Z.db.meta.json
│   ├── 2025-11-02T15-20-30.000Z.db
│   ├── 2025-11-02T15-20-30.000Z.db.meta.json
│   ├── pre-migration-045/
│   │   ├── 2025-11-01T08-15-00.000Z.db
│   │   └── 2025-11-01T08-15-00.000Z.db.meta.json
│   └── manual-recovery/
│       ├── 2025-10-31T11-46-19.db      (Current "damaged" backup)
│       └── 2025-10-31T11-46-19.db.meta.json
```

**Backup Organization Logic:**

```typescript
enum BackupCategory {
  AUTO_PRE_MIGRATION = 'pre-migration',
  AUTO_DAILY = 'daily',
  MANUAL = 'manual',
  RECOVERY = 'recovery'
}

export class BackupService {
  static getBackupDirectory(category: BackupCategory = 'auto'): string {
    const baseDir = path.join(path.dirname(this.getDbPath()), 'backups');
    
    switch (category) {
      case BackupCategory.AUTO_PRE_MIGRATION:
        return path.join(baseDir, 'pre-migration');
      case BackupCategory.MANUAL:
        return path.join(baseDir, 'manual');
      case BackupCategory.RECOVERY:
        return path.join(baseDir, 'recovery');
      default:
        return baseDir;
    }
  }
}
```

**Impact:**
- ✅ Organized backup storage
- ✅ Easy to find specific backup types
- ✅ Scalable for many backups

---

## 🔄 **PHASE 4: BACKUP RECOVERY & RESTORE STRATEGY**

### **Available Backups in System**

**Production Database Location:** `C:\Users\ramon\AppData\Roaming\Electron\database\`

| Backup File | Size | Date | Quality | Notes |
|:--|:--|:--|:--|:--|
| `rawalite.db.backup-current-damaged-2025-10-31-11-46-19` | 5.2 MB | 2025-10-31 08:20:36 | ⚠️ CAUTION | **MARKED AS DAMAGED** - User reported corruption |
| `rawalite.db.backup-before-045-rollback-1761591346891` | 5.2 MB | 2025-10-27 19:55:46 | ✅ GOOD | Pre-Migration 045 backup (rollback marker) |
| `rawalite.db.backup-1761332960186` | 5.2 MB | 2025-10-24 20:44:41 | ✅ GOOD | Pre-Migration 044 backup |
| `rawalite.db` (current) | 5.2 MB | 2025-10-27 19:55:46 | ⚠️ UNKNOWN | May be corrupted or in migration-fail state |

**Development Backups (Local):** `C:\Users\ramon\Desktop\RawaLite\db\archive-migration-backups\`

| Backup File | Size | Date | Notes |
|:--|:--|:--|:--|
| `after-migration-040-fresh.db` | 5.2 MB | 2025-10-22 08:56:28 | Post-migration-040 clean snapshot |
| `after-migration-040.db` | 5.2 MB | 2025-10-22 08:56:28 | Post-migration-040 backup |
| `real-rawalite.db` | 5.2 MB | 2025-10-22 08:56:28 | Marked as "real" production DB |

---

### **SCENARIO 1: User Wants to Recover from Damaged Backup**

**Goal:** Restore production database from before-corruption state

**Prerequisites:**
- [ ] Close RawaLite application completely
- [ ] Backup current corrupted DB: `rawalite.db.backup-corrupted-$(date).db`
- [ ] Verify restore backup has valid structure

**Recovery Steps:**

```powershell
# Step 1: Stop all processes
taskkill /F /IM electron.exe 2>$null
taskkill /F /IM node.exe 2>$null

# Step 2: Backup current corrupted DB
$timestamp = Get-Date -Format "yyyy-MM-dd-HH-mm-ss"
Copy-Item `
  "C:\Users\ramon\AppData\Roaming\Electron\database\rawalite.db" `
  "C:\Users\ramon\AppData\Roaming\Electron\database\rawalite.db.backup-corrupted-$timestamp"

# Step 3: Restore from best backup (before-045-rollback)
Copy-Item `
  "C:\Users\ramon\AppData\Roaming\Electron\database\rawalite.db.backup-before-045-rollback-1761591346891" `
  "C:\Users\ramon\AppData\Roaming\Electron\database\rawalite.db"

# Step 4: Verify file exists and has correct size
Get-Item "C:\Users\ramon\AppData\Roaming\Electron\database\rawalite.db" | `
  ForEach-Object { Write-Host "✅ Restored DB: $($_.FullName), Size: $($_.Length) bytes" }

# Step 5: Restart app
& ".\scripts\MAINTAIN_INSTALL_VERIFY_CHECK.ps1"  # Verify installation

# Step 6: Validation
pnpm validate:critical-fixes
```

**Rollback If Needed:**
```powershell
# If restore didn't work, revert to corrupted version
Copy-Item `
  "C:\Users\ramon\AppData\Roaming\Electron\database\rawalite.db.backup-corrupted-$timestamp" `
  "C:\Users\ramon\AppData\Roaming\Electron\database\rawalite.db" -Force
```

**Validation Query:**
```sql
-- After restore, verify schema integrity
SELECT COUNT(*) as table_count FROM sqlite_master WHERE type='table';
PRAGMA integrity_check;  -- Should return 'ok'
```

---

### **SCENARIO 2: Incremental Rollback via Migration System**

**Goal:** If Migration 045 or 046 caused issues, rollback to Migration 044

**Prerequisites:**
- [ ] Fix 2.1 + 2.2 must be IMPLEMENTED first
- [ ] Rollback system must be in place

**Recovery Steps:**

```typescript
// Call from Recovery UI or CLI
await rollbackMigration(44);  // Rollback to schema version 44

// This will:
// 1. Create pre-rollback backup automatically
// 2. Execute migration 046.down() → remove migration_046_table
// 3. Execute migration 045.down() → rollback migration_045_changes
// 4. Update schema version to 44
// 5. Log all operations
```

**Validation:**
```bash
# Verify we're now at version 44
SELECT user_version FROM pragma_user_version;  # Should return 44
```

---

### **SCENARIO 3: Dev/Prod Separation Prevents Future Corruption**

**After Fix 1.1-1.3 Implementation:**

```
DEV WORKFLOW:
pnpm dev
  ↓
Uses: rawalite-dev.db (isolated, safe for testing)
  ↓
Can apply risky migrations without affecting production

PROD WORKFLOW:
./RawaLite-Setup-v1.0.71.exe
  ↓
Uses: rawalite.db (production data)
  ↓
Protected: Dev changes don't touch prod DB
```

**Result:** ✅ **Dev and prod databases NEVER collide again**

---

## 📋 **IMPLEMENTATION SEQUENCE**

### **WEEK 1: Emergency Fixes**

**DAY 1 (2-3 hours):**
- [ ] Fix 1.1: Database path separation (Database.ts)
- [ ] Fix 1.2: BackupService synchronization
- [ ] Fix 1.3: Main process database init
- [ ] Testing: `pnpm dev` uses rawalite-dev.db, prod uses rawalite.db
- [ ] Commit: "Fix: Implement Dev/Prod database separation"

**DAY 2 (1-2 hours):**
- [ ] Fix 1.4: Environment configuration module
- [ ] Fix 1.5: Pre-migration backup verification
- [ ] Fix 1.6: Config validation at startup
- [ ] Testing: Full startup sequence with environment logging
- [ ] Commit: "Fix: Add environment configuration and validation"

### **WEEK 2: Rollback System**

**DAY 3 (3-4 hours):**
- [ ] Fix 2.1: Implement rollbackMigration() function
- [ ] Fix 2.2: Convert all migrations 027-046 to have reversible down()
  - Start with low-risk migrations (027-035)
  - Then risky ones (043, 045)
  - Non-reversible migrations marked explicitly
- [ ] Testing: Test rollback for each migration
- [ ] Commit: "Fix: Implement comprehensive migration rollback system"

**DAY 4 (1-2 hours):**
- [ ] Fix 2.3: Add error dialog + rollback UI
- [ ] Fix 2.4: Pre-migration validation
- [ ] Testing: Simulate migration failure and verify recovery flow
- [ ] Commit: "Fix: Add error handling and user recovery options"

### **WEEK 3: Recovery UI**

**DAY 5 (2-3 hours):**
- [ ] Fix 3.1: Create backup IPC handlers
- [ ] Fix 3.2: Build backup management React component
- [ ] Fix 3.3: Backup metadata system
- [ ] Testing: UI backup list functionality
- [ ] Commit: "Feat: Add backup management UI"

**DAY 6 (1-2 hours):**
- [ ] Fix 3.4: Backup directory reorganization
- [ ] Testing: Verify backup organization, metadata, and restore flow
- [ ] Documentation: User guide for backup recovery
- [ ] Commit: "Feat: Organize backup storage and add restore functionality"

---

## ✅ **TESTING STRATEGY**

### **Unit Tests**

```typescript
// tests/unit/db/database.test.ts
describe('Database Path Separation', () => {
  it('should use rawalite-dev.db in development', () => {
    const path = getDbPath(true);  // isDev=true
    expect(path).toContain('rawalite-dev.db');
  });

  it('should use rawalite.db in production', () => {
    const path = getDbPath(false);  // isDev=false
    expect(path).toContain('rawalite.db');
  });
});

// tests/unit/db/migrations.test.ts
describe('Migration Rollback', () => {
  it('should rollback migration 027 successfully', async () => {
    await migration027.up(db);
    await migration027.down(db);
    // Verify tables are dropped
    expect(tableExists('themes')).toBe(false);
  });

  it('should reject rollback of non-reversible migration 045', async () => {
    expect(() => migration045.down(db)).toThrow();
  });
});
```

### **Integration Tests**

```bash
# Test full dev/prod separation
pnpm test:integration --dev     # Should use rawalite-dev.db
pnpm test:integration --prod    # Should use rawalite.db

# Test rollback system
pnpm test:rollback:all          # Test each migration rollback
pnpm test:rollback:migrations 43-46  # Test specific range
```

### **Manual QA**

```bash
# 1. Full dev workflow
pnpm clean:force
pnpm install
pnpm dev
# Verify: Uses rawalite-dev.db, migrations apply successfully

# 2. Production installation
pnpm build && pnpm dist
./install-local.cmd
# Verify: Uses rawalite.db, separate from dev

# 3. Recovery workflow
# Manually corrupt database
# Test restore from backup via UI
# Verify data integrity after restore
```

---

## 🎯 **SUCCESS CRITERIA**

### **Phase 1 Complete**
- [ ] ✅ Dev uses `rawalite-dev.db`, Prod uses `rawalite.db`
- [ ] ✅ No more database collisions between dev and prod
- [ ] ✅ Startup logs clearly show environment and DB path
- [ ] ✅ Tests pass: dev/prod path separation verified

### **Phase 2 Complete**
- [ ] ✅ `rollbackMigration()` function exists and works
- [ ] ✅ All migrations 027-046 have reversible `down()` methods
- [ ] ✅ Non-reversible migrations clearly marked
- [ ] ✅ Migration failure shows user-friendly error dialog
- [ ] ✅ Pre-migration backups created automatically
- [ ] ✅ Tests pass: each migration can rollback successfully

### **Phase 3 Complete**
- [ ] ✅ Backup list accessible via UI
- [ ] ✅ Backup metadata shows schema version, timestamp, environment
- [ ] ✅ One-click restore from UI
- [ ] ✅ Backup integrity validation working
- [ ] ✅ Backups organized in dedicated directory
- [ ] ✅ Tests pass: UI restore flow verified

### **Overall**
- [ ] ✅ Production database integrity guaranteed
- [ ] ✅ Zero risk of dev/prod collision
- [ ] ✅ Users can recover from any migration failure
- [ ] ✅ User-friendly recovery UI available
- [ ] ✅ All critical fixes preserved
- [ ] ✅ `pnpm validate:critical-fixes` passes ✅

---

## 📊 **EFFORT & TIMELINE SUMMARY**

| Phase | Effort | Timeline | Risk | Status |
|:--|:--|:--|:--|:--|
| Phase 1: Emergency | 1-2 days | ASAP | 🟢 LOW | **CRITICAL - Do First** |
| Phase 2: Rollback | 2-3 days | Week 2 | 🟡 MEDIUM | **HIGH PRIORITY** |
| Phase 3: Recovery UI | 1 day | Week 3 | 🟢 LOW | **Standard Priority** |
| **TOTAL** | **4-6 days** | **3 weeks** | | **READY FOR IMPLEMENTATION** |

---

## 🔒 **RISK MITIGATION**

| Risk | Mitigation | Owner |
|:--|:--|:--|
| Breaking changes in Phase 1 | Start with dev path, test thoroughly before prod path | Developer |
| Migration rollback failures | Implement dry-run mode first, test on copy of prod DB | Developer |
| User data loss on restore | Always create backup before restore, show confirmation | UI/Developer |
| Missing backup metadata | Store metadata alongside backup file | Developer |
| Backup disk space | Archive old backups monthly, implement retention policy | DevOps |

---

## 📝 **DOCUMENTATION TODOS**

- [ ] User Guide: "How to Restore from Backup"
- [ ] Developer Guide: "Migration Rollback System"
- [ ] API Documentation: IPC backup handlers
- [ ] Release Notes: Dev/Prod separation, recovery features
- [ ] Troubleshooting: Common backup/restore scenarios

---

## 🎯 **NEXT STEPS**

1. **IMMEDIATELY:** Review this plan with development team
2. **WEEK 1:** Implement Phase 1 (Emergency Fixes)
3. **WEEK 2:** Implement Phase 2 (Rollback System)
4. **WEEK 3:** Implement Phase 3 (Recovery UI)
5. **BEFORE RELEASE:** Full QA + backup recovery scenario testing
6. **RELEASE:** v1.0.72+ with all fixes included

---

*Comprehensive Fix Strategy - Ready for Implementation | 03.11.2025*
