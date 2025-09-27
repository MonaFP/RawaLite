# Architektur-Übersicht

## Ziel
Dieses Dokument definiert die High-Level-Architektur von RawaLite und beschreibt den Aufbau aller Kernkomponenten.

## Gesamtarchitektur

RawaLite folgt einer **Electron-basierten Desktop-Anwendung** mit strikter Trennung zwischen Main-Process und Renderer-Process. Die Architektur ist in vier Hauptschichten unterteilt:

### Schicht 1: Electron Runtime
- **Main Process** (`electron/main.ts`): Systembetrieb, IPC-Handler, Update-System
- **Renderer Process** (React App): UI-Layer mit strikter Sandboxing
- **Preload Script** (`electron/preload.ts`): Typisierte IPC-Bridge zwischen Main und Renderer

### Schicht 2: Frontend (React)
- **React 18.3.1** mit TypeScript im strict mode
- **React Router** für Navigation (Header-Modus / Sidebar-Modus)
- **Custom Hooks** für Business Logic (`useCustomers`, `useOffers`, etc.)
- **Context API** für globale State-Verwaltung (Theme, Settings)

### Schicht 3: Service Layer
- **VersionService**: App-Versionierung und Update-Checks
- **PDFService**: PDF-Generierung mit lokalen Templates
- **BackupService**: Automatische Backups vor Updates
- **MigrationService**: Schema-Updates und Datenbank-Migrationen
- **LoggingService**: Einheitliches Logging für Debugging

### Schicht 4: Persistenz
- **Primary**: SQLite (sql.js) für Production
- **Fallback**: IndexedDB (Dexie) für Development
- **Einheitlicher Entry-Point**: `src/persistence/index.ts`
- **Adapter Pattern**: Gleiche API für beide Backends

## Datenfluss

```
UI Components → Custom Hooks → Services → Persistence Adapter → Database
     ↓              ↓            ↓              ↓               ↓
React Router → Business Logic → PDF/Update → SQLite/Dexie → Storage
```

## Business-Entitäten

RawaLite verwaltet fünf Kern-Entitäten mit automatischer Nummerierung:

1. **Customers** (K-0001, K-0002...): Kundendaten
2. **Packages** (PAK-001...): Hierarchische Paket-Templates  
3. **Offers** (AN-2025-0001...): Angebote mit Workflow-Status
4. **Invoices** (RE-2025-0001...): Rechnungen mit Zahlungsstatus
5. **Timesheets** (LN-2025-0001...): Leistungsnachweise/Zeiterfassung

Alle Entitäten unterstützen **Line Items** mit Parent-Child-Hierarchien.

## Navigation & Theme System

- **Dual Navigation**: Header-Modus oder Sidebar-Modus (240px fest)
- **5 Pastel-Themes**: salbeigrün, himmelblau, lavendel, pfirsich, rosé (fix, nicht änderbar)
- **Persistente Themes**: Gespeichert über SQLite/Dexie
- **FOUC-Vermeidung**: Theme wird vor Render geladen

## Update-System

- **Custom In-App Updater**: Basiert auf GitHub Releases API
- **Workflow**: Check (App-Start) → Download (auf Anfrage) → Install (mit Backup)
- **Strikte In-App-Regel**: Keine externen Links oder Browser-Navigation

## Dev vs. Prod Unterschiede

### Development Mode
- **Security**: `contextIsolation` optional für debugging
- **Database**: Dexie/IndexedDB als Primary erlaubt
- **Updates**: Deaktiviert (localhost-Erkennung)
- **Logging**: Erweiterte Console-Ausgaben

### Production Mode
- **Security**: `sandbox:true` + `contextIsolation:true` verpflichtend
- **Database**: SQLite zwingend, Dexie nur Fallback
- **Updates**: Vollständig aktiviert mit GitHub Integration
- **Logging**: Nur kritische Logs, File-basiert

## Package Manager

**Ausschließlich pnpm** - npm/yarn sind vollständig untersagt in allen Scripts und Workflows.
