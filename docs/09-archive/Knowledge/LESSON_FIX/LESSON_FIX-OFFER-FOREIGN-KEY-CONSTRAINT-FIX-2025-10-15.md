# LESSONS LEARNED: Offer Foreign Key Constraint Fix
+CAVE:  **🤖 KI-AUTO-DETECTION SYSTEM NEEDED. KI HAS TO READ HANDBOOK FIRST**
**Status:** ✅ SOLVED  
**Date:** 2025-10-03  
**Issue:** FOREIGN KEY constraint failed when updating offers with sub-items  
**Solution:** Database schema extension + ID mapping system

## 🚨 Problem Description

### Initial Error
```
FOREIGN KEY constraint failed
```

**Symptom:** When updating offers containing sub-items (items with `parentItemId`), the database would reject the update due to FOREIGN KEY constraint violations.

**Root Cause:** The frontend used negative IDs for new items to avoid conflicts, but the database expected valid positive IDs for `parentItemId` references.

## 🔍 Analysis

### Database Schema Issue
The `offer_line_items` table had a simple structure that couldn't distinguish between:
- Standalone positions
- Individual sub-items (created manually)  
- Package import items (imported from packages)

### ID Mapping Problem
- Frontend: Used negative IDs for new items (e.g., `-1730648729203`)
- Database: Expected positive IDs for parent references
- **Gap:** No mapping system between frontend negative IDs and database positive IDs

## 💡 Solution Architecture

### 1. Database Schema Extension (Migration 011)

**File:** `src/main/db/migrations/011_extend_offer_line_items.ts`

```sql
-- Add item type classification
ALTER TABLE offer_line_items 
ADD COLUMN item_type TEXT NOT NULL DEFAULT 'standalone' 
CHECK (item_type IN ('standalone', 'individual_sub', 'package_import'));

-- Add source package reference
ALTER TABLE offer_line_items 
ADD COLUMN source_package_id INTEGER 
REFERENCES packages(id) ON DELETE SET NULL;

-- Update existing data to use new schema
UPDATE offer_line_items SET 
  item_type = CASE 
    WHEN parent_item_id IS NOT NULL THEN 'individual_sub'
    ELSE 'standalone'
  END;
```

### 2. ID Mapping System

**File:** `src/adapters/SQLiteAdapter.ts`

**Key Pattern:**
```typescript
// Create ID mapping from frontend negative IDs to database positive IDs
const idMapping: Record<number, number> = {};

// Insert parent items first, build mapping
for (const item of parentItems) {
  const result = db.prepare(`INSERT INTO offer_line_items (...) VALUES (...)`).run(...);
  if (item.id < 0) {
    idMapping[item.id] = result.lastInsertRowid as number;
  }
}

// Insert sub-items with mapped parent IDs
for (const subItem of subItems) {
  const mappedParentId = subItem.parentItemId < 0 
    ? idMapping[subItem.parentItemId] 
    : subItem.parentItemId;
    
  db.prepare(`INSERT INTO offer_line_items (..., parent_item_id) VALUES (..., ?)`).run(..., mappedParentId);
}
```

### 3. Frontend Structure Cleanup

**File:** `src/components/OfferForm.tsx`

**Implemented:**
- ✅ Removed redundant "Eigenständige Position" dropdown
- ✅ Removed duplicate purple "Neue eigenständige Position" button  
- ✅ Fixed parent-child display hierarchy
- ✅ Proper parent-first, sub-items-grouped rendering

**UI Structure:**
```tsx
{lineItems
  .filter(item => !item.parentItemId) // Parent items first
  .map(parentItem => (
    <React.Fragment key={`parent-${parentItem.id}`}>
      {/* Parent Item */}
      <div style={{...parentStyles}}>
        {/* Parent fields + Sub button */}
      </div>
      
      {/* Sub-Items grouped under parent */}
      {lineItems
        .filter(item => item.parentItemId === parentItem.id)
        .map(subItem => (
          <div style={{...subItemStyles, marginLeft: "24px"}}>
            {/* Sub-item fields */}
          </div>
        ))}
    </React.Fragment>
  ))}
```

