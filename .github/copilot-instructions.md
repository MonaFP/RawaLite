# RawaLite - AI Coding Instructions

## 🔍 **Technologie-Stack**

### Laufzeitumgebung & Tools
- **Node.js**: v20.18.0
- **npm**: v10.8.2  
- **pnpm**: 10.15.1 (Primary Package Manager)
- **PowerShell**: v7.5.2 (Core) - pwsh.exe
- **Git**: v2.51.0.1
- **GitHub CLI**: v2.78.0
- **VS Code**: Latest LTS

### Frontend & Build
- **React:** 18.3.1 mit TypeScript 5.9.2
- **Router:** React Router DOM 7.8.2
- **Desktop:** Electron 31.7.7
- **Build Tools:** Vite 5.4.0, esbuild 0.21.5
- **Package Manager:** pnpm

### Datenbank & Persistence ⚡ **CRITICAL UPDATE**
- **Primary:** SQL.js 1.13.0 (SQLite with file persistence)
- **Real File Storage:** `%APPDATA%/rawalite/d## 🔍 Debug-Tipps

- **Development**: Chrome DevTools für Renderer, VS Code Debug für Main Process
- **Database**: SQLite-Browser für Schema-Inspektion
- **Logs**: Console.log für Development, strukturiertes Logging für Production
- **IPC**: Electron DevTools für IPC-Message Debugging
- **Update Testing**: `node test-update-system.js` für GitHub API Tests

## 🔧 **Critical Development Workflows**

### **Database Debug Commands** (USE IN BROWSER CONSOLE)
```javascript
// Available in development mode
window.rawaliteDebug.getDatabaseInfo()    // Check DB status & storage size
window.rawaliteDebug.exportDatabase()     // Export current SQLite binary
window.rawaliteDebug.saveDatabase()       // Force manual persistence
```

### **PDF Generation Workflow**
```typescript
// Use PDFService for all PDF operations - NO jsPDF directly!
import { PDFService } from '../services/PDFService';

// Correct way: Native Electron PDF with save dialog
const result = await PDFService.exportOfferToPDF(offer, customer, settings);
if (result.success) {
  console.log('PDF saved to:', result.filePath);
}
```

### **Build & Development Commands**
```bash
# ALWAYS use pnpm (not npm!)
pnpm dev          # Vite + Electron (hot reload)
pnpm build        # Production build
pnpm dist         # Electron distributables

# Kill hanging Electron processes (Windows)
Get-Process electron | Stop-Process

# Database validation
node debug-database-content.js
```

### **Auto-Numbering Implementation**
```typescript
// Pattern for all entities with auto-numbering
const { getNextNumber } = useUnifiedSettings();

// Get next number (handles year reset automatically)
const number = await getNextNumber('offer');  // Returns "AN-2025-0001"
const number = await getNextNumber('invoice'); // Returns "RE-2025-0001"
const number = await getNextNumber('timesheet'); // Returns "LN-2025-0001"
```

### **Theme System Rules** (NEVER CHANGE THESE HEX VALUES!)
```typescript
// These colors are FINAL - only IDs/names can be changed
const IMMUTABLE_THEME_COLORS = {
  'salbeigrün': { primary: '#4a5d5a', secondary: '#3a4d4a', accent: '#7dd3a0' },
  'himmelblau': { primary: '#4a5b6b', secondary: '#3d4e5e', accent: '#87ceeb' },
  'lavendel': { primary: '#5a4d6b', secondary: '#4d405e', accent: '#b19cd9' },
  'pfirsich': { primary: '#6b5a4d', secondary: '#5e4d40', accent: '#f4a28c' },
  'rosé': { primary: '#6b4d5a', secondary: '#5e4050', accent: '#e6a8b8' }
};
```.sqlite` via Electron IPC
- **Dual-Mode System:** Electron = Real files, Browser = LocalStorage fallback
- **Auto-Updater:** electron-updater 6.6.2 (real GitHub integration)
- **Secondary:** Dexie 4.2.0 (IndexedDB backup)

### Testing & Development
- **Unit Tests:** Vitest 1.6.0
- **E2E Tests:** Playwright 1.46.0
- **Linting:** ESLint 9.9.0 mit TypeScript-Plugin
- **Build Tools**: electron-builder 24.13.3, npm-run-all 4.1.5

