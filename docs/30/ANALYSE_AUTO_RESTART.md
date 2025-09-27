# 🔎 ANALYSE — App startet nach Installation nicht automatisch neu (RawaLite)

## 📚 Dokumentation Review (✅ abgehakt)

- ✅ `docs/architecture/PROJECT_OVERVIEW.md`: Electron 31.7.7, React + TypeScript, pnpm-only bestätigt
- ✅ `docs/operations/AUTO_UPDATER_IMPLEMENTATION.md`: **VERALTETE DOKU** - beschreibt electron-updater v1.6.0, aber aktuell ist Custom Updater ohne electron-updater
- ✅ `electron/main.ts`: Custom IPC-Handler mit VISIBLE installer, runAfterFinish: true konfiguriert
- ✅ `electron-builder.yml`: NSIS mit runAfterFinish: true, perMachine: false bestätigt
- ✅ `src/components/AutoUpdaterModal.tsx`: UI für Custom Updater System
- ❌ `src/services/VersionService.ts`: Irrelevant, nutzt nur Version-API, kein Update-Management

## 1) Kurzfazit

**Hauptursache**: Single-Instance Lock blockiert automatischen Neustart nach Installation. NSIS `runAfterFinish: true` startet neue App-Instanz, aber diese wird von der noch laufenden Single-Instance-Prüfung abgewiesen.

**Zusatzproblem**: UI zeigt "0 MB" bei unbekannter Dateigröße statt "wird ermittelt..." - irreführend für User.

## 2) Ist-Zustand (Belege aus Code)

### electron-builder.yml (NSIS Konfiguration)
```yaml
nsis:
  oneClick: false
  runAfterFinish: true  # ✅ Konfiguriert für Auto-Restart
  perMachine: false     # ✅ User-Installation
```

### electron/main.ts (Installer-Start)
```typescript
// Zeile 261: ✅ VISIBLE installer ohne Silent-Flags
log.info("🚀 [CUSTOM-UPDATER] Starting VISIBLE installer:", candidate);
const child = spawn(candidate, [], {  // ✅ Keine /S Flags
  detached: true,
  stdio: "ignore",
  windowsHide: true,
});

// Zeile 271: App beendet sich nach 500ms
setTimeout(() => app.quit(), 500);
```

### Single-Instance Lock (Zeile 25-33)
```typescript
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();  // ❌ PROBLEM: Neue Instanz wird sofort beendet
} else {
  app.on("second-instance", (event, commandLine, workingDirectory) => {
    // ❌ PROBLEM: Fokussiert alte Instanz statt Neustart zu erlauben
  });
}
```

### AutoUpdaterModal.tsx (0MB Problem - Zeile 278)
```tsx
<p><strong>Größe:</strong> {formatFileSize(updateManifest.files?.[0]?.size || 0)}</p>
// ❌ PROBLEM: formatFileSize(0) = "0 MB" statt "wird ermittelt..."
```

## 3) Ursachenliste (gewichtet)

### 🔴 **TOP: Single-Instance Lock Konflikt**
- **Was**: `requestSingleInstanceLock()` verhindert neue App-Instanz nach Installation
- **Warum**: NSIS startet neue Instanz mit `runAfterFinish: true`, aber Single-Instance-Check weist sie ab
- **Beleg**: Log zeigt "Second instance detected" statt erfolgreichen Neustart
- **Impact**: 🚨 KRITISCH - Kein automatischer Neustart möglich

### 🟡 **MEDIUM: Timing Race Condition**
- **Was**: 500ms Delay zwischen Installer-Start und app.quit() zu kurz
- **Warum**: App beendet sich bevor Installer vollständig übernommen hat
- **Beleg**: "App will quit" Log direkt nach Installer-Start
- **Impact**: ⚠️ MÖGLICH - Könnte Single-Instance Lock nicht freigeben

### 🟢 **LOW: UI Größe-Anzeige**
- **Was**: "0 MB" statt "wird ermittelt..." bei unbekannter Dateigröße
- **Warum**: `formatFileSize(0)` gibt "0 MB" zurück
- **Beleg**: updateManifest.files[0]?.size ist null bei ersten Check
- **Impact**: 📱 UX - Verwirrend für User

## 4) Konkrete Fix-Optionen

### ⭐ **EMPFEHLUNG A: Single-Instance Lock temporär deaktivieren**

