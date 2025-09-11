# 🏢 RaWaLite - Project Overview

> **Vollständige Anwendungsübersicht** - Letzte Aktualisierung: 11. Januar 2025

## 🔍 **Technologie-Stack**

### Laufzeitumgebung & Tools
- **Node.js**: v20.18.0
- **npm**: v10.8.2  
- **pnpm**: 10.15.1 (Primary Package Manager)
- **PowerShell**: v7.5.2 (Core) - pwsh.exe
- **Git**: v2.51.0.1
- **GitHub CLI**: v2.78.0
- **VS Code**: v1.103.2

### Frontend & Build
- **React:** 18.3.1 mit TypeScript 5.9.2
- **Router:** React Router DOM 7.8.2
- **Desktop:** Electron 31.7.7
- **Build Tools:** Vite 5.4.20, esbuild 0.23.1
- **Package Manager:** pnpm

### Datenbank & Persistence
- **Primary:** SQL.js 1.13.0 (SQLite im Browser)
- **Secondary:** Dexie 4.2.0 (IndexedDB)
- **Backup:** LocalStorage für Einstellungen

### Testing & Development
- **Unit Tests:** Vitest 2.1.8
- **E2E Tests:** Playwright 1.55.0
- **Linting:** ESLint 9.35.0 mit TypeScript-Plugin
- **Build Tools**: electron-builder 24.13.3, npm-run-all 4.1.5

### Business Logic Libraries
- **PDF Generation:** jsPDF 3.0.2 + html2canvas 1.4.1
- **Archive:** JSZip 3.10.1

---

## 🏗️ **Architektur & Struktur**

### **Layered Architecture**
- **UI Layer**: React Components (`src/components/`, `src/pages/`)
- **Business Logic**: Custom Hooks (`src/hooks/`)
- **Data Layer**: Adapters (`src/adapters/`) + SQLite (`src/persistence/sqlite/`)

### **Key Design Patterns**
- **Context + Custom Hooks**: Business Logic in Hooks, UI-State über React Context
- **Adapter Pattern**: `SQLiteAdapter`, `IndexedDBAdapter`, `SettingsAdapter`
- **Auto-Numbering**: Alle Entitäten haben automatische Nummerierung (K-0001, AN-2025-0001, etc.)
- **Hierarchical Data**: Pakete und LineItems unterstützen Parent-Child-Beziehungen

### Core Application Files
```
src/
├── App.tsx                    # Haupt-Layout (Sidebar + Header + Main)
├── main.tsx                   # React Router Setup + Provider
├── PersistenceProvider.tsx    # Database Abstraction Layer
├── PlatformProvider.tsx       # Platform-spezifische Services
└── index.css                  # Global Styles (Dark Theme)
```

### Datenschicht (Persistence Layer)
```
src/persistence/
├── adapter.ts                 # Core Interfaces & Types
└── sqlite/
    └── db.ts                  # SQLite Connection & Schema

src/adapters/
├── SQLiteAdapter.ts           # Haupt-Datenbank-Adapter
├── SettingsAdapter.ts         # Spezial-Adapter für Einstellungen
└── IndexedDBAdapter.ts        # Alternative für Browser-Storage
```

### Business Logic (React Hooks)
```
src/hooks/
├── useUnifiedSettings.ts      # 🔧 Zentrale Einstellungsverwaltung
├── useCustomers.ts            # 👥 Kundenverwaltung + Auto-Nummerierung
├── usePackages.ts             # 📦 Paket-Management mit Hierarchien
├── useOffers.ts               # 📋 Angebotsverwaltung + Kalkulationen
├── useInvoices.ts             # 🧾 Rechnungsverwaltung + Status-Tracking
├── useTimesheets.ts           # ⏰ Leistungsnachweise + Stundenabrechnung
└── useSettings.ts             # ⚙️ Legacy Settings Hook
```

### UI Components
```
src/components/
├── Layout/
│   ├── Sidebar.tsx            # Navigation + Firmenlogo + Mini-Dashboard
│   ├── Header.tsx             # Page Title + Actions
│   └── Table.tsx              # Generische Datentabelle
└── Forms/
    ├── CustomerForm.tsx       # Kundenformular
    ├── PackageForm.tsx        # Paketformular mit Sub-Items
    ├── OfferForm.tsx          # Angebotsformular + Line Items
    ├── InvoiceForm.tsx        # Rechnungsformular + Angebot-Import
    └── TimesheetForm.tsx      # Leistungsnachweis-Formular mit Zeiterfassung
```

