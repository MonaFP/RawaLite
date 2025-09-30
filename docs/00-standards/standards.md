# 📏 Coding Standards - RawaLite

> **Verbindliche Entwicklungsstandards** für die RawaLite Codebasis
> 
> **Letzte Aktualisierung:** 29. September 2025 | **Version:** 1.1.0

---

## 🎯 **Übersicht**

Diese Standards gewährleisten **konsistente, wartbare und sichere** Codebasis in RawaLite. Alle Entwickler müssen diese Regeln befolgen.

---
## ✅ docs-Struktur
- ** Änderung nur nach Abnahme und Aufforderung durch Entwickler **-
- ** hier ergänzen/aktualisieren bei neuen Inhalten ** - 
docs/
├── 00-standards/           [INDEX.md + 4 Root-Files + workflows/ + debugging/]
├── 10-architecture/        [INDEX.md + 5 Root-Files + troubleshooting/ + electron/]
├── 20-paths/              [INDEX.md + solved/ + active/]
├── 30-updates/            [INDEX.md + solved/ + active/]
├── 40-pdf/                [INDEX.md + solved/ + active/]
├── 50-persistence/        [INDEX.md + 3 Root-Files + migration/ + backup/]
├── 60-security/           [INDEX.md + ipc/]
├── 70-reserved/           [INDEX.md + solved/ + active/] 
├── 80-ui-theme/           [INDEX.md + solved/ + active/]
├── 90-deprecated/         [INDEX.md + solved/ + active/]
├── 99-glossary/           [INDEX.md + solved/ + active/]
└── INSTRUCTIONS-KI.md     [bleibt in root]

## 🧠 Methodologie (Systematische Problemlösung)  
In RawaLite wird bei Problemen eine **systematische, evidenzbasierte Vorgehensweise** erwartet. Jeder Fehler wird strukturiert analysiert, statt durch zufälliges Probieren. Wichtige Grundsätze sind: **klare Problemdefinition, reproduzierbare Tests, schrittweises Ändern einzelner Variablen** und gründliche Dokumentation jeder Analyse. Dieses methodische Vorgehen stellt sicher, dass **Ursachen statt Symptome** gefunden werden und verhindert zeitaufwändige Irrwege. *(Details zum Ablauf siehe [Debugging-Workflow](debugging.md).)*

## 🚫 Anti-Patterns bei der Fehlersuche  
Typische Fehlverhaltensmuster, die vermieden werden müssen:  

- **Fehler nicht reproduziert** – Problem wird untersucht, ohne es zuverlässig auszulösen → Ursache und Wirkung bleiben unklar.  
- **Planloses Ausprobieren** – Änderungen vornehmen, ohne **Hypothese** oder Analyse → hoher Zeitverlust durch Zufallsversuche.  
- **Ergebnisse „raten“** – Ein Resultat oder Verhalten wird angenommen, ohne Daten zu überprüfen → falsche Schlussfolgerungen möglich.  
- **Mehrere Änderungen gleichzeitig** – Parallel viele Parameter ändern → unklar, welche Änderung welchen Effekt hatte.  
- **Logs ignorieren** – Vorhandene **Logs, Fehlermeldungen oder Hinweise** nicht gründlich auswerten → wertvolle Anhaltspunkte gehen verloren.  
- **Keine Dokumentation** – Durchgeführte Versuche nicht festhalten → Erkenntnisse gehen verloren und es kommt zu **Doppelarbeit** bei wiederholten Tests.


## 🏗️ **Architektur-Prinzipien**

### **1. Strikte Layer-Trennung**
```typescript
// ✅ RICHTIG: Klare Trennung der Verantwortlichkeiten
src/
├── hooks/           # Business Logic Layer
├── adapters/        # Data Access Layer  
├── contexts/        # State Management Layer
├── components/      # Presentation Layer
├── pages/           # Route Components
├── lib/             # Utility Layer
└── services/        # External Service Layer
```

### **2. Dependency Flow**
- **Pages** → Hooks → Adapters → Database
- **Components** → Contexts/Props nur
- **Hooks** → niemals direkte UI-Abhängigkeiten
- **Services** → keine Business Logic

