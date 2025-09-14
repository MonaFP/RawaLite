# RawaLite – AI Coding Instructions# RawaLite – AI Coding Instructions



> **Professional Business Management Desktop App** - React + TypeScript + Electron + SQLite  > **Professional Business Management Desktop App** - React + TypeScript + Electron + SQLite  

> German business document generation with extended debug patterns for rapid development> German business document generation with extended debug patterns for rapid development



## 🛡️ Goldene Regeln (nicht verhandelbar)## 🛡️ Goldene Regeln (nicht verhandelbar)



1. **Alles läuft in-App.**1. **Alles läuft in-App.**

   Keine externen Seiten/Downloads im Browser. **Kein** `shell.openExternal`, **kein** `window.open`, **keine** externen `href`/`target="_blank"` – auch nicht als „Fallback".   Keine externen Seiten/Downloads im Browser. **Kein** `shell.openExternal`, **kein** `window.open`, **keine** externen `href`/`target="_blank"` – auch nicht als „Fallback“.



2. **Update-Flow vollständig in-App.**2. **Update-Flow vollständig in-App.**

   Check → Download → Verifikation → Installationsaufforderung → `quitAndInstall()` – **ohne** externe Navigation zu GitHub/Website.   Check → Download → Verifikation → Installationsaufforderung → `quitAndInstall()` – **ohne** externe Navigation zu GitHub/Website.



3. **PDF 100 % offline & deterministisch.**3. **PDF 100 % offline & deterministisch.**

   **Keine** externen Ressourcen (Webfonts/CDN/HTTP-Bilder/JS/CSS). **Alle** Assets eingebettet (Base64/Binary aus App-Paketen/Settings).   **Keine** externen Ressourcen (Webfonts/CDN/HTTP-Bilder/JS/CSS). **Alle** Assets eingebettet (Base64/Binary aus App-Paketen/Settings).



4. **Theme & Navigation persistent.**4. **Theme & Navigation persistent.**

   Auswahl bleibt nach **View → Reload** unverändert (SQLite/SettingsAdapter als Single-Source-of-Truth). Kein FOUC.   Auswahl bleibt nach **View → Reload** unverändert (SQLite/SettingsAdapter als Single-Source-of-Truth). Kein FOUC.



5. **Adapter-Parität.**5. **Adapter-Parität.**

   Gleiches Daten-/API-Verhalten für SQLite (sql.js, Datei-Persist) und IndexedDB/Dexie (Dev-Fallback). Keine Schema-Drifts.   Gleiches Daten-/API-Verhalten für SQLite (sql.js, Datei-Persist) und IndexedDB/Dexie (Dev-Fallback). Keine Schema-Drifts.



6. **Nummernkreise transaktional.**6. **Nummernkreise transaktional.**

   Atomare Vergabe ohne Doppelnummern; Jahr-Reset gemäß Konfiguration.   Atomare Vergabe ohne Doppelnummern; Jahr-Reset gemäß Konfiguration.



7. **Security: ESM + `contextIsolation: true`.**7. **Security: ESM + `contextIsolation: true`.**

   IPC **whitelist-basiert & typisiert**; Renderer ohne direkten Node/Shell.   IPC **whitelist-basiert & typisiert**; Renderer ohne direkten Node/Shell.



------



## 🔧 Tech Stack & Architecture## 🔧 Tech Stack & Architecture



⚠️ **PNPM-ONLY PROJECT** - Never use `npm` or `yarn` in commands or documentation⚠️ **PNPM-ONLY PROJECT** - Never use `npm` or `yarn` in commands or documentation



### Core Stack### Core Stack

- **Frontend**: React 18.3.1 + TypeScript 5.9.2 (strict mode)- **Frontend**: React 18.3.1 + TypeScript 5.9.2 (strict mode)

- **Desktop**: Electron 31.7.7 with IPC security (`contextIsolation: true`)- **Desktop**: Electron 31.7.7 with IPC security (`contextIsolation: true`)

