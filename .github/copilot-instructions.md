# RawaLite – Konsolidierte Instructions (Safe Edition)# RawaLite – Konsolidierte Instructions (Safe Edition)



Diese Datei ist die **einzige gültige Spezifikation** für RawaLite. Deren Dokumente (inkl. ältere Anleitungen) gelten nur noch ergänzend als Historie.Diese Datei ist die **einzige gültige Spezifikation** für RawaLite.👉 Bei komplexeren Problemen ist der dokumentierte

[Systematische Debugging-Standard](../docs/development/DEBUGGING_STANDARDS.md)

👉 Bei komplexeren Problemen ist der dokumentiertezwingend einzuhalten.

[Systematische Debugging-Standard](../docs/00/DEBUGGING_STANDARDS.md)

zwingend einzuhalten.---



---## 🚀 Release-Workflow (Safe Edition, Zero-Interaction)deren Dokumente (inkl. ältere Anleitungen) gelten nur noch ergänzend als Historie.



## 🛡️ Goldene Regeln---



### Package Manager## 🛡️ Goldene Regeln

- **PNPM-only** – keine Nutzung von `npm` oder `yarn`.  

- Hinweis: `npm` ist technisch installiert, wird aber **nicht verwendet**.### Package Manager

- **PNPM-only** – keine Nutzung von `npm` oder `yarn`.  

### In-App Prinzip- Hinweis: `npm` ist technisch installiert, wird aber **nicht verwendet**.

- **Alles in-App**: keine externen Links, kein `shell.openExternal`, kein `window.open`, kein `target="_blank"`.  

- Alle Abläufe laufen vollständig in der Anwendung.### In-App Prinzip

- **Alles in-App**: keine externen Links, kein `shell.openExternal`, kein `window.open`, kein `target="_blank"`.  

### Update-System- Alle Abläufe laufen vollständig in der Anwendung.

- **Automatische Prüfung**: nur einmal beim App-Start.  

- **Manuelle Prüfung**: über Header (Versionsnummer) oder Einstellungen → Updates.  ### Update-System

- `autoDownload: false`.  - **Automatische Prüfung**: nur einmal beim App-Start.  

- Download & Install starten nur nach User-Aktion.  - **Manuelle Prüfung**: über Header (Versionsnummer) oder Einstellungen → Updates.  

- Pending-Pfad basiert auf `PATHS.userData()`.  - `autoDownload: false`.  

- **Verboten:** Browser-Fallbacks oder Redirects.- Download & Install starten nur nach User-Aktion.  

- Pending-Pfad basiert auf `PATHS.userData()`.  

### Pfad-Management- **Verboten:** Browser-Fallbacks oder Redirects.

- **Single Source of Truth:** `src/lib/paths.ts` (`PATHS`).  

- Für Standalone/CLI: `src/lib/path-utils.ts`.  ### Pfad-Management

- **Verboten:** direkter Aufruf von `app.getPath()` außerhalb `paths.ts`.  - **Single Source of Truth:** `src/lib/paths.ts` (`PATHS`).  

- **Feste Ordnerstruktur:**  - Für Standalone/CLI: `src/lib/path-utils.ts`.  

  - downloads  - **Verboten:** direkter Aufruf von `app.getPath()` außerhalb `paths.ts`.  

  - logs  - **Feste Ordnerstruktur:**  

  - cache    - downloads  

  - temp    - logs  

  - templates    - cache  

  - backups    - temp  

  - userdata    - templates  

  - documents    - backups  

  - desktop    - userdata  

  - documents  

### PDF-System  - desktop  

- **Workflow:** `PDFService → PDFPostProcessor → templates`.  

- Alle Assets & Fonts **lokal gebundled**.  ### PDF-System

- Nur Fonts mit **rechtlich zulässiger Einbettung** (SIL OFL, kommerzielle Lizenzen mit Einbettungsrecht).  - **Workflow:** `PDFService → PDFPostProcessor → templates`.  

- **Verboten:** externe Ressourcen, CDNs, Online-Nachladung.  - Alle Assets & Fonts **lokal gebundled**.  

