# RawaLite – Konsolidierte Instructions (Safe Edition)# RawaLite – Konsolidierte Instructions (Safe Edition)# RawaLite – Konsolidierte Instructions (Safe Edition)



Diese Datei ist die **einzige gültige Spezifikation** für RawaLite. Deren Dokumente (inkl. ältere Anleitungen) gelten nur noch ergänzend als Historie.



👉 Bei komplexeren Problemen ist der dokumentierteDiese Datei ist die **einzige gültige Spezifikation** für RawaLite. Deren Dokumente (inkl. ältere Anleitungen) gelten nur noch ergänzend als Historie.Diese Datei ist die **einzige gültige Spezifikation** für RawaLite.👉 Bei komplexeren Problemen ist der dokumentierte

[Systematische Debugging-Standard](../docs/00/DEBUGGING_STANDARDS.md)

zwingend einzuhalten.[Systematische Debugging-Standard](../docs/development/DEBUGGING_STANDARDS.md)



---👉 Bei komplexeren Problemen ist der dokumentiertezwingend einzuhalten.



## 🛡️ Goldene Regeln[Systematische Debugging-Standard](../docs/00/DEBUGGING_STANDARDS.md)



### Package Managerzwingend einzuhalten.---

- **PNPM-only** – keine Nutzung von `npm` oder `yarn`.  

- Hinweis: `npm` ist technisch installiert, wird aber **nicht verwendet**.



### In-App Prinzip---## 🚀 Release-Workflow (Safe Edition, Zero-Interaction)deren Dokumente (inkl. ältere Anleitungen) gelten nur noch ergänzend als Historie.

- **Alles in-App**: keine externen Links, kein `shell.openExternal`, kein `window.open`, kein `target="_blank"`.  

- Alle Abläufe laufen vollständig in der Anwendung.



### Update-System## 🛡️ Goldene Regeln---

- **Automatische Prüfung**: nur einmal beim App-Start.  

- **Manuelle Prüfung**: über Header (Versionsnummer) oder Einstellungen → Updates.  

- `autoDownload: false`.  

- Download & Install starten nur nach User-Aktion.  ### Package Manager## 🛡️ Goldene Regeln

- Pending-Pfad basiert auf `PATHS.userData()`.  

- **Verboten:** Browser-Fallbacks oder Redirects.- **PNPM-only** – keine Nutzung von `npm` oder `yarn`.  



### Pfad-Management- Hinweis: `npm` ist technisch installiert, wird aber **nicht verwendet**.### Package Manager

- **Single Source of Truth:** `src/lib/paths.ts` (`PATHS`).  

- Für Standalone/CLI: `src/lib/path-utils.ts`.  - **PNPM-only** – keine Nutzung von `npm` oder `yarn`.  

- **Verboten:** direkter Aufruf von `app.getPath()` außerhalb `paths.ts`.  

- **Feste Ordnerstruktur:**  ### In-App Prinzip- Hinweis: `npm` ist technisch installiert, wird aber **nicht verwendet**.

  - downloads  

  - logs  - **Alles in-App**: keine externen Links, kein `shell.openExternal`, kein `window.open`, kein `target="_blank"`.  

  - cache  

  - temp  - Alle Abläufe laufen vollständig in der Anwendung.### In-App Prinzip

  - templates  

  - backups  - **Alles in-App**: keine externen Links, kein `shell.openExternal`, kein `window.open`, kein `target="_blank"`.  

  - userdata  

  - documents  ### Update-System- Alle Abläufe laufen vollständig in der Anwendung.

  - desktop  

- **Automatische Prüfung**: nur einmal beim App-Start.  

### PDF-System

- **Workflow:** `PDFService → PDFPostProcessor → templates`.  - **Manuelle Prüfung**: über Header (Versionsnummer) oder Einstellungen → Updates.  ### Update-System

- Alle Assets & Fonts **lokal gebundled**.  

- Nur Fonts mit **rechtlich zulässiger Einbettung** (SIL OFL, kommerzielle Lizenzen mit Einbettungsrecht).  - `autoDownload: false`.  - **Automatische Prüfung**: nur einmal beim App-Start.  

- **Verboten:** externe Ressourcen, CDNs, Online-Nachladung.  

- Tests: deterministisch & offline.- Download & Install starten nur nach User-Aktion.  - **Manuelle Prüfung**: über Header (Versionsnummer) oder Einstellungen → Updates.  



