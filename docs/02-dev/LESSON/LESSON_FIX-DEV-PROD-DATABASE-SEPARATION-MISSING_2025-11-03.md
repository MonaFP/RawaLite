# LESSON_FIX-DEV-PROD-DATABASE-SEPARATION-MISSING_2025-11-03

> **Erstellt:** 03.11.2025 | **Letzte Aktualisierung:** 03.11.2025 (Initiale Dokumentation – CRITICAL ISSUE)  
> **Status:** Lesson Learned - Critical Design Flaw | **Typ:** Architecture Flaw - Database  
> **Schema:** `LESSON_FIX-DEV-PROD-DATABASE-SEPARATION-MISSING_2025-11-03.md`

> **🤖 KI-AUTO-DETECTION SYSTEM:**
> - **AKTUELLER STATUS:** Critical Issue (automatisch durch "Database Separation Missing", "Dev-Prod Conflict" erkannt)
> - **TEMPLATE-QUELLE:** 02-dev/LESSON/ Template
> - **AUTO-UPDATE:** Bei ähnlichen DB-Architektur-Problemen automatisch diese Lösung referenzieren
> - **STATUS-KEYWORDS:** Erkannt durch "LESSON_FIX", "dev-prod-database", "separation missing"

## 🚨 **PROBLEM: Dev und Prod nutzen GLEICHE Datenbank**

### **Kritikalität: 🔴 CRITICAL (Production Data Corruption Risk)**

---

## 📊 **ISSUE ANALYSE**

### **Root Cause:**
Die Anwendung nutzt **für Development und Production die gleichen Datenbankpfade** ohne Umgebungs-Unterscheidung.

### **Code-Beweis:**

**1. Database.ts (KEINE Umgebungs-Erkennung):**
```typescript
// src/main/db/Database.ts Line 9-14
function getDbPath(): string {
  const userData = app.getPath('userData');  // ← KEIN isDev Check!
  return path.join(userData, 'database', 'rawalite.db');
}
// ERGEBNIS: Beide Dev und Prod → C:\Users\ramon\AppData\Roaming\Electron\database\rawalite.db
```

**2. electron/main.ts (isDev wird NICHT genutzt):**
```typescript
// electron/main.ts Line 27
const isDev = !app.isPackaged  // ← Variable existiert aber wird NICHT für DB verwendet!

// DATABASE-NUTZUNG (keine Unterscheidung):
app.whenReady().then(async () => {
  getDb()  // ← Ruft getDbPath() auf, die keine isDev Unterscheidung macht
  await runAllMigrations()  // ← Gegen SAME database laufen
  createWindow()  // ← Mit SAME database
});
```

**3. BackupService.ts (KOPIERT das Problem):**
```typescript
// src/main/db/BackupService.ts Line 9-14
function getDbPath(): string {
  const userData = app.getPath('userData');  // ← GLEICHER Code!
  return path.join(userData, 'database', 'rawalite.db');
}
```

---

## 💥 **KONKRETE AUSWIRKUNGEN**

### **Szenario 1: Dev-Session überschreibt Prod-Daten**
```
Ablauf:
1. Benutzer installiert RawaLite v1.0.71 lokal
   → DB erstellt in: C:\Users\ramon\AppData\Roaming\Electron\database\rawalite.db
   → Produziert 100 Invoices, 50 Customers, etc.

2. Developer startet `pnpm dev` auf gleicher Machine
   → Lädt SAME Database!
   → Neue Migrations (043-046) werden gegen Prod-Daten gelaufen
   
3. Migration 043 konvertiert Legacy-Modes
   → Wenn Fehler: DB ist beschädigt
   → Prod-Installation betroffen!
   
4. Benutzer startet App wieder
   → Sieht keine Daten, oder Constraints-Fehler
```

### **Szenario 2: Lokale Installation gelöscht sich selbst**
```
Ablauf:
1. Benutzer installiert Prod-Build (v1.0.71)
2. Dev startet `pnpm build && pnpm dist` lokal
   → New Build erstellt mit Migration 047+
3. Dev testet neue Installation
   → Migrations werden GEGEN ALT-DB gelaufen!
   → Alte Daten werden konvertiert zu neuem Schema
4. Benutzer startet ALTE Installation wieder
   → Alte App erwartet altes Schema
   → "Table column not found" Fehler
```

