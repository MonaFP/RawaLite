# 📏 Coding Standards - RawaLite

> **Verbindliche Entwicklungsstandards** für die RawaLite Codebasis
> 
> **Letzte Aktualisierung:** 12. Oktober 2025 | **Version:** 2.0 (Extracted from standards.md)

---

## 🎯 **Übersicht**

Diese Standards gewährleisten **konsistente, wartbare und sichere** Codebasis in RawaLite. Alle Entwickler müssen diese Regeln befolgen.

---

## 🧠 **Entscheidungsfindung & Problem-Solving**

### **1. Root-Cause vs. Symptom-Behandlung Prinzip**
```
❌ SYMPTOM-BEHANDLUNG:
Problem: "TypeScript import errors"
→ Lösung: Alle import statements umschreiben

✅ ROOT-CAUSE-ANALYSE:  
Problem: "TypeScript import errors"
→ Analyse: esModuleInterop nicht konfiguriert
→ Lösung: tsconfig.json korrekt setzen
```

**Entscheidungsmatrix für Problemlösung:**
1. **Impact Assessment:** Config-Änderung vs. Code-Änderung Aufwand
2. **Standard Compliance:** Folgt die Lösung Ecosystem-Standards?
3. **Wartbarkeit:** Wie viele zukünftige Entwickler müssen das verstehen?
4. **Zukunftssicherheit:** Funktioniert das mit neuen Dependencies?

### **2. Konfiguration vor Code-Änderung**
```
Hierarchie der Lösungsansätze:
1. ✅ Tool-Konfiguration (tsconfig, eslint, vite)
2. ✅ Build-Pipeline Anpassung  
3. ✅ Architektur-Refactoring
4. ❌ Code-Workarounds (nur als letzter Ausweg)
```

**Begründung:** Konfigurationsprobleme erfordern Konfigurationslösungen, nicht Code-Workarounds.

### **3. Standard-Syntax vor Custom-Lösungen**
```typescript
// ✅ RICHTIG: Standard-konforme Imports (mit esModuleInterop)
import Database from 'better-sqlite3';
import path from 'node:path';
import fs from 'node:fs';

// ❌ FALSCH: Workaround-Syntax wegen falscher Config
import * as Database from 'better-sqlite3';
import * as path from 'node:path';
import * as fs from 'node:fs';
```

**Developer Experience Prinzip:** Code sollte aussehen wie in der offiziellen Dokumentation der Libraries.

---

## 🚫 **Anti-Patterns bei der Fehlersuche**

Typische Fehlverhaltensmuster, die vermieden werden müssen:

- **Fehler nicht reproduziert** – Problem wird untersucht, ohne es zuverlässig auszulösen → Ursache und Wirkung bleiben unklar.
- **Planloses Ausprobieren** – Änderungen vornehmen, ohne **Hypothese** oder Analyse → hoher Zeitverlust durch Zufallsversuche.
- **Ergebnisse „raten"** – Ein Resultat oder Verhalten wird angenommen, ohne Daten zu überprüfen → falsche Schlussfolgerungen möglich.
- **Mehrere Änderungen gleichzeitig** – Parallel viele Parameter ändern → unklar, welche Änderung welchen Effekt hatte.
- **Logs ignorieren** – Vorhandene **Logs, Fehlermeldungen oder Hinweise** nicht gründlich auswerten → wertvolle Anhaltspunkte gehen verloren.
- **Keine Dokumentation** – Durchgeführte Versuche nicht festhalten → Erkenntnisse gehen verloren und es kommt zu **Doppelarbeit** bei wiederholten Tests.
- **Symptom-Behandlung statt Root-Cause-Analyse** – Oberflächliche Fixes implementieren, ohne die eigentliche Ursache zu verstehen → Problem kehrt zurück oder verschlimmert sich.
- **"Kleinste Änderung"-Bias** – Reflexartig die scheinbar kleinste Code-Änderung wählen, ohne Impact auf Wartbarkeit und Standards zu bewerten → Technische Schulden akkumulieren.
- **Workarounds vor Standards** – Nicht-standard-konforme Lösungen implementieren, statt Konfiguration oder Architektur korrekt zu setzen → Developer Experience verschlechtert sich langfristig.
- **Config-Problem als Code-Problem behandeln** – TypeScript-, Build- oder Tool-Konfigurationsprobleme durch Code-Umschreibung "lösen" → Unnötige Komplexität und Inkompatibilität mit Ecosystem.

