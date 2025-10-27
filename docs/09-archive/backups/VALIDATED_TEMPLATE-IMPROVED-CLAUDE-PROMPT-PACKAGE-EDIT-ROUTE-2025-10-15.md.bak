# RawaLite – Implementiere Edit-Route für „Pakete" (Focus-Mode, kein Overlay) - VERBESSERTE VERSION

**🚨 KRITISCHE RAWALITE-COMPLIANCE (ERGÄNZT)**

* **PFLICHT vor Start:** Befolge [KI-SESSION-BRIEFING.prompt.md](../../.github/prompts/KI-SESSION-BRIEFING.prompt.md)
  - Lese **ZWINGEND:** `docs/00-meta/final/CRITICAL-FIXES-REGISTRY.md` (ABSOLUT KRITISCH!)
  - Lese **ZWINGEND:** `docs/00-meta/final/VALIDATED-2025-10-15_INSTRUCTIONS-KI.md` 
  - Lese **ZWINGEND:** `.github/copilot-instructions.md`
* **Nichts ausführen, bis ich „OK Phase 1/2/3…" schreibe.**
* **Critical-Fixes:** `pnpm validate:critical-fixes` MUSS vor jedem Schritt PASS zeigen (15/15 Fixes)
* Strikt nach **RawaLite-Goldenen Regeln** (PNPM-only, keine externen Links/Shell, PDF/Updater unberührt, IPC getypt, `contextIsolation: true`).
* **Field-Mapping:** Nutze `convertSQLQuery()`, niemals hardcoded snake_case SQL
* **Environment:** `!app.isPackaged` für Dev/Prod-Detection (niemals `process.env.NODE_ENV`)
* **Dokumentation:** Konsultiere `docs/07-ipc/` und `docs/08-ui/` für etablierte Patterns
* Nur bestehende Patterns verwenden. Keine neuen Frameworks.
* **IPC-Security:** Nur statische whitelisted channels erweitern, keine dynamischen Kanäle
* Nach jedem Schritt: `pnpm validate:critical-fixes && pnpm typecheck && pnpm lint && pnpm guard:external && pnpm guard:pdf && pnpm validate:ipc && pnpm validate:versions` ausführen und Ergebnis posten (ohne zu starten, nur berichten).
* Wenn du bestehenden Code auslagerst: **zuerst auskommentieren**, dann neue Datei, dann schrittweise umhängen.

---

## Ziel

1. Für den Bereich **Pakete** eine **eigene Edit-Ansicht als Route** bauen (`/pakete/:id/edit`) – **Focus-Mode-konform** (keine Overlays, keine `position: fixed`-UI).
2. **Listenzustand** (Filter, Sortierung, Scroll) **beim Wechsel zur Edit-Route sichern** und beim Zurücknavigieren **restaurieren**.
3. **Keyboard-Shortcuts**: `Esc` → zurück zur Liste; `Ctrl+S` → Speichern.
4. IPC-Calls **typisiert über preload** (keine Node-APIs im Renderer).

---

## Kritische Pfade (halte dich daran)

* **Field-Mapping:** `src/lib/field-mapper.ts` - IMMER verwenden für DB-Zugriffe
* **Environment Detection:** `!app.isPackaged` (NIEMALS `process.env.NODE_ENV`)
* Hooks: `use{Customers,Offers,Invoices,Timesheets}.ts` → analog **`usePackages.ts`** falls nicht vorhanden.
* Services: `PDFService.ts`, `UpdateService.ts` (unverändert lassen!), neu/ergänzt: **`PackageService.ts`** falls sinnvoll.
* Persistenz: `SQLiteAdapter.ts`, `adapter.ts` (Parität zu Dexie beachten).
* Nummern: `lib/numbering.ts` (nicht anfassen).
* Security: `ipc.ts`, `preload.ts`, `main.ts` (nur whitelisten, nichts dynamisch).
* Router/Pages: `src/pages/PackagesPage.tsx`, **`src/pages/PackageEditPage.tsx` (neu)**.

