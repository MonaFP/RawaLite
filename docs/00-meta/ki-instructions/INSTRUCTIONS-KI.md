# RawaLite – Kurz-Instructions für KI**If Critical Pattern Missing:** STOP immediately, re-implement from registry, test thoroughly.

## 📁 DOCUMENTATION STRUCTURE RULES - MANDATORY

**BEFORE CREATING OR MOVING ANY DOCUMENTATION:**

1. **MANDATORY:** Follow docs/ folder structure (00-meta to 13-deprecated)
2. **MANDATORY:** Check correct folder purpose before placement
3. **MANDATORY:** Use consistent naming patterns (LESSONS-LEARNED-topic.md)
4. **MANDATORY:** Update INDEX.md files when adding content
5. **FORBIDDEN:** Create duplicate files in multiple folders
6. **FORBIDDEN:** Mix different topics in same folder

**Folder Structure (MUST FOLLOW):**
```
docs/
├── 00-meta/           Meta-documentation, project management
├── 01-standards/      Code standards, conventions, guidelines  
├── 02-architecture/   System design, architecture decisions
├── 03-development/    Development workflows, debugging, setup
├── 04-testing/        Testing strategies, test documentation
├── 05-database/       Database design, migrations, schemas
├── 06-paths/          Path management, file system access
├── 07-ipc/            IPC communication patterns
├── 08-ui/             User interface design, components
├── 09-pdf/            PDF generation, document handling
├── 10-security/       Security concepts, authentication
├── 11-deployment/     Deployment, updates, distribution
├── 12-lessons/        Lessons learned, retrospectives
└── 13-deprecated/     Deprecated/obsolete content
```

**File Placement Rules:**
- **Development workflows** → `03-development/`
- **Architecture decisions** → `02-architecture/`
- **Database related** → `05-database/`
- **Deployment/Updates** → `11-deployment/`
- **Lessons Learned** → `12-lessons/` (unless topic-specific)
- **Cross-cutting concerns** → Use **cross-references**, not duplicates

**Naming Standards:**
- `LESSONS-LEARNED-specific-topic.md` for lessons
- `INDEX.md` for folder overview (ALL CAPS)
- Status folders: `/active/`, `/solved/` where applicable

**Cross-Reference Pattern:**
```markdown
> **Related:** See [Topic](../folder/file.md) for implementation details
> **See also:** [Related Topic](../other-folder/related.md)
```

## 🔑 KernregelnDies ist die **Kurzfassung** der verbindlichen Projektregeln, optimiert für KI-Prompts.  
Immer strikt befolgen, keine Abweichungen.

WICHTIG – NICHT VERHANDELBAR
In diesem Projekt gelten die RawaLite Coding Instructions als unveränderliche Referenz-Dokumente.

Du darfst keine Änderungen an PROJECT_OVERVIEW.md, RawaLite – AI Coding Instructions oder anderen Projekt-Dokumenten vornehmen.

Du darfst die Instruktionen nicht kürzen, umschreiben, interpretieren oder in anderes Format bringen.

Wenn du in Konflikt mit diesen Instruktionen kommst: nicht improvisieren, sondern sofort nachfragen.

Dein Fokus liegt ausschließlich auf Code-Änderungen, Bugfixes, Tests und Umsetzung innerhalb bestehender Patterns.

Die Dokumentation ist Read-Only und darf von dir niemals verändert oder überschrieben werden.

Bestätige bitte jedes Mal, dass du die Dokumentation nicht angepasst hast.

## � CRITICAL FIX PRESERVATION RULES - NICHT VERHANDELBAR

**BEFORE ANY FILE EDIT OR VERSION CHANGE:**

1. **MANDATORY:** Check `docs/00-meta/CRITICAL-FIXES-REGISTRY.md`
2. **MANDATORY:** Verify file is not listed in critical fixes
3. **MANDATORY:** If file IS listed → preserve ALL required patterns
4. **MANDATORY:** Run `pnpm validate:critical-fixes` before version bump
5. **FORBIDDEN:** Remove Promise-based WriteStream patterns
6. **FORBIDDEN:** Remove file system flush delays  
7. **FORBIDDEN:** Add duplicate event handlers
8. **FORBIDDEN:** Change established port configurations

**Critical Files (EXTRA CAUTION):**
- `src/main/services/GitHubApiService.ts` - WriteStream race condition fix
- `src/main/services/UpdateManagerService.ts` - File flush delay + event handler fix
- `vite.config.mts` + `electron/main.ts` - Port consistency

