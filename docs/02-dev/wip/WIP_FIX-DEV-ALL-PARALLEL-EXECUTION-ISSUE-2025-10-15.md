# dev:all Parallel Execution Issue

**Status:** ACTIVE - Not Resolved  
**Created:** 2025-10-02  
**Priority:** Medium  
**Component:** Development Environment  

## Problem Summary

The `dev:all` script appears to start successfully but **Electron application window does not open** correctly, despite database initialization completing successfully.

## Expected Behavior

Historical versions had a working `dev:all` solution that:
- ✅ Opened Vite development server (`http://localhost:5173`)
- ✅ Opened Electron desktop application window with full API access
- ✅ Both processes ran in parallel seamlessly

## Current Behavior

With the current `scripts/dev-starter.cjs` implementation:
- ✅ Vite server starts correctly: `http://localhost:5173/`
- ✅ Electron build process completes successfully
- ✅ Database initializes properly (schema v4, migrations complete)
- ✅ Database queries execute (numbering_circles, offers, invoices, customers)
- ❌ **Desktop application window does not open visibly**

## Technical Context

### Implementation Details
- **Script:** `scripts/dev-starter.cjs` (Node.js cross-platform solution)
- **Command:** `pnpm run dev:all` → `node scripts/dev-starter.cjs`
- **Process Management:** Simplified taskkill cleanup, sequential spawn with 3s delay

### Terminal Output Analysis
```bash
🚀 Starting Vite development server...
🚀 Starting Electron (waiting 3 seconds for Vite)...

VITE v6.3.6  ready in 722 ms
➜  Local:   http://localhost:5173/

📋 Electron build completes:
  dist-electron\preload.js  3.4kb
  dist-electron\main.cjs  64.3kb

🗃️ Database initialization:
[DB] Opening database: C:\Users\ramon\AppData\Roaming\Electron\database\rawalite.db
[Migration] Current schema version: 4 ✅
Application ready with database initialized ✅

📊 Database queries executing successfully:
SELECT * FROM settings WHERE id = 1 (12x)
SELECT * FROM numbering_circles ORDER BY name (12x)
SELECT * FROM offers/invoices/customers/packages ✅
```

### What Works
- Process spawning and management
- Vite development server
- Electron build pipeline
- Database connectivity and migrations
- SQL query execution

### What Doesn't Work
- **Electron desktop window visibility** - the critical missing piece

## Potential Root Causes

1. **Window Management Issue:** Electron window might be created but not focused/visible
2. **Process Lifecycle:** Electron process might exit after database initialization
3. **Display/Graphics:** Window might be off-screen or minimized
4. **Environment Variables:** Missing required environment setup for Electron GUI

## Investigation Needed

1. **Process Status Check:** Verify if Electron process remains alive after "Application ready"
2. **Window Creation Debug:** Add logging to main.ts window creation process
3. **Electron DevTools:** Check if renderer process starts correctly
4. **Historical Comparison:** Analyze what the working dev:all implementation did differently

## Workaround

Current development can continue using separate commands:
```bash
# Terminal 1
pnpm dev

# Terminal 2  
pnpm run electron:dev
```

## Files Involved

- `scripts/dev-starter.cjs` - Main development starter script
- `package.json` - Script definitions
- `electron/main.ts` - Electron main process
- `electron/preload.ts` - Electron preload script

## Next Steps

1. **Debug Electron window creation** in main.ts
2. **Add process monitoring** to detect if Electron exits prematurely
3. **Research historical dev:all implementation** patterns
4. **Test cross-platform compatibility** (Windows PowerShell vs Unix shells)

---

**Note:** This issue blocks the seamless development workflow but does not affect production builds or core application functionality.