### Context Providers
```
src/contexts/
├── PersistenceContext.tsx     # Database Access
├── LoadingContext.tsx         # Global Loading States
└── NotificationContext.tsx    # Toast Notifications
```

### Pages
```
src/pages/
├── DashboardPage.tsx          # 📊 Übersicht + Statistiken
├── KundenPage.tsx             # 👥 Kundenverwaltung
├── PaketePage.tsx             # 📦 Paket-Management
├── AngebotePage.tsx           # 📋 Angebotsliste
├── AngebotDetailPage.tsx      # 📋 Einzelangebot-Ansicht
├── RechnungenPage.tsx         # 🧾 Rechnungsübersicht
├── TimesheetsPage.tsx         # ⏰ Leistungsnachweise-Verwaltung
├── EinstellungenPage.tsx      # ⚙️ Vollständige Konfiguration
├── UpdatesPage.tsx            # 🔄 Changelog & Updates
└── NotFoundPage.tsx           # 404 Error Page
```

---

## 📊 **Datenmodell & Entitäten**

### Core Business Entities

#### 🏢 **Settings**
```typescript
interface Settings {
  companyData: CompanyData;     // Firmendaten, Logo, Steuern
  numberingCircles: NumberingCircle[]; // Auto-Nummerierung
}
```

#### 👤 **Customer**
```typescript
interface Customer {
  id: number;
  number: string;               // Auto-generiert (K-0001)
  name: string;
  email?: string;
  phone?: string;
  street?: string;
  zip?: string;
  city?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}
```

#### 📦 **Package**
```typescript
interface Package {
  id: number;
  internalTitle: string;
  lineItems: PackageLineItem[]; // Hierarchische Positionen
  parentPackageId?: number;     // Sub-Pakete möglich
  total: number;
  addVat: boolean;
  createdAt: string;
  updatedAt: string;
}
```

#### 📋 **Offer**
```typescript
interface Offer {
  id: number;
  offerNumber: string;          // Auto-generiert (AN-2025-0001)
  customerId: number;
  title: string;
  status: 'draft' | 'sent' | 'accepted' | 'rejected';
  validUntil: string;
  lineItems: OfferLineItem[];   // Hierarchische Positionen
  subtotal: number;
  vatRate: number;
  vatAmount: number;
  total: number;
  notes?: string;
  // Status-Tracking
  sentAt?: string;
  acceptedAt?: string;
  rejectedAt?: string;
  createdAt: string;
  updatedAt: string;
}
```

#### 🧾 **Invoice**
```typescript
interface Invoice {
  id: number;
  invoiceNumber: string;        // Auto-generiert (RE-2025-0001)
  customerId: number;
  offerId?: number;             // Optional: Bezug zu Angebot
  title: string;
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
  dueDate: string;
  lineItems: InvoiceLineItem[]; // Hierarchische Positionen
  subtotal: number;
  vatRate: number;
  vatAmount: number;
  total: number;
  notes?: string;
  // Status-Tracking
  sentAt?: string;
  paidAt?: string;
  overdueAt?: string;
  cancelledAt?: string;
  createdAt: string;
  updatedAt: string;
}
```

#### ⏰ **Timesheet** (Leistungsnachweis)
```typescript
interface Timesheet {
  id: number;
  timesheetNumber: string;      // Auto-generiert (LN-2025-0001)
  customerId: number;
  title: string;
  status: 'draft' | 'sent' | 'approved' | 'rejected';
  startDate: string;            // Zeitraum Start
  endDate: string;              // Zeitraum Ende
  hourlyRate: number;           // Stundensatz
  totalHours: number;           // Gesamtstunden
  subtotal: number;             // hourlyRate * totalHours
  vatRate: number;
  vatAmount: number;
  total: number;
  notes?: string;
  // Status-Tracking
  sentAt?: string;
  approvedAt?: string;
  rejectedAt?: string;
  createdAt: string;
  updatedAt: string;
}
```

---

## 🗄️ **Datenbank-Schema (SQLite)**

