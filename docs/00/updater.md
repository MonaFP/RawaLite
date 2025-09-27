# RawaLite – Update-System (Safe Edition)  

Dieses Dokument erläutert den Ablauf des automatischen In-App Update-Systems von RawaLite und listet wichtige Erkenntnisse für dessen Wartung und Weiterentwicklung.

## 🔄 Update-Ablauf  
Das **Auto-Update-System** prüft und installiert neue Versionen vollständig innerhalb der Anwendung:  

1. **Prüfen:** Beim App-Start führt der `VersionService` einen Versions-Check über die GitHub Releases API durch. Wenn eine neuere Version verfügbar ist, wird der Nutzer benachrichtigt (Anzeige im UI, z. B. im AutoUpdaterModal).  
2. **Download:** Auf Nutzerbestätigung wird das Update-Paket (`rawalite-Setup-X.Y.Z.exe` inkl. Begleitdateien) vom GitHub Release heruntergeladen – progressiv und ohne die App zu verlassen.  
3. **Backup:** Vor der Installation initiiert das Update-System ein **Backup** der aktuellen Daten (Datenbank und Einstellungen). Dieses Backup wird im Profilverzeichnis gesichert, um bei Fehlern eine Wiederherstellung zu ermöglichen.  
4. **Installation:** Der Nutzer startet die Installation in der App. Daraufhin bereitet der Main-Prozess die Aktualisierung vor: Über eine PowerShell (`install-custom-handler.ts`) wird der NSIS-Installer mit erhöhten Rechten ausgeführt. Die laufende Anwendung verzögert sich kurz und **beendet sich selbst**, sobald der Installer gestartet wurde.  
5. **Update-Launcher:** Ein spezielles **Update-Launcher**-Script übernimmt im Hintergrund die Kontrolle. Es wartet, bis die alte Instanz vollständig geschlossen ist, und startet den NSIS-Installer. Dieser installiert die neue Version (überschreibt Dateien im Installationsordner).  
6. **Neustart:** Nach erfolgreicher Installation wird RawaLite automatisch neu gestartet (durch das Update-Launcher-Skript), nun in der aktuellen Version. Das Update ist damit abgeschlossen; der Nutzer kann nahtlos weiterarbeiten.

## ⚠️ Wichtige Hinweise & Best Practices  
- **User-Installation:** RawaLite wird standardmäßig im Benutzerkontext installiert (`nsis.perMachine=false`). Daher ist beim Update **kein Windows UAC-Dialog** erforderlich. (Nutzer könnten einen Admin-Dialog erwarten – in Wirklichkeit läuft das Update ohne Administratorrechte im Benutzerprofil.)  
- **Admin-Berechtigung:** Sollte künftig eine Installation mit Admin-Rechten nötig sein (z. B. systemweiter Installationsmodus), muss das Aufrufkommando für den Installer ein gültiges **Parent-Window-Handle** mitgeben, damit der UAC-Dialog sichtbar erscheint. *(Lessons Learned: Ein unsichtbarer UAC kann Installation und Nutzerinteraktion blockieren.)*  
- **App-Beendigung:** Die Anwendung muss **vor dem Installationsschritt vollständig beendet** sein. Andernfalls können offene Datei-Handles (z. B. durch den Single-Instance-Lock) die Installation behindern oder zu Fehlermeldungen führen. Die Update-Logik stellt dies sicher, indem `app.quit()` zeitgesteuert ausgeführt wird, sobald das Update initiiert ist.  
- **Keine externen Updates:** Updates dürfen **ausschließlich über das interne System** erfolgen. Weder direkte Downloads noch manuelle Installer-Aufrufe innerhalb der App sind erlaubt (siehe [Deprecated Patterns](90-deprecated-patterns.md#update-system-verbote)). Dies gewährleistet, dass z. B. Backup und Versionsabgleich immer automatisch ablaufen.  
- **Backup prüfen:** Nach einem Update findet sich im Anwendungsverzeichnis ggf. ein **Backup-Ordner** der Vorversion. Dieses Backup dient zur Wiederherstellung, falls bei der Installation etwas schiefgeht. Im Normalfall kann der Ordner manuell gelöscht werden, sobald das Update als erfolgreich verifiziert ist.