### **3. Electron Process Isolation**
```typescript
// ✅ RICHTIG: Strikte Main/Renderer Trennung
electron/main.ts     // Main Process - Filesystem, OS-Integration
src/                 // Renderer Process - UI, Business Logic
electron/preload.ts  // Secure Bridge (falls nötig)

// ❌ FALSCH: Renderer-Code in Main Process
// ❌ FALSCH: Node.js APIs direkt im Renderer
```

---

## 💻 **TypeScript Standards**

### **1. Strict Configuration**
```typescript
// tsconfig.json - PFLICHT-Einstellungen
{
  "compilerOptions": {
    "strict": true,                    // Alle strict-Flags aktiviert
    "noUncheckedIndexedAccess": true, // Array-Zugriff sicher
    "exactOptionalPropertyTypes": true // Keine undefined bei optional
  }
}
```

### **2. Type Definitions**
```typescript
// ✅ RICHTIG: Explizite Typen für alle öffentlichen APIs
export interface Customer {
  id: number;
  name: string;
  email?: string;  // Optional mit Fragezeichen
  createdAt: string;
}

// ✅ RICHTIG: Generics für wiederverwendbare Typen
interface PersistenceAdapter<T> {
  create(data: Omit<T, "id">): Promise<T>;
  update(id: number, patch: Partial<T>): Promise<T>;
}

// ❌ FALSCH: any verwenden
const data: any = {};

// ❌ FALSCH: Implicit any
function processData(input) { }
```

### **3. Naming Conventions**
```typescript
// ✅ Interfaces: PascalCase mit beschreibenden Namen
interface CustomerFormData { }
interface DatabaseAdapter { }

// ✅ Types: PascalCase für komplexe Typen
type CustomerStatus = 'active' | 'inactive' | 'suspended';

// ✅ Enums: PascalCase mit Kontext-Präfix
enum InvoiceStatus {
  DRAFT = 'draft',
  SENT = 'sent', 
  PAID = 'paid'
}

// ✅ Generics: Bedeutsame Namen statt T, U, V
interface Repository<TEntity, TKey> {
  findById(id: TKey): Promise<TEntity | null>;
}
```

---

## ⚛️ **React Standards**

### **1. Component Architecture**
```tsx
// ✅ RICHTIG: Funktionskomponenten mit TypeScript
interface CustomerFormProps {
  customer?: Customer;
  onSave: (data: CustomerFormData) => Promise<void>;
  onCancel: () => void;
}

export default function CustomerForm({ 
  customer, 
  onSave, 
  onCancel 
}: CustomerFormProps) {
  // Hook-Aufrufe immer am Anfang
  const [loading, setLoading] = useState(false);
  const { showError } = useNotifications();
  
  // Event Handler mit useCallback bei Props
  const handleSubmit = useCallback(async (data: CustomerFormData) => {
    setLoading(true);
    try {
      await onSave(data);
    } catch (error) {
      showError('Fehler beim Speichern');
    } finally {
      setLoading(false);
    }
  }, [onSave, showError]);
  
  return <form onSubmit={handleSubmit}>{/* JSX */}</form>;
}

// ❌ FALSCH: Klassen-Komponenten verwenden
// ❌ FALSCH: Props ohne TypeScript-Interface
// ❌ FALSCH: Hooks in Bedingungen oder Schleifen
```

### **2. Hook Standards**
```typescript
// ✅ RICHTIG: Business Logic in Custom Hooks
export function useCustomers() {
  const { adapter } = usePersistence();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Konsistentes Error Handling
  const createCustomer = async (data: CreateCustomerData) => {
    if (!adapter) {
      throw new DatabaseError("Adapter nicht verfügbar");
    }
    
    // Validation vor API-Call
    if (!data.name?.trim()) {
      throw new ValidationError("Name erforderlich", "name");
    }
    
    try {
      const customer = await adapter.createCustomer(data);
      setCustomers(prev => [...prev, customer]);
      return customer;
    } catch (error) {
      const appError = handleError(error);
      setError(appError.message);
      throw appError;
    }
  };
  
  return { customers, loading, error, createCustomer };
}

// ❌ FALSCH: Business Logic direkt in Komponenten
// ❌ FALSCH: Unbehandelte Promises in useEffect
```

