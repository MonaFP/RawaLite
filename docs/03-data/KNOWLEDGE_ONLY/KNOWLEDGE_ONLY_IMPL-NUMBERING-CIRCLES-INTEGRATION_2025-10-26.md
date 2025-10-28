# Numbering Circles Integration Architecture
CAVE:  **🤖 KI-AUTO-DETECTION SYSTEM NEEDED. KI HAS TO READ HANDBOOK FIRST**
**Datum:** 2. Oktober 2025  
**Kontext:** Frontend-Database Integration für Nummernkreise  
**Problem:** Dual-System mit localStorage vs SQLite Database

## 🎯 Problem Analysis

### Original Architecture Issues
Die App verwendete **zwei getrennte Systeme** für Nummernkreise:

1. **Frontend System:** `useSettings()` → **localStorage**
   - Zeigt nur hardcoded defaults: `['customers', 'offers', 'invoices', 'packages']`
   - Keine Database-Integration
   - Statische Daten ohne Persistierung

2. **Backend System:** `NummernkreisService` → **SQLite Database**
   - Direct Database Access
   - Dynamische Nummernkreise möglich
   - Wurde vom Frontend **NICHT abgefragt**

### Symptom
- ✅ Database: Queries erfolgreich (`SELECT FROM numbering_circles` - 12x sichtbar in Logs)
- ❌ Frontend: Nur "Kunden" sichtbar in UI, fehlende Angebote/Rechnungen/Pakete

## 🏗️ Lösung: Unified IPC Architecture

### 1. React Context für Database Integration

**File:** `src/contexts/NumberingContext.tsx`
```typescript
interface NumberingContextType {
  circles: NumberingCircle[];
  loading: boolean;
  error: string | null;
  refreshCircles: () => Promise<void>;
  updateCircle: (id: string, updates: Partial<NumberingCircle>) => Promise<void>;
  getNextNumber: (circleId: string) => Promise<string>;
}

export function NumberingProvider({ children }: NumberingProviderProps) {
  const refreshCircles = async () => {
    // Call the NummernkreisService via Electron IPC
    const result = await window.rawalite.nummernkreis.getAll();
    if (result.success) {
      setCircles(result.data);
    }
  };
}
```

### 2. IPC Bridge Implementation

**File:** `electron/preload.ts`
```typescript
contextBridge.exposeInMainWorld('rawalite', {
  // 🔢 Numbering Circles API
  nummernkreis: {
    getAll: () => ipcRenderer.invoke('nummernkreis:getAll'),
    update: (id: string, circle: any) => ipcRenderer.invoke('nummernkreis:update', id, circle),
    getNext: (circleId: string) => ipcRenderer.invoke('nummernkreis:getNext', circleId),
  },
});
```

### 3. Main Process Handler (Direct Database Access)

**File:** `electron/main.ts`
```typescript
// 🔢 Numbering Circles IPC Handlers
ipcMain.handle('nummernkreis:getAll', async () => {
  try {
    // Direct database access instead of DbClient service
    const db = getDb()
    const query = `
      SELECT id, name, prefix, digits, current, resetMode, lastResetYear 
      FROM numbering_circles 
      ORDER BY name
    `
    const circles = db.prepare(query).all()
    return { success: true, data: circles }
  } catch (error) {
    return { success: false, error: error.message }
  }
})
```

### 4. Frontend Integration

**File:** `src/main.tsx`
```typescript
<LoadingProvider>
  <NotificationProvider>
    <PersistenceProvider mode="sqlite">
      <SettingsProvider>
        <NumberingProvider>  {/* 🆕 Added */}
          <RouterProvider router={router} />
        </NumberingProvider>
      </SettingsProvider>
    </PersistenceProvider>
  </NotificationProvider>
</LoadingProvider>
```

**File:** `src/pages/EinstellungenPage.tsx`
```typescript
// ❌ BEFORE: localStorage only
const { settings, updateNumberingCircles } = useSettings();

// ✅ AFTER: Database integration  
const { settings } = useSettings();
const { circles: numberingCircles, updateCircle } = useNumbering();
```

## 🚨 Critical Architecture Lesson

### Main Process vs Renderer Process
**FEHLER:** `ReferenceError: window is not defined`

**Ursache:** DbClient verwendet `window.rawalite` aber wird im Main Process instanziiert
```typescript
// ❌ WRONG: DbClient in Main Process
const service = new NummernkreisService() // uses DbClient.getInstance()

// ✅ CORRECT: Direct database access in Main Process
const db = getDb()
const circles = db.prepare(query).all()
```