### Core Tables
```sql
-- Firmeneinstellungen
CREATE TABLE settings (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  companyName TEXT, street TEXT, zip TEXT, city TEXT,
  phone TEXT, email TEXT, website TEXT,
  taxId TEXT, vatId TEXT,
  kleinunternehmer INTEGER DEFAULT 1,
  bankName TEXT, bankAccount TEXT, bankBic TEXT,
  logo TEXT,                    -- Base64-encoded Logo
  nextCustomerNumber INTEGER DEFAULT 1,
  nextOfferNumber INTEGER DEFAULT 1,
  nextInvoiceNumber INTEGER DEFAULT 1,
  createdAt TEXT, updatedAt TEXT
);

-- Kunden
CREATE TABLE customers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  number TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  email TEXT, phone TEXT,
  street TEXT, zip TEXT, city TEXT,
  notes TEXT,
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL
);

-- Pakete
CREATE TABLE packages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  internalTitle TEXT NOT NULL,
  parentPackageId INTEGER REFERENCES packages(id) ON DELETE CASCADE,
  total REAL NOT NULL,
  addVat INTEGER DEFAULT 0,
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL
);

-- Paket-Positionen (mit Hierarchie)
CREATE TABLE package_line_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  packageId INTEGER NOT NULL REFERENCES packages(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  amount REAL NOT NULL DEFAULT 0,
  parentItemId INTEGER REFERENCES package_line_items(id) ON DELETE CASCADE,
  description TEXT
);

-- Angebote
CREATE TABLE offers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  offerNumber TEXT NOT NULL UNIQUE,
  customerId INTEGER NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft',
  validUntil TEXT NOT NULL,
  subtotal REAL NOT NULL DEFAULT 0,
  vatRate REAL NOT NULL DEFAULT 19,
  vatAmount REAL NOT NULL DEFAULT 0,
  total REAL NOT NULL DEFAULT 0,
  notes TEXT,
  sentAt TEXT, acceptedAt TEXT, rejectedAt TEXT,
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL
);

-- Angebots-Positionen (mit Hierarchie)
CREATE TABLE offer_line_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  offerId INTEGER NOT NULL REFERENCES offers(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  quantity INTEGER NOT NULL DEFAULT 1,
  unitPrice REAL NOT NULL DEFAULT 0,
  total REAL NOT NULL DEFAULT 0,
  parentItemId INTEGER REFERENCES offer_line_items(id) ON DELETE CASCADE
);

-- Rechnungen
CREATE TABLE invoices (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  invoiceNumber TEXT NOT NULL UNIQUE,
  customerId INTEGER NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  offerId INTEGER REFERENCES offers(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft',
  dueDate TEXT NOT NULL,
  subtotal REAL NOT NULL DEFAULT 0,
  vatRate REAL NOT NULL DEFAULT 19,
  vatAmount REAL NOT NULL DEFAULT 0,
  total REAL NOT NULL DEFAULT 0,
  notes TEXT,
  sentAt TEXT, paidAt TEXT, overdueAt TEXT, cancelledAt TEXT,
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL
);

-- Rechnungs-Positionen (mit Hierarchie)
CREATE TABLE invoice_line_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  invoiceId INTEGER NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  quantity INTEGER NOT NULL DEFAULT 1,
  unitPrice REAL NOT NULL DEFAULT 0,
  total REAL NOT NULL DEFAULT 0,
  parentItemId INTEGER REFERENCES invoice_line_items(id) ON DELETE CASCADE
);

-- Leistungsnachweise
CREATE TABLE timesheets (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  timesheetNumber TEXT NOT NULL UNIQUE,
  customerId INTEGER NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft',
  startDate TEXT NOT NULL,
  endDate TEXT NOT NULL,
  hourlyRate REAL NOT NULL DEFAULT 0,
  totalHours REAL NOT NULL DEFAULT 0,
  subtotal REAL NOT NULL DEFAULT 0,
  vatRate REAL NOT NULL DEFAULT 19,
  vatAmount REAL NOT NULL DEFAULT 0,
  total REAL NOT NULL DEFAULT 0,
  notes TEXT,
  sentAt TEXT, approvedAt TEXT, rejectedAt TEXT,
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL
);
```

---

### ⚙️ **Besondere Features**

### 🔢 **Automatische Nummerierung**
- Konfigurierbare Nummernkreise für alle Entitäten
- **Neue Unterstützung für Leistungsnachweise:** LN-2025-0001
- Jährliche Reset-Optionen (z.B. AN-2025-0001, LN-2025-0001)
- Fallback zu Timestamp-basierter Nummerierung
- Präfix + Stellenanzahl vollständig anpassbar

