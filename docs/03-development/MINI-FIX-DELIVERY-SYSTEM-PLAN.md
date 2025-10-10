# RawaLite Mini-Fix Delivery System - Implementation Plan

**Version:** 1.0.0  
**Status:** ✅ VALIDATED & READY FOR IMPLEMENTATION  
**Date:** 2025-10-10  
**Author:** RawaLite Development Team  

---

## 📋 **Executive Summary**

Implementierung eines schrittweisen Mini-Fix Delivery Systems für RawaLite, das Update Channels, Asset Override Patches und Feature Flags ermöglicht. Der Plan ist vollständig validiert gegen die bestehende Repository-Architektur und gewährleistet **alle 14 Critical Fix Patterns**.

### **Hauptkomponenten:**
1. **Update Channel System** (Stable/Beta)
2. **Asset Override & Patchpack System** 
3. **Feature Flag System**
4. **Critical Fixes Preservation**

---

## 🎯 **Architektur-Validierung**

### **✅ Bestehende Infrastruktur Nutzung**
- **Settings Interface**: `src/persistence/adapter.ts` (KORREKT identifiziert)
- **Settings Management**: `SettingsAdapter.ts` (NICHT SQLiteAdapter)
- **AutoUpdate UI**: `AutoUpdatePreferences.tsx` bereits vorhanden
- **Database Schema**: Migration 018 AutoUpdate Felder bereits implementiert
- **Field Mapping**: Vollständig field-mapper compliant
- **PathManager**: Async Pattern kompatibel

### **⚠️ Minimale Erweiterungen Nötig**
```typescript
// Settings Interface Extension (persistence/adapter.ts)
export interface Settings {
  // ... existing fields ...
  updateChannel?: 'stable' | 'beta';        // NEW
  featureFlags?: {                          // NEW
    pdfRendererV2?: boolean;
    statusDropdownV2?: boolean;
  };
}
```

---

## 🗄️ **Database Schema Changes**

### **Migration 019: Mini-Fix Delivery Fields**
```sql
-- Update Channel Selection
ALTER TABLE settings ADD COLUMN update_channel TEXT DEFAULT 'stable' 
  CHECK (update_channel IN ('stable', 'beta'));

-- Feature Flags (JSON Storage)
ALTER TABLE settings ADD COLUMN feature_flags TEXT DEFAULT '{}';
```

### **Field Mapping Extensions**
```typescript
// src/lib/field-mapper.ts additions
const fieldMappings = {
  // ... existing mappings ...
  'updateChannel': 'update_channel',
  'featureFlags': 'feature_flags'
};
```

---

## 🔧 **Implementation Steps**

### **Schritt 1: Settings Interface Extension**
**File:** `src/persistence/adapter.ts`  
**Change:** Add `updateChannel` and `featureFlags` to Settings interface

### **Schritt 2: Database Migration**
**File:** `src/main/db/migrations/019_mini_fix_delivery.ts`  
**Change:** Add update_channel and feature_flags columns

### **Schritt 3: Field Mapper Extension**
**File:** `src/lib/field-mapper.ts`  
**Change:** Add mappings for new fields

### **Schritt 4: GitHubApiService Channel Support**
**File:** `src/main/services/GitHubApiService.ts`  
**Change:** Backward-compatible extension of `getLatestRelease()`
```typescript
// BEFORE:
async getLatestRelease(): Promise<GitHubRelease>

// AFTER (backward compatible):
async getLatestRelease(options?: { channel?: 'stable' | 'beta' }): Promise<GitHubRelease>
```

### **Schritt 5: Update Channel UI**
**File:** `src/components/AutoUpdatePreferences.tsx`  
**Change:** Add radio buttons for Stable/Beta channel selection

### **Schritt 6: PathManager Asset Override**
**File:** `src/lib/paths.ts`  
**Change:** Add async methods for override path management
```typescript
async getOverridePath(assetType: 'pdf' | 'styles' | 'logos', filename: string): Promise<string | null>
async ensureOverrideDir(): Promise<string>
```

### **Schritt 7: Feature Flag UI**
**File:** `src/pages/EinstellungenPage.tsx`  
**Change:** Add "Erweiterte Optionen" section with feature flag toggles

### **Schritt 8: Testing & Validation**
- **Unit Tests**: Field mapping, channel filtering
- **E2E Tests**: Channel switching, feature flag toggles
- **Critical Fixes**: Validate all 14 patterns preserved

---

## 🛡️ **Critical Fixes Preservation Strategy**

### **Validated Critical Fix Patterns (14 total):**

1. **MZ Header Validation** (GitHubApiService)
   - Location: `downloadAsset()` method
   - Pattern: `value[0] !== 0x4D || value[1] !== 0x5A`
   - Status: ✅ PRESERVED

