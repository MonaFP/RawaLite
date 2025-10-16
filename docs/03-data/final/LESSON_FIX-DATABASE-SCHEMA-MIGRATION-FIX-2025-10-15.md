# Lessons Learned – Database Schema Migration Issues Fix

**Datum:** 2. Oktober 2025  
**Version:** v1.0.1  
**GitHub Release:** https://github.com/MonaFP/RawaLite/releases/tag/v1.0.1

## 🎯 **Problem-Zusammenfassung**

### **Original Issues:**
1. **"SqliteError: table packages has no column named internal_title"** - Critical Schema Mismatch
2. **"NOT NULL constraint failed: packages.internal_title"** - Field-Mapper Problem  
3. **Missing Line Items Tables** - Incomplete database structure
4. **Update Button Failures** - EinstellungenPage Updates-Tab non-functional

### **Root Cause Analysis:**
- **Database Schema Drift**: Code modernized, migrations never executed
- **Field-Mapper Gaps**: Missing Package-specific camelCase ↔ snake_case mappings
- **Incomplete Migration System**: Critical tables and columns missing

## 🔧 **Solution Implementation**

### **1. Migration 007 - Packages & Invoices Schema Fix**
```typescript
// src/main/db/migrations/007_fix_packages_invoice_schema.ts
- Packages: name → internal_title, added parent_package_id, total, add_vat
- Invoices: number/total_amount → invoice_number/subtotal/vat_rate/vat_amount/total  
- Created: package_line_items, invoice_line_items tables
- Data Migration: Existing data automatically converted
```

### **2. Migration 008 - Offers Schema Fix**
```typescript
// src/main/db/migrations/008_fix_offers_schema.ts
- Offers: number/total_amount → offer_number/subtotal/vat_rate/vat_amount/total
- Created: offer_line_items table
- Full modernization to match code expectations
```

### **3. Field-Mapper Critical Fix**
```typescript
// src/lib/field-mapper.ts - Added Missing Mappings:
'internalTitle': 'internal_title',      // 🚨 This was the NULL cause!
'parentPackageId': 'parent_package_id',
'addVat': 'add_vat',
```

**Before Fix:**
```sql
INSERT INTO packages (internal_title, ...) VALUES (NULL, ...)  -- ❌
```

**After Fix:**
```sql
INSERT INTO packages (internal_title, ...) VALUES ('Package Name', ...)  -- ✅
```

## ✅ **Verification Results**

### **Database Schema Status:**
- **Schema Version**: 8 (up from 6)
- **Packages Table**: ✅ internal_title, parent_package_id, total, add_vat
- **Invoices Table**: ✅ invoice_number, subtotal, vat_rate, vat_amount, total  
- **Offers Table**: ✅ offer_number, subtotal, vat_rate, vat_amount, total
- **Line Items**: ✅ All tables (package_line_items, invoice_line_items, offer_line_items)

### **Functional Testing:**
- ✅ Package Creation: No more NOT NULL errors
- ✅ Invoice Management: Modern schema working
- ✅ Offer Management: Modern schema working  
- ✅ Update Button: EinstellungenPage fully functional
- ✅ Field Mappings: 100% consistency across all entities

## 📊 **Technical Details**

### **Migration Flow:**
```
Schema v6 → Migration 007 → Schema v7 → Migration 008 → Schema v8
```

### **Backup Strategy:**
- Automatic cold backups before each migration
- Located: `%APPDATA%\Electron\database\backups\`
- Format: `pre-migration-YYYY-MM-DDTHH-mm-ss-sssZ.sqlite`

### **Critical Code Changes:**
1. **SQLiteAdapter.ts**: Updated queries for new schema structure
2. **Field-Mapper.ts**: Added complete Package field mappings  
3. **Migration System**: Robust transaction-based migrations with rollback
4. **Update Components**: Direct IPC calls replacing complex hook dependencies

## 🎯 **Key Learnings**

### **1. Schema Consistency is Critical**
- **Never** assume database schema matches code expectations
- **Always** validate Field-Mapper mappings for new entities
- **Regularly** audit schema vs code alignment

### **2. Migration System Best Practices**
- Cold backups before every migration
- Transaction-based atomic operations
- Data migration for existing records
- Comprehensive logging for production debugging

### **3. Field-Mapper Pattern**
- Central source of truth for camelCase ↔ snake_case mappings
- Must be updated when adding new entity fields
- Critical for preventing NULL constraint errors

### **4. Debugging Production Issues**
- Terminal SQL logs provide exact error reproduction
- Field-Mapper gaps cause subtle but critical failures
- Migration testing in development prevents production issues

## 🚀 **Production Readiness**

### **Release Status: ✅ READY**
- **Version**: v1.0.1
- **Schema**: Fully consistent and modern
- **Functionality**: All business operations working
- **Stability**: No known migration issues remaining

### **Deployment Notes:**
- Migrations run automatically on first startup
- Existing user data preserved and converted
- No manual intervention required
- Rollback possible via backup files

---

**Next Steps**: Regular schema audits, automated migration testing, Field-Mapper validation tools

**Related Documentation**: 
- [Migration System Architecture](../01-architecture/troubleshooting/active/SQLITE-MIGRATION-ARCHITECTURE.md)
- [Database Schema Documentation](../04-database/solved/SQLITE-DATABASE-SYSTEM.md)
- [Update Button Fix](../00-standards/debugging/solved/LESSONS-LEARNED-update-button-fix.md)