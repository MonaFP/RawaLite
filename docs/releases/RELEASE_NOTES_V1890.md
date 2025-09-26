# RawaLite v1.8.90 - Update-Launcher Pfad-Fix

## 🔧 Kritischer Fix für Update-Launcher

- **✅ Pfad-Korrektur**: Update-Launcher wird nun korrekt außerhalb des ASAR-Archivs gesucht
- **🚀 Verbesserte Ressourcen-Einbindung**: Launcher wird zuverlässig in den richtigen Ordner kopiert
- **🔄 Robustere Ausführung**: Verhindert "Launcher nicht gefunden"-Fehler bei Updates

## 🧰 Technische Details

- Korrektur des Launcher-Pfads von `app.getAppPath()` zu `path.dirname(app.getPath('exe'))`
- Explizite Kopieranweisung in electron-builder.yml für update-launcher.js
- Verbesserte Fehlerbehandlung bei nicht gefundenen Dateien

---

**Release-Datum**: 22. September 2025