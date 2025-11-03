# LESSON_FIX-ELECTRON-BUILDER-APP-ASAR-LOCK_2025-11-03

> **Erstellt:** 03.11.2025 | **Letzte Aktualisierung:** 03.11.2025 (Initiale Dokumentation)  
> **Status:** Lesson Learned | **Typ:** Debugging Fix  
> **Schema:** `LESSON_FIX-ELECTRON-BUILDER-APP-ASAR-LOCK_2025-11-03.md`

> **🤖 KI-AUTO-DETECTION SYSTEM:**
> - **AKTUELLER STATUS:** Lesson Learned (automatisch durch "app.asar lock", "electron-builder fix" erkannt)
> - **TEMPLATE-QUELLE:** 02-dev/LESSON/ Template
> - **AUTO-UPDATE:** Bei ähnlichen Build-Problemen automatisch diese Lösung referenzieren
> - **STATUS-KEYWORDS:** Erkannt durch "LESSON_FIX", "electron-builder", "app.asar lock"

## 🚨 **PROBLEM: electron-builder kann app.asar nicht überschreiben**

### **Fehlermeldung:**
```
⨯ remove C:\Users\ramon\Desktop\RawaLite\dist-release\win-unpacked\resources\app.asar: The process cannot access the file because it is being used by another process.
```

### **Root Cause Analysis:**
- VS Code hält File-Handles auf Build-Artefakte
- Output-Verzeichnis ist Teil des VS Code Workspaces
- Build-Prozess kann existierende Dateien nicht überschreiben

### **Impact:**
- Build-Pipeline blockiert
- Distribution nicht möglich
- Entwicklungsprozess unterbrochen

## 🔧 **LÖSUNG**

### **Sofort-Fix für diese Session:**
1. Alle node.exe und electron.exe Prozesse beenden
2. Build & Dist Task ausführen
3. Falls nötig, VS Code neustarten

### **Langfristige Lösung (bereits implementiert):**
```yaml
# electron-builder.yml
directories:
  output: dist-release  # Statt 'release' oder default
```

### **Zusätzliche Absicherung:**
```yaml
# electron-builder.yml
asarUnpack:
  - "node_modules/better-sqlite3/**/*"
  - "node_modules/bindings/**/*"
  - "node_modules/file-uri-to-path/**/*"
```

## 📊 **VALIDATION**

### **Test Matrix:**
| Test | Status | Notes |
|------|--------|-------|
| `pnpm build` | ✅ OK | TypeScript/Vite Build erfolgreich |
| `pnpm dist` | ✅ OK | electron-builder erfolgreich |
| Installation | ✅ OK | better-sqlite3 lädt korrekt |

### **Output-Validierung:**
```
dist-release/
├── win-unpacked/     ✅ Erfolgreich erstellt
├── builder-effective-config.yaml
└── latest.yml       ✅ Update-Manifest generiert
```

## 🎯 **PREVENTION**

### **Build Process Best Practices:**
1. IMMER vor Build prüfen: Keine blockierenden Prozesse
2. Output-Verzeichnis außerhalb des aktiven VS Code Workspaces
3. Native Module in `asarUnpack` konfigurieren
4. Build & Dist Task verwenden statt direkter Befehle

### **Validation Commands:**
```powershell
# Vor jedem Build:
taskkill /F /IM node.exe
taskkill /F /IM electron.exe

# Build starten:
pnpm run "🏗️ Build & Dist"
```

## � **ZUSÄTZLICHE ERKENNTNISSE (03.11.2025)**

### **1. ⚠️ RÜCKWÄRTSKOMPATIBILITÄT – KRITISCHE LÜCKE IDENTIFIZIERT**

**Problem:** Es gibt **KEINE Migration `down()` Funktionen** für Rollback!

**Code-Beweis (MigrationService.ts):**
```typescript
// Line 46-92: runAllMigrations() läuft NUR "up()"
tx((db) => {
  for (const migration of pendingMigrations) {
    migration.up(db);  // ← NUR up(), kein down() Aufruf möglich!
    setUserVersion(targetVersion);
  }
});
```

**Problematische Migrationen ohne `down()` (oder nicht-reversible):**
- Migration 043: `convert_legacy_navigation_modes` → Wirft Error in `down()`: "Migration 043 is not reversible"
- Migration 045: `enforce_ki_safe_navigation` → Wirft Error in `down()`: "Migration 045 is not reversible – KI-safe schema is mandatory"
- Migration 046: `add_navigation_mode_history` → `down()` in Migration 045 schlägt fehl, Cascade-Fehler

**Impact:**
- ❌ **KEINE Downgrade-Möglichkeit** von v1.0.71 zu älteren Versionen
- ❌ **DB-Fehler sind permanent** – wir können nicht zurückrollen
- ❌ **Benutzer sind gefangen** bei fehlerhafter Migration

**Warum das kritisch ist:**
Wenn Migration 043-046 bei einer Installation fehlschlägt (wie im Nov-3-Build), **KÖNNEN WIR NICHT ZURÜCKROLLEN**. Die App ist dann STUCK.

### **2. 🚨 CRITICAL: Dev & Prod nutzen GLEICHE Datenbank!**

**Code-Beweis (src/main/db/Database.ts + electron/main.ts):**
```typescript
// Database.ts (used in BOTH dev und prod):
function getDbPath(): string {
  const userData = app.getPath('userData');  // ← KEIN isDev Check!
  return path.join(userData, 'database', 'rawalite.db');
}

// electron/main.ts:
const isDev = !app.isPackaged  // ← Erkennt Packaged-Status, aber nutzt ihn nicht!
// Die Variable isDev wird NUR für Dev-Windows genutzt, NICHT für Datenbank!
```

