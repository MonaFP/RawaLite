# 🔧 **PHASE 4 COMPLIANCE CORRECTION - KI-PRÄFIX RULES**

> **Erstellt:** 04.11.2025 | **Status:** IN-PROGRESS | **Typ:** FIX-SESSION  
> **Thema:** Phase 4 Korrekte Durchführung - RawaLite Compliance Restoration

## 📋 **VIOLATIONS IDENTIFIED & CORRECTED**

### ❌ **Violations Found:**

| # | Violation | Status | Fix |
|---|-----------|--------|-----|
| 1 | Neue Test-Datei statt bestehende zu debuggen | ❌ SEVERE | Delete new tests, debug existing |
| 2 | Keine LESSON_LEARNED Template verwendet | ❌ SEVERE | Create with proper template |
| 3 | Keine COMPLETED_IMPL Dokumentation | ❌ SEVERE | Document with correct prefix |
| 4 | Dateinamens-Konvention falsch | ❌ SEVERE | Use `COMPLETED_IMPL-...` format |
| 5 | Keine KI-AUTO-DETECTION Systemheader | ❌ MODERATE | Add to all new docs |
| 6 | Test Mocking Fehler (10 fehlgeschlagene Tests) | ⚠️ BLOCKERROR | Fix mock pattern in existing tests |

---

## 🎯 **CORRECTED PHASE 4 PROCESS**

### **Step 1: Analyze Existing Tests (✅ DONE)**
- ✅ Identified `tests/navigation-hybrid-mapper.spec.ts` (Phase 2 tests)
- ✅ Found 10 failing tests due to mock structure issues
- ✅ Understood real function signatures

### **Step 2: Fix Mapper Mock Issues (🔧 IN PROGRESS)**

**Root Causes Found:**
1. **Test using `.mockReturnValue()` on non-spy objects** 
   - Need to use `vi.spyOn()` FIRST
   
2. **Function signature mismatches:**
   - `getAllModeSettingsBySchema(db, schemaVersion, userId)` takes 3 params, not separate ones
   - `normalizeSettingsBySchema(schemaVersion, settings, defaults)` order wrong in tests
   - `getFallbackSettings(defaults)` - correct, but tests pass wrong data

3. **Field-Mapper camelCase transformation:**
   - Tests expect `user_id`, get `userId` (CORRECT behavior!)
   - Need to update test expectations, not code

### **Step 3: Create Proper Documentation (✅ NEXT)**
- LESSON_FIX-PHASE4-HYBRID-MAPPER-DEBUG... with LESSON_ prefix
- COMPLETED_IMPL-OPTION3-HYBRID-MAPPING-LAYER-PHASE4... with COMPLETED_ prefix
- Both with full KI-AUTO-DETECTION SYSTEM headers

---

## 🛠️ **IMMEDIATE ACTIONS**

### **Fix Mapper Tests - Correct Signatures:**

**getNavigationSettingsBySchema(db, schemaVersion, userId, navigationMode?)**
```typescript
// ✅ CORRECT
const result = HybridMapper.getNavigationSettingsBySchema(
  mockDb, 
  '034',        // schemaVersion
  'user1',      // userId
  'mode-dashboard-view'  // navigationMode (optional)
);
```

**getAllModeSettingsBySchema(db, schemaVersion, userId)**
```typescript
// ✅ CORRECT
const result = HybridMapper.getAllModeSettingsBySchema(
  mockDb,
  '034',       // schemaVersion
  'user1'      // userId
);
```

**normalizeSettingsBySchema(schemaVersion, settings, defaults)**
```typescript
// ✅ CORRECT
const result = HybridMapper.normalizeSettingsBySchema(
  '034',                                    // schemaVersion
  { navigation_mode: 'mode-...' },         // settings
  {}                                        // defaults
);
```

**getFallbackSettings(defaults)**
```typescript
// ✅ CORRECT
const result = HybridMapper.getFallbackSettings({});
// Returns: { navigationMode, headerHeight, sidebarWidth, ... }
```

---

## 📊 **Mock Strategy (Corrected)**

### **Use vi.spyOn() BEFORE mocking:**

```typescript
// ❌ WRONG - mocking non-spy object
(db.prepare as any).mockReturnValue(...);

// ✅ CORRECT - spy first, then mock
const prepareSpy = vi.spyOn(mockDb, 'prepare');
prepareSpy.mockReturnValue(...);
```

### **Transaction handling:**

```typescript
// ❌ WRONG
(db.transaction as any).mockImplementation((fn: Function) => fn());

// ✅ CORRECT
const transactionSpy = vi.spyOn(mockDb, 'transaction');
transactionSpy.mockImplementation((fn: any) => fn());
```

---

## 📝 **Field-Mapper Verification**

### **Transformation is CORRECT:**
- Input: `{ user_id: 'user1', navigation_mode: '...', header_height: 160 }`
- Output: `{ userId: 'user1', navigationMode: '...', headerHeight: 160 }`

### **Tests need correction:**
```typescript
// ❌ WRONG - expects unmapped snake_case
expect(result.user_id).toBe('user1');

// ✅ CORRECT - expects mapped camelCase
expect(result.userId).toBe('user1');
```

---

## ✅ **SUCCESS CRITERIA**

- [ ] All 10 failing tests fixed with corrected mocks
- [ ] LESSON_LEARNED doc created with template
- [ ] COMPLETED_IMPL doc created with template  
- [ ] Both docs have KI-AUTO-DETECTION SYSTEM header
- [ ] Proper STATUS-PRÄFIX used: `LESSON_` + `COMPLETED_`
- [ ] Tests passing: 100% of Phase 2 + Phase 3 + Phase 4

---

*Phase 4 Compliance Restoration in progress - RawaLite Standards being restored*