**Strategie**: Deaktiviere Single-Instance Lock vor Installation, reaktiviere nach Neustart

```typescript
// electron/main.ts - MINIMAL DIFF
// Vor Installer-Start (Zeile ~260)
app.releaseSingleInstanceLock();  // ✅ Lock freigeben
log.info("🚀 [CUSTOM-UPDATER] Released single instance lock for restart");

const child = spawn(candidate, [], {
  detached: true,
  stdio: "ignore", 
  windowsHide: true,
});

setTimeout(() => app.quit(), 1000);  // ✅ Längeres Delay
```

```yaml
# electron-builder.yml - KEINE ÄNDERUNG
nsis:
  runAfterFinish: true  # Bleibt aktiviert
```

### **ALTERNATIVE B: Conditional Single-Instance während Update**

```typescript
// electron/main.ts
let isUpdating = false;

// Bei Update-Start
ipcMain.handle("update:install", async () => {
  isUpdating = true;
  app.releaseSingleInstanceLock();
  // ... rest bleibt gleich
});

// Bei App-Start
if (!isUpdating) {
  const gotTheLock = app.requestSingleInstanceLock();
  // ... rest der Single-Instance Logik
}
```

## 5) Minimal-Diffs für Empfehlung A

### electron/main.ts
```diff
@@ -258,6 +258,10 @@
     }

     log.info("🚀 [CUSTOM-UPDATER] Starting VISIBLE installer:", candidate);
+    
+    // Release single instance lock to allow restart after installation
+    app.releaseSingleInstanceLock();
+    log.info("🔓 [CUSTOM-UPDATER] Released single instance lock for restart");
+    
     // ⬇️ Wichtig: KEINE Silent-Args übergeben - NSIS-Dialog wird sichtbar
     const child = spawn(candidate, [], {
@@ -267,7 +271,7 @@
     child.unref();

     // App beenden – NSIS installiert & startet App automatisch neu (runAfterFinish)
-    setTimeout(() => app.quit(), 500);
+    setTimeout(() => app.quit(), 1000);
     return { ok: true, used: candidate };
```

### src/components/AutoUpdaterModal.tsx (UI Fix)
```diff
@@ -160,6 +160,10 @@
   const formatFileSize = (bytes: number): string => {
+    if (!bytes || bytes === 0) {
+      return "wird ermittelt...";
+    }
     const MB = bytes / (1024 * 1024);
     return `${Math.round(MB * 100) / 100} MB`;
   };
```

## 6) Akzeptanzkriterien (Checkliste)

- [ ] Kein Single-Instance Lock während Update-Installation
- [ ] `nsis.runAfterFinish: true` bleibt aktiviert
- [ ] Log: "Released single instance lock for restart" vor Installer
- [ ] Nach Setup startet App automatisch; `version:get.app` zeigt neue Version
- [ ] UI zeigt "wird ermittelt..." statt "0 MB"
- [ ] Kein "Second instance detected" Log nach Installation
- [ ] Pending-Ordner wird korrekt geleert nach erfolgreicher Installation

## 7) Testplan (manuell)

1. **Setup**: v1.8.53 installiert → v1.8.56 verfügbar → "Nach Updates suchen"
2. **Download**: UI zeigt "wird ermittelt..." während Größen-Ermittlung
3. **Installation**: "Jetzt installieren" → NSIS-Dialog sichtbar 
4. **Auto-Restart**: Nach NSIS-Finish startet App **automatisch** neu
5. **Validierung**: Version = v1.8.56, Pending-Ordner leer
6. **Keine Fehler**: Kein "Second instance" Log, keine Manual-Start erforderlich

## 8) Risiken & Rückfall

### Risiken
- **Doppelstart**: Ohne Single-Instance könnte kurz 2 Instanzen laufen
- **Update-Abbruch**: User bricht NSIS ab → App bleibt beendet, Manual-Start erforderlich

### Rückfall-Strategien
- **Doppelstart**: Kurzfristig akzeptabel (1-2 Sekunden), da alte Instanz sich beendet
- **Abbruch**: UI-Hinweis "Falls Installation abgebrochen: Manueller App-Start erforderlich"
- **Notfall**: Alte App-Version bleibt installiert, manueller Restart möglich

---

**Status**: ✅ Analyse komplett | **Empfehlung**: A (Single-Instance Lock Release) | **Priority**: 🔴 KRITISCH