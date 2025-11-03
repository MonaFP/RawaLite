# KNOWLEDGE_ONLY_FIX-PRODUCTION-DATABASE-RECOVERY-STRATEGY_2025-11-03

> **Erstellt:** 03.11.2025 | **Letzte Aktualisierung:** 03.11.2025 (Database Recovery Analysis)  
> **Status:** Knowledge Only – Historical Debug Knowledge | **Typ:** Recovery Strategy  
> **Schema:** `KNOWLEDGE_ONLY_FIX-PRODUCTION-DATABASE-RECOVERY-STRATEGY_2025-11-03.md`

> **🤖 KI-AUTO-DETECTION SYSTEM:**
> - **AKTUELLER STATUS:** Knowledge Only (automatisch durch "Production Database Recovery" erkannt)
> - **TEMPLATE-QUELLE:** 09-archive/Knowledge Template
> - **AUTO-UPDATE:** Bei ähnlichen Recovery-Szenarien automatisch diese Strategie referenzieren
> - **STATUS-KEYWORDS:** Erkannt durch "KNOWLEDGE_ONLY", "database recovery", "production backup"

---

## 🔴 **PROBLEM: Produktions-Datenbank wurde überschrieben**

**Annahme (basierend auf Debugging-Session Hinweis):**
- Lokale Produktions-Installation hat funktioniert
- Dev-Sessions oder fehlgeschlagene Migrationen haben die DB überschrieben
- Keine Daten-Backup (oder Backup ist auch beschädigt)

---

## 📋 **DATENBANK-RECOVERY STRATEGIEN**

### **SZENARIO 1: Pre-Migration Backup existiert und ist valid ✅**

**Was ist passiert:**
```
1. Migration 043-046 startet
2. MigrationService.ts erstellt Pre-Migration Backup:
   → C:\Users\ramon\AppData\Roaming\Electron\database\backups\pre-migration-2025-11-03T10-15-47.sqlite
3. Migration fehlgeschlagen oder fehlerhaft ausgeführt
4. Produktions-DB ist jetzt beschädigt oder leer
```

**Recovery-Prozess:**
```powershell
# Step 1: App stoppen (falls läuft)
Stop-Process -Name "RawaLite" -Force -ErrorAction SilentlyContinue
Stop-Process -Name "electron" -Force -ErrorAction SilentlyContinue

# Step 2: Backup-Datei finden und prüfen
$backupPath = "C:\Users\ramon\AppData\Roaming\Electron\database\backups"
Get-ChildItem $backupPath -Filter "pre-migration-*.sqlite" | Sort-Object LastWriteTime -Descending | Select-Object -First 5

# Output zeigt alle Pre-Migration Backups (neueste zuerst):
# pre-migration-2025-11-03T10-15-47.sqlite  (← Vor fehlgeschlagener Migration)
# pre-migration-2025-11-02T15-22-33.sqlite  (← Vor früherer Migration)
# ...

# Step 3: Aktuelles Main-DB Backup erstellen (für Debugging)
$mainDbPath = "C:\Users\ramon\AppData\Roaming\Electron\database\rawalite.db"
$debugBackup = "$mainDbPath.backup-corrupted-2025-11-03"
Copy-Item $mainDbPath -Destination $debugBackup

# Step 4: Gutes Backup wiederherstellen
# Wähle die neueste Backup-Datei VOR der Fehler-Migration:
$goodBackup = "C:\Users\ramon\AppData\Roaming\Electron\database\backups\pre-migration-2025-11-02T15-22-33.sqlite"
Copy-Item $goodBackup -Destination $mainDbPath -Force

# Step 5: App wieder starten
# Öffne RawaLite-Anwendung
# App erkennt alte Schema-Version und läuft neue Migrationen aus
```

**Validation nach Recovery:**
```bash
# In einem Dev-Terminal:
node scripts/ANALYZE_DATABASE_SQLJS_INSPECT.mjs

# Output sollte zeigen:
# ✅ Database opened successfully
# ✅ Schema version: 42 (oder Version VOR der fehlgeschlagenen Migrationen)
# ✅ All tables present and accessible
# ✅ Data count: [number of records recovered]
```

---

### **SZENARIO 2: Pre-Migration Backup beschädigt oder leer ❌**

**Was ist passiert:**
```
1. Backup wurde erstellt, aber...
2. Backup-Datei ist corrupted
3. Oder: Backup ist leer (0 bytes)
4. Oder: Backup-Prozes fehlgeschlagen
```

**Symptome:**
```
// Backup-Datei Größe prüfen:
Get-Item "C:\Users\ramon\AppData\Roaming\Electron\database\backups\pre-migration-*.sqlite" | Select-Object Length

# Wenn: Length = 0  → Backup ist leer!
# Wenn: Length < 1000  → Backup ist zu klein (wahrscheinlich corrupt)
```

**Recovery Strategy (Last Resort):**

#### **Option A: Database Schema rekonstruieren (Komplex)**
```typescript
// Wenn alte Daten nicht wiederherstellbar sind:
// 1. Lösche beschädigte Database
// 2. App wird neue leere DB erstellen
// 3. Migrationen werden auf sauberer DB laufen

// ABER: ALLE Benutzer-Daten sind verloren!
// → Nur wenn kein anderes Backup vorhanden ist
```