### ⏰ **Leistungsnachweise & Zeiterfassung**
- **Stundenbasierte Abrechnung:** Stundensatz × Gesamtstunden
- **Zeitraum-Verwaltung:** Start- und Enddatum für Abrechnungsperioden
- **Status-Workflow:** Entwurf → Versendet → Genehmigt/Abgelehnt
- **Automatische Kalkulationen:** Netto, MwSt., Brutto
- **Kunden-Integration:** Vollständige Verknüpfung mit Kundendatenbank

### 🌳 **Hierarchische Strukturen**
- **Pakete:** Sub-Pakete mit eigenen Line Items
- **Line Items:** Sub-Positionen unter Hauptpositionen
- **Kalkulationen:** Automatische Summenberechnung nur für Hauptpositionen

### 📋➡️🧾 **Angebot-zu-Rechnung Workflow**
- Direkte Übernahme aller Angebotsdaten
- Automatische Zuordnung der Rechnung zum Angebot
- Status-Tracking für beide Entitäten

### 🎨 **Design System**
- **Dark Theme:** Professionelles dunkles Design
- **Sidebar Gradient:** Grüner Gradient für Corporate Identity
- **Responsive:** Grid-basiertes Layout
- **Logo Support:** Base64-Firmenlogos in Sidebar

### 🔧 **Entwickler-Features**
- **TypeScript First:** Vollständige Typsicherheit
- **Error Handling:** Umfassende Validierung + Benutzerfreundliche Fehlermeldungen
- **Loading States:** Global Loading Context für UX
- **Notifications:** Toast-System für Feedback

---

## � **GitHub Integration & Release Management**

### **Repository Information**
- **Repository**: `MonaFP/RawaLite` (GitHub)
- **Branch**: `main` (primary development branch)
- **Releases**: GitHub Releases für Versionierung und Distribution

### **GitHub CLI Setup**
- **Installation Path**: `C:\Program Files\GitHub CLI\gh.exe`
- **Status**: ✅ Installiert und authentifiziert
- **Usage Pattern**: `& "C:\Program Files\GitHub CLI\gh.exe" <command>`

### **Release Workflow**
```bash
# 1. Version aktualisieren
# package.json + VersionService.ts BASE_VERSION

# 2. Build erstellen (optional für reine Code-Releases)
pnpm build && pnpm dist

# 3. Git commit & tag
git add -A && git commit -m "vX.Y.Z: Feature description"
git tag vX.Y.Z && git push origin main --tags

# 4. GitHub Release erstellen (BEWÄHRTER WEG - nur Source Code)
& "C:\Program Files\GitHub CLI\gh.exe" release create vX.Y.Z \
  --title "RawaLite vX.Y.Z - Title" \
  --notes "Release notes..."

# NICHT: Setup.exe anhängen (außer bei Major Releases mit neuen Binaries)
# GitHub erstellt automatisch Source Code ZIP/TAR für Updates
```

### **Distribution Files**
- **Setup**: `RawaLite Setup X.Y.Z.exe` (nur bei Major Releases mit neuen Binaries)
- **Portable**: `RawaLite-X.Y.Z-portable.zip` (nur bei Major Releases)
- **Standard Updates**: Nur Source Code via GitHub Release (schnell & effizient)
- **Location**: `dist/` nach `pnpm dist`

## 🔄 **Update System Architecture**

### **Update Service Pattern**
```typescript
// Real GitHub API Integration (NOT simulation)
UpdateService.ts -> GitHub Releases API
VersionService.ts -> Version management & user notifications
```

### **Key Components**
- **VersionService.ts**: Version management, update checks, user notifications
- **UpdateService.ts**: Real GitHub API integration, download workflow
- **Electron IPC**: Shell API für externe URLs (`shell:openExternal`)
- **GitHub API**: `https://api.github.com/repos/MonaFP/RawaLite/releases/latest`

### **Update Workflow (Real System)**
1. **Auto Check**: App prüft GitHub API auf neue Releases
2. **Version Compare**: Semantic versioning comparison (nicht simulation!)
3. **User Notification**: Modal mit Download-Anweisungen
4. **Browser Redirect**: Electron shell öffnet GitHub Releases
5. **Manual Install**: User lädt neue Version, ersetzt .exe (Daten bleiben erhalten)

