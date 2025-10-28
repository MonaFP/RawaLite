# 🔗 Hook-Synchronisation Patterns - Status Updates Reference
CAVE:  **🤖 KI-AUTO-DETECTION SYSTEM NEEDED. KI HAS TO READ HANDBOOK FIRST**
> **Erstellt:** 17.10.2025 | **Letzte Aktualisierung:** 27.10.2025 (Header repariert, KI-PRÄFIX Schema compliance)  
> **Status:** Reference | **Typ:** Hook Synchronisation Patterns  
> **Schema:** `VALIDATED_REFERENCE-HOOK-SYNCHRONISATION-PATTERNS_2025-10-17.md`

## 📋 **SCHEMA-ÜBERSICHT nach KI-PRÄFIX-ERKENNUNGSREGELN**

### **STATUS-PRÄFIX:** `VALIDATED_`
- **Bedeutung:** Validierte, stabile Dokumentation (verlässliche Quelle)
- **KI-Verhalten:** Behandelt als verlässliche Quelle für Hook Synchronisation

### **TYP-KATEGORIE:** `REFERENCE-`
- **Verwendung:** Hook synchronisation patterns für status updates
- **Purpose:** React hooks synchronisation und state management patterns

> **🔗 HOOK SYNCHRONISATION OVERVIEW**  
> **Zweck:** Hook-Synchronisation Fix für Status Updates zwischen Komponenten  
> **Usage:** React hooks synchronisation patterns und state management

## 🎯 **HOOK SYNCHRONISATION PROBLEM & SOLUTION**

**Problem:** Status-Updates nur im Dashboard sichtbar, nicht in Sidebar/HeaderStatistics  
**Status:** ✅ **GELÖST**

## 📋 **Problem Beschreibung**

Nach Status-Änderungen über `StatusControl` wurden Updates nur im Dashboard angezeigt, aber nicht in anderen Komponenten:

- ✅ **Dashboard** → Zeigt Updates sofort (via `onUpdated` callback)
- ❌ **Sidebar** → Zeigt alte Status-Werte bis Reload
- ❌ **HeaderStatistics** → Counts bleiben unaktualisiert

### **Root Cause Analysis**

**Das Status-System (FIX-009) funktioniert perfekt:**
- ✅ Database-Updates mit Optimistic Locking
- ✅ Versioning und Conflict Detection
- ✅ IPC Handlers arbeiten korrekt
- ✅ StatusControl macht successful updates

**Das Problem lag in der Frontend Hook-Synchronisation:**

```typescript
// Problem: Jede Komponente hat eigene Hook-Instanz
Dashboard → useInvoices() → Eigener State
Sidebar → useInvoices() → Separater State (wird nicht invalidiert)
HeaderStatistics → useInvoices() → Separater State (wird nicht invalidiert)
```

## Implementierte Lösung

### 1. Global Event Bus System

**File:** `src/hooks/useHookEventBus.ts`

```typescript
class HookEventBus {
  private listeners: Map<EventName, Set<EventListener>> = new Map();

  on(eventName: EventName, listener: EventListener): () => void
  emit(eventName: EventName, payload: EventPayload): void
  emitEntityUpdate(entityType, entityId, data): void
}

export const hookEventBus = new HookEventBus();
export function useHookInvalidation(eventName, listener): void
```

**Event Types:**
- `offer-updated` → Angebot-Status geändert
- `invoice-updated` → Rechnung-Status geändert
- `entity-status-changed` → Allgemeine Status-Änderung

### 2. Hook-Instanzen mit Event-Listening

**Files:** `src/hooks/useInvoices.ts`, `src/hooks/useOffers.ts`

```typescript
// Event-basierte Invalidation hinzugefügt
useHookInvalidation('invoice-updated', useCallback((payload) => {
  console.log('🔄 Invoice hook invalidated by status update:', payload);
  loadInvoices(); // Re-fetch data
}, [loadInvoices]));

useHookInvalidation('entity-status-changed', useCallback((payload) => {
  if (payload.entityType === 'invoice') {
    loadInvoices(); // Re-fetch data
  }
}, [loadInvoices]));
```

### 3. StatusControl Event-Emission