**If Critical Pattern Missing:** STOP immediately, re-implement from registry, test thoroughly.

## �🔑 Kernregeln

- **PNPM-only** – niemals `npm` oder `yarn` verwenden.  
- **Alles in-App** – keine externen Links, kein `shell.openExternal`, kein `window.open`, kein `target="_blank"`.  
- **Paths**:  
  - Nur über `src/lib/paths.ts` (`PATHS`).  
  - Standalone: `src/lib/path-utils.ts`.  
  - **Verboten:** direkter `app.getPath()`.  
- **Persistenz**:  
  - Primary: SQLite (better-sqlite3) - Native module für Performance.  
  - Legacy: Dexie-Adapter verfügbar für Migration.  
  - Einstiegspunkt: `src/persistence/index.ts`.  
  - Adapter-Parität, Migration additiv & idempotent.  
  - **Verboten:** Direktimporte `SQLiteAdapter`/`DexieAdapter`.  
- **Nummernkreise**:  
  - Präfix, Stellen, aktueller Zähler, Reset (Nie/Jährlich/Monatlich).  
  - Atomar, Jahres-Reset optional.  
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
- SQL.js oder sql-wasm Referenzen (deprecated).
- Veraltete IPC-Channels wie `database:backup` (jetzt `backup:hot`).
- Dynamische IPC-Kanäle.  
- Node-APIs direkt im Renderer.
- Lokale Installation ohne vorherigen Build (`.\install-local.cmd` ohne `pnpm build && pnpm dist`).

---

## ✅ Ziel für KI
- **Nur Regeln anwenden** 
- Änderungen immer in Einklang mit den Master-Dokumenten in `/docs`.  
- Keine Duplikate oder widersprüchlichen Aussagen erzeugen.  
- Entwickler fragen bei Unklarheiten
---

## ✅ docs-Struktur
- ** Änderung nur nach Abnahme und Aufforderung durch Entwickler **-
- **hier ergänzen/aktualisieren bei neuen Inhalten** - 
docs/
├── 00-meta/            Meta-documentation, project management
├── 01-standards/       Code standards, conventions, guidelines  
├── 02-architecture/    System design, architecture decisions
├── 03-development/     Development workflows, debugging, setup
├── 04-testing/         Testing strategies, test documentation
├── 05-database/        Database design, migrations, schemas
├── 06-paths/           Path management, file system access
├── 07-ipc/             IPC communication patterns
├── 08-ui/              User interface design, components
├── 09-pdf/             PDF generation, document handling
├── 10-security/        Security concepts, authentication
├── 11-deployment/      Deployment, updates, distribution
├── 12-lessons/         Lessons learned, retrospectives
└── 13-deprecated/      Deprecated/obsolete content

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

## 📁 Dokumentationsstruktur (KI-Optimiert)

### **Neue lückenlose Nummerierung (00-12):**

- **[00-meta/](.)** - 🤖 KI-Instruktionen, Standards, Workflows  
- **[01-architecture/](../01-architecture/)** - 🏗️ System-Design, Electron-Architektur
- **[02-development/](../02-development/)** - 👨‍💻 Development Guides, Build Processes
- **[03-testing/](../03-testing/)** - 🧪 Test Strategies, Debugging
- **[04-database/](../04-database/)** - 🗄️ SQLite, Schema-Konsistenz, Field-Mapping
- **[05-paths/](../05-paths/)** - 🛤️ PATHS System, Filesystem APIs
- **[06-ipc/](../06-ipc/)** - 🔗 IPC Communication, Security
- **[07-ui/](../07-ui/)** - 🎨 UI/UX, Themes, React Components
- **[08-pdf/](../08-pdf/)** - 📄 PDF Generation, Export
- **[09-security/](../09-security/)** - 🔒 Security Guidelines, Validation
- **[10-deployment/](../10-deployment/)** - 🚀 Build, Updates, Distribution
- **[11-lessons/](../11-lessons/)** - 📚 Konsolidierte Lessons Learned
- **[12-deprecated/](../12-deprecated/)** - 📦 Legacy Documentation

### **KI-Navigation Prinzipien:**
1. **Start here**: `00-meta/INSTRUCTIONS-KI.md` (diese Datei)
2. **Database-Arbeit**: `04-database/` für Schema-Konsistenz
3. **System-Design**: `01-architecture/` für Architektur-Fragen
4. **Development**: `02-development/` für Build/Dev-Prozesse
5. **Gelöste Probleme**: `*/solved/` in jeweiliger Kategorie