- **Database**: SQLite (sql.js 1.13.0) with IndexedDB fallback (Dexie 4.2.0)- **Database**: SQLite (sql.js 1.13.0) with IndexedDB fallback (Dexie 4.2.0)

- **Build**: Vite 5.4.20 + esbuild for bundling- **Build**: Vite 5.4.20 + esbuild for bundling

- **Testing**: Vitest (unit) + Playwright (e2e) + Node.js integration tests- **Testing**: Vitest (unit) + Playwright (e2e) + Node.js integration tests



### Project Structure Patterns### Project Structure Patterns

``````

src/src/

├── adapters/          # Data access layer (SQLiteAdapter, SettingsAdapter)├── adapters/          # Data access layer (SQLiteAdapter, SettingsAdapter)

├── hooks/             # Business logic hooks (useCustomers, useOffers, useUnifiedSettings)├── hooks/             # Business logic hooks (useCustomers, useOffers, useUnifiedSettings)

├── services/          # External services (PDFService, UpdateService, VersionService)├── services/          # External services (PDFService, UpdateService, VersionService)

├── persistence/       # Database schema & migrations├── persistence/       # Database schema & migrations

├── lib/               # Shared utilities (themes, settings, numbering)├── lib/               # Shared utilities (themes, settings, numbering)

├── types/             # IPC types & global definitions├── types/             # IPC types & global definitions

└── components/        # React UI components└── components/        # React UI components



Key Files:Key Files:

- src/types/ipc.ts     # Strict IPC type definitions- src/types/ipc.ts     # Strict IPC type definitions

- src/persistence/adapter.ts # Database interface contract- src/persistence/adapter.ts # Database interface contract

- src/lib/settings.ts  # Numbering circles & company data types- src/lib/settings.ts  # Numbering circles & company data types

``````



### Adapter Pattern (Critical)### Adapter Pattern (Critical)

All data access goes through adapters implementing `PersistenceAdapter`:All data access goes through adapters implementing `PersistenceAdapter`:

```typescript```typescript

// ALWAYS use adapters, never direct database calls// ALWAYS use adapters, never direct database calls

const adapter = new SQLiteAdapter();const adapter = new SQLiteAdapter();

await adapter.createCustomer(customerData);await adapter.createCustomer(customerData);



// Unified settings access// Unified settings access

const { getNextNumber } = useUnifiedSettings();const { getNextNumber } = useUnifiedSettings();

const number = await getNextNumber('offers'); // "AN-2025-0001"const number = await getNextNumber('offers'); // "AN-2025-0001"

``````



## 🔬 Extended Debug System (Project Standard)## 🔬 Extended Debug System (Project Standard)



**CRITICAL**: All features must implement Extended Debug Pattern for 5-10x faster development**CRITICAL**: All features must implement Extended Debug Pattern for 5-10x faster development



### Template Processing Debug Pattern### Template Processing Debug Pattern

```typescript```typescript

// ALWAYS: Comprehensive debug output for template processing// ALWAYS: Comprehensive debug output for template processing

console.log('🔄 Processing conditionals and loops first...');console.log('🔄 Processing conditionals and loops first...');

template = template.replace(/\{\{#if\s+([^}]+)\}\}(.*?)\{\{\/if\}\}/gs, (match, condition, content) => {template = template.replace(/\{\{#if\s+([^}]+)\}\}(.*?)\{\{\/if\}\}/gs, (match, condition, content) => {

  const value = getNestedValue(data, condition.trim());  const value = getNestedValue(data, condition.trim());

  const result = value ? content : '';  const result = value ? content : '';

  console.log(`🔄 Conditional {{#if ${condition.trim()}}}: value=${!!value}, showing=${!!result}`);  console.log(`🔄 Conditional {{#if ${condition.trim()}}}: value=${!!value}, showing=${!!result}`);

  return result;  return result;

});});



