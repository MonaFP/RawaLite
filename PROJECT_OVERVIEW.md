# RawaLite - Projektübersicht

## 🚀 Version 1.5.6 - Kritische Datenpersistierung behoben

**RawaLite** ist eine Electron-basierte Desktop-Anwendung für Geschäftsverwaltung mit React + TypeScript + SQLite.

**Wichtige Fixes in v1.5.6:**
- ✅ **Kritischer Datenverlust behoben** - Business-Daten werden garantiert persistiert
- ✅ **SQLite Persistierung** - Automatische Speicherung nach jeder Datenänderung
- ✅ **Deutsches Menü-System** - Professionelle Benutzeroberfläche ohne Development-Features
- ✅ **Klassischer Installer** - Dialog mit Pfad-Auswahl (oneClick=false)

## 🏗️ Architektur

### Tech Stack
- **Frontend**: React 18.3.1 + TypeScript 5.9.2
- **Desktop**: Electron 31.7.7  
- **Datenbank**: SQLite (SQL.js) + IndexedDB (Dexie)
- **Build**: Vite 5.4.20 + esbuild
- **Package Manager**: pnpm 10.15.1

### Projekt-Struktur
```
src/
├── adapters/          # Data Layer (SQLiteAdapter, SettingsAdapter)
├── components/        # UI Components (Forms, Tables, Widgets)
├── contexts/          # React Context (Settings, Notifications)
├── hooks/             # Business Logic Hooks (useCustomers, useOffers)
├── lib/               # Shared Utilities (errors, themes, settings)
├── pages/             # Route Components
├── persistence/       # Database Logic
└── services/          # External Services (UpdateService, VersionService)

tests/
├── unit/              # Vitest Unit Tests
│   ├── SettingsAdapter.test.ts
│   ├── setup.ts
│   └── hooks/         # (Reserved for hook tests)
└── integration/       # Node.js Integration Tests
    ├── database/      # SQLite & Persistence Tests
    ├── design/        # Theme & UI Tests  
    ├── persistence/   # Data Consistency Tests
    └── update-system/ # GitHub API & Update Tests
```

## 🔬 Test-System

### Unit Tests (Vitest)
```bash
pnpm test              # Läuft nur Unit Tests
```

**Aktuelle Tests:**
- ✅ `SettingsAdapter.test.ts` - Auto-Nummerierung System
  - Sequentielle Kundennummern (K-001, K-002, ...)
  - Jährliche Rechnungsnummern (RE-2025-0001, ...)
  - Jahreswechsel-Reset für yearly numbering
  - Error handling für unbekannte Nummernkreise

**Test-Konfiguration:**
- Environment: jsdom für React DOM simulation
- Mocking: SQLite database + localStorage
- Coverage: Business Logic der Auto-Nummerierung

### Integration Tests (Node.js)
```bash
# Database Tests
node tests/integration/database/verification.js

# Design System Tests  
node tests/integration/design/persistence.js

# Update System Tests
node tests/integration/update-system/github-api.js
```

**Verfügbare Tests:**
- **Database**: File system permissions, SQLite creation, Electron integration
- **Design**: Theme persistence, navigation mode persistence, reload behavior
- **Update System**: GitHub API connectivity, version comparison, download workflow
- **Persistence**: Data consistency, fallback mechanisms

### Test-Best-Practices

#### 🧪 Unit Tests hinzufügen
1. Erstelle Datei in `tests/unit/[Component].test.ts`
2. Verwende Vitest + Vi für Mocking
3. Teste Business Logic, nicht UI-Details
4. Aktualisiere `vitest.config.ts` include-Array

#### 🔗 Integration Tests hinzufügen  
1. Erstelle Datei in `tests/integration/[category]/[test-name].js`
2. Verwende pure Node.js (keine Vite/React dependencies)
3. Teste echte APIs, Filesystem, Database operations
4. Dokumentiere Test-Output mit Console-Logging

#### 📝 Test-Struktur Richtlinien
- **Unit Tests**: Isolierte Komponenten/Services mit Mocks
- **Integration Tests**: End-to-end Workflows mit echten Dependencies
- **Kategorisierung**: Thematische Gruppierung (database, design, update-system)
- **Naming Convention**: Descriptive file names ohne Präfixe (nicht test-xxx)

## 🎨 Design-System

