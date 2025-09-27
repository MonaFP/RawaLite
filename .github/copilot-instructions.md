# RawaLite – Konsolidierte Instructions (Safe Edition)

Diese Datei ist die **einzige gültige Spezifikation** für RawaLite.  
Alle anderen Dokumente (inkl. ältere Anleitungen) gelten nur noch ergänzend als Historie.

---

## 🛡️ Goldene Regeln

### Package Manager
- **PNPM-only** – keine Nutzung von `npm` oder `yarn`.  
- Hinweis: `npm` ist technisch installiert, wird aber **nicht verwendet**.

### In-App Prinzip
- **Alles in-App**: keine externen Links, kein `shell.openExternal`, kein `window.open`, kein `target="_blank"`.  
- Alle Abläufe laufen vollständig in der Anwendung.

### Update-System
- **Automatische Prüfung**: nur einmal beim App-Start.  
- **Manuelle Prüfung**: über Header (Versionsnummer) oder Einstellungen → Updates.  
- `autoDownload: false`.  
- Download & Install starten nur nach User-Aktion.  
- Pending-Pfad basiert auf `PATHS.userData()`.  
- **Verboten:** Browser-Fallbacks oder Redirects.

### Pfad-Management
- **Single Source of Truth:** `src/lib/paths.ts` (`PATHS`).  
- Für Standalone/CLI: `src/lib/path-utils.ts`.  
- **Verboten:** direkter Aufruf von `app.getPath()` außerhalb `paths.ts`.  
- **Feste Ordnerstruktur:**  
  - downloads  
  - logs  
  - cache  
  - temp  
  - templates  
  - backups  
  - userdata  
  - documents  
  - desktop  

### PDF-System
- **Workflow:** `PDFService → PDFPostProcessor → templates`.  
- Alle Assets & Fonts **lokal gebundled**.  
- Nur Fonts mit **rechtlich zulässiger Einbettung** (SIL OFL, kommerzielle Lizenzen mit Einbettungsrecht).  
- **Verboten:** externe Ressourcen, CDNs, Online-Nachladung.  
- Tests: deterministisch & offline.

### Persistenz
- **Primary:** SQLite (sql.js).  
- **Dev-Fallback:** Dexie (IndexedDB).  
- Einstiegspunkt: `src/persistence/index.ts` (einziger Import).  
- **Adapter-Parität:** SQLite & Dexie implementieren identische Schnittstellen.  
- **Migration:** additiv, idempotent, ein gemeinsamer Migrations-Ordner.  
- **Verboten:** direkte Importe von `SQLiteAdapter` oder `DexieAdapter`.  
- **Nicht erlaubt:** LocalStorage (nur noch historische Migration).

### Security & IPC
- **Prod verpflichtend:**  
  - `sandbox:true`  
  - `contextIsolation:true`  
- IPC ausschließlich typisiert via `preload` (ContextBridge).  
- **Verboten:** dynamische Kanäle, Node im Renderer.  
- **Dev vs. Prod:** Unterschiede dokumentieren, Prod-Regeln nicht aufweichen.

### Nummernkreise
- Pro Dokumenttyp konfigurierbar:  
  - Präfix  
  - Stellen  
  - Aktueller Zähler  
  - Reset (Nie / Jährlich / Monatlich)  
- Atomarität garantiert.  
- Jahres-Reset optional.  
- Tests: Parallelität & Vorschau „nächste Nummer“.

### UI, Theme & Navigation
- Persistenz über SQLite (Dexie nur Dev-Fallback).  
- **Kein FOUC**.  
- Sidebar hat feste Breite (240 px).  
- Konsistente Typografie.  
- **Farbpalette:** Pastellfarben sind final & dürfen nicht verändert werden.

---

## 📂 Struktur der Dokumentation

- `00-index.md` – Übersicht & Code-Wahrheit (Referenzdateien)  
- `10-architecture-overview.md` – High-Level Architektur  
- `20-paths.md` – Pfad-Management  
- `30-updates.md` – Update-System  
- `40-pdf-workflow.md` – PDF-Workflow  
- `50-persistence.md` – Persistenz  
- `60-security-ipc.md` – Security & IPC  
- `70-numbering.md` – Nummernkreise  
- `80-ui-theme-navigation.md` – UI, Theme & Navigation  
- `90-deprecated-patterns.md` – Verbotene Muster  
- `99-glossary.md` – Glossar  

---

## 🚫 Deprecated Patterns

Die folgenden Muster sind **streng verboten**:

- `app.getPath()` außerhalb `paths.ts`.  
- `shell.openExternal`, externe Links, `window.open`, `target="_blank"`.  
- PDF-Assets aus dem Netz.  
- Direktimporte `SQLiteAdapter` oder `DexieAdapter`.  
- Dynamische IPC-Kanäle.  

---

## ✅ Checkliste vor Änderungen

- [ ] Kein `npm` oder `yarn` verwendet.  
- [ ] Update-Flow entspricht 100 % den In-App-Regeln.  
- [ ] Pfade ausschließlich via `paths.ts` oder `path-utils.ts`.  
- [ ] PDF nur via `PDFService` & `PostProcessor`, offline & deterministisch.  
- [ ] Persistenz über `persistence/index.ts`, Adapter-Parität gewahrt.  
- [ ] Migration additiv & idempotent.  
- [ ] Security: `sandbox:true`, `contextIsolation:true`, IPC typisiert.  
- [ ] Nummernkreise atomar, Reset optional, Tests vorhanden.  
- [ ] Theme persistiert, Sidebar 240 px, kein FOUC, Farbpalette unverändert.  
- [ ] Keine verbotenen Patterns implementiert.  
👉 Bei komplexeren Problemen ist der dokumentierte
[Systematische Debugging-Standard](../docs/development/DEBUGGING_STANDARDS.md)
zwingend einzuhalten.
