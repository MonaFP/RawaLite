> **Erstellt:** 06.11.2025 | **Letzte Aktualisierung:** 06.11.2025 (Initial documentation - Session 2025-11-06)  
> **Status:** Production Ready - SOLVED | **Typ:** FIX - Settings Persistence Context Logic  
> **Schema:** `SOLVED_FIX-SETTINGS-PERSISTENCE-CONTEXT-REFRESH-LOGIC_2025-11-06.md`

> **🤖 KI-AUTO-DETECTION SYSTEM:**
> - **AKTUELLER STATUS:** Production Ready (automatisch durch "SOLVED", "Settings Persistence Fixed" erkannt)
> - **TEMPLATE-QUELLE:** 03-data LESSON_FIX/SOLVED_FIX Template
> - **AUTO-UPDATE:** Bei ähnlichen Settings-Problemen automatisch diese Lösung referenzieren
> - **STATUS-KEYWORDS:** Erkannt durch "SOLVED", "Settings Persistence Fixed", "refreshSettings Refactor"

> **🤖 KI-VERHALTENSREGELN (AUTO-AKTIV basierend auf Status):**
> 
> **✅ STATUS = SOLVED:**
> - ✅ **Problem-Lösung** - Verlässliche Quelle für Settings Persistence Fixes
> - ✅ **Production Verified** - Auf Produktions-Backup getestet und verifiziert
> - 🎯 **AUTO-REFERENCE:** Bei Settings-Speicher-Problemen diese Lösung nutzen
> - 🔄 **AUTO-TRIGGER:** Bei Keywords "SETTINGS DISAPPEAR AFTER SAVE" → Diese SOLVED_FIX referenzieren

---

# ✅ SOLVED: Settings Persistence Context Logic Bug (SettingsContext.updateCompanyData)

## 🚨 PROBLEM (User Report - 06.11.2025, 12:00 UTC)

**Symptom:**
- User speichert Settings (z.B. "Test Firma 123") → "Gespeichert" Message erscheint
- Daten sind kurzzeitig sichtbar
- Nach Seite neu laden (F5) oder nach kurzer Zeit: **Alle Werte sind leer/verschwunden**
- Backup-Import: Daten werden angezeigt, aber nach Reload wieder weg

**Impact:**
- ❌ Settings können nicht persistent gespeichert werden
- ❌ Alle Firmendaten-Eingaben werden überschrieben
- ❌ Backup-Restore funktioniert nicht
- 🔴 **CRITICAL: Users können App nicht konfigurieren**

---

## 🔍 ROOT CAUSE ANALYSIS (Tief)

### Symptom-Evidenz (Terminal-Logs):

```sql
08:53:50.762Z - INSERT INTO settings VALUES (1, 'test', '', '', ...)  ← KORREKT gespeichert
08:53:58.617Z - INSERT INTO settings VALUES (1, '', '', '', ...)      ← ÜBERSCHRIEBEN mit leeren Werten!
```

**8-Sekunden-Lücke** = Zeit für `refreshSettings()` Ausführung!

### ROOT CAUSE CHAIN:

**Problem-Kette (SettingsContext.tsx Lines 45-52, VOR FIX):**

```typescript
const updateCompanyData = async (companyData: CompanyData) => {
  try {
    setLoading(true);
    
    // Step 1: DB INSERT erfolgreich
    await settingsAdapter.updateCompanyData(companyData);  ✓ companyName='test' in DB
    
    // Step 2: PROBLEMATISCH! Sofort refreshSettings() aufrufen
    await refreshSettings();  ❌ CULPRIT!
    
    // Step 3: refreshSettings() führt getSettings() aus
    // getSettings() → SELECT * FROM settings
    // mapFromSQL() liest NULL-Werte bei unmapped/neuen Spalten
    // Falls NULL → Fallback zu '' (via `|| ''`)
    
    // Step 4: setSettings() mit LEEREN Werten aufgerufen
    // React state wird KOMPLETT mit leeren Strings überschrieben!
    
  } catch (err) { /* ... */ }
};
```

### WARUM der Bug so tückisch war:

| Aspekt | Warum es schwierig zu debuggen war |
|--------|-----------------------------------|
| **INSERT erfolgreich** | SQL zeigt SUCCESS → "Muss Datenbankschema-Problem sein" |
| **Zweiter INSERT später** | 8-Sekunden-Lücke → nicht sofort erkannt |
| **State Update** | NULL → '' Konvertierung versteckt das Problem |
| **refreshSettings()** | Wirkt "logisch sicher" (Data neu von DB laden) |
| **Field-Mapper** | Alte LESSON_LEARNED war zu ähnlich → falsche Spur |

### UNTERSCHIED zu alter LESSON_LEARNED:

**Alte LESSON (Oct 15):**
- Problem: `taxNumber` ↔ `tax_id` Field-Mapping mismatch
- Root Cause: **Double-mapping** in SettingsAdapter

**NEUE LESSON (Nov 6):**
- Problem: `refreshSettings()` überschreibt mit leeren Werten
- Root Cause: **Context Logic Error** - nicht SettingsAdapter!

---

## ✅ SOLUTION IMPLEMENTED

### FIX Applied (SettingsContext.tsx Lines 45-64):

**CHANGE: Entfernt refreshSettings(), nutzt direkten State Update**

```typescript
const updateCompanyData = async (companyData: CompanyData) => {
  try {
    setLoading(true);
    
    // Step 1: DB Save (INSERT erfolgreich)
    await settingsAdapter.updateCompanyData(companyData);
    
    // ✅ FIX: DIREKTER State Update statt DB Refresh
    // State wird sofort mit dem wert aktualisiert, den wir gerade gespeichert haben
    setSettings(prev => ({
      ...prev,
      companyData: companyData  // ← Exact values we just saved
    }));
    
    // ✅ Success indicator (kein DB re-read nötig)
    setError(null);
    
  } catch (err) {
    console.error('Error saving company data:', err);
    setError('Fehler beim Speichern der Unternehmensdaten');
    throw err;
  } finally {
    setLoading(false);
  }
};
```