// ALWAYS: Step-by-step variable resolution// ALWAYS: Step-by-step variable resolution

template = template.replace(/\{\{([^}]+)\}\}/g, (match, variable) => {template = template.replace(/\{\{([^}]+)\}\}/g, (match, variable) => {

  const result = getNestedValue(data, variable.trim());  const result = getNestedValue(data, variable.trim());

  console.log(`✅ Replaced {{${variable.trim()}}} = "${result}"`);  console.log(`✅ Replaced {{${variable.trim()}}} = "${result}"`);

  return result;  return result;

});});

``````



### Data Structure Analysis Pattern### Data Structure Analysis Pattern

```typescript```typescript

// ALWAYS: Log complete data structure before processing// ALWAYS: Log complete data structure before processing

console.log('📊 Template Data Structure:');console.log('📊 Template Data Structure:');

console.log('  - Offer exists:', !!templateData.offer);console.log('  - Offer exists:', !!templateData.offer);

console.log('  - Customer exists:', !!templateData.customer);console.log('  - Customer exists:', !!templateData.customer);



// ALWAYS: Test critical template variables// ALWAYS: Test critical template variables

console.log('🧪 TEMPLATE VARIABLE RESOLUTION TEST:');console.log('🧪 TEMPLATE VARIABLE RESOLUTION TEST:');

const testVars = ['offer.offerNumber', 'customer.name', 'company.name'];const testVars = ['offer.offerNumber', 'customer.name', 'company.name'];

testVars.forEach(varPath => {testVars.forEach(varPath => {

  const value = getNestedValue(templateData, varPath);  const value = getNestedValue(templateData, varPath);

  console.log(`  {{${varPath}}} = ${value !== undefined ? `"${value}"` : 'UNDEFINED'}`);  console.log(`  {{${varPath}}} = ${value !== undefined ? `"${value}"` : 'UNDEFINED'}`);

});});

``````



### Database Operation Debug### Database Operation Debug

```typescript```typescript

// ALWAYS: Debug data persistence operations// ALWAYS: Debug data persistence operations

console.log('💾 Saving customer:', customer.id, customer.name);console.log('💾 Saving customer:', customer.id, customer.name);

const result = await adapter.createCustomer(customer);const result = await adapter.createCustomer(customer);

console.log('✅ Save result:', result.success, result.id);console.log('✅ Save result:', result.success, result.id);

``````



---* `shell.openExternal(`, `window.open(`, `<a target="_blank" …>`, `href="http://|https://"`

* Update-UI mit Links/Buttons zu GitHub/Releases/Webseiten

## 🚨 Verbotene Patterns (Hard-Stop + CI-Fail)* PDF außerhalb von `PDFService`/`PDFPostProcessor`

* Renderer-Zugriff auf Node/Shell ohne IPC

* `shell.openExternal(`, `window.open(`, `<a target="_blank" …>`, `href="http://|https://"`* Externe Ressourcen in `templates/*.html` (Webfonts/CDN/CSS/JS/HTTP-Bilder)

* Update-UI mit Links/Buttons zu GitHub/Releases/Webseiten

* PDF außerhalb von `PDFService`/`PDFPostProcessor`**CI-Guards (Beispiele):**

* Renderer-Zugriff auf Node/Shell ohne IPC

* Externe Ressourcen in `templates/*.html` (Webfonts/CDN/CSS/JS/HTTP-Bilder)```bash

# verbiete externe Navigation (Code/Doku ausgenommen)

**CI-Guards (Beispiele):**git grep -nE 'shell\.openExternal|window\.open|target="_blank"|https?://' -- \

  :^docs :^README* || true

```bash

# verbiete externe Navigation (Code/Doku ausgenommen)# verbiete externe Assets in PDF-Templates