### **Szenario 3: Backup-Chaos**
```
BackupService.ts macht Backups zur gleichen Location:
- pre-migration-2025-11-03T10-15-47.sqlite
- pre-migration-2025-11-02T15-22-33.sqlite

PROBLEM: Wer hat diese Backups erstellt?
- Prod-Migration? Dev-Session? Build-Test?
→ KEINE TRACEABILITY → Verwirrendes Debugging
```

---

## 📋 **WARUM RÜCKWÄRTSKOMPATIBILITÄT KRITISCH IST**

### **Code-Beweis (MigrationService.ts):**
```typescript
// Line 46-92: Nur FORWARD Migrations!
tx((db) => {
  for (const migration of pendingMigrations) {
    migration.up(db);  // ← NUR up(), kein down()!
    setUserVersion(targetVersion);
  }
});

// NO ROLLBACK FUNCTION EXISTIERT!
// export function rollbackMigration(toVersion) { ... } ← DOESN'T EXIST
```

### **Nicht-Reversible Migrations (Code-Beweis):**
```typescript
// Migration 043: convert_legacy_navigation_modes.ts
export const migration043: Migration = {
  version: 43,
  name: 'convert_legacy_navigation_modes',
  
  up(db) {
    // Konvertiert Legacy-Modes → KI-safe Modes
    db.exec('CREATE TABLE user_navigation_preferences_new ...');
    db.exec('INSERT INTO ... CASE ... END');
    db.exec('DROP TABLE user_navigation_preferences');
    db.exec('ALTER TABLE user_navigation_preferences_new RENAME ...');
  },
  
  down(db) {
    throw new Error('Migration 043 is not reversible');  // ← BLÖCKED!
  }
}

// Migration 045: enforce_ki_safe_navigation.ts
export const migration045: Migration = {
  down(db) {
    throw new Error('Migration 045 is not reversible – KI-safe schema is mandatory');  // ← BLÖCKED!
  }
}
```

### **Konsequenzen bei Fehler:**
```
1. Migration 043-046 hat Fehler
   → Exception wird geworfen
   → Transaktion wird ROLLED BACK (ok)
   
2. ABER: Falls Migration nur TEILWEISE fehlschlägt?
   → user_navigation_preferences ist HALBTRANSFORMIERT
   → alte + neue Spalten existieren nicht
   
3. KEINE MÖGLICHKEIT zum Rollback zu älteren Version
   → Benutzer kann nicht downgraden
   → Muss auf Bugfix warten oder DB löschen
```

---

## 🔧 **ARCHITECTURE DESIGN FLAW**

### **Was HÄTTE sein sollen (Best Practice):**
```typescript
// SZENARIO A: Environment-basierte Separation (Empfohlen)
function getDbPath(): string {
  const userData = app.getPath('userData');
  
  // Umgebungs-Check
  if (!app.isPackaged) {
    // Development: separate DB
    return path.join(userData, 'database', 'rawalite-dev.db');
  } else {
    // Production: main DB
    return path.join(userData, 'database', 'rawalite.db');
  }
}

// SZENARIO B: App-Name-basierte Separation (Alternative)
function getDbPath(): string {
  const appName = app.getName();  // "RawaLite-Dev" vs "RawaLite"
  const userData = app.getPath('userData');
  return path.join(userData, appName, 'database', 'rawalite.db');
}

// SZENARIO C: explicit Configuration (Most Control)
function getDbPath(): string {
  const env = process.env.RAWALITE_ENV || 'production';
  const userData = app.getPath('userData');
  
  if (env === 'development') {
    return path.join(userData, 'database', 'rawalite-dev.db');
  } else if (env === 'staging') {
    return path.join(userData, 'database', 'rawalite-staging.db');
  } else {
    return path.join(userData, 'database', 'rawalite.db');
  }
}
```