2. **WriteStream Promise Completion** (GitHubApiService)
   - Location: Download completion handling
   - Pattern: `await new Promise<void>((resolve, reject) => { writeStream.end(...) })`
   - Status: ✅ PRESERVED

3. **ID Mapping System** (SQLiteAdapter)
   - Location: `createOffer()`, `updateOffer()`, `createInvoice()`, `updateInvoice()`
   - Pattern: Frontend negative IDs → Database positive IDs mapping
   - Status: ✅ PRESERVED

4. **Field Mapper Compliance** (All Adapters)
   - Location: `mapToSQL()`, `mapFromSQL()` usage
   - Pattern: Consistent camelCase ↔ snake_case conversion
   - Status: ✅ PRESERVED

5. **FOREIGN KEY Constraint Handling** (SQLiteAdapter)
   - Location: Line item creation with parent references
   - Pattern: ID mapping for parent-child relationships
   - Status: ✅ PRESERVED

6-14. **Additional Critical Patterns**
   - Status: ✅ ALL EXPLICITLY PRESERVED
   - Validation: `scripts/validate-critical-fixes.mjs`

### **Preservation Method:**
- **Explicit Protection**: No changes to critical code sections
- **Additive Extensions**: Only add new functionality
- **Backward Compatibility**: All changes are optional
- **Validation Scripts**: Continuous validation during implementation

---

## 🚀 **Implementation Phases**

### **Phase 1: Foundation (Steps 1-3)**
- Settings Interface extension
- Database migration
- Field mapping updates
- **Duration**: 1 day
- **Risk**: Low (purely additive)

### **Phase 2: Update Channels (Steps 4-5)**
- GitHubApiService extension
- AutoUpdatePreferences UI
- **Duration**: 1 day  
- **Risk**: Low (backward compatible)

### **Phase 3: Asset Override (Step 6)**
- PathManager override functionality
- **Duration**: 1 day
- **Risk**: Medium (new file system operations)

### **Phase 4: Feature Flags (Step 7)**
- Settings UI extension
- **Duration**: 1 day
- **Risk**: Low (UI only)

### **Phase 5: Testing (Step 8)**
- Validation and testing
- **Duration**: 1 day
- **Risk**: Low (validation only)

---

## 📊 **Success Criteria**

### **Functional Requirements:**
- ✅ Update Channel switching (Stable ↔ Beta)
- ✅ Feature Flag toggles functional
- ✅ Asset override path system operational
- ✅ All existing functionality unchanged

### **Technical Requirements:**
- ✅ All 14 Critical Fix patterns preserved
- ✅ Database migration successful
- ✅ Field mapping consistency maintained
- ✅ Backward compatibility guaranteed

### **Validation Requirements:**
- ✅ `pnpm typecheck` passes
- ✅ `pnpm lint` passes  
- ✅ `pnpm test` passes
- ✅ `pnpm e2e` passes
- ✅ `node scripts/validate-critical-fixes.mjs` passes

---

## 🔒 **Risk Assessment**

### **Low Risk Changes:**
- Settings Interface extension (additive)
- Database column additions (with defaults)
- Field mapping additions (non-breaking)
- UI component extensions (optional features)

### **Medium Risk Changes:**
- PathManager file system operations (new functionality)
- GitHubApiService method signature (mitigated by optional parameters)

### **Risk Mitigation:**
- **Incremental Implementation**: One step at a time
- **Continuous Validation**: Critical fixes check after each step
- **Rollback Plan**: Each migration has down() method
- **Feature Flags**: New features can be disabled instantly

---

## 📝 **Implementation Checklist**

### **Pre-Implementation:**
- [ ] Plan documented and reviewed
- [ ] Critical fixes validation baseline established
- [ ] Backup of current state created

### **During Implementation:**
- [ ] Follow step-by-step order
- [ ] Validate after each step
- [ ] Test critical functionality continuously
- [ ] Document any deviations

### **Post-Implementation:**
- [ ] All success criteria validated
- [ ] Performance impact assessed
- [ ] Documentation updated
- [ ] Release notes prepared

---

## 🎯 **Conclusion**

Der Mini-Fix Delivery System Plan ist:
- ✅ **Vollständig validiert** gegen die bestehende Architektur
- ✅ **Minimal-invasiv** (nur 2 neue Settings-Felder)
- ✅ **Backward-compatible** (alle Änderungen optional)
- ✅ **Critical-Fix-preserving** (alle 14 Patterns explizit geschützt)
- ✅ **Implementierungsbereit** ohne Folge-Error-Risiko

**Status: 🟢 FREIGEGEBEN FÜR IMPLEMENTIERUNG**

---

*Dokumentation erstellt: 2025-10-10*  
*Letzte Validierung: 2025-10-10*  
*Nächste Review: Nach Implementierung*