### Persistenz- Pending-Pfad basiert auf `PATHS.userData()`.  - `autoDownload: false`.  

- **Primary:** SQLite (sql.js).  

- **Dev-Fallback:** Dexie (IndexedDB).  - **Verboten:** Browser-Fallbacks oder Redirects.- Download & Install starten nur nach User-Aktion.  

- Einstiegspunkt: `src/persistence/index.ts` (einziger Import).  

- **Adapter-Parität:** SQLite & Dexie implementieren identische Schnittstellen.  - Pending-Pfad basiert auf `PATHS.userData()`.  

- **Migration:** additiv, idempotent, ein gemeinsamer Migrations-Ordner.  

- **Verboten:** direkte Importe von `SQLiteAdapter` oder `DexieAdapter`.  ### Pfad-Management- **Verboten:** Browser-Fallbacks oder Redirects.

- **Nicht erlaubt:** LocalStorage (nur noch historische Migration).

- **Single Source of Truth:** `src/lib/paths.ts` (`PATHS`).  

### Security & IPC

- **Prod verpflichtend:**  - Für Standalone/CLI: `src/lib/path-utils.ts`.  ### Pfad-Management

  - `sandbox:true`  

  - `contextIsolation:true`  - **Verboten:** direkter Aufruf von `app.getPath()` außerhalb `paths.ts`.  - **Single Source of Truth:** `src/lib/paths.ts` (`PATHS`).  

- IPC ausschließlich typisiert via `preload` (ContextBridge).  

- **Verboten:** dynamische Kanäle, Node im Renderer.  - **Feste Ordnerstruktur:**  - Für Standalone/CLI: `src/lib/path-utils.ts`.  

- **Dev vs. Prod:** Unterschiede dokumentieren, Prod-Regeln nicht aufweichen.

  - downloads  - **Verboten:** direkter Aufruf von `app.getPath()` außerhalb `paths.ts`.  

### Nummernkreise

- Pro Dokumenttyp konfigurierbar:    - logs  - **Feste Ordnerstruktur:**  

  - Präfix  

  - Stellen    - cache    - downloads  

  - Aktueller Zähler  

  - Reset (Nie / Jährlich / Monatlich)    - temp    - logs  

- Atomarität garantiert.  

- Jahres-Reset optional.    - templates    - cache  

- Tests: Parallelität & Vorschau „nächste Nummer".

  - backups    - temp  

### UI, Theme & Navigation

- Persistenz über SQLite (Dexie nur Dev-Fallback).    - userdata    - templates  

- **Kein FOUC**.  

- Sidebar hat feste Breite (240 px).    - documents    - backups  

- Konsistente Typografie.  

- **Farbpalette:** Pastellfarben sind final & dürfen nicht verändert werden.  - desktop    - userdata  



---  - documents  



## 📂 Struktur der Dokumentation### PDF-System  - desktop  



- `00-index.md` – Übersicht & Code-Wahrheit (Referenzdateien)  - **Workflow:** `PDFService → PDFPostProcessor → templates`.  

- `10-architecture-overview.md` – High-Level Architektur  

- `20-paths.md` – Pfad-Management  - Alle Assets & Fonts **lokal gebundled**.  ### PDF-System

- `30-updates.md` – Update-System  

- `40-pdf-workflow.md` – PDF-Workflow  - Nur Fonts mit **rechtlich zulässiger Einbettung** (SIL OFL, kommerzielle Lizenzen mit Einbettungsrecht).  - **Workflow:** `PDFService → PDFPostProcessor → templates`.  

- `50-persistence.md` – Persistenz  

- `60-security-ipc.md` – Security & IPC  - **Verboten:** externe Ressourcen, CDNs, Online-Nachladung.  - Alle Assets & Fonts **lokal gebundled**.  

- `70-numbering.md` – Nummernkreise  

- `80-ui-theme-navigation.md` – UI, Theme & Navigation  - Tests: deterministisch & offline.- Nur Fonts mit **rechtlich zulässiger Einbettung** (SIL OFL, kommerzielle Lizenzen mit Einbettungsrecht).  

- `90-deprecated-patterns.md` – Verbotene Muster  

- `99-glossary.md` – Glossar  - **Verboten:** externe Ressourcen, CDNs, Online-Nachladung.  



---### Persistenz- Tests: deterministisch & offline.



