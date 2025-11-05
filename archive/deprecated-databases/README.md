# Deprecated Database Files - Archive

> **Erstellt:** 22.10.2025 | **Zweck:** Database Consolidation Cleanup  
> **Status:** Archived obsolete database files  

## Database File Consolidation (22.10.2025)

### ✅ AUTHORITATIVE DATABASE (Production)
- **Location:** `C:\Users\ramon\AppData\Roaming\Electron\database\rawalite.db`
- **Size:** 5.2MB
- **Last Modified:** 22.10.2025 09:57
- **Status:** **ACTIVE** - Used by RawaLite v1.0.50
- **Purpose:** Production database with current data and schema

### 📦 ARCHIVED OBSOLETE DATABASES

#### `rawalite-legacy-2025-10-21.db`
- **Original Path:** `C:\Users\ramon\AppData\Roaming\rawalite\database\rawalite.db`
- **Size:** 1.2MB
- **Last Modified:** 21.10.2025 19:16
- **Reason:** Legacy location - app switched to Electron AppData path
- **Migration Date:** 22.10.2025

#### `rawalite-data-2025-09-29.db`
- **Original Path:** `C:\Users\ramon\AppData\Roaming\Electron\data\rawalite.db`
- **Size:** 139KB (Small - likely test/development data)
- **Last Modified:** 29.09.2025 07:10
- **Reason:** Old development/test database
- **Migration Date:** 22.10.2025

## Consolidation Context

**Problem:** Multiple database files caused confusion during debugging session  
**Solution:** Established single authoritative source  
**Verification:** App confirmed using Electron/database path via log analysis  

### Files Status After Consolidation
- ✅ **Production:** Single authoritative database at Electron/database/rawalite.db
- ✅ **Legacy Data:** Safely archived with date stamps for recovery if needed
- ✅ **Cleanup:** No orphaned or duplicate database files

**Notes:**
- Archive files preserved for potential data recovery
- Original paths now clear for clean app operation
- Database consolidation completed as part of Navigation Header Heights fix session