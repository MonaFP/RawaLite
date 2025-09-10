# 🏢 RaWaLite - Project Overview

> **Vollständige Anwendungsübersicht** - Letzte Aktualisierung: 10. September 2025

## 🔍 **Technologie-Stack**

### Frontend & Build
- **React:** 18.3.1 mit TypeScript 5.5.4
- **Router:** React Router DOM 7.8.2
- **Desktop:** Electron 31.2.0
- **Build Tools:** Vite 5.4.0, esbuild 0.21.5
- **Package Manager:** pnpm

### Datenbank & Persistence
- **Primary:** SQL.js 1.13.0 (SQLite im Browser)
- **Secondary:** Dexie 4.0.8 (IndexedDB)
- **Backup:** LocalStorage für Einstellungen

### Testing & Development
- **Unit Tests:** Vitest 1.6.0
- **E2E Tests:** Playwright 1.46.0
- **Linting:** ESLint 9.9.0 mit TypeScript-Plugin

### Business Logic Libraries
- **PDF Generation:** jsPDF 3.0.2 + html2canvas 1.4.1
- **Archive:** JSZip 3.10.1

---

## 🏗️ **Architektur & Struktur**

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
└── useSettings.ts             # ⚙️ Legacy Settings Hook
```

### UI Components
```
src/components/
├── Layout/
│   ├── Sidebar.tsx            # Navigation + Firmenlogo
│   ├── Header.tsx             # Page Title + Actions
│   └── Table.tsx              # Generische Datentabelle
└── Forms/
    ├── CustomerForm.tsx       # Kundenformular
    ├── PackageForm.tsx        # Paketformular mit Sub-Items
    ├── OfferForm.tsx          # Angebotsformular + Line Items
    └── InvoiceForm.tsx        # Rechnungsformular + Angebot-Import
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
```

---

## ⚙️ **Besondere Features**

### 🔢 **Automatische Nummerierung**
- Konfigurierbare Nummernkreise für alle Entitäten
- Jährliche Reset-Optionen (z.B. AN-2025-0001)
- Fallback zu Timestamp-basierter Nummerierung
- Präfix + Stellenanzahl vollständig anpassbar

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

## 🚀 **Build & Deployment**

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

## 📊 **Status & Roadmap**

### ✅ **Implementiert**
- ✅ Vollständige CRUD-Operationen für alle Entitäten
- ✅ Automatische Nummerierung mit konfigurierbaren Kreisen
- ✅ Hierarchische Pakete und Line Items
- ✅ Angebot-zu-Rechnung Workflow
- ✅ SQLite-basierte Persistierung
- ✅ TypeScript-First Architektur
- ✅ Dark Theme Design
- ✅ Electron Desktop App

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
  - ✅ Konsistente Datenanbindung - Verwendet useOffers() und useInvoices() Hooks
  - ✅ Responsive Mini-Widgets - Kompakte Darstellung für Sidebar-Breite

---

*Letzte Aktualisierung: 10. September 2025*
*Version: 0.9.0-optionc-mvp*