## 🚫 Deprecated Patterns- **Primary:** SQLite (sql.js).  



Die folgenden Muster sind **streng verboten**:- **Dev-Fallback:** Dexie (IndexedDB).  ### Persistenz



- `app.getPath()` außerhalb `paths.ts`.  - Einstiegspunkt: `src/persistence/index.ts` (einziger Import).  - **Primary:** SQLite (sql.js).  

- `shell.openExternal`, externe Links, `window.open`, `target="_blank"`.  

- PDF-Assets aus dem Netz.  - **Adapter-Parität:** SQLite & Dexie implementieren identische Schnittstellen.  - **Dev-Fallback:** Dexie (IndexedDB).  

- Direktimporte `SQLiteAdapter` oder `DexieAdapter`.  

- Dynamische IPC-Kanäle.  - **Migration:** additiv, idempotent, ein gemeinsamer Migrations-Ordner.  - Einstiegspunkt: `src/persistence/index.ts` (einziger Import).  



---- **Verboten:** direkte Importe von `SQLiteAdapter` oder `DexieAdapter`.  - **Adapter-Parität:** SQLite & Dexie implementieren identische Schnittstellen.  



## ✅ Checkliste vor Änderungen- **Nicht erlaubt:** LocalStorage (nur noch historische Migration).- **Migration:** additiv, idempotent, ein gemeinsamer Migrations-Ordner.  



- [ ] Kein `npm` oder `yarn` verwendet.  - **Verboten:** direkte Importe von `SQLiteAdapter` oder `DexieAdapter`.  

- [ ] Update-Flow entspricht 100 % den In-App-Regeln.  

- [ ] Pfade ausschließlich via `paths.ts` oder `path-utils.ts`.  ### Security & IPC- **Nicht erlaubt:** LocalStorage (nur noch historische Migration).

- [ ] PDF nur via `PDFService` & `PostProcessor`, offline & deterministisch.  

- [ ] Persistenz über `persistence/index.ts`, Adapter-Parität gewahrt.  - **Prod verpflichtend:**  

- [ ] Migration additiv & idempotent.  

- [ ] Security: `sandbox:true`, `contextIsolation:true`, IPC typisiert.    - `sandbox:true`  ### Security & IPC

- [ ] Nummernkreise atomar, Reset optional, Tests vorhanden.  

- [ ] Theme persistiert, Sidebar 240 px, kein FOUC, Farbpalette unverändert.    - `contextIsolation:true`  - **Prod verpflichtend:**  

- [ ] Keine verbotenen Patterns implementiert.  

- IPC ausschließlich typisiert via `preload` (ContextBridge).    - `sandbox:true`  

👉 Bei komplexeren Problemen ist der dokumentierte

[Systematische Debugging-Standard](../docs/00/DEBUGGING_STANDARDS.md)- **Verboten:** dynamische Kanäle, Node im Renderer.    - `contextIsolation:true`  

zwingend einzuhalten.

- **Dev vs. Prod:** Unterschiede dokumentieren, Prod-Regeln nicht aufweichen.- IPC ausschließlich typisiert via `preload` (ContextBridge).  

---

- **Verboten:** dynamische Kanäle, Node im Renderer.  

## 🚀 Release-Workflow (Safe Edition, Zero-Interaction)

### Nummernkreise- **Dev vs. Prod:** Unterschiede dokumentieren, Prod-Regeln nicht aufweichen.

Für Releases gilt ein **vollständig automatisierter, nicht-interaktiver Ablauf**.  

Der KI-Assistent **führt alle Schritte selbstständig aus**, ohne Nachfragen oder To-Dos an den Benutzer.  - Pro Dokumenttyp konfigurierbar:  



### Grundprinzipien  - Präfix  ### Nummernkreise

- **PNPM-only** – keine `npm`/`yarn`.  

- **Zero-Interaction** – Defaults sind fix (Patch-Bump, Windows-Build).    - Stellen  - Pro Dokumenttyp konfigurierbar:  

- **Guards & Tests** – jedes Mal zwingend, bevor Version/Build/Publish ausgeführt wird.  

- **GitHub Release** – KI erstellt automatisch Release mit allen Assets.    - Aktueller Zähler    - Präfix  

- **Safe Edition** – keine Abkürzungen, kein Überspringen von Schritten.  

  - Reset (Nie / Jährlich / Monatlich)    - Stellen  

### Standard-Ablauf (immer befolgen)