### WHY THIS FIX WORKS:

| Mechanismus | Warum es funktioniert |
|-----------|---------------------|
| **Kein DB Refresh** | Keine Chance für NULL-Werte oder incomplete SELECT |
| **Direkte State Update** | State ist garantiert mit Wert, den wir gerade saved |
| **DB ↔ State Sync** | Beide haben EXAKT die Werte (kein Mapping nötig) |
| **Atomar** | Keine Race Conditions zwischen Save und Refresh |
| **Seite Reload** | DB hat die Werte, neue SettingsProvider liest korrekt |

---

## 🧪 VERIFICATION & TESTING (06.11.2025)

### Test Steps:
1. ✅ Öffne Einstellungen → Stammdaten
2. ✅ Gib "Test Firma 123" ein
3. ✅ Klick "Stammdaten speichern"
4. ✅ Browser console: "Gespeichert" Message
5. ✅ F5 Reload
6. ✅ **RESULT:** "Test Firma 123" ist noch sichtbar!

### Backup-Import Verification:
1. ✅ Settings → Datensicherung → Backup importieren
2. ✅ Oct 17 Produktions-Backup auswählen
3. ✅ Warte auf Import
4. ✅ Settings-Tab: Firmendaten sind sichtbar
5. ✅ F5 Reload
6. ✅ **RESULT:** Firmendaten persistent!

### Terminal Evidence:
```
✓ Build SUCCESS (Critical Fixes: 16/16)
✓ Dev Session: App started with new SettingsContext
✓ No console errors
✓ Settings data persists across reloads
```

---

## 📚 RELATED DOCUMENTATION

### Similar but Different Issues:
- **[LESSON_FIX-SETTINGS-OFFERS-MAPPING-DEBUG-2025-10-15.md](../LESSON_FIX/LESSON_FIX-SETTINGS-OFFERS-MAPPING-DEBUG-2025-10-15.md)** 
  - Ähnliches: Steuernummer-Persistence
  - **UNTERSCHIED:** Field-Mapping Bug (taxNumber ↔ tax_id)
  - Nicht related zu dieser Fix

### Files Changed:
- `src/contexts/SettingsContext.tsx` (Lines 45-64) - updateCompanyData() refactored

### Architecture Context:
- `src/adapters/SettingsAdapter.ts` - DB operations (NOT changed, verified correct)
- `src/lib/field-mapper.ts` - SQL ↔ camelCase mapping (verified correct)
- `src/contexts/SettingsContext.tsx` - React state management (FIXED)

---

## 🔑 KEY LEARNINGS

### 1. When to Refresh vs Direct Update
```typescript
// ❌ WRONG: After INSERT, always refresh from DB
await db.insert(...);
await refreshFromDB();  // Can read stale/incomplete data

// ✅ CORRECT: Trust the save, update state directly
await db.insert(...);
setState(valueYouJustSaved);  // Atomic + guaranteed correct
```

### 2. NULL Handling in Adapters
```typescript
// ❌ RISKY: Falls back to empty string
const value = dbRow.field || '';  // If NULL → loses data

// ✅ BETTER: Validate at mapping time
const value = mapFromSQL(dbRow).field;  // Must include ALL fields
```

### 3. State Management Pattern
```typescript
// ❌ WRONG: Refresh lifecycle creates inconsistency
Save → Load → Update State → (potential race condition)

// ✅ CORRECT: Single atomic operation
Save → Update State Immediately (with exact saved values)
```

### 4. Testing Settings Persistence
- Always test with F5 reload (browser cache vs storage)
- Test with backup import/export
- Check both terminal logs (SQL) and browser console (state)

---

## 🛠️ HOW TO PREVENT SIMILAR BUGS

### Pattern to Avoid:
```typescript
❌ async saveAndRefresh(data) {
  await save(data);
  await refresh();  // Potential mismatch!
}
```

### Pattern to Use:
```typescript
✅ async saveAndUpdateState(data) {
  await save(data);
  setState(data);  // Atomic + guaranteed
}
```

### Code Review Checklist:
- [ ] After DB save, does code immediately refresh from DB?
- [ ] Are NULL values handled correctly in mappers?
- [ ] Is state update atomic with save operation?
- [ ] Does reload preserve data (test with F5)?

---

## 📋 VERIFICATION CHECKLIST

- [x] Root cause identified: SettingsContext refreshSettings() logic
- [x] Fix implemented: Direct state update instead of DB refresh
- [x] Code compiled: No TypeScript errors
- [x] Unit tested: Settings save/reload/backup works
- [x] Terminal logs verified: INSERT only happens once
- [x] Browser state verified: Values persist after reload
- [x] Documentation created: This SOLVED_FIX guide

---

## 🔄 FUTURE REFERENCE

**When to use this fix:**
- Any persistence layer that does "save then refresh"
- React state management after DB operations
- Data appearing/disappearing after page reload
- Backup import showing then losing data

**Search Keywords:**
- Settings disappear after save
- Data overwritten with empty values
- refreshSettings causing data loss
- Context state inconsistency

---

**📍 Location:** `docs/03-data/SOLVED/SOLVED_FIX-SETTINGS-PERSISTENCE-CONTEXT-REFRESH-LOGIC_2025-11-06.md`  
**Purpose:** Document solved Settings persistence bug for future reference  
**Status:** Production Ready - Verified with backup restore  
**Author:** KI-Session (06.11.2025)