git grep -nE 'shell\.openExternal|window\.open|target="_blank"|https?://' -- \git grep -nE '<link[^>]+https?://|<script[^>]+https?://|<img[^>]+https?://' templates || true

  :^docs :^README* || true```



# verbiete externe Assets in PDF-Templates---

git grep -nE '<link[^>]+https?://|<script[^>]+https?://|<img[^>]+https?://' templates || true

```## � Verbotene Patterns (Hard-Stop + CI-Fail)



---**Muss:**



## 🔄 Update-System – In-App-Only (Kanon)* `autoDownload: false`; Download startet bewusst aus In-App-Modal.

* Fortschritt im `AutoUpdaterModal`; nach Download: Button „Jetzt installieren“ → `quitAndInstall()`.

**Muss:*** **Keine** externen Links/Texte „auf GitHub herunterladen“.



* `autoDownload: false`; Download startet bewusst aus In-App-Modal.**Anfasspunkte:**

* Fortschritt im `AutoUpdaterModal`; nach Download: Button „Jetzt installieren" → `quitAndInstall()`.

* **Keine** externen Links/Texte „auf GitHub herunterladen".* `electron/main.ts` (Updater-Events, Menü **ohne** externe Hilfe-Links)

* `src/hooks/useAutoUpdater.ts` (State-Maschine/IPC)

**Anfasspunkte:*** `src/components/AutoUpdaterModal.tsx`, `src/pages/UpdatesPage.tsx` (nur In-App-Aktionen)

* `src/services/UpdateService.ts` (steuert **nicht** via Browser, sondern via `electron-updater`)

* `electron/main.ts` (Updater-Events, Menü **ohne** externe Hilfe-Links)* `electron-builder.yml` (publish-Quelle konsistent)

* `src/hooks/useAutoUpdater.ts` (State-Maschine/IPC)

* `src/components/AutoUpdaterModal.tsx`, `src/pages/UpdatesPage.tsx` (nur In-App-Aktionen)**Tests:**

* `src/services/UpdateService.ts` (steuert **nicht** via Browser, sondern via `electron-updater`)

* `electron-builder.yml` (publish-Quelle konsistent)* `tests/integration/update-system/*` → kein externer Link, Download→Ready→Install-Prompt grün.



**Tests:**---



* `tests/integration/update-system/*` → kein externer Link, Download→Ready→Install-Prompt grün.## 🔄 Update-System – In-App-Only (Kanon)



---**Muss:**



## 🧾 PDF-System – Offline, stabil, reproduzierbar* `templates/*.html` ohne externe `<link>/<script>/<img>`

* Logos/Fonts/CSS lokal/eingebettet (Settings/Assets/Base64)

**Muss:*** Datenvalidierung vor Render (Defaults/Placeholders)

* Ausschließlich über `PDFService` + `PDFPostProcessor` exportieren

* `templates/*.html` ohne externe `<link>/<script>/<img>`

* Logos/Fonts/CSS lokal/eingebettet (Settings/Assets/Base64)**Anfasspunkte:**

* Datenvalidierung vor Render (Defaults/Placeholders)`src/services/PDFService.ts`, `src/services/PDFPostProcessor.ts`, `templates/*`, `src/lib/pdfThemes.ts`, `src/lib/settings.ts`

* Ausschließlich über `PDFService` + `PDFPostProcessor` exportieren

**Tests:**

**Anfasspunkte:**`test-pdf-system.js` ohne Netzwerk; Snapshots für deterministisches Layout.

`src/services/PDFService.ts`, `src/services/PDFPostProcessor.ts`, `templates/*`, `src/lib/pdfThemes.ts`, `src/lib/settings.ts`

---

**Tests:**

`test-pdf-system.js` ohne Netzwerk; Snapshots für deterministisches Layout.## 🧾 PDF-System – Offline, stabil, reproduzierbar



---**Muss:**



## 🎨 Theme & Navigation – Persistenz & Stabilität* Persistenz in **SQLite/Settings** (nicht `localStorage`).

* Kein FOUC: Theme sofort am App-Start anwenden.