---

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
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "esModuleInterop": true
  }
}
```

**Begründung für esModuleInterop:**
- ✅ **Standard-konforme Syntax:** `import Database from 'better-sqlite3'` wie in offizieller Dokumentation
- ✅ **Wartbarkeit:** Keine Workarounds mit `import * as Database`  
- ✅ **Developer Experience:** Konsistent mit Node.js und Library-Standards
- ✅ **Zukunftssicherheit:** TypeScript Richtung moderne ES Module Interoperabilität

### **2. Type Definitions**
```typescript
// ✅ RICHTIG: Explizite Typen für alle öffentlichen APIs
export interface Customer {
  id: number;
  name: string;
  email: string;
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
  onSave: (customer: Customer) => void;
  onCancel: () => void;
}

export default function CustomerForm({ 
  customer, 
  onSave, 
  onCancel 
}: CustomerFormProps) {
  // Hook-Aufrufe immer am Anfang
  const [formData, setFormData] = useState<CustomerFormData>({
    name: customer?.name ?? '',
    email: customer?.email ?? ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Validation und Save-Logik
  };

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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadCustomers = useCallback(async () => {
    if (!adapter) return;
    
    try {
      setLoading(true);
      setError(null);
      const data = await adapter.getCustomers();
      setCustomers(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [adapter]);

  const createCustomer = useCallback(async (data: CreateCustomerData) => {
    if (!adapter) throw new Error('No adapter available');
    
    const newCustomer = await adapter.createCustomer(data);
    setCustomers(prev => [...prev, newCustomer]);
    return newCustomer;
  }, [adapter]);

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
  isLoading: boolean;
  error: string | null;
}

const PersistenceContext = createContext<PersistenceContextValue>({
  adapter: null,
  isLoading: false,
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
  
  getCustomers(): Promise<Customer[]>;
  createCustomer(data: CreateCustomerData): Promise<Customer>;
  updateCustomer(id: number, patch: Partial<Customer>): Promise<Customer>;
  deleteCustomer(id: number): Promise<void>;
}

// ✅ RICHTIG: Implementierung mit Error Handling
export class SQLiteAdapter implements PersistenceAdapter {
  async createCustomer(data: CreateCustomerData): Promise<Customer> {
    try {
      const stmt = this.db.prepare(`
        INSERT INTO customers (name, email) 
        VALUES (?, ?) 
        RETURNING *
      `);
      
      const result = stmt.get(data.name, data.email) as Customer;
      return result;
    } catch (error) {
      throw new DatabaseError(
        `Failed to create customer: ${data.name}`,
        error instanceof Error ? error : undefined
      );
    }
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

### **3. Schema Consistency Standards**
```typescript
// ✅ RICHTIG: Field-Mapper für camelCase ↔ snake_case
import { convertSQLQuery } from '../lib/field-mapper';

// ✅ RICHTIG: Alle Queries verwenden convertSQLQuery()
const query = convertSQLQuery(`
  SELECT customerId, customerName FROM customers 
  WHERE packageId = ? AND invoiceId IS NOT NULL
`);

// ✅ RICHTIG: Service Layer mit convertSQLQuery()
export class CustomerService {
  static async getCustomers(searchTerm: string): Promise<Customer[]> {
    const query = convertSQLQuery(`
      SELECT customerId, customerName, packageId 
      FROM customers 
      WHERE customerName LIKE ?
      ORDER BY createdAt DESC
    `);
    return this.client.query(query, [`%${searchTerm}%`]);
  }
}

// ❌ FALSCH: Hardcoded snake_case in Queries
const query = `SELECT customer_id FROM customers WHERE package_id = ?`;

// ❌ FALSCH: Direkte snake_case im Renderer Process
```

**Schema Consistency Rules:**
- **Field-Mapper als Single Source of Truth** für alle camelCase ↔ snake_case Mappings
- **convertSQLQuery() IMMER verwenden** - außer in Main Process direkte DB-Zugriffe
- **Neue Fields:** Zuerst Field-Mapper erweitern, dann Queries konvertieren
- **Testing:** Alle Schema-Mappings müssen Unit Tests haben

---

## 🚨 **Error Handling Standards**

### **1. Error Types**
```typescript
// ✅ RICHTIG: Spezifische Error-Klassen
export class ValidationError extends Error {
  constructor(
    message: string,
    public field: string,
    public value: unknown
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
    return {
      type: 'validation',
      message: error.message,
      field: error.field
    };
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
        console.error('Uncaught error:', error, errorInfo);
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
└── CustomerTypes.ts           # Ohne .types.ts Suffix
```

### **2. Import/Export Standards**
```typescript
// ✅ RICHTIG: Named Exports für Utilities
export { formatCurrency, formatDate } from './formatting';

// ✅ RICHTIG: Default Exports für Components/Hooks
export default function CustomerForm() { /* */ }

// ✅ RICHTIG: Type-Only Imports
import type { Customer, CreateCustomerData } from './customer.types';

// ✅ RICHTIG: Grouped Imports
import React, { useState, useCallback } from 'react';
import { formatCurrency } from '../lib/formatting';
import type { Customer } from '../types/customer.types';

// ❌ FALSCH: Gemischte Import-Styles
import * as React from 'react';
import formatCurrency from '../lib/formatting';
```

---

## 🔧 **Performance Standards**

### **1. React Performance**
```typescript
// ✅ RICHTIG: useMemo für teure Berechnungen
const expensiveValue = useMemo(() => {
  return customers.reduce((total, customer) => {
    return total + calculateCustomerValue(customer);
  }, 0);
}, [customers]);

// ✅ RICHTIG: useCallback für Event Handler
const handleCustomerSelect = useCallback((customerId: number) => {
  setSelectedCustomer(customers.find(c => c.id === customerId));
}, [customers]);

// ❌ FALSCH: Inline Functions in JSX
<button onClick={() => handleClick(item.id)}>Click</button>

// ✅ RICHTIG: Memoized Components
const CustomerListItem = React.memo(function CustomerListItem({ customer, onSelect }) {
  return <div onClick={() => onSelect(customer.id)}>{customer.name}</div>;
});
```

### **2. Database Performance**
```typescript
// ✅ RICHTIG: Bulk Operations
async bulkCreateCustomers(customers: CreateCustomerData[]): Promise<Customer[]> {
  const stmt = this.db.prepare('INSERT INTO customers (name, email) VALUES (?, ?)');
  
  return this.db.transaction(() => {
    return customers.map(customer => 
      stmt.get(customer.name, customer.email) as Customer
    );
  })();
}

// ❌ FALSCH: N+1 Query Problem
for (const customer of customers) {
  await this.createCustomer(customer); // Separate transaction each time
}
```

---

## 🔒 **Security Standards**

### **1. Input Validation**
```typescript
// ✅ RICHTIG: Joi Schema Validation
const customerSchema = Joi.object({
  name: Joi.string().min(1).max(100).required(),
  email: Joi.string().email().required(),
  phone: Joi.string().pattern(/^\+?[\d\s-()]+$/).optional()
});

export function validateCustomer(data: unknown): CreateCustomerData {
  const { error, value } = customerSchema.validate(data);
  if (error) {
    throw new ValidationError(error.details[0].message, error.details[0].path[0] as string, data);
  }
  return value;
}

// ❌ FALSCH: Keine Input Validation
function createCustomer(data: any) { /* */ }
```

### **2. SQL Injection Prevention**
```typescript
// ✅ RICHTIG: Prepared Statements
const customers = this.db.prepare('SELECT * FROM customers WHERE name LIKE ?').all(`%${searchTerm}%`);

// ❌ FALSCH: String Interpolation
const customers = this.db.prepare(`SELECT * FROM customers WHERE name LIKE '%${searchTerm}%'`).all();
```

---

## 📊 **Code Quality Metrics**

### **Akzeptable Schwellenwerte:**
- **Test Coverage:** > 80% für Business Logic
- **TypeScript Strict Mode:** 100% compliant
- **ESLint:** 0 errors, < 5 warnings
- **Bundle Size:** < 10MB für Electron App
- **Component Complexity:** < 15 cyclomatic complexity
- **Function Length:** < 50 lines per function
- **File Length:** < 500 lines per file

### **Quality Gates:**
```bash
# Minimum standards für PR acceptance
pnpm typecheck    # Must pass
pnpm lint         # Must pass  
pnpm test         # Must pass
pnpm build        # Must pass
```

---

*Letzte Aktualisierung: 12. Oktober 2025 | Nächste Review: Januar 2026*