### **Critical Implementation Notes**
- **NO SIMULATION**: Echte GitHub API Integration verwenden
- **Portable App Logic**: Manuelle Download-Workflow für portable Anwendungen
- **Data Preservation**: SQLite-Datei in `%APPDATA%/RawaLite/` bleibt erhalten
- **Version Sync**: `package.json` UND `VersionService.ts` BASE_VERSION aktualisieren

## 🎨 **Theme System (Current: v1.5.2+)**

### **Pastel Color Palette**
```typescript
// themes.ts - 5 Pastel Themes
'salbeigrün': { primary: '#9db3a1', secondary: '#b8c7bb', accent: '#7a9b7e' }
'himmelblau': { primary: '#a8c5e0', secondary: '#c2d6ea', accent: '#7fb3d3' }
'lavendel': { primary: '#c4a8d8', secondary: '#d5bee6', accent: '#b089cc' }
'pfirsich': { primary: '#f5c2a0', secondary: '#f7d1b3', accent: '#f2ad7a' }
'rosé': { primary: '#e8b5c2', secondary: '#edc7d1', accent: '#e299ac' }
```

### **Navigation Modes**
- **Header-Modus**: Navigation im Header + kompakte 120px Sidebar (Logo/Firmeninfo)
- **Sidebar-Modus**: Vollbreite 240px Sidebar mit integrierter Navigation
- **Sidebar bleibt IMMER sichtbar**: Branding und Firmeninfo permanent verfügbar

## 🚨 **Wichtige Workspace-Spezifika**

### **Entwicklungsumgebung**
- **OS**: Windows mit PowerShell (pwsh.exe)
- **PowerShell**: v7.5.2 (Core)
- **System**: ASUS MONAPC mit 16GB RAM
- **Package Manager**: pnpm 10.15.1 (nicht npm!)
- **Node.js**: v20.18.0
- **npm**: v10.8.2
- **Git**: v2.51.0.1
- **GitHub CLI**: v2.78.0 (C:\Program Files\GitHub CLI\gh.exe)
- **VS Code**: v1.103.2
- **Electron Ports**: Development auf wechselnden Ports (5173, 5174, 5175...)

### **Konsistenz-Regeln**
1. **GitHub CLI**: Immer vollständigen Pfad verwenden: `& "C:\Program Files\GitHub CLI\gh.exe"`
2. **Versioning**: package.json UND VersionService.ts synchron halten
3. **Release Assets**: Setup.exe UND portable.zip für jedes Release
4. **Update System**: NIE Simulation - immer echte GitHub API verwenden
5. **Build Date**: VersionService.ts BUILD_DATE bei Releases aktualisieren

### **PowerShell Scripts**
```bash
# Available pnpm scripts
test                 # vitest
postinstall         # SQL.js WASM setup
dev                 # npm-run-all -l -p vite electron:dev
vite                # vite
electron:dev        # npm-run-all -s build:preload build:main && electron
build               # vite build && npm-run-all -s build:preload build:main
build:preload       # esbuild electron/preload.ts
build:main          # esbuild electron/main.ts
typecheck           # tsc --noEmit
lint                # eslint .
e2e                 # playwright
dist                # electron-builder
```

### **Installierte Pakete (Current)**
```bash
# Production Dependencies
@fontsource/roboto@5.1.0
@types/react@18.3.12
@types/react-dom@18.3.1
dexie@4.2.0
electron@31.7.7
jspdf@3.0.2
html2canvas@1.4.1
jszip@3.10.1
react@18.3.1
react-dom@18.3.1
react-router-dom@7.8.2
sql.js@1.13.0
typescript@5.9.2

# Development Dependencies
@eslint/js@9.35.0
@playwright/test@1.55.0
@types/node@22.10.2
@vitejs/plugin-react@4.3.4
electron-builder@24.13.3
esbuild@0.23.1
eslint@9.35.0
globals@15.14.0
npm-run-all@4.1.5
playwright@1.55.0
typescript-eslint@8.18.2
vite@5.4.20
vitest@2.1.8
```

### **Git Workflow**
- **Commit Messages**: Deutsche Sprache mit Feature-Beschreibung
- **Tagging**: Immer `vX.Y.Z` Format
- **Pushing**: Tags mit `--tags` Flag pushen

## �🚀 **Build & Deployment**

