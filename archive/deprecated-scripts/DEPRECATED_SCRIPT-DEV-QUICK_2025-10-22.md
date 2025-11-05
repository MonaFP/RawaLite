# DEPRECATED: dev:quick Script

> **Erstellt:** 22.10.2025 | **Status:** DEPRECATED - USE `pnpm dev:all` INSTEAD  
> **Schema:** `DEPRECATED_SCRIPT-DEV-QUICK_2025-10-22.md`

## 🚫 **DEPRECATION NOTICE**

**This script has been identified as problematic and DEPRECATED.**

### **Original Script:**
```json
"dev:quick": "pnpm run build:main && pnpm run build:preload && electron dist-electron/main.cjs"
```

### **Problems Identified:**
1. **ABI Issues:** Bypassed proper Vite dev server causing connection failures
2. **Missing Hot Reload:** No live reload functionality during development  
3. **Documentation Inconsistency:** RawaLite standards define `dev:all` as primary dev command
4. **Session Confusion:** KI used this instead of established `dev:all` command

### **Correct Replacement:**
```bash
# ✅ CORRECT: Use established dev:all command
pnpm dev:all

# This runs: pnpm run predev:electron && node scripts/DEV_GLOBAL_ENVIRONMENT_START.cjs
```

### **Why dev:all is Superior:**
- ✅ Full Vite dev server with hot reload
- ✅ Proper ABI compilation before start
- ✅ Comprehensive environment setup
- ✅ Consistent with RawaLite development standards
- ✅ Documented in all guides as primary development command

### **Deprecation Actions Taken:**
1. **Removed from package.json** (22.10.2025)
2. **Updated documentation** to reference only `dev:all`
3. **Archived script definition** in this file
4. **KI instructions updated** to prevent future usage

### **Migration Path:**
```bash
# Old (DEPRECATED):
pnpm dev:quick

# New (CORRECT):
pnpm dev:all
```

---

**📍 Location:** `/archive/deprecated-scripts/DEPRECATED_SCRIPT-DEV-QUICK_2025-10-22.md`  
**Purpose:** Document deprecation of problematic dev:quick script  
**Action Required:** Always use `pnpm dev:all` for development

*Deprecated on: 2025-10-22 - Replaced with established dev:all workflow*