**Das Problem:**
```
Development-Build (pnpm dev):
  → userData = C:\Users\ramon\AppData\Roaming\Electron\database\rawalite.db
  
Production-Build (dist-release Install):
  → userData = C:\Users\ramon\AppData\Roaming\Electron\database\rawalite.db
  
🔴 BEIDE nutzen den GLEICHEN Pfad und Datenbank!
```

**Konsequenzen:**
1. **Datenbank-Überschreibung:** Wenn Prod-Build mit Migration 043-046 die alte DB findet, wird sie konvertiert
2. **Unerwartete Migrations:** Dev-Sessions ändern die Prod-DB wenn lokal entwickelt wird
3. **Keine Isolation:** Keine Möglichkeit, Dev/Prod getrennt zu testen

**Architektur-Problem:**
- ✅ **PATHS System** existiert (`src/lib/paths.ts`) mit getAppDataPath(), DATABASE_DIR(), etc.
- ✅ **BackupService** existiert und erstellt Pre-Migration-Backups
- ❌ **ABER:** BackupService nutzt GLEICHE Pfade wie Produktion
- ❌ **ABER:** Keine Umgebungs-Erkennung zur Datenbankentrennung

### **3. 🗄️ BACKUP-SITUATION (Deine Frage zur Wiederherstellung)**

**Gute Nachrichten:**
```typescript
// MigrationService.ts Line 14-30: Pre-Migration Backups werden ERSTELLT!
function createPreMigrationBackup(): string | null {
  const backupDir = path.join(userData, 'database', 'backups');
  fs.mkdirSync(backupDir, { recursive: true });
  const backupPath = path.join(backupDir, `pre-migration-${timestamp}.sqlite`);
  db.exec(`VACUUM INTO '${backupPath}'`);  // ← Cold backup erstellt!
  return backupPath;
}
```

**Wo die Backups sind:**
```
C:\Users\ramon\AppData\Roaming\Electron\database\backups\
├── pre-migration-2025-11-03T10-15-47.sqlite
├── pre-migration-2025-11-02T15-22-33.sqlite
└── ...
```

**Wiederherstellung möglich:**
```powershell
# 1. App stoppen
# 2. Backup kopieren
Copy-Item "C:\Users\ramon\AppData\Roaming\Electron\database\backups\pre-migration-XXXXX.sqlite" `
         -Destination "C:\Users\ramon\AppData\Roaming\Electron\database\rawalite.db"

# 3. App neu starten
```

**ABER:** Das Backup ist wahrscheinlich VOR der fehlgeschlagenen Migration erstellt worden. **Falls die Fehler-Migration NACH dem Backup gelaufen ist, ist die DB beschädigt.**

---

## 📋 **EMPFOHLENE SOFORT-MAßNAHMEN (Aktion erforderlich)**

### **1. Dev/Prod Separation implementieren:**
```typescript
// src/main/db/Database.ts FIX:
function getDbPath(): string {
  const userData = app.getPath('userData');
  const isDev = !app.isPackaged;  // ← Environment-Check
  
  if (isDev) {
    // Dev-DB in separatem Pfad
    return path.join(userData, 'database', 'rawalite-dev.db');
  } else {
    // Prod-DB wie aktuell
    return path.join(userData, 'database', 'rawalite.db');
  }
}
```

**Alternative (besser):** Nutze `process.env.NODE_ENV` oder App-Name-basierte Trennung.

### **2. Migrations Rollback implementieren:**
```typescript
// MigrationService.ts: down() Funktion hinzufügen
export async function rollbackMigration(toVersion: number): Promise<void> {
  const currentVersion = getUserVersion();
  const migrationToRollback = migrations.filter(m => m.version > toVersion);
  
  tx((db) => {
    // Rückwärts durch Migrationen gehen
    for (const migration of migrationToRollback.reverse()) {
      if (migration.down) {
        migration.down(db);
      }
    }
    setUserVersion(toVersion);
  });
}
```

### **3. Backup-Wiederherstellung in UI einbauen:**
```typescript
// Create recovery command in IPC
ipcMain.handle('backup:restore', async (event, backupPath: string) => {
  // 1. App stoppen
  // 2. Backup-File kopieren zur Main-DB
  // 3. App neu starten
});
```

---

## �📚 **REFERENZEN**

- [VALIDATED_GUIDE-BUILD-SYSTEM_2025-10-26.md](../../docs/02-dev/VALIDATED/GUIDE/VALIDATED_GUIDE-BUILD-SYSTEM_2025-10-26.md)
- [SOLVED_FIX-ELECTRON-BUILDER-FILE-LOCKING-2025-10-15.md](../../docs/09-archive/backups/01-core-final-backup_2025-10-23_10-28-49/SOLVED_FIX-ELECTRON-BUILDER-FILE-LOCKING-2025-10-15.md)
- [src/main/db/MigrationService.ts](../../../src/main/db/MigrationService.ts) – Pre-Migration Backups
- [src/main/db/Database.ts](../../../src/main/db/Database.ts) – Database Path (KEINE Env-Trennung!)
- [electron/main.ts](../../../electron/main.ts) – App Initialization

---

**📍 Location:** `docs/02-dev/LESSON/LESSON_FIX-ELECTRON-BUILDER-APP-ASAR-LOCK_2025-11-03.md`  
**Purpose:** Dokumentation von Build-Locking, Rückwärtskompatibilität und Dev/Prod Separation  
**Status:** Erweiterter Bericht mit kritischen Erkenntnissen  
**Next Steps:** 
1. Dev/Prod DB Separation implementieren (CRITICAL)
2. Migration Rollback System bauen (HIGH)
3. Backup-Wiederherstellung in UI (MEDIUM)