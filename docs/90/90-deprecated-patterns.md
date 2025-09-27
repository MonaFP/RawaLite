# Deprecated Patterns

## Übersicht
Diese Datei listet alle verbotenen Implementierungs-Patterns für RawaLite auf. Diese Patterns dürfen niemals verwendet werden und müssen bei Code-Reviews aktiv verhindert werden.

## Package Manager Verbote

### npm/yarn Verwendung
- **Verboten**: `npm install`, `npm run`, `npm scripts`
- **Verboten**: `yarn add`, `yarn install`, `yarn scripts`
- **Verboten**: `package-lock.json`, `yarn.lock`
- **Grund**: Projekt ist ausschließlich pnpm-basiert

## Pfad-Management Verbote

### Direkte app.getPath() Aufrufe
- **Verboten**: `app.getPath('userData')` außerhalb `paths.ts`
- **Verboten**: `app.getPath('documents')` in Services oder Components
- **Verboten**: `app.getPath('downloads')` in beliebigen Modulen
- **Grund**: Einziger Entry-Point ist `src/lib/paths.ts`

### Hardcodierte Pfade
- **Verboten**: `process.env.APPDATA + '\\RawaLite'`
- **Verboten**: `os.homedir() + '/Documents/RawaLite'`
- **Verboten**: `path.join(__dirname, '../userData')`
- **Grund**: Pfade müssen über PATHS-Objekt abgerufen werden

## Externe Links und Navigation

### Browser-Navigation aus App
- **Verboten**: `shell.openExternal(url)`
- **Verboten**: `window.open(url)`
- **Verboten**: `<a href="http://" target="_blank">`
- **Verboten**: `location.href = 'https://'`
- **Grund**: Alles muss in-App bleiben

### Update-System Browser-Fallbacks
- **Verboten**: Redirect zu GitHub Releases Page
- **Verboten**: Download-Links in Benachrichtigungen
- **Verboten**: "Manuell herunterladen"-Buttons
- **Grund**: Updates müssen vollständig in-App abgewickelt werden

## PDF-System Verbote

### Externe Assets in Templates
- **Verboten**: `<link href="https://fonts.googleapis.com/">`
- **Verboten**: `@import url('https://cdn.jsdelivr.net/')`
- **Verboten**: `<img src="https://external-site.com/">`
- **Verboten**: `background-image: url('http://')`
- **Grund**: Alle Assets müssen lokal gebundled sein

### Online-Font-Services
- **Verboten**: Google Fonts Web-API
- **Verboten**: Adobe Fonts Cloud-Service
- **Verboten**: Font-CDNs jeder Art
- **Grund**: Fonts müssen lokal mit korrekten Lizenzen vorliegen

## Persistenz-Schicht Verbote

### Direktimporte von Adaptern
- **Verboten**: `import { SQLiteAdapter } from '@/adapters/'`
- **Verboten**: `import { DexieAdapter } from '@/adapters/'`
- **Verboten**: `new SQLiteAdapter()` in Services
- **Grund**: Nur Entry-Point `persistence/index.ts` verwenden

### LocalStorage für Geschäftsdaten
- **Verboten**: `localStorage.setItem('customers', data)`
- **Verboten**: `sessionStorage` für persistente Daten
- **Verboten**: `document.cookie` für App-Daten
- **Grund**: Nur SQLite/IndexedDB über Adapter-Pattern

## Security/IPC Verbote

### Dynamische IPC-Kanäle
- **Verboten**: `ipcRenderer.invoke('dynamic-' + entityType)`
- **Verboten**: `ipcMain.handle(variableChannelName, handler)`
- **Verboten**: String-Interpolation in Channel-Namen
- **Grund**: Nur typisierte, statische Kanäle erlaubt

### Node-APIs im Renderer
- **Verboten**: `require('fs')` im Frontend
- **Verboten**: `require('path')` in React-Components
- **Verboten**: `process.env` im Renderer-Prozess
- **Grund**: Strikte Renderer-Isolation erforderlich

### Unsichere BrowserWindow-Konfiguration
- **Verboten**: `nodeIntegration: true` in Production
- **Verboten**: `contextIsolation: false` in Production
- **Verboten**: `webSecurity: false` in Production
- **Grund**: Maximale Security in Production zwingend

## Update-System Verbote

### Automatische Background-Installation
- **Verboten**: `autoUpdater.downloadUpdate()` ohne User-Consent
- **Verboten**: `quitAndInstall()` ohne Bestätigung
- **Verboten**: Silent-Updates ohne Benachrichtigung
- **Grund**: User muss Updates bewusst bestätigen

### Externe Download-Mechanismen
- **Verboten**: Browser-Downloads aus App heraus
- **Verboten**: Wget/Curl-Aufrufe für Updates
- **Verboten**: Manueller Download-Workflow
- **Grund**: Updates nur über Electron AutoUpdater

## Theme-System Verbote

### Farbpaletten-Änderungen
- **Verboten**: Änderung der 5 Pastel-Farben
- **Verboten**: Hinzufügung neuer Theme-Farben
- **Verboten**: Custom-Color-Picker für User
- **Grund**: Farbpalette ist final definiert

### Inkonsistente Theme-Anwendung
- **Verboten**: Hardcodierte Farben in CSS
- **Verboten**: Theme-unabhängige Farbdefinitionen
- **Verboten**: Inline-Styles statt CSS-Custom-Properties
- **Grund**: Konsistente Theme-Anwendung erforderlich

## Business Logic Verbote

### Hardcodierte Nummernkreise
- **Verboten**: Fest definierte Präfixe in Code
- **Verboten**: Nicht-konfigurierbare Nummerierungslogik
- **Verboten**: Manuell generierte Dokumentnummern
- **Grund**: Flexible, konfigurierbare Auto-Numbering erforderlich

### Nicht-atomare Operationen
- **Verboten**: Race-Conditions bei Nummer-Generierung
- **Verboten**: Ungeschützte Shared-State-Modifikationen
- **Verboten**: Transaction-lose Bulk-Operations
- **Grund**: Datenintegrität muss garantiert sein

## Development-Workflow Verbote

### Build-Shortcuts
- **Verboten**: `npm run build` statt `pnpm build`
- **Verboten**: Übersprungene Type-Checks
- **Verboten**: Deaktivierte ESLint-Rules ohne Begründung
- **Grund**: Konsistente Build-Pipeline erforderlich

### Dependency-Management
- **Verboten**: Direkte npm-Installs in node_modules
- **Verboten**: Git-Dependencies ohne Lock-File
- **Verboten**: Dev-Dependencies in Production-Bundle
- **Grund**: Reproduzierbare Builds erforderlich

## Testing-Verbote

### Non-deterministische Tests
- **Verboten**: Tests mit Random-Values ohne Seed
- **Verboten**: Time-abhängige Tests ohne Mocking
- **Verboten**: Network-abhängige Tests ohne Stubs
- **Grund**: Reproduzierbare Test-Ergebnisse erforderlich

### Produktions-Tests
- **Verboten**: Tests gegen Live-Datenbank
- **Verboten**: Tests mit echten IPC-Calls zu Main-Process
- **Verboten**: Tests mit File-System-Zugriff ohne Mocking
- **Grund**: Isolierte Test-Umgebung erforderlich