## 🎯 Item Type System

### Three Item Types

1. **`standalone`** - Independent positions
2. **`individual_sub`** - Manually created sub-items  
3. **`package_import`** - Items imported from packages

### Type Usage
```typescript
// New standalone item
const newItem: OfferLineItem = {
  id: -(Date.now()),
  itemType: 'standalone',
  parentItemId: undefined,
  sourcePackageId: undefined
};

// New individual sub-item
const subItem: OfferLineItem = {
  id: -(Date.now()),
  itemType: 'individual_sub', 
  parentItemId: parentId,
  sourcePackageId: undefined
};

// Package import items
const importedItems = pkg.lineItems.map(item => ({
  ...item,
  itemType: 'package_import',
  sourcePackageId: pkg.id
}));
```

## ✅ Validation

### Migration Success
```bash
pnpm typecheck                     # ✅ No TypeScript errors
Database migration 010 → 011       # ✅ Schema updated  
Existing data preserved            # ✅ No data loss
FOREIGN KEY constraints working    # ✅ Updates successful
```

### User Confirmation
> **User:** "Scheint zu funktionieren!" ✅

## 🔧 Technical Implementation

### Database Layer
- **Migration 011** successfully applied
- **Backward compatibility** maintained
- **Data integrity** preserved during migration

### Application Layer  
- **ID mapping** resolves frontend↔database ID conflicts
- **Type safety** with TypeScript interfaces
- **Error handling** for constraint violations

### UI Layer
- **Parent-child hierarchy** clearly displayed
- **Visual distinction** between parent and sub-items
- **Logical button placement** (Sub button only on parents)

## 📝 Code Quality

### Before (Problematic)
```typescript
// ❌ Direct database insert without ID mapping
await db.prepare(`INSERT INTO offer_line_items (..., parent_item_id) VALUES (..., ?)`).run(..., item.parentItemId);
// Would fail with negative parentItemId
```

### After (Solution)
```typescript
// ✅ ID mapping system
const mappedParentId = item.parentItemId && item.parentItemId < 0 
  ? idMapping[item.parentItemId] 
  : item.parentItemId;

await db.prepare(`INSERT INTO offer_line_items (..., parent_item_id) VALUES (..., ?)`).run(..., mappedParentId);
```

## 🎯 Key Success Factors

1. **Comprehensive Migration:** Extended schema without breaking existing data
2. **ID Mapping System:** Bridged frontend negative IDs ↔ database positive IDs  
3. **Type Classification:** Clear distinction between item types
4. **UI Cleanup:** Removed confusing redundant elements
5. **Testing:** Validated with real data and user confirmation

## 🔄 Reusable Pattern

This ID mapping pattern can be applied to other parent-child relationships:
- Customer ↔ Projects  
- Package ↔ Package Line Items
- Invoice ↔ Invoice Line Items

### Generic ID Mapping Template
```typescript
// 1. Separate parent and child items
const parentItems = items.filter(item => !item.parentId);
const childItems = items.filter(item => item.parentId);

// 2. Create mapping
const idMapping: Record<number, number> = {};

// 3. Insert parents, build mapping
for (const parent of parentItems) {
  const result = await insertParent(parent);
  if (parent.id < 0) {
    idMapping[parent.id] = result.insertId;
  }
}

// 4. Insert children with mapped IDs
for (const child of childItems) {
  const mappedParentId = child.parentId < 0 
    ? idMapping[child.parentId] 
    : child.parentId;
  await insertChild({...child, parentId: mappedParentId});
}
```

## 📊 Impact

- ✅ **FOREIGN KEY constraint errors eliminated**
- ✅ **Offer updates with sub-items working**  
- ✅ **UI hierarchy properly displayed**
- ✅ **No regression in existing functionality**
- ✅ **Foundation for future parent-child features**

---

**Next Steps:** Monitor for any edge cases in production usage.