- Atomarität garantiert.    - Aktueller Zähler  

1. **Install (frozen):**

   ```powershell- Jahres-Reset optional.    - Reset (Nie / Jährlich / Monatlich)  

   pnpm install --frozen-lockfile

   ```- Tests: Parallelität & Vorschau „nächste Nummer".- Atomarität garantiert.  



2. **Caches & Artefakte leeren:**- Jahres-Reset optional.  

   ```powershell

   @("dist","out","build","release","coverage",".vite","node_modules\.vite",".cache",".electron-builder","tests\test-results") | % { if (Test-Path $_) { Remove-Item -Recurse -Force $_ } }### UI, Theme & Navigation- Tests: Parallelität & Vorschau „nächste Nummer“.

   ```

- Persistenz über SQLite (Dexie nur Dev-Fallback).  

3. **Guards & Tests (Zero-Tolerance):**

   ```powershell- **Kein FOUC**.  ### UI, Theme & Navigation

   pnpm typecheck

   pnpm lint- Sidebar hat feste Breite (240 px).  - Persistenz über SQLite (Dexie nur Dev-Fallback).  

   pnpm guard:external

   pnpm guard:pdf- Konsistente Typografie.  - **Kein FOUC**.  

   pnpm test --run

   ```- **Farbpalette:** Pastellfarben sind final & dürfen nicht verändert werden.- Sidebar hat feste Breite (240 px).  



4. **Version bump (Patch default):**- Konsistente Typografie.  

   ```powershell

   pnpm version patch -m "chore(release): v%s"---- **Farbpalette:** Pastellfarben sind final & dürfen nicht verändert werden.

   git push

   git push --follow-tags

   ```

## 📂 Struktur der Dokumentation---

5. **Build & Publish (Windows):**

   ```powershell

   pnpm build

   pnpm exec electron-builder --win --publish never- `00-index.md` – Übersicht & Code-Wahrheit (Referenzdateien)  ## 📂 Struktur der Dokumentation

   pnpm generate:update-json

   ```- `10-architecture-overview.md` – High-Level Architektur  



6. **Asset-Guards:**- `20-paths.md` – Pfad-Management  - `00-index.md` – Übersicht & Code-Wahrheit (Referenzdateien)  

   ```powershell

   pnpm guard:release:assets- `30-updates.md` – Update-System  - `10-architecture-overview.md` – High-Level Architektur  

   ```

- `40-pdf-workflow.md` – PDF-Workflow  - `20-paths.md` – Pfad-Management  

7. **GitHub Release erstellen & Assets hochladen:**

   ```powershell- `50-persistence.md` – Persistenz  - `30-updates.md` – Update-System  

   $version = node -e "console.log(require('./package.json').version)"

   gh release create v$version --title "RawaLite v$version - [Auto-Generated Release]" --notes "[Auto-Generated Release Notes]"- `60-security-ipc.md` – Security & IPC  - `40-pdf-workflow.md` – PDF-Workflow  

   gh release upload v$version "release\rawalite-Setup-$version.exe"

   gh release upload v$version "release\update.json"- `70-numbering.md` – Nummernkreise  - `50-persistence.md` – Persistenz  

   gh release upload v$version "release\latest.json"

   gh release upload v$version "release\rawalite-Setup-$version.exe.blockmap"- `80-ui-theme-navigation.md` – UI, Theme & Navigation  - `60-security-ipc.md` – Security & IPC  

   ```

- `90-deprecated-patterns.md` – Verbotene Muster  - `70-numbering.md` – Nummernkreise  

8. **Release-Verifikation:**

   ```powershell- `99-glossary.md` – Glossar  - `80-ui-theme-navigation.md` – UI, Theme & Navigation  

   gh release view v$version --json name,tagName,assets

   ```- `90-deprecated-patterns.md` – Verbotene Muster  



### Ergebnis---- `99-glossary.md` – Glossar  



* KI **erstellt automatisch GitHub Release** mit allen erforderlichen Assets

* KI gibt am Ende **Version, Tag, Release-Status und Download-URLs** aus

* Falls ein Schritt fehlschlägt → **Abbruch + Diagnose** (keine Nachfragen)## 🚫 Deprecated Patterns---

* **Immer strikt nach Doku**, keine eigenen Workflows

* **Vollständig automatisiert** - keine manuellen GitHub-Aktionen erforderlich

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

