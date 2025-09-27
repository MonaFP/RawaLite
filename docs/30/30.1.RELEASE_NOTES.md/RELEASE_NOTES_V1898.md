# RawaLite v1.8.98 - UAC-Resistant Launcher Update System 🚀

## 🔧 **Major Update: Robust Launcher-Based Installation**

Diese Version implementiert ein komplett neues, UAC-resistentes Update-System mit detachiertem PowerShell-Launcher, das die bisherigen UAC-Terminierungsprobleme vollständig löst.

### ✅ **Neue Features**

#### 🛡️ **UAC-Resistant Update System**
- **PowerShell Launcher**: Detachierte Ausführung überlebt UAC-Elevation
- **Result Persistence**: Installation-Ergebnisse werden persistent gespeichert
- **Process Independence**: Launcher läuft unabhängig vom Haupt-App-Prozess
- **Timeout Handling**: Robuste 10-Minuten-Überwachung mit Progress-Updates
- **Error Recovery**: Umfassende Fehlerbehandlung und Logging

#### 📊 **Installation Flow**
1. **User klickt "Install"** → App startet UAC-resistenten Launcher
2. **Launcher detachiert sich** → PowerShell-Prozess läuft unabhängig
3. **UAC-Elevation** → User bestätigt, Launcher überlebt Prozess-Fork
4. **NSIS Installation** → Installer läuft vollständig unabhängig
5. **Result Persistence** → Ergebnis wird in JSON-Datei gespeichert
6. **App Restart** → Ergebnis wird beim nächsten Start angezeigt

#### 🔄 **Enhanced APIs**
- **Launcher-based IPC**: `updater:install` und `updater:install-custom` verwenden Launcher
- **Result Checking**: `updater:check-results` für Installation-Ergebnis-Abfrage
- **Event System**: Neue Events für Launcher-Status und Installation-Completion
- **Auto Restart**: `app:restart-after-update` für manuelle Neustarts nach Updates

### 🔧 **Technische Verbesserungen**

#### **PowerShell Launcher** (`resources/update-launcher.ps1`)
```powershell
# UAC-resistant execution with detached process
Start-Process -FilePath $InstallerPath -Verb RunAs -PassThru
# No -Wait parameter to avoid UAC fork termination
```

#### **Result Persistence** (`%LOCALAPPDATA%/rawalite-updater/install-results.json`)
```json
{
  "success": true,
  "message": "Installation completed successfully",
  "exitCode": 0,
  "duration": 45.2,
  "timestamp": "2025-09-25T18:30:00.000Z"
}
```

#### **Startup Result Check**
- App prüft beim Start automatisch auf Installation-Ergebnisse
- Erfolgreiche Updates werden mit Bestätigung angezeigt
- Fehlgeschlagene Installationen zeigen detaillierte Fehlermeldungen

### 🧪 **Testing Empfehlungen**

1. **UAC Test**: Teste sowohl "Ja" als auch "Nein" bei UAC-Dialogs
2. **Process Survival**: Verifiziere dass App nach UAC-Bestätigung läuft
3. **Result Persistence**: Prüfe Ergebnis-Anzeige nach manuellem Neustart
4. **Error Handling**: Teste Launcher-Fehler und Timeout-Szenarien

### 📦 **Installation & Update**

- **Neue Installationen**: Nutzen automatisch das neue Launcher-System
- **Bestehende Installationen**: Erhalten Update über alte Methode, danach neues System
- **Backward Compatibility**: Alte IPC-APIs bleiben verfügbar

### 🐛 **Gelöste Probleme**

- ✅ **UAC Termination**: App und Installer bleiben nach UAC-Bestätigung aktiv
- ✅ **Process Fork Issues**: Detachierter Launcher überlebt UAC-Elevation
- ✅ **Silent Failures**: Persistente Ergebnis-Speicherung für Transparent Feedback
- ✅ **Installation Tracking**: Vollständige Überwachung des Installation-Fortschritts

---

**🚨 Critical Fix**: Diese Version löst das Kernproblem der UAC-bedingten Prozess-Terminierung durch einen robusten, detachierten Launcher-Ansatz mit Ergebnis-Persistierung.

**🔄 Recommended Testing**: Installiere diese Version und teste das Update-System über Einstellungen → Update-Manager.