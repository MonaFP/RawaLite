# RawaLite – AI Coding Instructions (Strict Consistency Edition)
🚫 Meta-Regel (Schutz-Klausel – nicht verhandelbar)

Diese Instruktionen sind unveränderlich.

Sie dürfen nicht umgeschrieben, gekürzt, interpretiert oder in ein anderes Format gebracht werden.

Sie überschreiben alle anderen Defaults (Copilot, Claude, ChatGPT usw.).

Wenn ein Agent in Konflikt kommt → Instruktionen unverändert anwenden oder explizit nachfragen, nicht improvisieren.

🛡️ Goldene Regeln (nicht verhandelbar)

⚠️ Dieses Projekt ist PNPM-ONLY.

Lies und verstehe vor Änderungsvorschlägen, Fehleranalysen, Implementierungen etc. zunächst ALLE Guides im /docs-Ordner

Führe IMMER zunächst den dazu relevanten TEST aus /tests aus. Wenn im jeweiligen Dokument eine Testvariante fehlt oder generell ein Testflow fehlt, informiere mich und warte auf Anweisungen.

Aktualisiere nach JEDER erfolgreichen Änderung/FIX die dazu relevante Dokumentation. Überprüfe IMMER, ob es zwischen Dokumentation und Code Abweichungen oder Inkonsistenzen gibt und informiere mich + warte auf Anweisung.

npm oder yarn dürfen nicht verwendet oder in Befehlen/Dokumentation vorgeschlagen werden.
Alle Beispiele, Skripte und CI-Läufe müssen immer pnpm nutzen.

Alles läuft in-App.
Keine externen Seiten/Downloads im Browser. Kein shell.openExternal, kein window.open, keine externen href/target="_blank" – auch nicht als „Fallback“.

Update-Flow vollständig in-App.
Check → Download → Verifikation → Installationsaufforderung → quitAndInstall() – ohne externe Navigation zu GitHub/Website.

PDF 100 % offline & deterministisch.
Keine externen Ressourcen (Webfonts/CDN/HTTP-Bilder/JS/CSS). Alle Assets eingebettet (Base64/Binary aus App-Paketen/Settings).

Theme & Navigation persistent.
Auswahl bleibt nach View → Reload unverändert (SQLite/SettingsAdapter als Single-Source-of-Truth). Kein FOUC.

Adapter-Parität.
Gleiches Daten-/API-Verhalten für SQLite (sql.js, Datei-Persist) und IndexedDB/Dexie (Dev-Fallback). Keine Schema-Drifts.

Nummernkreise transaktional.
Atomare Vergabe ohne Doppelnummern; Jahr-Reset gemäß Konfiguration.

Security: ESM + contextIsolation: true.
IPC whitelist-basiert & typisiert; Renderer ohne direkten Node/Shell.

---

## 🔧 Technologie-Stack (konsistenz-geführt)

* **Runtime/Tools:** Node 20, pnpm (Primary), Vite + esbuild, Electron (Main/Preload gebündelt), TypeScript strict.
* **Frontend:** React 18 + React Router.
* **Persistenz:** SQLite (sql.js) + Datei-Persist via IPC im AppData; Dexie/IndexedDB als Dev-Fallback.
* **Updater:** `electron-updater` – **nur In-App-Workflow**.
* **PDF:** `PDFService` + `PDFPostProcessor` (Electron PDF).

> Versions-Up/Downgrades nur, wenn bestehende Projektdateien es verlangen. Keine blinden Tool-Änderungen.

---

## 🚨 Verbotene Patterns (Hard-Stop + CI-Fail)

* `shell.openExternal(`, `window.open(`, `<a target="_blank" …>`, `href="http://|https://"`
* Update-UI mit Links/Buttons zu GitHub/Releases/Webseiten
* PDF außerhalb von `PDFService`/`PDFPostProcessor`
* Renderer-Zugriff auf Node/Shell ohne IPC
* Externe Ressourcen in `templates/*.html` (Webfonts/CDN/CSS/JS/HTTP-Bilder)

**CI-Guards (Beispiele):**

