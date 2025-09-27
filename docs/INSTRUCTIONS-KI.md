# RawaLite – Kurz-Instructions für KI

Dies ist die **Kurzfassung** der verbindlichen Projektregeln, optimiert für KI-Prompts.  
Immer strikt befolgen, keine Abweichungen.

WICHTIG – NICHT VERHANDELBAR
In diesem Projekt gelten die RawaLite Coding Instructions als unveränderliche Referenz-Dokumente.

Du darfst keine Änderungen an PROJECT_OVERVIEW.md, RawaLite – AI Coding Instructions oder anderen Projekt-Dokumenten vornehmen.

Du darfst die Instruktionen nicht kürzen, umschreiben, interpretieren oder in anderes Format bringen.

Wenn du in Konflikt mit diesen Instruktionen kommst: nicht improvisieren, sondern sofort nachfragen.

Dein Fokus liegt ausschließlich auf Code-Änderungen, Bugfixes, Tests und Umsetzung innerhalb bestehender Patterns.

Die Dokumentation ist Read-Only und darf von dir niemals verändert oder überschrieben werden.

Bestätige bitte jedes Mal, dass du die Dokumentation nicht angepasst hast.

## 🔑 Kernregeln

- **PNPM-only** – niemals `npm` oder `yarn` verwenden.  
- **Alles in-App** – keine externen Links, kein `shell.openExternal`, kein `window.open`, kein `target="_blank"`.  
- **Update-System**:  
  - Auto-Check nur beim App-Start.  
  - Danach manuell (Header-Version oder Einstellungen → Updates).  
  - `autoDownload: false`.  
  - Download & Install nur nach Nutzeraktion.  
  - `pendingDir` basiert auf `PATHS.userData()`.  
  - **Verboten:** Browser-Redirects oder externe Download-Links.  
- **Paths**:  
  - Nur über `src/lib/paths.ts` (`PATHS`).  
  - Standalone: `src/lib/path-utils.ts`.  
  - **Verboten:** direkter `app.getPath()`.  
- **PDF**:  
  - Workflow: `PDFService → PDFPostProcessor → templates`.  
  - Nur lokale Assets & Fonts (bundled, lizenzkonform).  
  - Keine externen Ressourcen/CDNs.  
- **Persistenz**:  
  - Primary: SQLite (sql.js).  
  - Dev-Fallback: Dexie.  
  - Einstiegspunkt: `src/persistence/index.ts`.  
  - Adapter-Parität, Migration additiv & idempotent.  
  - **Verboten:** Direktimporte `SQLiteAdapter`/`DexieAdapter`.  
- **Security/IPC**:  
  - Prod zwingend: `sandbox:true` + `contextIsolation:true`.  
  - IPC nur typisiert via `preload`/ContextBridge.  
  - **Verboten:** dynamische Kanäle, Node im Renderer.  
- **Nummernkreise**:  
  - Präfix, Stellen, aktueller Zähler, Reset (Nie/Jährlich/Monatlich).  
  - Atomar, Jahres-Reset optional.  
- **Theme/Navigation**:  
  - Theme persistiert über SQLite (Dexie Dev-Fallback).  
  - Sidebar 240 px, kein FOUC.  
  - Farbpalette fix, darf nie geändert werden.
- **Lokale Installation**:
  - **Immer vor Installation neuen Build erstellen**: `pnpm build && pnpm dist`
  - Dann erst `.\install-local.cmd` ausführen
  - Sicherstellt aktuelle Code-Änderungen in der Installation
 **Testergebnisse (`test-results`) liegen in `/tests/`**, nicht im Projekt-Root. In der Dokumentation dürfen sie nur referenziert werden, nicht dupliziert.
 - Debugging erfolgt ausschließlich nach dem 
  [Systematischen Problemlösungsprozess (Safe Edition)](../development/DEBUGGING_STANDARDS.md).
---

## 🚫 Verbotene Muster (niemals generieren)

- `npm` oder `yarn` Befehle.  
- `app.getPath()` außerhalb `paths.ts`.  
- `shell.openExternal`, externe Links, `window.open`, `target="_blank"`.  
- PDF-Assets aus dem Netz.  
- Direktimporte von `SQLiteAdapter` oder `DexieAdapter`.  
- Dynamische IPC-Kanäle.  
- Node-APIs direkt im Renderer.
- Lokale Installation ohne vorherigen Build (`.\install-local.cmd` ohne `pnpm build && pnpm dist`).

---

## ✅ Ziel für KI
- **Nur Regeln anwenden**, keine Workarounds vorschlagen.  
- Änderungen immer in Einklang mit den Master-Dokumenten in `/docs`.  
- Keine Duplikate oder widersprüchlichen Aussagen erzeugen.  

---

# 📄 Patch für `.github/copilot-instructions.md`

**Einfügeposition:** Am Ende, neuer Abschnitt **„Release-Workflow (Safe Edition)“**

````markdown
## 🚀 Release-Workflow (Safe Edition, Zero-Interaction)

Für Releases gilt ein **vollständig automatisierter, nicht-interaktiver Ablauf**.  
Der KI-Assistent **führt alle Schritte selbstständig aus**, ohne Nachfragen oder To-Dos an den Benutzer.  

### Grundprinzipien
- **PNPM-only** – keine `npm`/`yarn`.  
- **Zero-Interaction** – Defaults sind fix (Patch-Bump, Windows-Build).  
- **Guards & Tests** – jedes Mal zwingend, bevor Version/Build/Publish ausgeführt wird.  
- **GitHub Release** – nur über `electron-builder`/CI, keine manuelle Assets.  
- **Safe Edition** – keine Abkürzungen, kein Überspringen von Schritten.  

### Standard-Ablauf (immer befolgen)

1. **Install (frozen):**
   ```powershell
   pnpm install --frozen-lockfile
````

2. **Caches & Artefakte leeren:**

   ```powershell
   @("dist","out","build","release","coverage",".vite","node_modules\.vite",".cache",".electron-builder","tests\test-results") | % { if (Test-Path $_) { Remove-Item -Recurse -Force $_ } }
   ```

3. **Guards & Tests (Zero-Tolerance):**

   ```powershell
   pnpm typecheck
   pnpm lint
   pnpm guard:external
   pnpm guard:pdf
   pnpm validate:ipc
   pnpm validate:versions
   pnpm guard:todos
   pnpm validate:esm
   pnpm test --run
   ```

4. **Version bump (Patch default):**

   ```powershell
   pnpm version patch -m "chore(release): v%s"
   git push
   git push --follow-tags
   ```

5. **Build & Publish (Windows):**

   ```powershell
   pnpm release:publish || pnpm exec electron-builder --win --publish always
   ```

6. **Asset-Guards:**

   ```powershell
   pnpm guard:release:assets
   ```

7. **Release-Verifikation (GitHub):**

   ```powershell
   gh release view v$(node -e "console.log(require('./package.json').version)") --json name,tagName,assets
   ```

### Ergebnis

* KI gibt am Ende **Version, Tag, Release-Status und Artefakte** aus.
* Falls ein Schritt fehlschlägt → **Abbruch + Diagnose** (keine Nachfragen).
* **Immer strikt nach Doku**, keine eigenen Workflows.