**Muss:*** Komplementäre Widgets:



* Persistenz in **SQLite/Settings** (nicht `localStorage`).  * **Sidebar-Navigation** ⇒ Widgets **im Header**

* Kein FOUC: Theme sofort am App-Start anwenden.  * **Header-Navigation** ⇒ Widgets **in der Sidebar**

* Komplementäre Widgets:* **Sidebar immer 240 px**, identische Typografie in beiden Modi.



  * **Sidebar-Navigation** ⇒ Widgets **im Header****Anfasspunkte:**

  * **Header-Navigation** ⇒ Widgets **in der Sidebar**`src/adapters/SettingsAdapter.ts`, `src/contexts/SettingsContext.tsx`, Hooks `useUnifiedSettings`, `useDesignSettings`, Doku `docs/THEMES_NAVIGATION.md`

* **Sidebar immer 240 px**, identische Typografie in beiden Modi.

**Tests:**

**Anfasspunkte:**`tests/integration/design/theme-persistence.js`, `tests/integration/persistence/reload-test.js`

`src/adapters/SettingsAdapter.ts`, `src/contexts/SettingsContext.tsx`, Hooks `useUnifiedSettings`, `useDesignSettings`, Doku `docs/THEMES_NAVIGATION.md`

---

**Tests:**

`tests/integration/design/theme-persistence.js`, `tests/integration/persistence/reload-test.js`## 🎨 Theme & Navigation – Persistenz & Stabilität



---**Muss:**



## 🗄️ Persistenz-Adapter – Parität & Migration* Gemeinsames Interface `src/persistence/adapter.ts` für SQLite/Dexie

* Jede schreibende Operation triggert Datei-Persist

**Muss:*** Migrationen additiv/idempotent (`ALTER TABLE` in try/catch)



* Gemeinsames Interface `src/persistence/adapter.ts` für SQLite/Dexie**Anfasspunkte:**

* Jede schreibende Operation triggert Datei-Persist`src/adapters/SQLiteAdapter.ts`, `src/adapters/IndexedDBAdapter.ts`, `src/persistence/sqlite/db.ts`

* Migrationen additiv/idempotent (`ALTER TABLE` in try/catch)**Tests:** `tests/integration/database/*`, `complete-test.js`, `verification.js`



**Anfasspunkte:**---

`src/adapters/SQLiteAdapter.ts`, `src/adapters/IndexedDBAdapter.ts`, `src/persistence/sqlite/db.ts`

**Tests:** `tests/integration/database/*`, `complete-test.js`, `verification.js`## �️ Persistenz-Adapter – Parität & Migration



---**Muss:**



## 🔢 Nummernkreise – Atomar & konsistent* Zentrale Vergabe via `useUnifiedSettings().getNextNumber(kind)`

* Atomar/Transaktion/Lock; Jahr-Reset gemäß Konfiguration

**Muss:**

**Anfasspunkte:**

* Zentrale Vergabe via `useUnifiedSettings().getNextNumber(kind)``src/lib/numbering.ts`, Fix-Skripte `fix-numbering*.cjs`, `validate-version-sync.mjs`

* Atomar/Transaktion/Lock; Jahr-Reset gemäß Konfiguration**Tests:** Parallelitäts-Unit-Tests + Roundtrip-Integration



**Anfasspunkte:**---

`src/lib/numbering.ts`, Fix-Skripte `fix-numbering*.cjs`, `validate-version-sync.mjs`

**Tests:** Parallelitäts-Unit-Tests + Roundtrip-Integration## � Nummernkreise – Atomar & konsistent



---**Muss:**



## 🔐 Security/IPC – Whitelist & Types* `contextIsolation: true`, `sandbox: true`

* IPC strikt getypt (`src/types/ipc.ts`) & nur in `preload.ts` exponiert

**Muss:*** Keine dynamischen/unbestimmten IPC-Kanäle



* `contextIsolation: true`, `sandbox: true`**Anfasspunkte:**

