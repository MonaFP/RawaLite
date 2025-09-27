# RawaLite Dokumentation

## Zweck
Diese Dokumentation definiert die offiziellen Regeln und Spezifikationen der RawaLite-Anwendung.  
Sie ist die alleinige Referenz für Implementierung, Tests und KI-basierte Weiterentwicklungen.

## Aufbau
- Jedes Thema ist nur in **einem Master-Dokument** beschrieben.  
- Alle anderen Dokumente verweisen auf dieses Master-Dokument.  
- **Keine Redundanzen**, **keine Widersprüche**.  
- Deprecated Patterns sind separat gelistet.

## Offizielle Spezifikation (Code-Wahrheit)
Die Dokumentation orientiert sich an folgenden Dateien im Code:  
- **Pfade:** `src/lib/paths.ts`, `src/lib/path-utils.ts`  
- **Updates:** `useAutoUpdater.ts`, `UpdateService.ts`, `AutoUpdaterModal.tsx`, `electron-builder.yml`  
- **PDF:** `PDFService.ts`, `PDFPostProcessor.ts`, `templates/*`  
- **Persistenz:** `src/persistence/index.ts`, `SQLiteAdapter.ts`, `DexieAdapter.ts`, `migrations/*`  
- **Security/IPC:** `main.ts`, `preload.ts`, `ipc.ts`

## Navigation
1. `10-architecture-overview.md` – Architekturüberblick  
2. `20-paths.md` – Pfad-Management  
3. `30-updates.md` – Update-System  
4. `40-pdf-workflow.md` – PDF-Workflow  
5. `50-persistence.md` – Persistenz  
6. `60-security-ipc.md` – Security & IPC  
7. `70-numbering.md` – Nummernkreise  
8. `80-ui-theme-navigation.md` – UI, Theme & Navigation  
9. `90-deprecated-patterns.md` – Verbotene Muster  
10. `99-glossary.md` – Glossar