### Development
```bash
pnpm dev          # Startet Vite + Electron
pnpm vite         # Nur Vite Development Server
pnpm electron:dev # Nur Electron (nach Build)
```

### Production
```bash
pnpm build        # Vite Build + Electron Build
pnpm dist         # Electron Builder (Distributables)
```

### Testing
```bash
pnpm test         # Vitest Unit Tests
pnpm e2e          # Playwright E2E Tests
pnpm typecheck    # TypeScript Validation
pnpm lint         # ESLint
```

---

### **Migration System**
- Automatische Schema-Migrationen in `src/persistence/sqlite/db.ts`
- ALTER TABLE für neue Spalten mit Fehlerbehandlung
- Backward-kompatible Datenbank-Updates

## 🎣 **Business Logic Hooks**

### **CRUD Pattern**
```typescript
export function useEntity() {
  const { adapter } = usePersistence();
  const { getNextNumber } = useUnifiedSettings();
  
  async function create(data) {
    // 1. Validation
    validateEntityData(data);
    
    // 2. Auto-numbering 
    const number = await getNextNumber('entity');
    
    // 3. Database operation
    const entity = await adapter.createEntity({...data, number});
    
    // 4. State update
    setEntities(prev => [...prev, entity]);
  }
}
```

### **Settings Management**
- **Central Hub**: `useUnifiedSettings()` für alle Konfiguration
- **SQLite-First**: Settings werden in SQLite gespeichert, nicht localStorage
- **Auto-Numbering Service**: Integriert in Settings für Nummernkreise

## 🧩 **Komponenten-Konventionen**

### **Form Components**
- Alle Formulare in `src/components/` mit einheitlichem Pattern
- Error Handling über `ValidationError` und field-specific errors
- Auto-save für kritische Daten (Settings, etc.)

### **Table Components** 
- Generische `Table.tsx` für Listen-Darstellung
- Status-Badges für Workflow-States (draft, sent, accepted, etc.)
- Click-to-edit Pattern für inline editing

## 🔄 **Electron Integration**

### **IPC Pattern**
```typescript
// Main Process (electron/main.ts)
ipcMain.handle('db:save', async (event, data) => { ... });

// Preload (electron/preload.ts)  
contextBridge.exposeInMainWorld('rawalite', { ... });

// Renderer (React)
window.rawalite.db.save(data);
```