### **Was AKTUELL ist (FEHLERHAFT):**
```typescript
// ❌ BEIDE Dev und Prod nutzen GLEICHE Database!
function getDbPath(): string {
  const userData = app.getPath('userData');
  return path.join(userData, 'database', 'rawalite.db');  // ← NO DISTINCTION
}
```

---

## 📊 **BACKUP-STRATEGIE ANALYSE**

### **Was POSITIV ist (MigrationService.ts):**
```typescript
// Line 14-30: Pre-Migration Backups WERDEN erstellt ✅
function createPreMigrationBackup(): string | null {
  const userData = app.getPath('userData');
  const backupDir = path.join(userData, 'database', 'backups');
  
  fs.mkdirSync(backupDir, { recursive: true });
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupPath = path.join(backupDir, `pre-migration-${timestamp}.sqlite`);
  
  db.exec(`VACUUM INTO '${backupPath}'`);  // Cold backup erstellt
  return backupPath;
}
```

**Location der Backups:**
```
C:\Users\ramon\AppData\Roaming\Electron\database\backups\
├── pre-migration-2025-11-03T10-15-47.sqlite  (PROD-Backup?)
├── pre-migration-2025-11-02T15-22-33.sqlite  (DEV-Backup oder PROD?)
├── pre-migration-2025-10-29T14-33-12.sqlite  (Unklar!)
└── ...
```

### **Was PROBLEMATISCH ist:**
1. **Keine Traceability:** Ist das Backup von Dev oder Prod?
2. **Falsche Location:** Backup speichert sich IN SAME DATABASE-DIR (sollte separater Ordner sein)
3. **Keine Kennzeichnung:** Backups haben keinen Kontext (App-Version, Environment, etc.)
4. **Keine Wiederherstellung:** Kein IPC-Handler, um Backup zurück zu laden

---

## 🎯 **EMPFOHLENE FIXES**

### **PRIORITY 1 (CRITICAL): Dev/Prod Database Separation**

**Fix in src/main/db/Database.ts:**
```typescript
function getDbPath(): string {
  const userData = app.getPath('userData');
  const isDev = !app.isPackaged;  // Development erkennen
  
  if (isDev) {
    // Development → separate database
    console.log('[DB] Using DEVELOPMENT database');
    return path.join(userData, 'database', 'rawalite-dev.db');
  } else {
    // Production → main database
    console.log('[DB] Using PRODUCTION database');
    return path.join(userData, 'database', 'rawalite.db');
  }
}
```

**Fix in BackupService.ts (COPY-PASTE gleicher Code):**
```typescript
function getDbPath(): string {
  const userData = app.getPath('userData');
  const isDev = !app.isPackaged;  // MUST MATCH Database.ts!
  
  if (isDev) {
    return path.join(userData, 'database', 'rawalite-dev.db');
  } else {
    return path.join(userData, 'database', 'rawalite.db');
  }
}
```

### **PRIORITY 2 (HIGH): Reversible Migrations (Rollback Support)**

**Neue Funktion in MigrationService.ts:**
```typescript
export async function rollbackMigration(toVersion: number): Promise<void> {
  const currentVersion = getUserVersion();
  
  if (toVersion >= currentVersion) {
    console.log('No rollback needed');
    return;
  }
  
  const migrationsToRollback = migrations.filter(m => m.version > toVersion);
  
  console.log(`Rolling back from version ${currentVersion} to ${toVersion}`);
  
  // Create backup before rollback
  createPreMigrationBackup();
  
  try {
    tx((db) => {
      // Go backward through migrations
      for (const migration of migrationsToRollback.reverse()) {
        if (!migration.down) {
          throw new Error(`Migration ${migration.version} (${migration.name}) does not support rollback`);
        }
        
        console.log(`Rolling back migration ${migration.version}`);
        migration.down(db);
      }
      
      setUserVersion(toVersion);
    });
    
    console.log(`✅ Rollback to version ${toVersion} completed`);
  } catch (error) {
    console.error('❌ Rollback failed:', error);
    throw error;
  }
}
```