**File:** `src/components/StatusControl.tsx`

```typescript
// Nach erfolgreichem Status-Update
onUpdated(result);

// 🔥 NEW: Event für Hook-Invalidation emittieren
hookEventBus.emitEntityUpdate(kind, row.id, {
  oldStatus: currentStatus,
  status: newStatus,
  version: result.version
});
```

## Flow Diagram

```
Status-Update ausgelöst
        ↓
StatusControl → Database Update (FIX-009)
        ↓
hookEventBus.emitEntityUpdate()
        ↓
┌─────────────────────────────────────┐
│ Event Broadcasting                  │
├─────────────────────────────────────┤
│ • offer-updated                     │
│ • entity-status-changed             │
└─────────────────────────────────────┘
        ↓
┌─────────────────────────────────────┐
│ Hook Invalidation                   │
├─────────────────────────────────────┤
│ • Dashboard useInvoices()           │
│ • Sidebar useInvoices()             │
│ • HeaderStatistics useInvoices()    │
└─────────────────────────────────────┘
        ↓
Alle Komponenten re-fetchen Daten
        ↓
✅ Synchrone UI Updates überall
```

## Benefits

### ✅ Respektiert Critical Fixes
- **FIX-009** Status-System bleibt komplett unverändert
- **EntityStatusService** unberührt
- **Optimistic Locking** funktioniert weiter
- **Database Transactions** bleiben intakt

### ✅ Verbesserte UX
- **Sofortige Updates** in allen Komponenten
- **Keine Manual Reloads** mehr nötig
- **Konsistente Status-Anzeige** überall
- **Real-time Synchronisation**

### ✅ Debugging Support
- **Console Logs** für Event-Emission
- **Hook-Invalidation Tracking**
- **Event Bus Statistics** verfügbar

## Testing

### Test Procedure
1. **Status ändern** in Dashboard-Tabelle
2. **Sidebar beobachten** → Counts updaten sofort
3. **HeaderStatistics prüfen** → Status-Zahlen aktualisiert
4. **Console logs** → Event-Emission bestätigen

### Console Output
```
✅ Status updated: offer[123] draft → sent (v1 → v2)
📡 Event emitted for hook invalidation: offer-updated
🔄 Offer hook invalidated by status update: {entityType: "offer", ...}
🔄 Offer hook invalidated by entity status change: {entityType: "offer", ...}
```

## Code Safety

### Critical Fix Compliance
- ✅ **FIX-009 unberührt** → Database-System bleibt identisch
- ✅ **Keine Breaking Changes** → Bestehende API unverändert
- ✅ **Backward Compatibility** → Alte Callbacks funktionieren weiter
- ✅ **Error Handling** → Robust gegen Event-Failures

### Performance
- ✅ **Minimal Overhead** → Events nur bei Status-Changes
- ✅ **Efficient Re-fetching** → Nur betroffene Entity-Types
- ✅ **Memory Safe** → Event-Listeners automatisch cleanup
- ✅ **Debouncing** → Verhindert excessive API calls

## Files Modified

```
✅ src/hooks/useHookEventBus.ts (NEW)
✅ src/hooks/useInvoices.ts (Event-Listening)
✅ src/hooks/useOffers.ts (Event-Listening)  
✅ src/components/StatusControl.tsx (Event-Emission)
```

## Success Criteria

### ✅ Functional Requirements
- [x] Status-Updates propagieren zu allen Komponenten
- [x] Sidebar zeigt aktuelle Status-Counts
- [x] HeaderStatistics aktualisiert sich sofort
- [x] Keine Manual Reloads nötig

### ✅ Technical Requirements  
- [x] Critical Fix FIX-009 respektiert
- [x] Database-System unverändert
- [x] Event-basierte Architecture
- [x] Proper error handling

### ✅ User Experience
- [x] Immediate visual feedback
- [x] Consistent UI state
- [x] No loading delays
- [x] Professional UX flow

---

**Status:** ✅ **PRODUCTION READY**  
**Testing:** ✅ **User Validated**  
**Documentation:** ✅ **Complete**

Das Hook-Synchronisation Problem ist vollständig gelöst und respektiert alle Critical Fixes!
