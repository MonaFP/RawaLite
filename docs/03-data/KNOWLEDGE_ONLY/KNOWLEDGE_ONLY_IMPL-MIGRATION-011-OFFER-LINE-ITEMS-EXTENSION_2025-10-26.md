# Database Migration 011: Offer Line Items Extension
**Version:** 010 → 011  
**Date:** 2025-10-03  
**Purpose:** Extend offer_line_items table to support dual sub-item system  
**Status:** ✅ DEPLOYED

## Overview

This migration extends the `offer_line_items` table to support three distinct item types and resolves FOREIGN KEY constraint issues when updating offers with sub-items.

## Schema Changes

### New Columns

1. **`item_type`** 
   - Type: `TEXT NOT NULL DEFAULT 'standalone'`
   - Constraint: `CHECK (item_type IN ('standalone', 'individual_sub', 'package_import'))`
   - Purpose: Classify item origin and behavior

2. **`source_package_id`**
   - Type: `INTEGER`  
   - Constraint: `REFERENCES packages(id) ON DELETE SET NULL`
   - Purpose: Track which package imported items came from

### Migration SQL

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

-- Update schema version
PRAGMA user_version = 11;
```

## Item Type System

### Type Definitions

| Type | Description | Parent Allowed | Source Package |
|------|-------------|----------------|----------------|
| `standalone` | Independent top-level positions | No | `NULL` |
| `individual_sub` | Manually created sub-items | Yes | `NULL` |  
| `package_import` | Items imported from packages | Yes | Package ID |

### Usage Examples

```typescript
// Standalone item
{
  itemType: 'standalone',
  parentItemId: undefined,
  sourcePackageId: undefined
}

// Individual sub-item
{
  itemType: 'individual_sub',
  parentItemId: 123,
  sourcePackageId: undefined
}

// Package import item  
{
  itemType: 'package_import',
  parentItemId: 124, // If sub-item from package
  sourcePackageId: 5  // Reference to packages.id
}
```

## Data Migration

### Existing Data Handling

All existing `offer_line_items` records are automatically classified:
- Items with `parent_item_id IS NOT NULL` → `'individual_sub'`
- Items with `parent_item_id IS NULL` → `'standalone'`

### Backward Compatibility

- Existing queries continue to work
- `parent_item_id` column remains unchanged
- No data loss during migration

## Impact on Application

### SQLiteAdapter Changes

The adapter now maps item types correctly:

```typescript
// Query with new columns
const lineItems = db.prepare(`
  SELECT id, title, description, quantity, 
         unit_price as unit_price, total,
         parent_item_id as parent_item_id, 
         item_type as itemType, 
         source_package_id as sourcePackageId 
  FROM offer_line_items 
  WHERE offer_id = ? 
  ORDER BY id
`).all(offerId);

// Insert with new columns
db.prepare(`
  INSERT INTO offer_line_items 
  (offer_id, title, description, quantity, unit_price, total, 
   parent_item_id, item_type, source_package_id) 
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
`).run(
  offerId, item.title, item.description, item.quantity, 
  item.unitPrice, item.total, mappedParentId, 
  item.itemType, item.sourcePackageId
);
```

### Frontend Integration

OfferForm.tsx now uses the type system:

```typescript
// Create standalone item
const newItem: OfferLineItem = {
  itemType: 'standalone',
  parentItemId: undefined,
  sourcePackageId: undefined
};

// Create sub-item
const subItem: OfferLineItem = {
  itemType: 'individual_sub',
  parentItemId: parentId,
  sourcePackageId: undefined  
};

// Import from package
const importItems = packageItems.map(item => ({
  ...item,
  itemType: 'package_import',
  sourcePackageId: packageId
}));
```

## Validation

### Migration Verification

```sql
-- Check schema version
PRAGMA user_version;
-- Should return: 11

-- Verify new columns exist
PRAGMA table_info(offer_line_items);
-- Should show: item_type, source_package_id

-- Check constraint
SELECT sql FROM sqlite_master WHERE name = 'offer_line_items';
-- Should include: CHECK (item_type IN (...))

-- Verify data migration
SELECT item_type, COUNT(*) FROM offer_line_items GROUP BY item_type;
-- Should show: standalone/individual_sub counts
```

### Application Testing

- ✅ Existing offers load correctly
- ✅ New items can be created with all types
- ✅ Sub-items work without FOREIGN KEY errors  
- ✅ Package imports work correctly
- ✅ Updates and deletes function properly

## Performance Impact

### Query Performance
- Minimal impact: 2 new columns with efficient types
- Indexes not required for small datasets (typical offer sizes)
- JOIN to packages table only when needed

### Storage Impact
- `item_type`: ~10-15 bytes per row (TEXT)
- `source_package_id`: 8 bytes per row (INTEGER)
- Total: ~20 bytes per offer line item

## Error Handling

### Migration Errors
```typescript
// Migration rollback not implemented - schema changes are additive
// If migration fails, manual intervention required

// Validation after migration
if (getCurrentSchemaVersion() !== 11) {
  throw new Error('Migration 011 failed: Schema version mismatch');
}
```

### Runtime Errors
```typescript
// Invalid item_type
INSERT INTO offer_line_items (..., item_type) VALUES (..., 'invalid');
// Result: CHECK constraint failed: item_type

// Invalid source_package_id  
INSERT INTO offer_line_items (..., source_package_id) VALUES (..., 999);
// Result: FOREIGN KEY constraint failed (if package doesn't exist)
```

## Future Enhancements

### Potential Extensions
1. **Package versioning**: Track which version of package was imported
2. **Item templates**: Create reusable item templates  
3. **Bulk operations**: Import/export item collections
4. **Audit trail**: Track who created/modified items

### Schema Evolution
```sql
-- Future migration example (012)
ALTER TABLE offer_line_items ADD COLUMN created_by INTEGER;
ALTER TABLE offer_line_items ADD COLUMN modified_at DATETIME;
```

## Rollback Plan

**Note:** This migration is additive and backward-compatible. Rollback is not typically needed.

If rollback is required:
1. Export all offer data
2. Restore database from pre-migration backup  
3. Re-import data (item_type/source_package_id will be lost)

## Documentation Updates

- [x] Migration file created: `011_extend_offer_line_items.ts`
- [x] Adapter updated: `SQLiteAdapter.ts`  
- [x] Frontend updated: `OfferForm.tsx`
- [x] Types updated: `src/persistence/adapter.ts`
- [x] Lessons learned documented

---

**Migration Status:** ✅ Successfully deployed and validated