**Update Migration 043-046 `down()` Funktionen:**
```typescript
// Migration 043: Sollte reversible sein
down(db) {
  // Restore old table structure
  db.exec(`ALTER TABLE user_navigation_preferences RENAME TO user_navigation_preferences_v2`);
  db.exec(`... restore old schema ...`);
}

// Migration 045: Mark as reversible mit Warnung
down(db) {
  // Implement actual rollback (oder throw mit besserer Message)
  console.warn('⚠️ Rolling back Migration 045 may lose data');
  // Implement specific rollback logic
}
```

### **PRIORITY 3 (MEDIUM): Backup Management UI**

**IPC Handler (electron/ipc/backup.ts):**
```typescript
ipcMain.handle('backup:list', async () => {
  const backupDir = path.join(app.getPath('userData'), 'database', 'backups');
  const files = fs.readdirSync(backupDir);
  return files.map(f => ({
    name: f,
    path: path.join(backupDir, f),
    size: fs.statSync(path.join(backupDir, f)).size,
    created: fs.statSync(path.join(backupDir, f)).birthtime
  }));
});

ipcMain.handle('backup:restore', async (event, backupPath: string) => {
  const validPath = path.join(app.getPath('userData'), 'database', 'backups', path.basename(backupPath));
  
  if (backupPath !== validPath) {
    throw new Error('Invalid backup path');
  }
  
  // Copy backup to main database
  const mainDbPath = path.join(app.getPath('userData'), 'database', 'rawalite.db');
  fs.copyFileSync(validPath, mainDbPath);
  
  console.log(`✅ Restored backup from ${validPath}`);
});
```

---

## 📌 **VALIDATION TESTS**

### **Test 1: Dev-DB ist wirklich getrennt**
```bash
# Terminal 1: Start prod installation
./dist-release/RawaLite-Setup-1.0.71.exe

# Terminal 2: Start dev version
pnpm dev

# Verify two different databases:
ls "C:\Users\ramon\AppData\Roaming\Electron\database\"
# Should show:
# - rawalite.db (Prod, unchanged)
# - rawalite-dev.db (Dev, changes only)
```

### **Test 2: Backups haben Kontext**
```bash
# Run pre-migration backup
# Check backup directory:
ls "C:\Users\ramon\AppData\Roaming\Electron\database\backups\"

# Verify backup metadata (timestamp, environment):
node -e "console.log(require('fs').statSync('./backup.db').birthmtime)"
```

### **Test 3: Rollback funktioniert**
```typescript
// In test:
await rollbackMigration(42);  // Should work
// Expect: Migration 043, 044, 045, 046 werden zurückgerollt
// Expect: Database schema zurück zu Version 42
// Expect: Alte Daten wiederhergestellt (falls möglich)
```

---

## 📚 **REFERENZEN**

- [src/main/db/Database.ts](../../../src/main/db/Database.ts) – Current database path (MISSING environment check)
- [src/main/db/MigrationService.ts](../../../src/main/db/MigrationService.ts) – Migration system (no rollback)
- [src/main/db/BackupService.ts](../../../src/main/db/BackupService.ts) – Backup system (copies problem)
- [electron/main.ts](../../../electron/main.ts) – App initialization (isDev unused for DB)
- [Migration 043-046 files](../../../src/main/db/migrations/) – Non-reversible migrations

---

## 🚀 **NÄCHSTE SCHRITTE**

1. **SOFORT:** Dev/Prod Database Separation implementieren (kritisch!)
2. **HEUTE:** Migration `down()` Funktionen für alle 043-046 implementieren
3. **DIESE WOCHE:** Backup Management UI einbauen
4. **VALIDATION:** Alle drei Tests durchführen und dokumentieren

---

**📍 Location:** `docs/02-dev/LESSON/LESSON_FIX-DEV-PROD-DATABASE-SEPARATION-MISSING_2025-11-03.md`  
**Purpose:** Dokumentation des kritischen Design-Fehlers: Dev/Prod Database Separation fehlt komplett  
**Status:** Action Required – Production Data Corruption Risk  
**Priority:** CRITICAL (implement Dev/Prod separation BEFORE next release)

*Letzte Aktualisierung: 03.11.2025 – Critical issue identified during startup failure analysis*