### **File Paths**
- **Development**: Vite Dev Server (http://localhost:5173)
- **Production**: Static files aus `dist/`
- **Database**: `%APPDATA%/RawaLite/database.sqlite`

## 🐛 **Common Patterns**

### **Error Handling**
```typescript
import { handleError, ValidationError, DatabaseError } from '../lib/errors';

try {
  await operation();
} catch (err) {
  const appError = handleError(err);
  setError(appError.message);
  throw appError;
}
```

### **Database Migrations**
```typescript
// In sqlite/db.ts - always use try/catch for ALTER TABLE
try {
  db.exec(`ALTER TABLE settings ADD COLUMN newColumn TEXT DEFAULT 'value'`);
} catch (error) {
  console.warn('Migration warning:', error);
}
```

## 🎯 **Development Guidelines**

1. **TypeScript First**: Alle neuen Files mit strengen Types
2. **Hooks für Business Logic**: UI-Komponenten bleiben dünn
3. **SQLite Schema Evolution**: Nur additive Änderungen, keine Breaking Changes
4. **Error Boundaries**: Graceful Degradation bei Fehlern
5. **Auto-Numbering**: Konsistent für alle Entitäten verwenden

## 🚨 **Dauerauftrag - Arbeitsweise im Workspace**

### **👉 IMMER BEFOLGEN: Code-Verständnis vor Implementierung**

**Bevor du Code generierst oder Änderungen vorschlägst:**

1. **📖 Projektstruktur verstehen**
   - Lies `PROJECT_OVERVIEW.md` für aktuelle Architektur
   - Analysiere Ordnerstruktur unter `/src`
   - Verstehe vorhandene Adapter, Hooks, Pages
   - Prüfe bestehende Naming-Conventions

2. **🔍 Konsistenz sicherstellen**
   - Verwende exakt die vorhandenen Pfade (`src/hooks/`, `src/pages/`, `src/adapters/`)
   - Richte dich nach Naming-Conventions (`useOffers`, `useInvoices`, `useCustomers`)
   - Füge neue Entitäten sauber in SQLite-Schema (`sqlite/db.ts`) ein
   - Befolge etablierte Patterns (Adapter Pattern, CRUD Hooks, etc.)

3. **⚡ Vor jeder Implementierung**
   - Lade und verstehe den kompletten App-Code
   - **WARTE auf den konkreten Arbeitsauftrag**
   - Analysiere Impact auf bestehende Komponenten
   - Prüfe TypeScript-Interfaces und Domain-Models

4. **✅ Output-Qualität**
   - Keine Abweichungen von bestehender Struktur
   - Konsistente Implementierung zur Architektur
   - Vollständige Integration in vorhandene Systeme
   - Fehlerfreie Pfade und Imports

**Beispiele für korrekte Arbeitsweise:**
```typescript
// ✅ Korrekt: Bestehende Struktur verwenden
import { useCustomers } from '../hooks/useCustomers';
import { SQLiteAdapter } from '../adapters/SQLiteAdapter';

// ❌ Falsch: Neue, inkonsistente Struktur
import { CustomerService } from '../services/CustomerService';
```

**🎯 Ziel:** Jede Implementierung fügt sich nahtlos in die bestehende RawaLite-Architektur ein.

## 📁 **File Structure Summary**

```
RawaLite/
├── 📋 PROJECT_OVERVIEW.md     # Diese Datei
├── 📦 package.json
├── ⚙️ vite.config.mts
├── 🔧 electron-builder.yml
├── 🎯 tsconfig.json
├── 📚 docs/
│   ├── ARCHITEKTUR.md
│   ├── DEV_GUIDE.md
│   ├── INSTALL.md
│   └── README.md
├── 🖥️ electron/
│   ├── main.ts              # Electron Main Process
│   └── preload.ts           # Preload Script
├── 🧪 tests/
│   └── NummernkreisService.test.ts
├── 🎭 e2e/
│   └── app.test.ts
└── 🎨 src/                  # Main Application Code
    ├── App.tsx
    ├── main.tsx
    ├── index.css
    ├── adapters/            # Database Adapters
    ├── components/          # Reusable UI Components
    ├── contexts/            # React Contexts
    ├── hooks/               # Business Logic Hooks
    ├── lib/                 # Utility Libraries
    ├── pages/               # Route Components
    ├── persistence/         # Database Layer
    └── services/            # Business Services
```

---

## 🎉 **Version 1.0.0 - Official Release!**

**RawaLite hat den Meilenstein Version 1.0 erreicht!** Diese erste offizielle Version bietet eine vollständige, produktionsbereite Geschäftsverwaltungs-Lösung.

### ✅ **Was macht Version 1.0 so besonders:**
- 🏢 **Vollständiges Firmenprofil** - Logo, Stammdaten, Bankverbindung
- 👥 **Komplette Kundenverwaltung** - Mit automatischer Nummerierung
- 📦 **Hierarchische Pakete** - Sub-Pakete und verschachtelte Positionen
- 📋 **Professionelle Angebote** - Von Entwurf bis Annahme
- 🧾 **Umfassende Rechnungen** - Kompletter Workflow mit Status-Tracking
- 💾 **Robuste SQLite-Datenbank** - Zuverlässige lokale Speicherung
- 🎨 **Modernes Dark Theme** - Professionelles Corporate Design
- 📊 **Dashboard-Übersicht** - Alle Kennzahlen auf einen Blick
- 🔢 **Automatische Nummerierung** - Konfigurierbare Nummernkreise
- 🏷️ **Firmen-Branding** - Logo und Name in eleganter Sidebar

---

## 📊 **Status & Roadmap**

### ✅ **Implementiert**
- ✅ Vollständige CRUD-Operationen für alle Entitäten
- ✅ **Leistungsnachweise-Modul:** Stundenbasierte Abrechnung komplett implementiert
- ✅ Automatische Nummerierung mit konfigurierbaren Kreisen (inkl. LN-Nummern)
- ✅ Hierarchische Pakete und Line Items
- ✅ Angebot-zu-Rechnung Workflow
- ✅ SQLite-basierte Persistierung
- ✅ TypeScript-First Architektur
- ✅ Dark Theme Design
- ✅ Electron Desktop App
- ✅ **Erweiterte Sidebar:** Mini-Dashboard mit Leistungsnachweise-Übersicht

### 🚧 **In Entwicklung**
- 🚧 PDF-Export für Angebote/Rechnungen
- 🚧 Erweiterte Reportings
- 🚧 Backup/Restore Funktionalität

### 🎯 **Geplant**
- 🎯 Multi-Language Support
- 🎯 Cloud-Synchronisation
- 🎯 Email-Integration
- 🎯 Erweiterte Berechtigungen

### 🔧 **Letzte Fixes & Updates**
- ✅ **Real Update System Restored** (11.09.2025)
  - ✅ Echte GitHub API Integration wiederhergestellt (keine Simulation mehr)
  - ✅ VersionService.ts aus Git-Historie vollständig wiederhergestellt  
  - ✅ UpdateService.ts mit echter GitHub Releases API Integration
  - ✅ Electron Shell API für externe URLs hinzugefügt (shell:openExternal)
  - ✅ Benutzerfreundlicher Update-Workflow für portable Apps
  - ✅ Intelligente Update-Benachrichtigungen mit Download-Anweisungen
  - ✅ Data-Preservation-Logic: SQLite-Daten bleiben beim Update erhalten
  - ✅ GitHub CLI Integration in Release-Workflow dokumentiert
  - ✅ Versioning zwischen package.json und VersionService.ts synchronisiert
  - ✅ Real-Time GitHub API Testing mit test-update-system.js

- ✅ **Beautiful Pastel Themes & Enhanced Navigation** (11.09.2025)
  - ✅ 5 professionelle Pastel-Themes implementiert (Salbeigrün, Himmelblau, Lavendel, Pfirsich, Rosé)
  - ✅ Dual Navigation System: Header-Modus + Sidebar-Modus
  - ✅ Sidebar bleibt immer sichtbar für Branding und Firmeninfo
  - ✅ Header-Modus: Kompakte 120px Sidebar + Navigation im Header
  - ✅ Sidebar-Modus: Vollbreite 240px Sidebar mit integrierter Navigation
  - ✅ Augenschonende Farbpalette für professionelle Geschäftsanwendungen
  
- ✅ **Leistungsnachweise-Modul komplett implementiert** (10.09.2025)
  - ✅ Vollständiges Timesheet-Datenmodell mit Stundenabrechnung
  - ✅ Automatische Nummerierung (LN-2025-0001) mit jährlichem Reset
  - ✅ Zeitraum-basierte Verwaltung (Start-/Enddatum)
  - ✅ Status-Workflow: Entwurf → Versendet → Genehmigt/Abgelehnt
  - ✅ Stundenbasierte Kalkulation: Stundensatz × Gesamtstunden + MwSt.
  - ✅ Vollständige CRUD-Operationen in SQLite
  - ✅ TimesheetForm mit Echtzeit-Kostenvorschau
  - ✅ TimesheetsPage mit Statistiken und Filterung
  - ✅ Integration in Sidebar-Dashboard mit Leistungsnachweise-Widget
  - ✅ Routing und Navigation komplett eingerichtet (/leistungsnachweise)
  - ✅ Database-Migration für bestehende Installationen
  
- ✅ **Logo-Speicherung & Branding-System** (10.09.2025)
  - ✅ Logo-Speicherung behoben - Separater Submit-Handler verhindert Tab-Wechsel
  - ✅ Neues RawaLite App-Logo integriert - Ersetzt Text-Logo in Sidebar
  - ✅ Globaler Settings-Context implementiert - Verhindert State-Sync-Probleme
  - ✅ Firmen-Branding in Sidebar - Logo + Name mit dezenter Dashboard-Übersicht
  - ✅ Elegante Platzhalter-Logik - Zeigt "[Ihr Firmenname]" und "Kein Logo" bei fehlenden Daten
  
- ✅ **Sidebar Dashboard-Enhancement** (10.09.2025)
  - ✅ Mini-Dashboard implementiert - Angebote, Rechnungen & Finanz-Widgets
  - ✅ Dezente transparente Blöcke - Alle Widgets in einheitlichem, subtilen Design
  - ✅ Immer sichtbare Übersicht - Zeigt Statistiken auch bei 0-Werten
  - ✅ Konsistente Datenanbindung - Verwendet useOffers(), useInvoices() und useTimesheets() Hooks
  - ✅ Responsive Mini-Widgets - Kompakte Darstellung für Sidebar-Breite

---

*Letzte Aktualisierung: 11. Januar 2025*
*Version: 1.5.3 - Comprehensive Environment Documentation �*