### Theme-Architektur
- **5 Pastel Themes**: Salbeigrün, Himmelblau, Lavendel, Pfirsich, Rosé
- **Navigation Modi**: Header-Navigation + Sidebar-Widgets oder umgekehrt  
- **Persistierung**: SQLite für reload-sichere Design-Settings
- **Sofortige Anwendung**: Themes werden ohne Reload angewendet

### Navigation-Modi
- **Header-Modus**: Navigation im Header, Widgets in 240px Sidebar
- **Sidebar-Modus**: Navigation in 240px Sidebar, kompakte Widgets im Header
- **Widget-System**: HeaderWidgets + SidebarWidgets komplementäre Positionierung

## 🔧 Auto-Nummerierung

### Nummernkreise
```typescript
NumberingCircle {
  id: 'customers' | 'offers' | 'invoices' | 'packages' | 'timesheets'
  prefix: string        // K-, AN-2025-, RE-2025-, etc.
  digits: number        // Padding (3 = 001, 4 = 0001)
  current: number       // Aktueller Counter
  resetMode: 'yearly' | 'never'
  lastResetYear?: number
}
```

### Implementation
- **Service**: `SettingsAdapter.getNextNumber(circleId)`
- **Storage**: localStorage (temporary) → SQLite (geplant)
- **Reset-Logic**: Automatischer Reset bei Jahreswechsel für yearly numbering
- **Examples**: K-001, AN-2025-0001, RE-2025-0006

## 🔄 Update-System

### GitHub Integration
- **Repository**: MonaFP/RawaLite
- **API Endpoint**: `https://api.github.com/repos/MonaFP/RawaLite/releases/latest`
- **Version Service**: Semantic versioning comparison
- **Download Workflow**: Browser redirect zu GitHub Releases für manuelle Installation

### Release-Workflow
```bash
# 1. Version aktualisieren  
# package.json + VersionService.ts BASE_VERSION

# 2. Build (optional für Code-Releases)
pnpm build && pnpm dist

# 3. Git Tag + Release
git tag vX.Y.Z && git push origin main --tags
& "C:\Program Files\GitHub CLI\gh.exe" release create vX.Y.Z --title "..." --notes "..."
```

## 🗃️ Datenbank-Schema

### SQLite Tables
- **settings**: Company data, design settings, numbering configuration
- **customers**: Customer management with auto-numbers (K-xxxx)
- **offers**: Offers with yearly numbering (AN-2025-xxxx)
- **invoices**: Invoices with yearly numbering (RE-2025-xxxx)  
- **packages**: Reusable service packages (PAK-xxx)
- **timesheets**: Time tracking (LN-2025-xxxx)

### Migration System
- Automatic schema evolution in `src/persistence/sqlite/db.ts`
- Additive-only changes (ALTER TABLE ADD COLUMN)
- Graceful fallbacks for missing columns
- Version-safe database updates

## 📦 Business Logic

### Entity Management
- **CRUD Pattern**: Einheitliche Hooks (`useCustomers`, `useOffers`, `useInvoices`)
- **Auto-Numbering**: Integriert in alle Entity-Create-Operations
- **Validation**: Field-level + Entity-level validation mit structured errors
- **State Management**: React Context + Custom Hooks

### Document Generation
- **PDF Export**: jsPDF + html2canvas für Angebote/Rechnungen
- **Print-friendly**: Optimierte Layouts für Geschäftsdokumente
- **Archive**: JSZip für Batch-Export

## 🚀 Development

### Scripts
```bash
pnpm dev                # Vite + Electron Development
pnpm build              # Production Build  
pnpm dist               # Electron Distributables
pnpm test               # Unit Tests (Vitest)
pnpm e2e                # E2E Tests (Playwright)
pnpm lint               # ESLint Code Quality
```

### Environment
- **OS**: Windows mit PowerShell v7.5.2
- **Node.js**: v20.18.0
- **Package Manager**: pnpm (NICHT npm!)
- **VS Code**: Latest LTS mit TypeScript support

## 🎯 Coding Guidelines

1. **TypeScript First**: Strenge Types für alle neuen Files
2. **Hooks für Business Logic**: UI-Komponenten bleiben dünn  
3. **SQLite Schema Evolution**: Nur additive Änderungen
4. **Error Boundaries**: Graceful Degradation bei Fehlern
5. **Auto-Numbering**: Konsistent für alle Entitäten verwenden
6. **Test Coverage**: Unit Tests für Business Logic, Integration Tests für Workflows

---

**Sprache**: Deutsches Projekt mit deutscher UI und Dokumentation