### **3. State Management**
```typescript
// ✅ RICHTIG: Context für globalen State
interface PersistenceContextValue {
  adapter: PersistenceAdapter | null;
  ready: boolean;
  error: string | null;
}

const PersistenceContext = createContext<PersistenceContextValue>({
  adapter: null,
  ready: false,
  error: null
});

// ✅ RICHTIG: useState für lokalen State
const [formData, setFormData] = useState<CustomerFormData>({
  name: '',
  email: ''
});

// ❌ FALSCH: Redux für einfache Apps
// ❌ FALSCH: Props Drilling statt Context
```

---

## 🗄️ **Database & Persistence Standards**

### **1. Adapter Pattern**
```typescript
// ✅ RICHTIG: Interface-basierte Abstraktion
export interface PersistenceAdapter {
  ready(): Promise<void>;
  
  // CRUD mit konsistenten Signaturen
  listCustomers(): Promise<Customer[]>;
  getCustomer(id: number): Promise<Customer | null>;
  createCustomer(data: Omit<Customer, "id" | "createdAt" | "updatedAt">): Promise<Customer>;
  updateCustomer(id: number, patch: Partial<Customer>): Promise<Customer>;
  deleteCustomer(id: number): Promise<void>;
}

// ✅ RICHTIG: Implementierung mit Error Handling
export class SQLiteAdapter implements PersistenceAdapter {
  async createCustomer(data: CreateCustomerData): Promise<Customer> {
    const db = await getDB();
    
    // Transaction für Konsistenz
    return withTx(async () => {
      const now = new Date().toISOString();
      
      run(`
        INSERT INTO customers (name, email, createdAt, updatedAt)
        VALUES (?, ?, ?, ?)
      `, [data.name, data.email, now, now]);
      
      const [customer] = all<Customer>(`
        SELECT * FROM customers WHERE id = last_insert_rowid()
      `);
      
      return customer;
    });
  }
}
```

### **2. SQL Standards**
```sql
-- ✅ RICHTIG: Explizite Spaltennamen
SELECT id, name, email, createdAt FROM customers;

-- ✅ RICHTIG: Prepared Statements IMMER
INSERT INTO customers (name, email) VALUES (?, ?);

-- ✅ RICHTIG: Foreign Keys mit ON DELETE
CREATE TABLE invoices (
  customerId INTEGER NOT NULL REFERENCES customers(id) ON DELETE CASCADE
);

-- ✅ RICHTIG: Indizes für Performance
CREATE INDEX idx_invoices_customer ON invoices(customerId);
CREATE INDEX idx_invoices_status ON invoices(status);

-- ❌ FALSCH: SELECT *
-- ❌ FALSCH: String-Interpolation in SQL
-- ❌ FALSCH: Fehlende Foreign Key Constraints
```

---

## 🚨 **Error Handling Standards**

### **1. Error Types**
```typescript
// ✅ RICHTIG: Spezifische Error-Klassen
export class ValidationError extends Error {
  constructor(
    message: string,
    public field?: string,
    public code: string = 'VALIDATION_ERROR'
  ) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class DatabaseError extends Error {
  constructor(message: string, public cause?: Error) {
    super(message);
    this.name = 'DatabaseError';
  }
}

// ✅ RICHTIG: Zentrale Error Handler
export function handleError(error: unknown): AppError {
  if (error instanceof ValidationError) {
    return error;
  }
  
  if (error instanceof Error) {
    return new DatabaseError(error.message, error);
  }
  
  return new DatabaseError('Unbekannter Fehler');
}
```

### **2. Error Boundaries**
```tsx
// ✅ RICHTIG: Globaler Error Boundary
export function GlobalErrorBoundary({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary
      FallbackComponent={ErrorFallback}
      onError={(error, errorInfo) => {
        console.error('Global Error:', error, errorInfo);
        // Optional: Error Reporting Service
      }}
    >
      {children}
    </ErrorBoundary>
  );
}
```

---

## 📁 **Datei & Ordner-Standards**

### **1. Naming Conventions**
```
✅ RICHTIG:
src/
├── components/
│   ├── CustomerForm.tsx        # PascalCase für Components
│   ├── InvoiceTable.tsx
│   └── PackageForm.tsx
├── hooks/
│   ├── useCustomers.ts         # camelCase mit "use" Präfix
│   ├── useInvoices.ts
│   └── useSettings.ts
├── lib/
│   ├── errors.ts               # camelCase für Utilities
│   ├── validation.ts
│   └── formatting.ts
└── types/
    ├── customer.types.ts       # .types.ts für Type-Only Dateien
    └── invoice.types.ts

❌ FALSCH:
├── Components/                 # Großgeschrieben
├── customer-form.tsx           # kebab-case
├── useCustomers.jsx            # .jsx statt .tsx
└── utils.ts                    # Generischer Name
```