```bash
# verbiete externe Navigation (Code/Doku ausgenommen)
git grep -nE 'shell\.openExternal|window\.open|target="_blank"|https?://' -- \
  :^docs :^README* || true

# verbiete externe Assets in PDF-Templates
git grep -nE '<link[^>]+https?://|<script[^>]+https?://|<img[^>]+https?://' templates || true
```

---

## 🔄 Update-System – In-App-Only (Kanon)

**Muss:**

* `autoDownload: false`; Download startet bewusst aus In-App-Modal.
* Fortschritt im `AutoUpdaterModal`; nach Download: Button „Jetzt installieren“ → `quitAndInstall()`.
* **Keine** externen Links/Texte „auf GitHub herunterladen“.

**Anfasspunkte:**

* `electron/main.ts` (Updater-Events, Menü **ohne** externe Hilfe-Links)
* `src/hooks/useAutoUpdater.ts` (State-Maschine/IPC)
* `src/components/AutoUpdaterModal.tsx`, `src/pages/UpdatesPage.tsx` (nur In-App-Aktionen)
* `src/services/UpdateService.ts` (steuert **nicht** via Browser, sondern via `electron-updater`)
* `electron-builder.yml` (publish-Quelle konsistent)

**Tests:**

* `tests/integration/update-system/*` → kein externer Link, Download→Ready→Install-Prompt grün.

---

## 🧾 PDF-System – Offline, stabil, reproduzierbar

**Muss:**

* `templates/*.html` ohne externe `<link>/<script>/<img>`
* Logos/Fonts/CSS lokal/eingebettet (Settings/Assets/Base64)
* Datenvalidierung vor Render (Defaults/Placeholders)
* Ausschließlich über `PDFService` + `PDFPostProcessor` exportieren

**Anfasspunkte:**
`src/services/PDFService.ts`, `src/services/PDFPostProcessor.ts`, `templates/*`, `src/lib/pdfThemes.ts`, `src/lib/settings.ts`

**Tests:**
`test-pdf-system.js` ohne Netzwerk; Snapshots für deterministisches Layout.

---

## 🎨 Theme & Navigation – Persistenz & Stabilität

**Muss:**

* Persistenz in **SQLite/Settings** (nicht `localStorage`).
* Kein FOUC: Theme sofort am App-Start anwenden.
* Komplementäre Widgets:

  * **Sidebar-Navigation** ⇒ Widgets **im Header**
  * **Header-Navigation** ⇒ Widgets **in der Sidebar**
* **Sidebar immer 240 px**, identische Typografie in beiden Modi.

**Anfasspunkte:**
`src/adapters/SettingsAdapter.ts`, `src/contexts/SettingsContext.tsx`, Hooks `useUnifiedSettings`, `useDesignSettings`, Doku `docs/THEMES_NAVIGATION.md`

**Tests:**
`tests/integration/design/theme-persistence.js`, `tests/integration/persistence/reload-test.js`

---

## 🗄️ Persistenz-Adapter – Parität & Migration

**Muss:**

* Gemeinsames Interface `src/persistence/adapter.ts` für SQLite/Dexie
* Jede schreibende Operation triggert Datei-Persist
* Migrationen additiv/idempotent (`ALTER TABLE` in try/catch)

**Anfasspunkte:**
`src/adapters/SQLiteAdapter.ts`, `src/adapters/IndexedDBAdapter.ts`, `src/persistence/sqlite/db.ts`
**Tests:** `tests/integration/database/*`, `complete-test.js`, `verification.js`

---

## 🔢 Nummernkreise – Atomar & konsistent

**Muss:**

* Zentrale Vergabe via `useUnifiedSettings().getNextNumber(kind)`
* Atomar/Transaktion/Lock; Jahr-Reset gemäß Konfiguration

**Anfasspunkte:**
`src/lib/numbering.ts`, Fix-Skripte `fix-numbering*.cjs`, `validate-version-sync.mjs`
**Tests:** Parallelitäts-Unit-Tests + Roundtrip-Integration

---

## 🔐 Security/IPC – Whitelist & Types

**Muss:**