---

## Akzeptanzkriterien (Definition of Done)

* **A1. Route:** Navigieren von `/pakete` zu `/pakete/:id/edit` funktioniert, inkl. Browser-History.
* **A2. State-Restore:** Nach Rückkehr zur Liste (Back/Save/Cancel) sind Filter/Sort/Scroll exakt wie zuvor.
* **A3. Focus-Mode:** Keine Modals/Drawer/Dock-Overlays. Alles **in-flow** im Hauptpane (oder Vollseiten-Edit).
* **A4. Shortcuts:** `Esc` → zurück, `Ctrl+S` → Speichern (nur in Edit-View aktiv).
* **A5. IPC-getypt:** Laden/Speichern eines Pakets erfolgt über **typisierte IPC-Handler** (whitelist in `ipc.ts`, exposed via `preload.ts`).
* **A6. Critical-Fixes:** `pnpm validate:critical-fixes` zeigt 15/15 PASS nach jeder Phase
* **A7. Tests grün:** `pnpm typecheck lint test e2e` grün; Guards grün.
* **A8. Keine verbotenen Patterns:** Kein `shell.openExternal`, kein `window.open`, keine externen `href`.
* **A9. Adapter-Parität:** Änderungen an DB-Schema nur additiv; Dexie/SQLite Parität gegeben (falls betroffen).
* **A10. Field-Mapping:** Alle DB-Zugriffe nutzen `convertSQLQuery()` 
* **A11. Kein FOUC, Theme bleibt persistent.**
* **A12. Updater/PDF bleiben unverändert und lauffähig.**

---

## Phase 1 – Routing & Skeleton (keine Logik brechen)

**🚨 KI-ERINNERUNG VOR PHASE-START:**
```
🔴 SESSION-CRITICAL (Vergessen = Session-Killer):
- 🛡️ pnpm validate:critical-fixes → 15/15 PASS (vor JEDEM Schritt)
- 🗄️ convertSQLQuery() für ALLE DB-Zugriffe (nie hardcoded snake_case)
- 🗂️ PATHS-System (nie app.getPath in Renderer)

🟡 COMPLIANCE-CRITICAL (Vergessen = Anti-Pattern):
- 🔒 !app.isPackaged (nie process.env.NODE_ENV)
- 📡 Statische IPC channels (nie dynamisch)
- 🚫 Keine externen Links/Shell (shell.openExternal verboten)

� CONTEXT-REMINDER: Schema v26 (19 Tabellen), hierarchische package_line_items
```

**🧠 KI-MEMORY-TRICK**: Vor JEDER Code-Zeile frage: "Validation + Field-Mapping + PATHS OK?"

**ZWINGEND VOR START:**
1. **Führe KI-SESSION-BRIEFING durch** (lese alle 3 kritischen Dokumente)
2. **Prüfe:** `pnpm validate:critical-fixes` muss 15/15 PASS zeigen
3. **Konsultiere:** `docs/08-ui/INDEX.md` für bestehende UI-Patterns
4. **Konsultiere:** `docs/05-database/DATABASE-ARCHITECTURE-CURRENT-STATE.md` für Schema v26 (19 Tabellen)
5. **Konsultiere:** `docs/06-paths/final/PATHS-SYSTEM-DOCUMENTATION.md` für sichere Pfad-Abstraktion

**Aufgaben:**

