# Technical Summary: Image Upload System Implementation
CAVE:  **🤖 KI-AUTO-DETECTION SYSTEM NEEDED. KI HAS TO READ HANDBOOK FIRST**
## Quick Reference

### Feature Status: ✅ COMPLETE
- **Database Schema**: Migration 016 implemented
- **Frontend**: OfferForm.tsx with database-only upload
- **Backend**: Field mapping and PDF integration  
- **PDF Output**: 60x45px thumbnails under positions

### Key Files Modified
```
src/main/db/migrations/016_add_offer_attachments.ts    # Database schema
src/components/offer/OfferForm.tsx                     # Upload UI
src/pages/AngebotePage.tsx                            # Load attachments for PDF
src/main/db/field-mapper.ts                          # Field mappings
electron/main.ts                                      # PDF template with images
```

### Database Schema
```sql
CREATE TABLE offer_attachments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  offer_id INTEGER NOT NULL,
  line_item_id INTEGER NOT NULL,
  original_filename TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  base64_data TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (offer_id) REFERENCES offers(id) ON DELETE CASCADE,
  FOREIGN KEY (line_item_id) REFERENCES offer_line_items(id) ON DELETE CASCADE
);
```

### Critical Technical Points

#### 1. Field Mapping (REQUIRED)
```typescript
// Mapping snake_case (DB) ↔ camelCase (JS)
const OfferAttachmentFieldMap = {
  originalFilename: 'original_filename',  // ← Critical
  fileType: 'file_type',                 // ← Critical  
  fileSize: 'file_size',
  base64Data: 'base64_data'              // ← Critical
};
```

#### 2. PDF Data-URL Generation
```typescript
// Direct Base64 to Data-URL (NO temp files)
let dataUrl = attachment.base64Data;
if (!dataUrl.startsWith('data:')) {
  const mimeType = attachment.fileType || 'image/png';
  dataUrl = `data:${mimeType};base64,${dataUrl}`;
}
```

#### 3. Attachment Loading for PDF
```typescript
// Must load attachments from DB for PDF generation
const loadOfferWithAttachments = async (offerId: number) => {
  // 1. Load offer, 2. Load line items, 3. Load attachments with field mapping
  lineItem.attachments = (attachmentRows || []).map((attachment: any) => ({
    originalFilename: attachment.original_filename,  // ← Field mapping
    fileType: attachment.file_type,
    base64Data: attachment.base64_data
  }));
};
```

### UI Integration
- **Upload**: Drag & drop or file select in OfferForm
- **Display**: Thumbnail previews with delete option
- **PDF**: Automatic inclusion in all generated PDFs

### Performance Notes
- **Size Limit**: >2MB images show placeholder in PDF
- **Storage**: Base64 in SQLite (no external files)
- **PDF Size**: 60x45px thumbnails for optimal performance

### Debugging Commands
```typescript
// Check attachment loading
console.log('📎 Line Item ${lineItem.id}: Found ${lineItem.attachments.length} attachments');

// Check PDF template processing  
console.log('🖼️ [PDF TEMPLATE] Using data URL directly for:', attachment.originalFilename);
```

---
**Implementation Date**: October 6, 2025  
**Status**: Production Ready
**Version**: 1.0.13+