* `contextIsolation: true`, `sandbox: true`
* IPC strikt getypt (`src/types/ipc.ts`) & nur in `preload.ts` exponiert
* Keine dynamischen/unbestimmten IPC-Kanäle

**Anfasspunkte:**
`electron/preload.ts`, `electron/main.ts`, `src/types/ipc.ts`, `validate-ipc-types.mjs`
**Tests:** `validate-ipc-types.mjs` in CI, Negative-Tests für verbotene Kanäle

---

## 🧰 Arbeitsweise

1. **Einlesen**: `docs/PROJECT_OVERVIEW.md`, Struktur, Adapter/Hooks/Pages, Naming.
2. **Impact-Analyse** auf Update/PDF/Persistenz/IPC/Nummernkreise.
3. **Warten auf Arbeitsauftrag** – keine Umsetzung vor Freigabe.
4. **Implementieren** strikt innerhalb bestehender Patterns/Pfade.
5. **Validieren**: `pnpm typecheck && pnpm lint && pnpm test && pnpm e2e`.
6. **CI-Guards** (unten) müssen grün sein.

---

## ✅ Qualitäts-Checkliste (vor jedem PR/Release)

* [ ] Kein `shell.openExternal` / `window.open` / externe `href`/`target`.
* [ ] Update-Flow vollständig in-App; Download→Install getestet.
* [ ] PDF-Templates ohne externe Ressourcen; Export offline deterministisch.
* [ ] Theme/Navigation persistieren über Reload; kein FOUC.
* [ ] Adapter-Parität; Migrationen idempotent.
* [ ] Nummernvergabe atomar; Parallel-Tests grün.
* [ ] IPC getypt/whitelisted; `contextIsolation` aktiv.
* [ ] Version-Sync: `package.json` == Versionservice (Script grün).
* [ ] Lint/Typecheck/Unit/E2E/Guards alle grün.

---
Perfekt — hier ist der **fertige Abschnitt** für deine `COPILOT_INSTRUCTIONS.md`, exakt im Stil deiner bestehenden Regeln. Einfach unter die Goldenen Regeln/Update-System einfügen.

---

## 🚀 Release/Publish – automatisiert (pnpm-only, electron-builder → GitHub)

**Prinzipien (nicht verhandelbar)**

* Quelle der Wahrheit ist **electron-builder** mit **publish: github**.
* **Keine** manuellen Releases ohne Assets. `gh release upload` ist **nur Fallback**.
* **Dateinamen dürfen nicht umbenannt werden**: `latest.yml`, `.exe`, `.blockmap` müssen **1:1** zu den Einträgen in `latest.yml` passen.
* **PNPM-ONLY** in allen Befehlen, Skripten und CI-Jobs.
* **ZIP-Target entfernt**: Reduziert Upload-Zeit und -größe drastisch (von 1.3GB auf ~170MB).

**electron-builder.yml (Optimiert)**

```yaml
appId: com.rawalite.app
productName: RawaLite
directories:
  output: dist
publish:
  - provider: github
    owner: MonaFP
    repo: RawaLite
win:
  target:
    - nsis  # Nur NSIS, ZIP entfernt für schnellere Uploads
  artifactName: "RawaLite-Setup-${version}.${ext}"
nsis:
  oneClick: false
  allowToChangeInstallationDirectory: true
```

**package.json – Skripte (pnpm)**

```jsonc
{
  "scripts": {
    "//": "Release: immer Builder → GitHub. Optimiert ohne ZIP-Target.",
    "dist": "electron-builder --win --x64 --publish always",
    "release:dry": "electron-builder --win --x64 --publish never",

    "//guard": "CI-Guards: Release ist nur gültig, wenn latest.yml + exe + blockmap existieren",
    "guard:release:assets": "node guard-release-assets.mjs"
  }
}
```

**CI/Local Voraussetzungen**

* `GH_TOKEN` mit Repo-Rechten gesetzt (GitHub Actions: Secrets).
* Netzwerkzugriff zu `uploads.github.com` (HTTPS).
* Version‐Sync: Tag `vX.Y.Z` == `package.json.version`.