### **2. Import/Export Standards**
```typescript
// ✅ RICHTIG: Named Exports für Utilities
export { ValidationError, DatabaseError };
export { formatCurrency, formatDate };

// ✅ RICHTIG: Default Export für Components
export default function CustomerForm() { }

// ✅ RICHTIG: Barrel Exports für bessere DX
// src/lib/index.ts
export * from './errors';
export * from './validation';
export * from './formatting';

// ✅ RICHTIG: Relative Imports innerhalb src/
import { useCustomers } from '../hooks/useCustomers';
import type { Customer } from '../types/customer.types';

// ❌ FALSCH: Mix aus default/named in einer Datei
// ❌ FALSCH: Absolute Imports ohne Path Mapping
```

### **3. Datei-Struktur**
```typescript
// ✅ RICHTIG: Konsistente Datei-Struktur
// 1. Imports (External → Internal → Types)
import React, { useState, useCallback } from 'react';
import { usePersistence } from '../contexts/PersistenceContext';
import type { Customer, CreateCustomerData } from '../types/customer.types';

// 2. Types & Interfaces
interface CustomerFormProps {
  customer?: Customer;
  onSave: (data: CreateCustomerData) => Promise<void>;
}

// 3. Constants
const DEFAULT_FORM_DATA: CreateCustomerData = {
  name: '',
  email: ''
};

// 4. Main Component/Function
export default function CustomerForm({ customer, onSave }: CustomerFormProps) {
  // Hooks
  // Event Handlers  
  // Render
}

// 5. Helper Functions (falls nötig)
function validateFormData(data: CreateCustomerData): ValidationResult {
  // ...
}
```

---

## 🧪 **Testing Standards**

### **1. Test Structure**
```typescript
// ✅ RICHTIG: Describe/It Structure
describe('CustomerService', () => {
  describe('createCustomer', () => {
    it('should create customer with valid data', async () => {
      // Arrange
      const customerData: CreateCustomerData = {
        name: 'John Doe',
        email: 'john@example.com'
      };
      
      // Act
      const result = await customerService.createCustomer(customerData);
      
      // Assert
      expect(result.name).toBe('John Doe');
      expect(result.id).toBeDefined();
    });
    
    it('should throw ValidationError for empty name', async () => {
      // Arrange
      const customerData: CreateCustomerData = {
        name: '',
        email: 'john@example.com'
      };
      
      // Act & Assert
      await expect(customerService.createCustomer(customerData))
        .rejects
        .toThrow(ValidationError);
    });
  });
});
```

### **2. Mock Standards**
```typescript
// ✅ RICHTIG: Typed Mocks
const mockAdapter: jest.Mocked<PersistenceAdapter> = {
  createCustomer: jest.fn(),
  listCustomers: jest.fn(),
  // ... other methods
};

// ✅ RICHTIG: Factory Functions für Test Data
export function createTestCustomer(overrides: Partial<Customer> = {}): Customer {
  return {
    id: 1,
    name: 'Test Customer',
    email: 'test@example.com',
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
    ...overrides
  };
}
```

---

## 📊 **Performance Standards**

### **1. React Performance**
```typescript
// ✅ RICHTIG: Memoization für teure Berechnungen
const expensiveValue = useMemo(() => {
  return customers.reduce((total, customer) => {
    return total + calculateCustomerValue(customer);
  }, 0);
}, [customers]);

// ✅ RICHTIG: useCallback für Event Handler Props
const handleCustomerSelect = useCallback((customerId: number) => {
  onCustomerSelect?.(customerId);
}, [onCustomerSelect]);

// ✅ RICHTIG: React.memo für Pure Components
export const CustomerListItem = React.memo(function CustomerListItem({
  customer,
  onSelect
}: CustomerListItemProps) {
  return <div onClick={() => onSelect(customer.id)}>{customer.name}</div>;
});
```

