# PDF Field Mapping Fix - RawaLite
+> **🤖 KI-AUTO-DETECTION SYSTEM:**
> - **AKTUELLER STATUS:** KNOWLEDGE_ONLY
> - **TEMPLATE-QUELLE:** 06-handbook/TEMPLATE/VALIDATED_TEMPLATE-LESSONS-LEARNED_2025-10-26.md
> - **AUTO-UPDATE:** Bei ähnlichen Problemen als Referenz nutzen
> - **STATUS-KEYWORDS:** Erkannt durch LESSON_FIX, Knowledge Base, Historical Reference
## Problem Summary
PDF generation showing "undefined" values for offer titles and "Invalid Date" for validUntil fields.

## Root Cause Analysis
**Field-Mapping Inconsistency between Database and PDF Template:**

### Problem 1: "Angebot undefined"
- **Database**: `offer_number` (snake_case)
- **Template**: `entity.offerNumber` (camelCase)
- **Issue**: Missing transformation from database format to JavaScript format

### Problem 2: "Gültig bis: Invalid Date"
- **Database**: `valid_until` (snake_case)  
- **Template**: `entity.validUntil` (camelCase)
- **Issue**: Missing transformation from database format to JavaScript format

## Solution Implemented

### 1. Field Mapping Transformation in PDF Handler
**Location**: `electron/main.ts` - PDF generation handler

```typescript
// 2. ✅ FIELD-MAPPING: Transform database snake_case to camelCase for template
console.log('🔄 [PDF GENERATION] Applying field mapping transformation...');
const preprocessedData = { ...options.data };

// Import the field mapper from the correct location
const { mapFromSQL } = await import('../src/lib/field-mapper');

// Transform the main entity (offer/invoice/timesheet) from database format to JS format
if (preprocessedData[options.templateType]) {
  const originalEntity = preprocessedData[options.templateType];
  
  // Apply field mapping transformation
  const mappedEntity = mapFromSQL(originalEntity);
  
  preprocessedData[options.templateType] = mappedEntity;
}
```

### 2. Debugging Integration
Added comprehensive debugging logs to trace field transformations:

```typescript
if (options.templateType === 'offer') {
  console.log('🔍 [FIELD-MAPPING] Offer field transformation:');
  console.log('  - offer_number →', mappedEntity.offerNumber, '(was:', originalEntity.offer_number, ')');
  console.log('  - valid_until →', mappedEntity.validUntil, '(was:', originalEntity.valid_until, ')');
  console.log('  - title →', mappedEntity.title, '(unchanged)');
}
```

### 3. Processing Order
1. **Field Mapping**: Transform database fields to JavaScript camelCase
2. **Attachment Pre-processing**: Compress images with Sharp
3. **Template Generation**: Use transformed fields in HTML template

## Technical Details

### Field Mappings Used
- `offer_number` → `offerNumber`
- `valid_until` → `validUntil`
- `customer_id` → `customerId`
- `created_at` → `createdAt`
- `updated_at` → `updatedAt`

### Components Modified
- **electron/main.ts**: PDF generation handler with field mapping
- **src/lib/field-mapper.ts**: Existing field mapping infrastructure (used)

## Testing
- ✅ Build successful
- ✅ Field mapping transformation added
- ✅ Debugging logs integrated
- 🔄 Ready for user testing with actual offer PDF generation

## Expected Results
- **Before**: "Angebot undefined" 
- **After**: "Angebot AN-2025-0001" (with correct offer number)
- **Before**: "Gültig bis: Invalid Date"
- **After**: "Gültig bis: 12.11.2025" (with correct formatted date)

## Status
✅ **IMPLEMENTED** - Ready for testing with actual offer PDF generation