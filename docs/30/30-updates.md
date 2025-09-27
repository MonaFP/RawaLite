## 📄 Datei: `/docs/30-updates.md`

````markdown
# Update-System

## Überblick
RawaLite führt Updates ausschließlich innerhalb der Anwendung aus.  
Externe Links oder manuelles Herunterladen sind nicht vorgesehen.  
Der Ablauf ist deterministisch: **Check → Download → Verify → Install**.

## Regeln
- **Automatischer Check**: Einmal beim App-Start.  
- **Manuelle Checks**:
  - Über das Versions-Badge im Header
  - Über Einstellungen → „Updates“
- **Download-Einstellung:** `autoDownload: false`  
  - Download startet nur nach Klick durch den Nutzer.
- **Install:** Nach Download wird der Nutzer aufgefordert: „Jetzt installieren“.  
  Erst nach Bestätigung wird `quitAndInstall()` ausgeführt.

## Pfade
- Pending-Verzeichnis für Update-Dateien wird konsistent über `PATHS.userData()` ermittelt:
```ts
const pendingDir = path.join(PATHS.userData(), "..", "Local", "rawalite-updater", "pending");
````

## Sicherheit

* Vor jedem Update erfolgt ein automatisches Backup.
* Downloads werden auf Integrität geprüft (Hash/Signatur).

## Verbote

* Keine externen Download-Links (z. B. GitHub Releases).
* Keine UI-Aktionen außerhalb des In-App-Flows.
* Kein automatisches Hintergrund-Installieren ohne User-Interaktion.

```