**Lösung:**
1. **Main Process:** Direct SQLite access via `getDb()`
2. **Renderer Process:** IPC calls via `window.rawalite`
3. **No DbClient in Main Process** - only in Renderer

### Service Export Issue
**Problem:** Static initialization in `NummernkreisService`
```typescript
// This runs on import and causes window error in Main Process
private static client = DbClient.getInstance();
```

**Solution:** Remove from main exports
```typescript
// src/index.ts
export * from './persistence/adapter';
// export * from './services/NummernkreisService'; // DISABLED: Causes window error
```

## 🗄️ Database Schema Verification

### Missing Default Data Issue
**Problem:** Nur 1 Nummernkreis in Database statt 4
```sql
-- Was in Database:
SELECT * FROM numbering_circles;
customers|Kunden|K-|4|0|never||2025-10-02 06:52:57|2025-10-02 07:20:30

-- Fehlten:
offers, invoices, packages
```

**Root Cause:** Migration unvollständig - nur `customers` erstellt

**Fix:** Manual insertion
```sql
INSERT OR IGNORE INTO numbering_circles 
(id, name, prefix, digits, current, resetMode, created_at, updated_at) VALUES 
('offers', 'Angebote', 'AN-', 4, 0, 'yearly', datetime('now'), datetime('now')),
('invoices', 'Rechnungen', 'RE-', 4, 0, 'yearly', datetime('now'), datetime('now')), 
('packages', 'Pakete', 'PAK-', 3, 0, 'never', datetime('now'), datetime('now'));
```

**Result:** Alle 4 Nummernkreise jetzt verfügbar
```sql
offers|Angebote|AN-|4|0|yearly||2025-10-02 08:25:03|2025-10-02 08:25:03
customers|Kunden|K-|4|0|never||2025-10-02 06:52:57|2025-10-02 07:20:30
packages|Pakete|PAK-|3|0|never||2025-10-02 08:25:03|2025-10-02 08:25:03
invoices|Rechnungen|RE-|4|0|yearly||2025-10-02 08:25:03|2025-10-02 08:25:03
```

## 📊 Integration Results

### Before Integration
- ❌ Frontend: Nur localStorage defaults (statisch)
- ❌ Backend: Database queries nicht im Frontend verfügbar
- ❌ UI: Nur "Kunden" sichtbar
- ❌ Architecture: Zwei getrennte Systeme

### After Integration  
- ✅ Frontend: Database-driven via IPC
- ✅ Backend: Direct SQLite access in Main Process
- ✅ UI: Alle 4 Nummernkreise sichtbar (Angebote, Kunden, Pakete, Rechnungen)
- ✅ Architecture: Unified system with proper separation

### Validation
```bash
# Database Queries (from terminal logs)
SELECT id, name, prefix, digits, current, resetMode, lastResetYear 
FROM numbering_circles ORDER BY name

# Frontend Integration
✅ NumberingProvider loaded in React Context
✅ IPC calls successful (window.rawalite.nummernkreis.getAll())
✅ All 4 circles displayed in Einstellungen → Nummernkreise
✅ Real-time updates working
```

## 🔮 Future Recommendations

### Migration Strategy
1. **Create Migration 005:** Ensure all default numbering circles exist
2. **Add validation:** Check for missing defaults on startup
3. **Rollback safety:** Include in migration down() function

### Architecture Patterns
1. **IPC-First:** Always use IPC for Main ↔ Renderer communication
2. **Context Providers:** Wrap database operations in React Contexts
3. **Direct DB Access:** Use `getDb()` in Main Process, avoid DbClient
4. **Type Safety:** Maintain proper TypeScript interfaces across IPC boundary

### Error Handling
1. **Graceful degradation:** Show fallback UI if database unavailable
2. **Loading states:** Proper loading indicators during IPC calls
3. **Error boundaries:** Catch and display database errors properly

## 🎯 Key Takeaways

1. **Unified Data Source:** Single database-driven system > dual localStorage/Database systems
2. **Process Separation:** Main Process = Direct DB, Renderer Process = IPC calls
3. **Migration Completeness:** Always verify default data creation
4. **Context Architecture:** React Contexts perfect for cross-component database state
5. **IPC Design:** Keep IPC APIs simple and typed for maintainability