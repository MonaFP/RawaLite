# Invoice Foreign Key Constraint Fix - Implementation Report

## 🎯 Problem Summary

**Issue**: "Fehler beim speichern von rechnungen. Auch subitems werden dabei gelöscht."

**Root Cause**: FOREIGN KEY constraint failures when saving Invoice line items with negative frontend IDs that reference parent items with negative IDs.

**Critical Error Pattern**:
```
FOREIGN KEY constraint failed
```

When invoice line items with `parentItemId: -1` were inserted before the parent item with `id: -1` was mapped to a positive database ID.

## 🔧 Solution Implemented

### ID Mapping System in SQLiteAdapter

**Files Modified**:
- `src/adapters/SQLiteAdapter.ts` - `createInvoice()` method (lines 801-809)
- `src/adapters/SQLiteAdapter.ts` - `updateInvoice()` method (lines 860-868)

### Key Algorithm Components

#### 1. **Item Sorting Strategy**
```typescript
// Sort items - main items first, then sub-items to ensure parent_item_id references exist
const mainItems = data.lineItems.filter(item => !item.parentItemId);
const subItems = data.lineItems.filter(item => item.parentItemId);
```

#### 2. **ID Mapping System**
```typescript
// Create ID mapping for frontend negative IDs to database positive IDs
const idMapping: Record<number, number> = {};

// Insert main items first and build ID mapping for ALL IDs
for (const item of mainItems) {
  const mappedItem = mapToSQL(item);
  const itemResult = await this.client.exec(/*...*/);
  
  // Map ALL IDs (both negative frontend IDs AND positive existing IDs) to new database IDs
  idMapping[item.id] = Number(itemResult.lastInsertRowid);
}
```

#### 3. **Parent Reference Resolution**
```typescript
// Then insert sub-items with correct parent references
for (const item of subItems) {
  const mappedItem = mapToSQL(item);

  // Resolve parent_item_id using ID mapping - CRITICAL: Look up parent's NEW database ID
  let resolvedParentId = null;
  if (item.parentItemId) {
    resolvedParentId = idMapping[item.parentItemId] || null;
    console.log(`🔧 Sub-Item ID Mapping: Sub-Item ${item.id} → Parent ${item.parentItemId} → Resolved Parent DB ID ${resolvedParentId}`);
  }

  const subItemResult = await this.client.exec(/*...INSERT with resolvedParentId...*/);
  idMapping[item.id] = Number(subItemResult.lastInsertRowid);
}
```

## 📊 Test Results

**Algorithm Verification**: ✅ PASSED

```
Test Data:
- ID -1: "Main Service Package" (main item)
- ID -2: "Sub-Service 1" (parent: -1)  
- ID -3: "Sub-Service 2" (parent: -1)
- ID -4: "Nested Sub-Service" (parent: -2)

Final ID Mapping:
  -1 → 1  (Main item)
  -2 → 2  (Sub-item, parent_item_id: 1)
  -3 → 3  (Sub-item, parent_item_id: 1)  
  -4 → 4  (Nested sub-item, parent_item_id: 2)
```

**Parent-Child Relationships**: ✅ All correctly resolved

## 🔒 Critical Fix Benefits

### 1. **Prevents FOREIGN KEY Constraint Failures**
- Ensures all parent_item_id references point to valid, existing database IDs
- Eliminates "FOREIGN KEY constraint failed" errors during invoice saving

### 2. **Preserves Sub-Item Relationships**
- Maintains hierarchical structure of invoice line items
- Prevents sub-items from being deleted due to constraint violations

### 3. **Consistent Implementation**
- Same ID mapping pattern already used successfully in `createOffer()` and `updateOffer()`
- Maintains architectural consistency across Invoice and Offer operations

## 📋 Implementation Coverage

**Methods Fixed**:
- ✅ `SQLiteAdapter.createInvoice()` - Lines 801-809
- ✅ `SQLiteAdapter.updateInvoice()` - Lines 860-868

**Methods Already Implemented**:
- ✅ `SQLiteAdapter.createOffer()` - Already had ID mapping
- ✅ `SQLiteAdapter.updateOffer()` - Already had ID mapping

## 🔍 Validation Status

**Code Implementation**: ✅ Complete
**Logic Testing**: ✅ Verified
**Documentation**: ✅ Updated
**Critical Fixes Registry**: 🔄 Ready for update

## 🎯 Resolution Confirmation

The Invoice Foreign Key constraint issue has been **RESOLVED** through:

1. **Systematic ID mapping** of frontend negative IDs to database positive IDs
2. **Proper insertion order** (main items before sub-items)
3. **Parent reference resolution** using the ID mapping table
4. **Consistent error prevention** across all line item operations

**User Impact**: Invoice saving with sub-items now works correctly without data loss or constraint violations.

---

**Date**: 2025-10-10
**Version**: RawaLite v1.0.40
**Status**: ✅ RESOLVED