1. **Router anpassen:** Füge Route `"/pakete/:id/edit"` hinzu (React Router).
2. **Datei neu:** `src/pages/PackageEditPage.tsx`

   * Minimaler Skeleton mit: Breadcrumb („Pakete › {Name} bearbeiten"), Formularfeldern (Name, Betrag, Items-Textarea), Buttons „Speichern"/„Abbrechen".
   * Keine Overlays.
   * **Environment Detection:** `!app.isPackaged` für Dev-spezifische Features
3. **Listenzustand sichern:**

   * In `PackagesPage.tsx`: Halte Filter, Sort, Scroll in `useRef`/`useState`; beim Klick auf „Bearbeiten": persistiere Zustand in `sessionStorage` unter key `ui:packages:liststate` (oder bestehendes Muster).
   * Beim Remount von `/pakete`: Zustand lesen und anwenden (Filter/Sort setzen, Scroll via `requestAnimationFrame` setzen).
4. **Navigation:**

   * „Bearbeiten"-Buttons führen zu `navigate("/pakete/"+id+"/edit")`.
   * In `PackageEditPage`: „Abbrechen" → `navigate(-1)` (oder explizit zurück nach `/pakete`).
5. **Shortcuts (nur Edit-View aktiv):**

   * `Esc` → zurück, `Ctrl+S` → submit.

**VALIDATION NACH PHASE 1:**
```bash
pnpm validate:critical-fixes && pnpm typecheck && pnpm lint && pnpm guard:external && pnpm guard:pdf && pnpm validate:ipc && pnpm validate:versions
```

**🚨 KI-COMPLETION-CHECK:**
```
⚠️ KI-MEMORY-MANAGEMENT: Bei Context-Überlauf THIS MESSAGE wiederholen:
"🔴 SESSION-CRITICAL: validate:critical-fixes + convertSQLQuery + PATHS-System"

Vor "Phase 1 abgeschlossen" melden ZWINGEND prüfen:
- ✅ Alle Validation Commands ausgeführt und Ergebnisse gepostet
- ✅ Critical-Fixes Status: 15/15 PASS bestätigt
- ✅ Keine verbotenen Patterns (shell.openExternal, etc.) verwendet
- ✅ Field-Mapping Pattern korrekt angewandt
- ✅ Stop-and-Wait für User-OK implementiert
```

**Nicht tun:** DB/Speichern; nur UI & Navigation.
**Output:** diffs/Codeblöcke, Liste geänderter Dateien, Validation-Results.
**Stop & auf mein OK warten.**

---

## Phase 2 – IPC & Datenfluss (typisiert)

**🚨 KI-ERINNERUNG VOR PHASE-START:**
```
🔴 SESSION-CRITICAL (Vergessen = Session-Killer):
- 🛡️ pnpm validate:critical-fixes → 15/15 PASS (vor JEDEM Schritt)
- 🗄️ convertSQLQuery() für ALLE DB-Zugriffe (nie hardcoded snake_case)
- 🗂️ PATHS-System (nie app.getPath in Renderer)

🟡 COMPLIANCE-CRITICAL (Vergessen = Anti-Pattern):
- 🔒 !app.isPackaged (nie process.env.NODE_ENV)
- 📡 Statische IPC channels (nie dynamisch)
- 🚫 Keine externen Links/Shell (shell.openExternal verboten)

� CONTEXT-REMINDER: Schema v26 (19 Tabellen), hierarchische package_line_items
```

**🧠 KI-MEMORY-TRICK**: Vor JEDER Code-Zeile frage: "Validation + Field-Mapping + PATHS OK?"

**ZWINGEND VOR START:**
1. **Konsultiere:** `docs/07-ipc/INDEX.md` für IPC-Security-Patterns
2. **Prüfe:** Bestehende IPC-Kanäle in `electron/ipc/`

**Aufgaben:**

1. **IPC Contracts definieren** (typsicher):

   * **Nur statische channels** - keine dynamischen Channel-Namen
   * In `electron/ipc/packages.ts` (neue Datei nach bestehendem Pattern):

     * `packages:getById` (input: `{id:number}` → output: `PackageDTO`)
     * `packages:update` (input: `UpdatePackageDTO` → output: `{ok:true}`)
   * Typen in `types/ipc-packages.d.ts` (oder bestehende Typ-Sammlung) definieren.
   * **Whitelist** in `electron/ipc/index.ts` erweitern
2. **Main-Handler** (in `electron/ipc/packages.ts`):

   * Implementiere `ipcMain.handle('packages:getById', …)` und `ipcMain.handle('packages:update', …)`
   * Zugriff auf DB **NUR über Field-Mapper**: `convertSQLQuery()` verwenden
   * **VERBOTEN:** Direkter SQL mit snake_case
   * Zugriff nur über bestehenden Adapter (`SQLiteAdapter`/Service). Keine neuen Singletons.
3. **Preload Bridge** (`preload.ts`):

   * Exponiere `window.api.packages.getById(id)` und `window.api.packages.update(dto)` mit strikten Typen.
   * **Security:** `contextIsolation: true` Pattern beibehalten
4. **Renderer-Nutzung:**

   * `PackageEditPage.tsx` lädt on-mount das Paket via `await window.api.packages.getById(id)`.
   * Beim Speichern `await window.api.packages.update(dto)`; nach Erfolg: Toast → zurück zur Liste.
5. **Fehlerpfade & a11y:**

   * Ladezustände (spinner klein) + Fehlermeldung (inline, kein Modal).
   * Disable-Buttons bei Pending. Focus-Management nach Save/Back sauber.

**VALIDATION NACH PHASE 2:**
```bash
pnpm validate:critical-fixes && pnpm typecheck && pnpm lint && pnpm guard:external && pnpm guard:pdf && pnpm validate:ipc && pnpm validate:versions
```

**🚨 KI-COMPLETION-CHECK:**
```
⚠️ KI-MEMORY-MANAGEMENT: Bei Context-Überlauf THIS MESSAGE wiederholen:
"🔴 SESSION-CRITICAL: validate:critical-fixes + convertSQLQuery + PATHS-System"

Vor "Phase 2 abgeschlossen" melden ZWINGEND prüfen:
- ✅ Alle Validation Commands ausgeführt und Ergebnisse gepostet
- ✅ IPC-Channels korrekt erweitert (statisch, nicht dynamisch)
- ✅ Preload Bridge korrekt mit getypten DTOs implementiert
- ✅ Kein process.env.NODE_ENV verwendet, nur !app.isPackaged
- ✅ Disable-Buttons bei Pending implementiert
- ✅ Stop-and-Wait für User-OK implementiert
```

**Output:** diffs/Codeblöcke, aktualisierte Typen, `preload` Anpassungen, Validation-Results.
**Guards & Checks laufen lassen.**
**Stop & auf mein OK warten.**

---

## Phase 3 – State-Restore & UX-Politur

**🚨 KI-ERINNERUNG VOR PHASE-START:**
```
🔴 SESSION-CRITICAL (Vergessen = Session-Killer):
- 🛡️ pnpm validate:critical-fixes → 15/15 PASS (vor JEDEM Schritt)
- 🗄️ convertSQLQuery() für ALLE DB-Zugriffe (nie hardcoded snake_case)
- 🗂️ PATHS-System (nie app.getPath in Renderer)

🟡 COMPLIANCE-CRITICAL (Vergessen = Anti-Pattern):
- 🔒 !app.isPackaged (nie process.env.NODE_ENV)
- 📡 Statische IPC channels (nie dynamisch)
- 🚫 Keine externen Links/Shell (shell.openExternal verboten)

� CONTEXT-REMINDER: Schema v26 (19 Tabellen), hierarchische package_line_items
✅ VALIDATION: Vollständige Guard-Chain vor Completion
```

**🧠 KI-MEMORY-TRICK**: Vor JEDER Code-Zeile frage: "Validation + Field-Mapping + PATHS OK?"

**Aufgaben:**

1. **State-Restore verifizieren:**

   * In `/pakete` tief scrollen, filtern, sortieren → „Bearbeiten" → „Speichern" → zurück → exakt gleicher Zustand.
2. **Breadcrumb & Keyboard:**

   * Breadcrumb in Edit-View korrekt mit Paketnamen.
   * `Esc`/`Ctrl+S` nur in Edit aktiv (nicht global).
3. **Unsaved-Guard:**

   * Wenn Formular dirty: beim Verlassen (Back/Route-Wechsel) **in-app Prompt** (kein Browser-Modal).
4. **E2E-Szenario:**

   * Test: `open list → filter → scroll → edit(id) → change → save → back → state restored`.
5. **Refactor minimal:**

   * Kein toter Code. Kommentare drin lassen, wo ausgelagert.

**FINAL VALIDATION:**
```bash
pnpm validate:critical-fixes && pnpm typecheck && pnpm lint && pnpm test && pnpm guard:external && pnpm guard:pdf && pnpm validate:ipc && pnpm validate:versions
```

**🚨 KI-COMPLETION-CHECK:**
```
⚠️ KI-MEMORY-MANAGEMENT: Bei Context-Überlauf THIS MESSAGE wiederholen:
"🔴 SESSION-CRITICAL: validate:critical-fixes + convertSQLQuery + PATHS-System"

Vor "Phase 3 abgeschlossen" melden ZWINGEND prüfen:
- ✅ Alle FINAL VALIDATION Commands ausgeführt und Ergebnisse gepostet
- ✅ E2E-Szenario getestet: Liste → Filter → Scroll → Edit → Save → Back → State-Restore
- ✅ SessionStorage für UI-State korrekt implementiert
- ✅ Focus-Management sauber nach Save/Back
- ✅ Kein toter Code hinterlassen
- ✅ Stop-and-Wait für User-FINAL-OK implementiert
```

**Output:** kurze GIF/Schritte (oder Text) der E2E-Checks, diffs, ALLE Validation-Results.

---

## Technische Leitplanken (streng befolgen)

* **PNPM-only.**
* **Critical-Fixes:** 15/15 PASS in allen Phasen ZWINGEND
* **Field-Mapping:** `convertSQLQuery()` für alle DB-Zugriffe ZWINGEND  
* **Environment:** `!app.isPackaged` ZWINGEND (niemals `process.env.NODE_ENV`)
* **PATHS-System:** Alle Pfade über PATHS abstrahiert, niemals direkter `app.getPath()` in Renderer
* **Kein `shell.openExternal`, kein `window.open`, keine externen href.**
* **Kein Overlay-UI** (keine Modals/Drawer/Dock via `position: fixed`).
* **`contextIsolation: true`, `sandbox: true`** bleiben.
* IPC **nur whitelisted** + **typisiert** + **statische Channels**.
* **PDF/Updater/THEME** nicht anfassen.
* Adapter-Parität **SQLite ↔ Dexie** wahren.
* Migrations nur **additiv** & **idempotent** (falls nötig; bevorzugt vermeiden).
* **DB-Schema:** Schema v26 (19 Tabellen) berücksichtigen, hierarchische Daten patterns beachten

---

## Akzeptanztests (manuell)

1. **Critical-Fixes-Test:** `pnpm validate:critical-fixes` zeigt 15/15 PASS
2. Starte App im Focus-Mode.
3. Gehe zu **Pakete**. Filtere „paket 2", sortiere absteigend, scrolle bis ca. 70%.
4. Klicke „Bearbeiten" bei einem Eintrag.
5. Ändere Name minimal, `Ctrl+S` → Toast → automatisch zurück.
6. Prüfe: Filter/Sort/Scroll **exakt** wie vor dem Edit.
7. Erneut Edit; `Esc` → zurück.
8. Dirty-Form: Eingabe ändern, versuche zurück → **In-App-Prompt** erscheint.
9. **Field-Mapping-Test:** Alle DB-Queries nutzen `convertSQLQuery()`
10. **Environment-Test:** Dev-Features nur bei `!app.isPackaged`
11. **PATHS-Test:** Keine direkten `app.getPath()` Aufrufe in Renderer Process
12. **Schema-Test:** Hierarchische package_line_items korrekt behandelt (parent-child)

---

## Code-Hinweise (nur Muster, an Projekt anpassen)

* **Field-Mapping Pattern:**
  ```typescript
  // ✅ RICHTIG:
  const query = convertSQLQuery(`
    SELECT {id}, {title}, {unitPrice} 
    FROM packages 
    WHERE {id} = ?
  `);
  
  // ❌ FALSCH:
  const query = `SELECT id, title, unit_price FROM packages WHERE id = ?`;
  ```

* **Environment Detection:**
  ```typescript
  // ✅ RICHTIG:
  const isDev = !app.isPackaged;
  
  // ❌ FALSCH:
  const isDev = process.env.NODE_ENV === 'development';
  ```

* **PATHS-System Pattern:**
  ```typescript
  // ✅ RICHTIG (Renderer Process):
  import PATHS from '../lib/paths';
  const dbPath = await PATHS.DATABASE_FILE();
  
  // ❌ FALSCH (Renderer Process):
  const dbPath = app.getPath('userData') + '/database/rawalite.db';
  ```

* **DB-Schema Pattern (Schema v26):**
  ```typescript
  // ✅ RICHTIG: Hierarchische package_line_items berücksichtigen
  const items = convertSQLQuery(`
    SELECT {id}, {packageId}, {parentItemId}, {hierarchyLevel}
    FROM package_line_items 
    WHERE {packageId} = ?
    ORDER BY COALESCE({parentItemId}, {id}), {parentItemId} NULLS FIRST
  `);
  ```

* Route:
  ```tsx
  <Route path="/pakete" element={<PackagesPage/>} />
  <Route path="/pakete/:id/edit" element={<PackageEditPage/>} />
  ```

* Preload (Auszug):
  ```ts
  contextBridge.exposeInMainWorld('api', {
    packages: {
      getById: (id:number)=> ipcRenderer.invoke('packages:getById', {id}),
      update: (dto:UpdatePackageDTO)=> ipcRenderer.invoke('packages:update', dto),
    }
  });
  ```

* State-Persist:
  ```ts
  sessionStorage.setItem('ui:packages:liststate', JSON.stringify({ q, sort, scrollTop }));
  // beim Zurücklesen: anwenden + scrollTop via rAF setzen
  ```

---

## 🧠 KI-Memory-Management Strategien

### **Context-Window Überlauf Prevention:**
```
Bei langen Conversations DIESE 3 Punkte IMMER im Gedächtnis:
1. 🛡️ pnpm validate:critical-fixes (vor JEDEM Schritt)
2. 🗄️ convertSQLQuery() (für ALLE DB-Zugriffe)
3. 🗂️ PATHS-System (nie app.getPath in Renderer)
```

### **Prioritäts-Hierarchie:**
- **🔴 SESSION-CRITICAL**: Vergessen = Session unmöglich fortsetzbar
- **🟡 COMPLIANCE-CRITICAL**: Vergessen = Anti-Pattern, aber reparabel
- **💡 CONTEXT-REMINDER**: Hilfsinformation, wenn verfügbar

### **Memory-Tricks für KI:**
- **Mantra**: "Validation + Field-Mapping + PATHS OK?" vor jeder Code-Zeile
- **Context-Anker**: Bei Überlauf die 🔴 SESSION-CRITICAL Message wiederholen
- **Phase-Grenzen**: Stop-and-Wait nach jeder Phase für Memory-Reset

---

## Abschluss

Wenn **A1–A12** erfüllt & **Critical-Fixes 15/15 PASS** & Guards/Tests grün → PR-Notizen mit Kurzbeschreibung, betroffenen Dateien, Risiken (keine) und Rollback-Hinweis (Toggle Route zurück auf Liste) erstellen.

**🚨 FINAL CHECK ZWINGEND:**
```bash
pnpm validate:critical-fixes && echo "SUCCESS: All 15 critical fixes preserved"
```

**Warte jetzt auf mein „OK Phase 1".**