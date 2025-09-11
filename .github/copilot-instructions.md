# RawaLite - AI Coding Instructions

## 🏢 Projektübersicht
RawaLite ist eine Electron-basierte Desktop-Anwendung für Geschäftsverwaltung mit React + TypeScript + SQLite.

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

## 🗃️ Datenbank-Schema (SQLite)

### **Core Tables**
```sql
-- Singleton Settings
CREATE TABLE settings (id INTEGER PRIMARY KEY CHECK (id = 1), ...);

-- Auto-numbered Entities  
CREATE TABLE customers (id, number TEXT UNIQUE, ...);
CREATE TABLE offers (id, offerNumber TEXT UNIQUE, ...);
CREATE TABLE invoices (id, invoiceNumber TEXT UNIQUE, ...);
CREATE TABLE timesheets (id, timesheetNumber TEXT UNIQUE, ...);

-- Hierarchical Structures
CREATE TABLE packages (id, parentPackageId REFERENCES packages(id), ...);
CREATE TABLE package_line_items (id, packageId, parentItemId REFERENCES package_line_items(id), ...);
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

## 🔍 Debug-Tipps

- **Development**: Chrome DevTools für Renderer, VS Code Debug für Main Process
- **Database**: SQLite-Browser für Schema-Inspektion
- **Logs**: Console.log für Development, strukturiertes Logging für Production
- **IPC**: Electron DevTools für IPC-Message Debugging

---

**Wichtig**: Dieses Projekt verwendet **deutsche Sprache** für UI, Kommentare und Dokumentation.