- Tests: deterministisch & offline.- Nur Fonts mit **rechtlich zulässiger Einbettung** (SIL OFL, kommerzielle Lizenzen mit Einbettungsrecht).  

- **Verboten:** externe Ressourcen, CDNs, Online-Nachladung.  

### Persistenz- Tests: deterministisch & offline.

- **Primary:** SQLite (sql.js).  

- **Dev-Fallback:** Dexie (IndexedDB).  ### Persistenz

- Einstiegspunkt: `src/persistence/index.ts` (einziger Import).  - **Primary:** SQLite (sql.js).  

- **Adapter-Parität:** SQLite & Dexie implementieren identische Schnittstellen.  - **Dev-Fallback:** Dexie (IndexedDB).  

- **Migration:** additiv, idempotent, ein gemeinsamer Migrations-Ordner.  - Einstiegspunkt: `src/persistence/index.ts` (einziger Import).  

- **Verboten:** direkte Importe von `SQLiteAdapter` oder `DexieAdapter`.  - **Adapter-Parität:** SQLite & Dexie implementieren identische Schnittstellen.  

- **Nicht erlaubt:** LocalStorage (nur noch historische Migration).- **Migration:** additiv, idempotent, ein gemeinsamer Migrations-Ordner.  

- **Verboten:** direkte Importe von `SQLiteAdapter` oder `DexieAdapter`.  

### Security & IPC- **Nicht erlaubt:** LocalStorage (nur noch historische Migration).

- **Prod verpflichtend:**  

  - `sandbox:true`  ### Security & IPC

  - `contextIsolation:true`  - **Prod verpflichtend:**  

- IPC ausschließlich typisiert via `preload` (ContextBridge).    - `sandbox:true`  

- **Verboten:** dynamische Kanäle, Node im Renderer.    - `contextIsolation:true`  

- **Dev vs. Prod:** Unterschiede dokumentieren, Prod-Regeln nicht aufweichen.- IPC ausschließlich typisiert via `preload` (ContextBridge).  

- **Verboten:** dynamische Kanäle, Node im Renderer.  

### Nummernkreise- **Dev vs. Prod:** Unterschiede dokumentieren, Prod-Regeln nicht aufweichen.

- Pro Dokumenttyp konfigurierbar:  

  - Präfix  ### Nummernkreise

  - Stellen  - Pro Dokumenttyp konfigurierbar:  

  - Aktueller Zähler    - Präfix  

  - Reset (Nie / Jährlich / Monatlich)    - Stellen  

- Atomarität garantiert.    - Aktueller Zähler  

- Jahres-Reset optional.    - Reset (Nie / Jährlich / Monatlich)  

- Tests: Parallelität & Vorschau „nächste Nummer".- Atomarität garantiert.  

- Jahres-Reset optional.  

### UI, Theme & Navigation- Tests: Parallelität & Vorschau „nächste Nummer“.

- Persistenz über SQLite (Dexie nur Dev-Fallback).  

- **Kein FOUC**.  ### UI, Theme & Navigation

- Sidebar hat feste Breite (240 px).  - Persistenz über SQLite (Dexie nur Dev-Fallback).  

- Konsistente Typografie.  - **Kein FOUC**.  

- **Farbpalette:** Pastellfarben sind final & dürfen nicht verändert werden.- Sidebar hat feste Breite (240 px).  

- Konsistente Typografie.  

---- **Farbpalette:** Pastellfarben sind final & dürfen nicht verändert werden.



## 📂 Struktur der Dokumentation---



- `00-index.md` – Übersicht & Code-Wahrheit (Referenzdateien)  ## 📂 Struktur der Dokumentation

- `10-architecture-overview.md` – High-Level Architektur  

- `20-paths.md` – Pfad-Management  - `00-index.md` – Übersicht & Code-Wahrheit (Referenzdateien)  

- `30-updates.md` – Update-System  - `10-architecture-overview.md` – High-Level Architektur  

- `40-pdf-workflow.md` – PDF-Workflow  - `20-paths.md` – Pfad-Management  

- `50-persistence.md` – Persistenz  - `30-updates.md` – Update-System  

- `60-security-ipc.md` – Security & IPC  - `40-pdf-workflow.md` – PDF-Workflow  