### **2. Database Performance**
```sql
-- ✅ RICHTIG: Indizes für häufige Queries
CREATE INDEX idx_customers_name ON customers(name);
CREATE INDEX idx_invoices_status_date ON invoices(status, createdAt);

-- ✅ RICHTIG: LIMIT für große Resultsets
SELECT * FROM customers ORDER BY name LIMIT 100 OFFSET 0;

-- ✅ RICHTIG: Joins statt N+1 Queries
SELECT 
  i.id, i.title, i.total,
  c.name as customerName
FROM invoices i 
JOIN customers c ON i.customerId = c.id;
```

---

## 🛡️ **Security Standards**

### **1. Input Validation**
```typescript
// ✅ RICHTIG: Zod für Runtime Validation
import { z } from 'zod';

const CreateCustomerSchema = z.object({
  name: z.string().min(1, 'Name erforderlich').max(100),
  email: z.string().email('Ungültige E-Mail').optional()
});

export function validateCustomerInput(input: unknown): CreateCustomerData {
  return CreateCustomerSchema.parse(input);
}
```

### **2. SQL Injection Prevention**
```typescript
// ✅ RICHTIG: Prepared Statements IMMER
function findCustomersByName(name: string): Customer[] {
  return all<Customer>(`
    SELECT * FROM customers 
    WHERE name LIKE ?
  `, [`%${name}%`]);
}

// ❌ FALSCH: String Interpolation
function findCustomersByNameUnsafe(name: string): Customer[] {
  return all<Customer>(`
    SELECT * FROM customers 
    WHERE name LIKE '%${name}%'
  `);
}
```

---

## 📝 **Documentation Standards**

### **1. Code Documentation**
```typescript
/**
 * Erstellt einen neuen Kunden im System.
 * 
 * @param customerData - Die Kundendaten ohne ID und Timestamps
 * @returns Promise mit dem erstellten Kunden inklusive ID
 * @throws {ValidationError} Wenn Pflichtfelder fehlen oder ungültig sind
 * @throws {DatabaseError} Bei Datenbankfehlern
 * 
 * @example
 * ```typescript
 * const customer = await createCustomer({
 *   name: 'Max Mustermann',
 *   email: 'max@example.com'
 * });
 * console.log(customer.id); // Auto-generierte ID
 * ```
 */
export async function createCustomer(
  customerData: CreateCustomerData
): Promise<Customer> {
  // Implementation...
}
```

### **2. README Standards**
```markdown
## 🚀 Quick Start

```bash
# Prerequisites: Node.js 20+, pnpm
pnpm install
pnpm dev
```

## 📁 Project Structure

```
src/
├── hooks/           # Business Logic
├── components/      # UI Components  
├── pages/           # Route Components
└── adapters/        # Data Layer
```

## 🧪 Testing

```bash
pnpm test           # Unit Tests
pnpm e2e            # E2E Tests
```
```

---

## ✅ **Compliance Checklist**

Vor jedem Commit prüfen:

### Code Quality
- [ ] TypeScript strict mode ohne Errors
- [ ] ESLint Regeln befolgt
- [ ] Alle Tests bestehen
- [ ] Code Coverage > 80%

### Architecture
- [ ] Layer-Trennung eingehalten
- [ ] Keine zirkulären Abhängigkeiten
- [ ] Interfaces für alle Public APIs
- [ ] Error Handling implementiert

### Documentation  
- [ ] JSDoc für öffentliche APIs
- [ ] README bei Struktur-Änderungen aktualisiert
- [ ] Neue Standards dokumentiert
- [ ] Breaking Changes kommuniziert

### Performance
- [ ] Keine N+1 Database Queries
- [ ] React Memoization wo nötig
- [ ] Bundle Size überprüft
- [ ] Database Indizes vorhanden

---

## 🔄 **Automatische Checks**

Diese Standards werden automatisch durchgesetzt:

```json
// package.json
{
  "scripts": {
    "lint": "eslint src --ext .ts,.tsx",
    "typecheck": "tsc --noEmit",
    "test": "vitest",
    "pre-commit": "lint-staged"
  },
  "lint-staged": {
    "src/**/*.{ts,tsx}": [
      "eslint --fix",
      "prettier --write"
    ]
  }
}
```

---

## 📞 **Bei Fragen**

**Unsicher bei Standards?**
1. Checke bestehenden Code als Referenz
2. Suche in dieser Dokumentation
3. Frage im Team-Chat
4. Bei Bedarf: Standards-Review anfordern

---

*Letzte Aktualisierung: 29. September 2025 | Nächste Review: Dezember 2025*