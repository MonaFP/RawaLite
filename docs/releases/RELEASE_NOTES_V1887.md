# RawaLite v1.8.87 - Update-Funktionalität Test (22.09.2025)

## 🧪 Update-Test-Release

Dieses Release dient speziell zum Testen der Update-Funktionalität mit dem in v1.8.85/v1.8.86 eingeführten Update-Launcher. Der Update-Launcher ermöglicht einen zuverlässigeren Update-Prozess, indem er sicherstellt, dass der Installer automatisch gestartet wird, nachdem die Hauptanwendung beendet wurde.

### 🔄 Update-Prozess Verbesserungen

- **Robustes Update-System**: Garantierte Ausführung des Installers nach App-Beendigung
- **Zuverlässige Erkennung**: Automatisches Fortsetzen des Update-Prozesses
- **Detaillierte Logs**: Verbesserte Diagnose-Möglichkeiten für Update-Probleme

### 📋 Test-Anweisungen

1. Installieren Sie zunächst v1.8.86 (falls noch nicht geschehen)
2. Öffnen Sie die Anwendung und navigieren Sie zu Einstellungen > Nach Updates suchen
3. Die Anwendung sollte dieses Update (v1.8.87) finden
4. Folgen Sie den Anweisungen zum Installieren des Updates
5. Beobachten Sie, ob der Update-Launcher aktiviert wird und der Installer automatisch startet

### 📊 Diagnose-Tools

Für die Analyse des Update-Prozesses können Sie die folgenden Log-Dateien überprüfen:
- Update-Launcher-Logs: `%TEMP%\rawalite-update-launcher-*.log`
- IPC-Kommunikation: `%TEMP%\rawalite-update-*.json`

### 🛠️ Bekannte Probleme und Workarounds

Falls der automatische Start des Installers fehlschlägt:
1. Überprüfen Sie die Log-Dateien auf mögliche Fehler
2. Starten Sie den Installer manuell aus dem Verzeichnis `%LOCALAPPDATA%\rawalite-updater\pending\`