- `70-numbering.md` – Nummernkreise  - `50-persistence.md` – Persistenz  

- `80-ui-theme-navigation.md` – UI, Theme & Navigation  - `60-security-ipc.md` – Security & IPC  

- `90-deprecated-patterns.md` – Verbotene Muster  - `70-numbering.md` – Nummernkreise  

- `99-glossary.md` – Glossar  - `80-ui-theme-navigation.md` – UI, Theme & Navigation  

- `90-deprecated-patterns.md` – Verbotene Muster  

---- `99-glossary.md` – Glossar  



## 🚫 Deprecated Patterns---



Die folgenden Muster sind **streng verboten**:## 🚫 Deprecated Patterns



- `app.getPath()` außerhalb `paths.ts`.  Die folgenden Muster sind **streng verboten**:

- `shell.openExternal`, externe Links, `window.open`, `target="_blank"`.  

- PDF-Assets aus dem Netz.  - `app.getPath()` außerhalb `paths.ts`.  

- Direktimporte `SQLiteAdapter` oder `DexieAdapter`.  - `shell.openExternal`, externe Links, `window.open`, `target="_blank"`.  

- Dynamische IPC-Kanäle.  - PDF-Assets aus dem Netz.  

- Direktimporte `SQLiteAdapter` oder `DexieAdapter`.  

---- Dynamische IPC-Kanäle.  



## ✅ Checkliste vor Änderungen---



- [ ] Kein `npm` oder `yarn` verwendet.  ## ✅ Checkliste vor Änderungen

- [ ] Update-Flow entspricht 100 % den In-App-Regeln.  

- [ ] Pfade ausschließlich via `paths.ts` oder `path-utils.ts`.  - [ ] Kein `npm` oder `yarn` verwendet.  

- [ ] PDF nur via `PDFService` & `PostProcessor`, offline & deterministisch.  - [ ] Update-Flow entspricht 100 % den In-App-Regeln.  

- [ ] Persistenz über `persistence/index.ts`, Adapter-Parität gewahrt.  - [ ] Pfade ausschließlich via `paths.ts` oder `path-utils.ts`.  

- [ ] Migration additiv & idempotent.  - [ ] PDF nur via `PDFService` & `PostProcessor`, offline & deterministisch.  

- [ ] Security: `sandbox:true`, `contextIsolation:true`, IPC typisiert.  - [ ] Persistenz über `persistence/index.ts`, Adapter-Parität gewahrt.  

- [ ] Nummernkreise atomar, Reset optional, Tests vorhanden.  - [ ] Migration additiv & idempotent.  

- [ ] Theme persistiert, Sidebar 240 px, kein FOUC, Farbpalette unverändert.  - [ ] Security: `sandbox:true`, `contextIsolation:true`, IPC typisiert.  

- [ ] Keine verbotenen Patterns implementiert.  - [ ] Nummernkreise atomar, Reset optional, Tests vorhanden.  

- [ ] Theme persistiert, Sidebar 240 px, kein FOUC, Farbpalette unverändert.  

👉 Bei komplexeren Problemen ist der dokumentierte- [ ] Keine verbotenen Patterns implementiert.  

[Systematische Debugging-Standard](../docs/00/DEBUGGING_STANDARDS.md)👉 Bei komplexeren Problemen ist der dokumentierte

zwingend einzuhalten.[Systematische Debugging-Standard](../docs/development/DEBUGGING_STANDARDS.md)

zwingend einzuhalten.

---

# 📄 Patch für `.github/copilot-instructions.md`

## 🚀 Release-Workflow (Safe Edition, Zero-Interaction)

**Einfügeposition:** Am Ende, neuer Abschnitt **„Release-Workflow (Safe Edition)“**

Für Releases gilt ein **vollständig automatisierter, nicht-interaktiver Ablauf**.  

Der KI-Assistent **führt alle Schritte selbstständig aus**, ohne Nachfragen oder To-Dos an den Benutzer.  ````markdown

## 🚀 Release-Workflow (Safe Edition, Zero-Interaction)

### Grundprinzipien