**CI-Schritt: Publish + Asset-Guard (Optimiert)**

```bash
# Build & Publish (pnpm) - Nur .exe, .blockmap, latest.yml
pnpm i --frozen-lockfile
pnpm dist

# Guard: sicherstellen, dass auf dem Release die Kern-Assets liegen
VERSION=$(node -p "require('./package.json').version")
gh release view "v$VERSION" --repo MonaFP/RawaLite --json assets --jq '
  [ .assets[].name ] as $a
  | ( ($a | index("latest.yml")) != null )
    and ( any($a[]; endswith(".exe")) )
    and ( any($a[]; endswith(".blockmap")) )
' | grep -q true || { echo "❌ Release-Assets fehlen oder heißen falsch."; exit 1; }
```

**Fallback (nur wenn absolut nötig)**

```powershell
# Vorher prüfen, was bereits hängt:
gh release view v1.7.2 --repo MonaFP/RawaLite --json assets --jq '.assets[].name'

# Upload (überschreiben). Achtung: Dateinamen exakt wie im latest.yml!
$env:GH_DEBUG="api"
gh release upload v1.7.2 `
  dist/latest.yml `
  "dist/RawaLite-Setup-1.7.2.exe" `
  "dist/RawaLite-Setup-1.7.2.exe.blockmap" `
  --repo MonaFP/RawaLite --clobber

# HINWEIS: ZIP nicht mehr erforderlich - electron-updater nutzt nur .exe + .blockmap
```

**Dev vs Prod (wichtig)**