* IPC strikt getypt (`src/types/ipc.ts`) & nur in `preload.ts` exponiert`electron/preload.ts`, `electron/main.ts`, `src/types/ipc.ts`, `validate-ipc-types.mjs`

* Keine dynamischen/unbestimmten IPC-Kanäle**Tests:** `validate-ipc-types.mjs` in CI, Negative-Tests für verbotene Kanäle



**Anfasspunkte:**---

`electron/preload.ts`, `electron/main.ts`, `src/types/ipc.ts`, `validate-ipc-types.mjs`

**Tests:** `validate-ipc-types.mjs` in CI, Negative-Tests für verbotene Kanäle## 🔐 Security/IPC – Whitelist & Types



---1. **Einlesen**: `docs/PROJECT_OVERVIEW.md`, Struktur, Adapter/Hooks/Pages, Naming.

2. **Impact-Analyse** auf Update/PDF/Persistenz/IPC/Nummernkreise.

## 🧰 Arbeitsweise3. **Warten auf Arbeitsauftrag** – keine Umsetzung vor Freigabe.

4. **Implementieren** strikt innerhalb bestehender Patterns/Pfade.

1. **Einlesen**: `docs/PROJECT_OVERVIEW.md`, Struktur, Adapter/Hooks/Pages, Naming.5. **Validieren**: `pnpm typecheck && pnpm lint && pnpm test && pnpm e2e`.

2. **Impact-Analyse** auf Update/PDF/Persistenz/IPC/Nummernkreise.6. **CI-Guards** (unten) müssen grün sein.

3. **Warten auf Arbeitsauftrag** – keine Umsetzung vor Freigabe.

4. **Implementieren** strikt innerhalb bestehender Patterns/Pfade.---

5. **Validieren**: `pnpm typecheck && pnpm lint && pnpm test && pnpm e2e`.

6. **CI-Guards** (unten) müssen grün sein.## 🧰 Arbeitsweise



---* [ ] Kein `shell.openExternal` / `window.open` / externe `href`/`target`.

* [ ] Update-Flow vollständig in-App; Download→Install getestet.

## ✅ Qualitäts-Checkliste (vor jedem PR/Release)* [ ] PDF-Templates ohne externe Ressourcen; Export offline deterministisch.

* [ ] Theme/Navigation persistieren über Reload; kein FOUC.

* [ ] Kein `shell.openExternal` / `window.open` / externe `href`/`target`.* [ ] Adapter-Parität; Migrationen idempotent.

* [ ] Update-Flow vollständig in-App; Download→Install getestet.* [ ] Nummernvergabe atomar; Parallel-Tests grün.

* [ ] PDF-Templates ohne externe Ressourcen; Export offline deterministisch.* [ ] IPC getypt/whitelisted; `contextIsolation` aktiv.

* [ ] Theme/Navigation persistieren über Reload; kein FOUC.* [ ] Version-Sync: `package.json` == Versionservice (Script grün).

* [ ] Adapter-Parität; Migrationen idempotent.* [ ] Lint/Typecheck/Unit/E2E/Guards alle grün.

* [ ] Nummernvergabe atomar; Parallel-Tests grün.

* [ ] IPC getypt/whitelisted; `contextIsolation` aktiv.---

* [ ] Version-Sync: `package.json` == Versionservice (Script grün).

* [ ] Lint/Typecheck/Unit/E2E/Guards alle grün.## ✅ Qualitäts-Checkliste (vor jedem PR/Release)



---```jsonc

{

## 🛠️ Nützliche Skripte (ergänzen in `package.json`)  "scripts": {

    "guard:external": "git grep -nE \"shell\\.openExternal|window\\.open|target=\\\"_blank\\\"|https?://\" -- . ':!docs' ':!README*' && echo \"NO EXTERNALS FOUND\"",

```jsonc    "guard:pdf": "git grep -nE \"<link[^>]+https?://|<script[^>]+https?://|<img[^>]+https?://\" templates && echo \"NO EXTERNAL ASSETS\"",