- **PNPM-only** – keine `npm`/`yarn`.  Für Releases gilt ein **vollständig automatisierter, nicht-interaktiver Ablauf**.  

- **Zero-Interaction** – Defaults sind fix (Patch-Bump, Windows-Build).  Der KI-Assistent **führt alle Schritte selbstständig aus**, ohne Nachfragen oder To-Dos an den Benutzer.  

- **Guards & Tests** – jedes Mal zwingend, bevor Version/Build/Publish ausgeführt wird.  

- **GitHub Release** – nur über `electron-builder`/CI, keine manuelle Assets.  ### Grundprinzipien

- **Safe Edition** – keine Abkürzungen, kein Überspringen von Schritten.  - **PNPM-only** – keine `npm`/`yarn`.  

- **Zero-Interaction** – Defaults sind fix (Patch-Bump, Windows-Build).  

### Standard-Ablauf (immer befolgen)- **Guards & Tests** – jedes Mal zwingend, bevor Version/Build/Publish ausgeführt wird.  

- **GitHub Release** – nur über `electron-builder`/CI, keine manuelle Assets.  

1. **Install (frozen):**- **Safe Edition** – keine Abkürzungen, kein Überspringen von Schritten.  

   ```powershell

   pnpm install --frozen-lockfile### Standard-Ablauf (immer befolgen)

   ```

1. **Install (frozen):**

2. **Caches & Artefakte leeren:**   ```powershell

   ```powershell   pnpm install --frozen-lockfile

   @("dist","out","build","release","coverage",".vite","node_modules\.vite",".cache",".electron-builder","tests\test-results") | % { if (Test-Path $_) { Remove-Item -Recurse -Force $_ } }````

   ```

2. **Caches & Artefakte leeren:**

3. **Guards & Tests (Zero-Tolerance):**

   ```powershell   ```powershell

   pnpm typecheck   @("dist","out","build","release","coverage",".vite","node_modules\.vite",".cache",".electron-builder","tests\test-results") | % { if (Test-Path $_) { Remove-Item -Recurse -Force $_ } }

   pnpm lint   ```

   pnpm guard:external

   pnpm guard:pdf3. **Guards & Tests (Zero-Tolerance):**

   pnpm validate:ipc

   pnpm validate:versions   ```powershell

   pnpm guard:todos   pnpm typecheck

   pnpm validate:esm   pnpm lint

   pnpm test --run   pnpm guard:external

   ```   pnpm guard:pdf

   pnpm validate:ipc

4. **Version bump (Patch default):**   pnpm validate:versions

   ```powershell   pnpm guard:todos

   pnpm version patch -m "chore(release): v%s"   pnpm validate:esm

   git push   pnpm test --run

   git push --follow-tags   ```

   ```

4. **Version bump (Patch default):**

5. **Build & Publish (Windows):**

   ```powershell   ```powershell

   pnpm release:publish || pnpm exec electron-builder --win --publish always   pnpm version patch -m "chore(release): v%s"

   ```   git push

   git push --follow-tags

6. **Asset-Guards:**   ```

   ```powershell

   pnpm guard:release:assets5. **Build & Publish (Windows):**

   ```

   ```powershell

7. **Release-Verifikation (GitHub):**   pnpm release:publish || pnpm exec electron-builder --win --publish always

   ```powershell   ```

   gh release view v$(node -e "console.log(require('./package.json').version)") --json name,tagName,assets

   ```6. **Asset-Guards:**



### Ergebnis   ```powershell

   pnpm guard:release:assets

* KI gibt am Ende **Version, Tag, Release-Status und Artefakte** aus.   ```

* Falls ein Schritt fehlschlägt → **Abbruch + Diagnose** (keine Nachfragen).

* **Immer strikt nach Doku**, keine eigenen Workflows.7. **Release-Verifikation (GitHub):**

   ```powershell
   gh release view v$(node -e "console.log(require('./package.json').version)") --json name,tagName,assets
   ```

### Ergebnis

* KI gibt am Ende **Version, Tag, Release-Status und Artefakte** aus.
* Falls ein Schritt fehlschlägt → **Abbruch + Diagnose** (keine Nachfragen).
* **Immer strikt nach Doku**, keine eigenen Workflows.

