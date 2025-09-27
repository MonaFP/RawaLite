# Security & IPC

## Überblick
RawaLite implementiert ein striktes Security-Modell für die Kommunikation zwischen Electron Main Process und Renderer Process. Alle IPC-Kommunikation erfolgt ausschließlich über typisierte Kanäle mit vollständiger Isolation.

## Production-Sicherheitsanforderungen

### Verpflichtende BrowserWindow-Konfiguration
```typescript
// Zwingend in Production
webPreferences: {
  sandbox: true,                    // Vollständige Renderer-Isolation
  contextIsolation: true,           // Context-Bridge verpflichtend
  nodeIntegration: false,           // Node-APIs im Renderer verboten
  enableRemoteModule: false,        // Remote-Module deaktiviert
  webSecurity: true,                // Web-Security aktiviert
  allowRunningInsecureContent: false, // Nur HTTPS/Secure Content
  preload: path.join(__dirname, 'preload.js') // Typisierte IPC-Bridge
}
```

### Strikte CSP-Policy
- **Content Security Policy**: Keine inline-scripts, keine eval(), keine externen Ressourcen
- **Resource Loading**: Nur lokale Ressourcen aus App-Bundle erlaubt
- **Network Requests**: Ausschließlich über IPC an Main Process

## IPC-Architektur

### Context Bridge Pattern
- **Einziger Zugang**: Über `window.rawalite` und `window.electronAPI`
- **Typisierung**: Vollständig typisierte Interfaces in `src/types/ipc.ts`
- **Preload Script**: `electron/preload.ts` als einzige Bridge zwischen Main und Renderer

### Typisierte IPC-Kanäle
Alle IPC-Kommunikation folgt strikten TypeScript-Definitionen:

```typescript
// Korrekt: Typisierte API-Calls
const version = await window.rawalite.app.getVersion();
const updateResult = await window.rawalite.updater.checkForUpdates();
const pdfResult = await window.electronAPI.pdf.generate(options);

// Verboten: Dynamische Channel-Namen
ipcRenderer.invoke('some-dynamic-channel', data);
```

### API-Kategorien
- **Database API** (`rawalite.db`): SQLite-Operationen
- **App API** (`rawalite.app`): Version, Neustart, Log-Export
- **Updater API** (`rawalite.updater`): Update-Checks, Download, Installation
- **Backup API** (`rawalite.backup`): Backup-Erstellung und -Verwaltung
- **Logo API** (`rawalite.logo`): Logo-Upload und -Management
- **PDF API** (`electronAPI.pdf`): PDF-Generierung

## Sicherheits-Patterns

### Input-Validierung
- **Typ-Checks**: Alle IPC-Parameter werden zur Laufzeit validiert
- **Sanitizing**: User-Input wird vor Main-Process-Verarbeitung bereinigt
- **Size-Limits**: Maximale Größe für übertragene Daten (z.B. Logo-Uploads)

### Output-Sanitizing
- **Error-Filtering**: Sensitive Systeminformationen werden aus Error-Messages entfernt
- **Path-Validation**: Alle Dateipfade werden gegen Directory-Traversal validiert
- **Content-Type-Checks**: Nur erwartete MIME-Types werden verarbeitet

### Permission Model
- **Least Privilege**: Renderer hat nur Zugriff auf explizit exponierte APIs
- **No File System**: Kein direkter Dateisystem-Zugriff aus Renderer
- **No Shell Access**: Keine Shell-Kommandos aus Renderer-Prozess

## Development vs. Production Unterschiede

### Development Mode
```typescript
// Development: Erweiterte Debug-Optionen erlaubt
webPreferences: {
  sandbox: false,              // Optional für DevTools-Zugriff
  contextIsolation: true,      // Bleibt aktiviert
  nodeIntegration: false,      // Bleibt deaktiviert
  devTools: true,              // DevTools aktiviert
  webSecurity: false           // Optional für lokale Ressourcen
}
```

**Erlaubte Dev-Features:**
- Electron DevTools für Debugging
- Hot-Reload ohne Security-Warnings
- Erweiterte Console-Logs mit System-Info
- Localhost-spezifische Debugging-APIs

### Production Mode
```typescript
// Production: Maximale Sicherheit zwingend
webPreferences: {
  sandbox: true,               // Verpflichtend
  contextIsolation: true,      // Verpflichtend
  nodeIntegration: false,      // Verpflichtend
  devTools: false,             // Deaktiviert
  webSecurity: true            // Verpflichtend
}
```

**Sicherheits-Checks:**
- Automatische Validierung der BrowserWindow-Konfiguration
- Runtime-Checks für Security-Settings
- Error bei Abweichung von Security-Standards

## Verbotene Patterns

### Dynamische IPC-Kanäle
```typescript
// Verboten: Untypisierte, dynamische Channels
ipcRenderer.invoke(`dynamic-${entityType}-operation`, data);
ipcRenderer.send('arbitrary-channel', someData);

// Verboten: String-basierte Event-Handler
ipcRenderer.on('some-event', callback);
```

### Node-APIs im Renderer
```typescript
// Verboten: Direkte Node-API-Nutzung
const fs = require('fs');
const path = require('path'); 
const { spawn } = require('child_process');

// Verboten: Process-Zugriff
console.log(process.env.APPDATA);
```

### Unsichere Ressourcen-Zugriffe
```typescript
// Verboten: Externe Ressourcen
<img src="https://external-site.com/image.png" />
<script src="https://cdn.jsdelivr.net/npm/library"></script>

// Verboten: File-Protocol ohne Validierung
window.open('file:///C:/sensitive-file.txt');
```

## IPC-Handler-Implementierung

### Sichere Handler-Pattern
- **Error Boundaries**: Alle Handler haben Try-Catch mit Logging
- **Input-Validation**: JSON-Schema-Validierung für komplexe Parameter
- **Rate Limiting**: Schutz vor IPC-Spam aus Renderer
- **Audit-Logging**: Sicherheitsrelevante IPC-Calls werden geloggt

### Response-Format
```typescript
// Standardisierte Response-Struktur
interface IPCResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  errorCode?: string;
}
```

## Security Testing

### Automated Checks
- **IPC-Validator**: Script validiert alle exponierten APIs gegen TypeScript-Definitionen
- **Security-Linter**: Automatische Checks für verbotene Patterns
- **Runtime-Validation**: Production-Builds validieren Security-Settings

### Manual Security Review
- **Code-Review**: Alle IPC-Handler durchlaufen Security-Review
- **Penetration Testing**: Regelmäßige Tests der IPC-Security
- **Dependency-Audit**: Überprüfung aller npm-Packages auf Sicherheitslücken

## Incident Response
- **Security-Logs**: Verdächtige IPC-Aktivitäten werden geloggt
- **Fail-Safe**: Bei Security-Verletzungen wird App kontrolliert beendet
- **Update-Pipeline**: Kritische Security-Fixes werden priorisiert ausgeliefert