### Business Logic Libraries
- **PDF System:** Native Electron PDF + JSZip 3.10.1
- **Logging:** electron-log 5.4.3

## 🏢 Projektübersicht
RawaLite ist eine Electron-basierte Desktop-Anwendung für Geschäftsverwaltung mit React + TypeScript + SQLite.

**Current Version: 1.6.0** - Production-ready business management solution with:
- Real SQLite file persistence (`%APPDATA%/rawalite/database.sqlite`)
- Native Electron PDF generation with save dialogs
- Professional pastel theme system (5 themes)
- Auto-updater with real GitHub API integration
- Comprehensive business entity management (Customers, Offers, Invoices, Timesheets)

## 🏗️ Architektur-Patterns

### **Layered Architecture**
- **UI Layer**: React Components (`src/components/`, `src/pages/`)
- **Business Logic**: Custom Hooks (`src/hooks/`)
- **Data Layer**: Adapters (`src/adapters/`) + SQLite (`src/persistence/sqlite/`)

### **Key Design Patterns**
- **Context + Custom Hooks**: Business Logic in Hooks, UI-State über React Context
- **Adapter Pattern**: `SQLiteAdapter`, `IndexedDBAdapter`, `SettingsAdapter`
- **Auto-Numbering**: Alle Entitäten haben automatische Nummerierung (K-0001, AN-2025-0001, etc.)
- **Hierarchical Data**: Pakete und LineItems unterstützen Parent-Child-Beziehungen

## � **Vollständiges Datenmodell & Entitäten**

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

## �🗃️ Datenbank-Schema (SQLite)

### **Core Tables**
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

### **Migration System**
- Automatische Schema-Migrationen in `src/persistence/sqlite/db.ts`
- ALTER TABLE für neue Spalten mit Fehlerbehandlung
- Backward-kompatible Datenbank-Updates

## 🎣 Business Logic Hooks

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

## 🧩 Komponenten-Konventionen

### **Form Components**
- Alle Formulare in `src/components/` mit einheitlichem Pattern
- Error Handling über `ValidationError` und field-specific errors
- Auto-save für kritische Daten (Settings, etc.)

### **Table Components** 
- Generische `Table.tsx` für Listen-Darstellung
- Status-Badges für Workflow-States (draft, sent, accepted, etc.)
- Click-to-edit Pattern für inline editing

## 🔄 Electron Integration

### **IPC Pattern**
```typescript
// Main Process (electron/main.ts)
ipcMain.handle('db:save', async (event, data) => { ... });

// Preload (electron/preload.ts)  
contextBridge.exposeInMainWorld('electronAPI', { ... });

// Renderer (React)
window.electronAPI.persistenceExecute(sql, params);
```