{    "validate:ipc": "node validate-ipc-types.mjs",

  "scripts": {    "validate:versions": "node validate-version-sync.mjs",

    "guard:external": "git grep -nE \"shell\\.openExternal|window\\.open|target=\\\"_blank\\\"|https?://\" -- . ':!docs' ':!README*' && echo \"NO EXTERNALS FOUND\"",    "precommit": "pnpm typecheck && pnpm lint && pnpm guard:external && pnpm guard:pdf && pnpm validate:ipc && pnpm validate:versions"

    "guard:pdf": "git grep -nE \"<link[^>]+https?://|<script[^>]+https?://|<img[^>]+https?://\" templates && echo \"NO EXTERNAL ASSETS\"",  }

    "validate:ipc": "node validate-ipc-types.mjs",}

    "validate:versions": "node validate-version-sync.mjs",```

    "precommit": "pnpm typecheck && pnpm lint && pnpm guard:external && pnpm guard:pdf && pnpm validate:ipc && pnpm validate:versions"

  }---

}

```## �️ Nützliche Skripte (ergänzen in `package.json`)



---**DB-Debug (Dev, Browser Console):**



## 🔍 Debug-Tipps & Workflows (konkret)```js

window.rawaliteDebug.getDatabaseInfo();

**DB-Debug (Dev, Browser Console):**window.rawaliteDebug.exportDatabase();

window.rawaliteDebug.saveDatabase();

```js```

window.rawaliteDebug.getDatabaseInfo();

window.rawaliteDebug.exportDatabase();**PDF-Export (einzig gültiger Weg):**

window.rawaliteDebug.saveDatabase();

``````ts

import { PDFService } from '../services/PDFService';

**PDF-Export (einzig gültiger Weg):**const result = await PDFService.exportOfferToPDF(offer, customer, settings);

if (result.success) console.log('PDF saved to:', result.filePath);

```ts```

import { PDFService } from '../services/PDFService';

const result = await PDFService.exportOfferToPDF(offer, customer, settings);**Auto-Numbering (zentral):**

if (result.success) console.log('PDF saved to:', result.filePath);

``````ts

const { getNextNumber } = useUnifiedSettings();

**Auto-Numbering (zentral):**await getNextNumber('offer');   // "AN-2025-0001"

await getNextNumber('invoice'); // "RE-2025-0001"

```tsawait getNextNumber('timesheet'); // "LN-2025-0001"

const { getNextNumber } = useUnifiedSettings();```

await getNextNumber('offer');   // "AN-2025-0001"

await getNextNumber('invoice'); // "RE-2025-0001"**Theme-Anwendung (stabil, keine HEX-Änderungen):**

await getNextNumber('timesheet'); // "LN-2025-0001"

``````ts

export function applyTheme(theme: ThemeDefinition) {

**Theme-Anwendung (stabil, keine HEX-Änderungen):**  document.documentElement.style.setProperty('--primary-color', theme.primary);

  document.documentElement.style.setProperty('--secondary-color', theme.secondary);

```ts  document.documentElement.style.setProperty('--accent-color', theme.accent);

export function applyTheme(theme: ThemeDefinition) {  document.documentElement.style.setProperty('--sidebar-gradient', theme.gradient);

  document.documentElement.style.setProperty('--primary-color', theme.primary);}

  document.documentElement.style.setProperty('--secondary-color', theme.secondary);```

  document.documentElement.style.setProperty('--accent-color', theme.accent);

  document.documentElement.style.setProperty('--sidebar-gradient', theme.gradient);---

}

```---



---## 🔍 Debug-Tipps & Workflows (konkret)


**Sprache & Doku:** Deutsch für UI/Kommentare/Dokumentation.  
**Konsistenz vor Features:** Erst Guardrails grün, dann neue Funktionalität.