* **Dev/`electron:dev`**: Updater standardmäßig **aus** (Logs wie „Skip checkForUpdates…" sind normal).
* **Prod (gepackt)**: Updater **an**; Tests des Update-Flows nur im gepackten Build bewerten.

**Definition of Done – Release (Optimiert)**

* `pnpm dist` erzeugt **latest.yml + .exe + .blockmap** (ZIP entfernt).
* GitHub-Release „vX.Y.Z" enthält **alle kritischen** Assets (Guard grün).
* `electron-updater` findet „latest" und installiert **in-App** (kein externer Link).
* Version in UI stammt **nur** aus `app.getVersion()` via IPC.
* **Upload-Zeit reduziert**: ~170MB statt 1.3GB durch ZIP-Wegfall.

---

---


## 🛠️ Nützliche Skripte (ergänzen in `package.json`)

```jsonc
{
  "scripts": {
    "guard:external": "git grep -nE \"shell\\.openExternal|window\\.open|target=\\\"_blank\\\"|https?://\" -- . ':!docs' ':!README*' && echo \"NO EXTERNALS FOUND\"",
    "guard:pdf": "git grep -nE \"<link[^>]+https?://|<script[^>]+https?://|<img[^>]+https?://\" templates && echo \"NO EXTERNAL ASSETS\"",
    "validate:ipc": "node validate-ipc-types.mjs",
    "validate:versions": "node validate-version-sync.mjs",
    "precommit": "pnpm typecheck && pnpm lint && pnpm guard:external && pnpm guard:pdf && pnpm validate:ipc && pnpm validate:versions"
  }
}
```

---

## 🏗️ Architektur-Patterns – Sofort produktiv werden

**Adapter-Pattern (Persistenz):**
```ts
// Einheitliche Schnittstelle für SQLite + IndexedDB
src/persistence/adapter.ts          // Interface-Definition
src/adapters/SQLiteAdapter.ts       // Production (sql.js + file persist)
src/adapters/IndexedDBAdapter.ts    // Dev-Fallback (Dexie)
```

**React-Hook-Pattern (Business Logic):**
```ts
// Standard-Struktur für Entity-Management
export function useCustomers() {
  const { adapter } = usePersistence();
  const { getNextNumber } = useUnifiedSettings();
  
  // CRUD + Auto-Numbering + Validation + Error-Handling
  async function createCustomer(input) {
    const customerNumber = await getNextNumber('customers'); // K-0001
    return await adapter.createCustomer({ ...input, number: customerNumber });
  }
}
```

**IPC-Pattern (Electron-Security):**
```ts
// 1. Type-Definition (src/types/ipc.ts)
export interface DatabaseAPI {
  save: (data: Uint8Array) => Promise<boolean>;
}

// 2. Preload-Exposing (electron/preload.ts)
const rawaliteAPI: RawaliteAPI = {
  db: { save: (data) => ipcRenderer.invoke('db:save', data) }
};

// 3. Main-Handler (electron/main.ts)
ipcMain.handle('db:save', async (_, data: Uint8Array) => { /* impl */ });
```

**Component-Composition-Pattern:**
```tsx
// Pages orchestrieren Hooks + zeigen Tabellen/Formulare
export default function AngebotePage() {
  const { offers, createOffer, updateOffer } = useOffers();
  const { customers } = useCustomers();
  
  return mode === "list" 
    ? <Table data={offers} columns={columns} onEdit={setEditMode} />
    : <OfferForm onSubmit={handleSubmit} customers={customers} />;
}
```

---

## 🔍 Debug-Tipps & Workflows (konkret)

**DB-Debug (Dev, Browser Console):**

```js
window.rawaliteDebug.getDatabaseInfo();
window.rawaliteDebug.exportDatabase();
window.rawaliteDebug.saveDatabase();
```

**Hooks testen (Vitest):**

```ts
// tests/unit/hooks/useCustomers.test.ts - Standard-Pattern
import { renderHook, act } from '@testing-library/react';
import { useCustomers } from '@/hooks/useCustomers';

// Mock PersistenceContext + useUnifiedSettings
const { result } = renderHook(() => useCustomers());
await act(async () => {
  await result.current.createCustomer({ name: 'Test' });
});
```

**PDF-Export (einzig gültiger Weg):**

```ts
import { PDFService } from '../services/PDFService';
const result = await PDFService.exportOfferToPDF(offer, customer, settings);
if (result.success) console.log('PDF saved to:', result.filePath);
```

**Auto-Numbering (zentral):**

```ts
const { getNextNumber } = useUnifiedSettings();
await getNextNumber('customers');  // "K-0001"
await getNextNumber('offers');     // "AN-2025-0001"
await getNextNumber('invoices');   // "RE-2025-0001"
await getNextNumber('timesheets'); // "LN-2025-0001"
```

**Theme-Anwendung (stabil, keine HEX-Änderungen):**

```ts
export function applyTheme(theme: ThemeDefinition) {
  document.documentElement.style.setProperty('--primary-color', theme.primary);
  document.documentElement.style.setProperty('--secondary-color', theme.secondary);
  document.documentElement.style.setProperty('--accent-color', theme.accent);
  document.documentElement.style.setProperty('--sidebar-gradient', theme.gradient);
}
```

**Integration Tests ausführen:**

```bash
# Database & Schema
node tests/integration/database/verification.js

# Theme Persistence 
node tests/integration/design/theme-persistence.js

# Update System
node tests/integration/update-system/github-api.js
```

---

## 📁 Kritische Dateipfade (Orientierung)

**Core Business Logic:**
- `src/hooks/use{Customers,Offers,Invoices,Timesheets}.ts` – Entity-Management
- `src/adapters/SQLiteAdapter.ts` – Hauptdatenbank-Implementation
- `src/lib/numbering.ts` – Automatische Nummernvergabe
- `src/services/{PDFService,UpdateService}.ts` – Externe Integration

**Architektur-Schnittstellen:**
- `src/persistence/adapter.ts` – Persistenz-Interface
- `src/types/ipc.ts` – Electron-IPC-Definitionen  
- `src/contexts/{PersistenceContext,SettingsContext}.tsx` – State-Management

**Config & Validation:**
- `validate-ipc-types.mjs` – Security & Type-Safety CI-Guard
- `electron-builder.yml` – Release-Konfiguration
- `tests/integration/*` – System-Tests ohne UI-Dependencies

---

**Sprache & Doku:** Deutsch für UI/Kommentare/Dokumentation.
**Konsistenz vor Features:** Erst Guardrails grün, dann neue Funktionalität.