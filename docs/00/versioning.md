# RawaLite – Versionierung (Safe Edition)  

Dieses Dokument definiert das **Versionsschema** der Anwendung sowie verbindliche Richtlinien für Versionsnummern. Eine konsistente Versionierung stellt sicher, dass Updates korrekt erkannt und verteilt werden.

## 🔢 Versionsschema  
RawaLite verwendet ein **semantisches Versionsschema** nach MAJOR.MINOR.PATCH:  

- **MAJOR (X.0.0):** Hauptversion bei inkompatiblen Änderungen oder neuen Kernfunktionen.  
- **MINOR (X.Y.0):** Neue Features und Verbesserungen, die abwärtskompatibel sind.  
- **PATCH (X.Y.Z):** Fehlerbehebungen und interne Optimierungen ohne Funktionsänderungen.

## ✅ Versionsrichtlinien  
- Bei **jedem Release** muss die Versionsnummer entsprechend dem Schema korrekt erhöht werden (niemals dieselbe Versionsnummer zweimal verwenden).  
- Versionsnummern müssen **semantisch konsistent** sein (MAJOR/MINOR/PATCH gemäß Art der Änderung).  
- Die Versionsangaben in **Quelle und Build** sind stets synchron zu halten – insbesondere in der `package.json` und im Code (`VersionService.ts`, inkl. `BUILD_DATE`).  
- Eine einmal veröffentlichte Version ist **einzigartig** – sollte ein weiterer Build mit Fixes nötig sein, erhält er eine **neue Patch-Nummer**.