#### **Option B: Manual Backup von Alter Installation suchen**
```
Mögliche Stellen, wo Backup kopiert sein könnte:
1. OneDrive / Google Drive Backup
2. Windows-System Restore Point
3. Externe Festplatte (Time Machine / Backup Software)
4. Git-History (falls DB wurde mal gecommittet)
5. Cloud-Sync Service (Dropbox, iCloud, etc.)

Windows File History:
1. Öffne "Versions verlauf" auf dem Ordner
2. Navigiere zu: C:\Users\ramon\AppData\Roaming\Electron\database\
3. Suche ältere Version der rawalite.db vor der Beschädigung
4. Restore alte Version
```

---

### **SZENARIO 3: Keine Backups vorhanden 🔴**

**Was ist zu tun:**
```
1. Datenbank kann NICHT rekonstruiert werden
2. Neue leere Datenbank muss erstellt werden
3. Alle Daten gehen verloren (tragisch!)

Recovery:
// Lösche beschädigte DB
Remove-Item "C:\Users\ramon\AppData\Roaming\Electron\database\rawalite.db"

// App wird beim Neustart eine neue leere DB erstellen
// Alle Migrationen laufen auf sauberer Basis
// Benutzer kann von vorne anfangen
```

---

## 🔍 **DIAGNOSE: Ist das Backup wiederherstellbar?**

### **Backup-Validierung durchführen:**
```bash
# Terminal öffnen und Backup-Datei prüfen:
node scripts/ANALYZE_DATABASE_SQLJS_INSPECT.mjs C:\Users\ramon\AppData\Roaming\Electron\database\backups\pre-migration-2025-11-02T15-22-33.sqlite

# Ergebnis:
# ✅ Database is valid → Backup kann wiederhergestellt werden
# ❌ Database corrupted → Backup ist beschädigt, anderes versuchen
```

### **Alternative Validierungs-Methode (PowerShell):**
```powershell
# Prüfe ob SQLite-Datei gültig ist:
$backupPath = "C:\Users\ramon\AppData\Roaming\Electron\database\backups\pre-migration-2025-11-02T15-22-33.sqlite"

# Hole File-Size und Magic Bytes:
$file = Get-Item $backupPath
$bytes = [System.IO.File]::ReadAllBytes($backupPath) | Select-Object -First 16
$magic = [System.Text.Encoding]::ASCII.GetString($bytes)

if ($magic -like "SQLite format*") {
  Write-Host "✅ File is valid SQLite database"
} else {
  Write-Host "❌ File is NOT a valid SQLite database"
}

Write-Host "File size: $($file.Length) bytes"
if ($file.Length -lt 1000) {
  Write-Host "⚠️  File is very small, may be corrupted"
}
```

---

## 📋 **EMPFOHLENE PRÄVENTION (FUTURE)**

### **1. Backup-Strategie verbessern:**
```typescript
// MigrationService.ts sollte implementieren:

// A: Backup mit Kontext-Metadaten
function createPreMigrationBackup(): string | null {
  const backupDir = path.join(userData, 'database', 'backups');
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  
  // Metadaten speichern
  const metadata = {
    created: new Date().toISOString(),
    environment: app.isPackaged ? 'production' : 'development',
    appVersion: app.getVersion(),
    schemaVersion: getUserVersion(),
    migrationsAboutToRun: pendingMigrations.map(m => ({ version: m.version, name: m.name }))
  };
  
  fs.writeFileSync(
    path.join(backupDir, `pre-migration-${timestamp}.json`),
    JSON.stringify(metadata, null, 2)
  );
  
  // Backup erstellen
  const backupPath = path.join(backupDir, `pre-migration-${timestamp}.sqlite`);
  db.exec(`VACUUM INTO '${backupPath}'`);
  
  return backupPath;
}

// B: Automatic Nightly Backup (Optional)
function scheduleNightlyBackup(): void {
  // Jeden Tag um 2 AM ein Backup erstellen
  // Alte Backups nach 30 Tagen löschen
}
```

### **2. Backup-Wiederherstellung in UI integrieren:**
```typescript
// IPC Handler für Recovery
ipcMain.handle('database:restore-from-backup', async (event, backupPath: string) => {
  // 1. Validiere Backup
  // 2. Erstelle aktuelles Backup (debug purposes)
  // 3. Kopiere Backup zu Main-DB
  // 4. Restart App (oder neu verbinden)
  // 5. Migrations laufen auf wiederhergestellter DB
});
```

### **3. Migration Error Handling:**
```typescript
// MigrationService.ts:
export async function runAllMigrations(): Promise<void> {
  try {
    // Migrationen laufen...
  } catch (error) {
    console.error('Migration failed:', error);
    
    // Biete Benutzer Optionen:
    // 1. "Retry Migration" (Fix anpassen und erneut versuchen)
    // 2. "Restore from Backup" (Backup-Liste anzeigen)
    // 3. "Report to Developer" (Fehler berichten)
    // 4. "Cancel and Revert" (Transaktion rollback)
    
    ipcMain.emit('migration:error', {
      message: error.message,
      migration: currentMigration,
      options: ['retry', 'restore', 'report', 'revert']
    });
    
    // Warte auf Benutzer-Entscheidung...
  }
}
```