### **File Paths**
- **Development**: Vite Dev Server (http://localhost:5173)
- **Production**: Static files aus `dist/`
- **Database**: `%APPDATA%/RawaLite/database.sqlite`

## 🚀 Build & Development

### **Key Commands**
```bash
pnpm dev          # Vite + Electron Development
pnpm build        # Production Build
pnpm dist         # Electron Distributables
pnpm typecheck    # TypeScript Validation
pnpm test         # Vitest Unit Tests
pnpm e2e          # Playwright E2E Tests
pnpm lint         # ESLint Code Quality
```

### **Critical Files**
- `vite.config.mts`: Build-Konfiguration
- `electron-builder.yml`: Packaging-Konfiguration  
- `package.json`: Scripts und Dependencies

## 🐛 Common Patterns

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

## 🎯 Development Guidelines

1. **TypeScript First**: Alle neuen Files mit strengen Types
2. **Hooks für Business Logic**: UI-Komponenten bleiben dünn
3. **SQLite Schema Evolution**: Nur additive Änderungen, keine Breaking Changes
4. **Error Boundaries**: Graceful Degradation bei Fehlern
5. **Auto-Numbering**: Konsistent für alle Entitäten verwenden

## 💼 **Critical Business Logic Patterns**

### **CRUD Hook Pattern** (USE THIS EXACTLY)
```typescript
export function useEntity() {
  const { adapter } = usePersistence();
  const { getNextNumber } = useUnifiedSettings();
  const [entities, setEntities] = useState<Entity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function create(data: Omit<Entity, "id" | "createdAt" | "updatedAt" | "number">) {
    if (!adapter) throw new DatabaseError("Datenbank-Adapter nicht verfügbar");
    
    // 1. Validation
    if (!data.title?.trim()) {
      throw new ValidationError("Titel ist erforderlich", "title");
    }
    
    // 2. Auto-numbering 
    const number = await getNextNumber('entity');
    
    // 3. Database operation
    const entity = await adapter.createEntity({...data, number});
    
    // 4. State update
    setEntities(prev => [...prev, entity]);
    return entity;
  }
}
```

### **Persistence Wrapper Pattern** (CRITICAL)
```typescript
// sqlite/db.ts - Database operations MUST trigger persistence
db.exec = (...args) => {
  const result = _exec(...args);
  if (/INSERT|UPDATE|DELETE|REPLACE|CREATE|DROP|ALTER/.test(sqlText)) {
    schedulePersist(); // Triggers %APPDATA%/rawalite/database.sqlite save
  }
  return result;
};
```

### **Theme Application Pattern**
```typescript
// Apply themes via CSS custom properties - DO NOT change hex values!
export function applyTheme(theme: ThemeDefinition) {
  document.documentElement.style.setProperty('--primary-color', theme.primary);
  document.documentElement.style.setProperty('--secondary-color', theme.secondary);
  document.documentElement.style.setProperty('--accent-color', theme.accent);
  document.documentElement.style.setProperty('--sidebar-gradient', theme.gradient);
}
```

## 🚨 **Dauerauftrag - Arbeitsweise im Workspace**

### **👉 IMMER BEFOLGEN: Code-Verständnis vor Implementierung**

**Bevor du Code generierst oder Änderungen vorschlägst:**

1. **📖 Projektstruktur verstehen**
   - Lies `docs/PROJECT_OVERVIEW.md` für aktuelle Architektur
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

---

**Wichtig**: Dieses Projekt verwendet **deutsche Sprache** für UI, Kommentare und Dokumentation.

## � GitHub Integration & Release Management

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

## 🔄 Update System Architecture

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

## 🎨 Theme System (Current: v1.5.2+)

**🚨 KRITISCHE REGEL - THEME-FARBEN:**
Die nachfolgenden Farbwerte sind **FINAL** und dürfen **NIE GEÄNDERT** werden!
Sie wurden sorgfältig ausgewählt, visuell getestet und sind perfekt implementiert.
Nur Theme-IDs und Namen dürfen angepasst werden, niemals die Hex-Farbcodes!

### **Pastel Color Palette**
```typescript
// themes.ts - 5 Pastel Themes (AKTUELLE IMPLEMENTIERUNG - NICHT ÄNDERN!)
'salbeigrün': { 
  primary: '#4a5d5a', 
  secondary: '#3a4d4a', 
  accent: '#7dd3a0',
  gradient: 'linear-gradient(160deg, #4a5d5a 0%, #3a4d4a 40%, #2f403d 100%)'
}
'himmelblau': { 
  primary: '#4a5b6b', 
  secondary: '#3d4e5e', 
  accent: '#87ceeb',
  gradient: 'linear-gradient(160deg, #4a5b6b 0%, #3d4e5e 40%, #324151 100%)'
}
'lavendel': { 
  primary: '#5a4d6b', 
  secondary: '#4d405e', 
  accent: '#b19cd9',
  gradient: 'linear-gradient(160deg, #5a4d6b 0%, #4d405e 40%, #403351 100%)'
}
'pfirsich': { 
  primary: '#6b5a4d', 
  secondary: '#5e4d40', 
  accent: '#f4a28c',
  gradient: 'linear-gradient(160deg, #6b5a4d 0%, #5e4d40 40%, #514033 100%)'
}
'rosé': { 
  primary: '#6b4d5a', 
  secondary: '#5e4050', 
  accent: '#e6a8b8',
  gradient: 'linear-gradient(160deg, #6b4d5a 0%, #5e4050 40%, #513343 100%)'
}

// ⚠️ WICHTIG: Diese Farbwerte sind final und dürfen NICHT geändert werden!
// Sie sind bereits perfekt implementiert und visuell getestet.
```

### **Navigation Modes**
- **Header-Modus**: Navigation im Header + Widgets in der Sidebar (240px Sidebar)
- **Sidebar-Modus**: Navigation in der Sidebar + Widgets im Header (240px Sidebar)
- **Sidebar behält IMMER 240px Breite**: Keine Verschiebung beim Mode-Wechsel
- **Komplementäre Widget-Positionierung**: Widgets wechseln Position basierend auf Navigation-Modus

#### **Stabile Layout-Philosophie:**
- **Feste Breite**: 240px in BEIDEN Modi (keine Anpassung)
- **Gleiche Schriftgrößen**: Identische Lesbarkeit in Header- und Sidebar-Modus
- **Keine Verschiebung**: Layout bleibt beim Wechsel stabil
- **Smart Widget Distribution**: Widgets ergänzen Navigation optimal

#### **Widget-System:**
- **Header-Navigation**: Dashboard-Widgets werden in der Sidebar angezeigt (vollständig)
- **Sidebar-Navigation**: Dashboard-Widgets werden im Header angezeigt (kompakt)
- **HeaderWidgets Component**: Kompakte horizontale Widget-Darstellung
- **Responsive Design**: Widgets passen sich automatisch an verfügbaren Platz an

#### **Persistente Design-Einstellungen:**
- **SQLite Storage**: Design-Settings werden in `settings.designSettings` Spalte gespeichert
- **Sofortige Anwendung**: Theme wird bei Settings-Load automatisch angewendet
- **Reload-Sicherheit**: Navigation-Modus und Farbtheme bleiben nach App-Reload erhalten
- **Backup-Mechanismus**: Standard-Theme wird beim App-Start als Fallback angewendet

## �🔍 Debug-Tipps

- **Development**: Chrome DevTools für Renderer, VS Code Debug für Main Process
- **Database**: SQLite-Browser für Schema-Inspektion
- **Logs**: Console.log für Development, strukturiertes Logging für Production
- **IPC**: Electron DevTools für IPC-Message Debugging
- **Update Testing**: `node test-update-system.js` für GitHub API Tests

## 🚨 Wichtige Workspace-Spezifika

### **Entwicklungsumgebung**
- **OS**: Windows mit PowerShell (pwsh.exe)
- **PowerShell**: v7.5.2 (Core)
- **System**: Standard Entwicklungssystem mit ausreichend RAM
- **Package Manager**: pnpm 10.15.1 (nicht npm!)
- **Node.js**: v20.18.0
- **npm**: v10.8.2
- **Git**: v2.51.0.1
- **GitHub CLI**: v2.78.0 (C:\Program Files\GitHub CLI\gh.exe)
- **VS Code**: Latest LTS
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
# Production Dependencies (package.json v1.6.0)
@fontsource/roboto@5.1.0
@types/react@18.3.12
@types/react-dom@18.3.1
dexie@4.2.0
electron@31.7.7
electron-log@5.4.3
electron-updater@6.6.2
jszip@3.10.1
react@18.3.1
react-dom@18.3.1
react-router-dom@7.8.2
sql.js@1.13.0
typescript@5.9.2

# Development Dependencies
@playwright/test@1.46.0
@testing-library/jest-dom@6.8.0
@testing-library/react@16.3.0
@testing-library/user-event@14.6.1
@types/node@20.14.10
@types/sql.js@1.4.9
@typescript-eslint/eslint-plugin@8.43.0
@typescript-eslint/parser@8.43.0
@vitejs/plugin-react@5.0.2
electron-builder@24.13.3
esbuild@0.21.5
eslint@9.9.0
jsdom@26.1.0
npm-run-all@4.1.5
tsx@4.20.5
typescript@5.5.4
vite@5.4.0
vitest@1.6.0
```

### **Git Workflow**
- **Commit Messages**: Deutsche Sprache mit Feature-Beschreibung
- **Tagging**: Immer `vX.Y.Z` Format
- **Pushing**: Tags mit `--tags` Flag pushen

---

**Wichtig**: Dieses Projekt verwendet **deutsche Sprache** für UI, Kommentare und Dokumentation.