---

## 🎯 **RECOVERY CHECKLISTE (PRAKTISCH)**

### **Schritt 1: Status prüfen**
- [ ] App ist gestoppt (keine Lock-Files)
- [ ] Produktions-DB Pfad bekannt: `C:\Users\ramon\AppData\Roaming\Electron\database\rawalite.db`
- [ ] Backups Ordner überprüft: `C:\Users\ramon\AppData\Roaming\Electron\database\backups\`
- [ ] Backup-Dateien vorhanden? Ja/Nein → welche?

### **Schritt 2: Backup auswählen**
- [ ] Pre-migration Backups gelistet
- [ ] Backup-Validierung durchgeführt (ANALYZE_DATABASE_SQLJS_INSPECT.mjs)
- [ ] Älteste gültige Backup ausgewählt (sichere Option)
- [ ] Dateiname notiert: `pre-migration-XXXXX.sqlite`

### **Schritt 3: Recovery durchführen**
- [ ] Corrupted DB backed up (debug purposes)
- [ ] Gutes Backup kopiert zu Main-Location
- [ ] Datei-Permissions prüfen (read/write)
- [ ] App neu gestartet

### **Schritt 4: Validierung**
- [ ] App lädt ohne Fehler
- [ ] Daten sind vorhanden
- [ ] Migrationen laufen durch (falls nötig)
- [ ] UI ist responsiv

### **Schritt 5: Dokumentation**
- [ ] Welches Backup wurde wiederhergestellt?
- [ ] Wieviel Daten wurde verloren?
- [ ] Was war die Root Cause (Dev/Prod Mix? Migration-Fehler?)
- [ ] Was muss für Zukunft behoben werden?

---

## 📊 **BACKUP-ANALYSEBERICHT (Was ist in Backups?)**

**Typische Struktur:**
```
C:\Users\ramon\AppData\Roaming\Electron\database\backups\
├── pre-migration-2025-11-03T10-15-47.sqlite         (← Neueste, kurz VOR Fehler)
├── pre-migration-2025-11-02T15-22-33.sqlite         (← Einen Tag älter)
├── pre-migration-2025-10-29T14-33-12.sqlite         (← 5 Tage älter)
├── pre-migration-2025-10-26T11-45-22.sqlite         (← 8 Tage älter)
└── pre-migration-2025-10-20T09-12-55.sqlite         (← 14 Tage älter)
```

**Analyse:**
```bash
# Für jedes Backup:
1. Größe prüfen (sollte > 1MB sein für echte Daten)
2. Erstellt-Zeit prüfen (wann war letzte Migration?)
3. Datenbasis-Schema prüfen (Migrationen, Tables)
4. Daten-Count prüfen (Invoices, Customers, etc.)

# Beispiel-Analyse:
pre-migration-2025-11-03T10-15-47.sqlite
  → Size: 5.2 MB ✅ (großes DB)
  → Created: 03.11.2025 10:15 (kurz VOR Fehler)
  → Schema: Version 42 (VOR fehlgeschlagene Migrationen 043-046)
  → Data: 150 Invoices, 48 Customers ✅ (Daten vorhanden)
  
pre-migration-2025-11-02T15-22-33.sqlite
  → Size: 5.1 MB ✅
  → Created: 02.11.2025 15:22 (einen Tag älter, aber sicherer!)
  → Schema: Version 42
  → Data: 142 Invoices, 45 Customers ✅
```

---

## 🚀 **NÄCHSTE SCHRITTE**

1. **SOFORT:** 
   - Backup-Verzeichnis öffnen und Dateien auflisten
   - Neueste Backup mit ANALYZE_DATABASE_SQLJS_INSPECT.mjs validieren
   - Backup-Größe prüfen (sollte > 1MB sein)

2. **WENN BACKUP VALID:**
   - Recovery durchführen (siehe Szenario 1)
   - App neu starten
   - Daten-Präsenz validieren

3. **WENN BACKUP INVALID:**
   - Windows File History prüfen (siehe Szenario 2, Option B)
   - Externe Backups suchen (Cloud, externe Festplatte, etc.)

4. **LANGFRISTIG:**
   - Dev/Prod Database Separation implementieren (siehe andere Lesson)
   - Migration Rollback-System bauen
   - Backup-UI in App integrieren

---

**📍 Location:** `docs/02-dev/LESSON/KNOWLEDGE_ONLY_FIX-PRODUCTION-DATABASE-RECOVERY-STRATEGY_2025-11-03.md`  
**Purpose:** Strategien zur Wiederherstellung der überschriebenen Produktions-Datenbank  
**Status:** Knowledge Only – Recovery Guidance  
**Action:** Follow checkliste für immediate recovery

*Letzte Aktualisierung: 03.11.2025 – Created during startup failure and database recovery analysis*
