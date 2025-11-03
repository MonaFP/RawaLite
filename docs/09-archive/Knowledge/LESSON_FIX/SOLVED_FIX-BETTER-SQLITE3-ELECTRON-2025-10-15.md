# better-sqlite3 Electron ABI Fix Implementation
+> **🤖 KI-AUTO-DETECTION SYSTEM:**
> - **AKTUELLER STATUS:** KNOWLEDGE_ONLY
> - **TEMPLATE-QUELLE:** 06-handbook/TEMPLATE/VALIDATED_TEMPLATE-LESSONS-LEARNED_2025-10-26.md
> - **AUTO-UPDATE:** Bei ähnlichen Problemen als Referenz nutzen
> - **STATUS-KEYWORDS:** Erkannt durch LESSON_FIX, Knowledge Base, Historical Reference
## 🎯 Problem Solved
Fixed Node.js MODULE_VERSION 127 vs Electron ABI 125 compilation conflicts that prevented proper database access for status dropdown debugging.

## 📋 Solution Overview

### 1. Core Fix: scripts/rebuild-native-electron.cjs
- **Purpose**: Automatically rebuilds better-sqlite3 for correct Electron ABI 125
- **Trigger**: Runs on postinstall and predev:electron hooks
- **Method**: Uses electron-rebuild with proper environment variables
- **Fallback**: Direct node-gyp rebuild if electron-rebuild fails

### 2. Package.json Script Integration
```json
{
  "scripts": {
    "postinstall": "node scripts/rebuild-native-electron.cjs",
    "predev:electron": "node scripts/rebuild-native-electron.cjs"
  }
}
```

### 3. Manual Fallback Tool: scripts/fix-native-addons.ps1
- **Purpose**: PowerShell script for manual native module rebuilding
- **Usage**: `.\scripts\fix-native-addons.ps1`
- **Features**: Clean build artifacts, multiple rebuild methods, verification

### 4. Alternative Database Access: db/inspect-sqljs.mjs
- **Purpose**: Read-only database inspection when better-sqlite3 fails
- **Usage**: `node db/inspect-sqljs.mjs [optional-db-path]`
- **Features**: Table listing, row counts, schema info, status distribution analysis

## ✅ Verification Results

### Installation Test
```
pnpm install
✅ postinstall hook executed
✅ better-sqlite3 rebuilt for Electron ABI 125
✅ No compilation errors
```

### Development Test
```
pnpm dev:all
✅ predev:electron hook executed
✅ better-sqlite3 verified for Electron
✅ Development environment ready
```

## 🔧 Implementation Details

### Environment Variables Set During Rebuild
- `npm_config_target`: Electron version (31.7.7)
- `npm_config_runtime`: "electron"
- `npm_config_arch`: "x64"
- `npm_config_disturl`: "https://electronjs.org/headers"
- `npm_config_build_from_source`: "true"

### Build Verification Checks
1. Native module file exists: `node_modules/better-sqlite3/build/Release/better_sqlite3.node`
2. Electron version detection from package.json
3. Clean build artifacts before rebuild
4. Multiple rebuild strategies with fallbacks

### Error Handling
- Graceful fallback from electron-rebuild to node-gyp
- Environment variable cleanup
- Detailed error logging and troubleshooting hints
- Alternative SQL.js tool for emergency database access

## 📖 Usage Instructions

### Automatic (Recommended)
- **Installation**: `pnpm install` (postinstall hook)
- **Development**: `pnpm dev:all` (predev:electron hook)

### Manual Rebuild
```powershell
.\scripts\fix-native-addons.ps1
```

### Database Inspection (when better-sqlite3 fails)
```bash
node db/inspect-sqljs.mjs
# or with specific database path
node db/inspect-sqljs.mjs /path/to/database.db
```

## 🎯 Next Steps

With better-sqlite3 properly compiled for Electron, we can now:

1. **Resume Status Dropdown Debugging**: Access database with proper schema
2. **Test Database Operations**: Verify offers/invoices data loading
3. **Debug React Hooks**: Investigate why useOffers/useInvoices return empty arrays
4. **Validate SQL Queries**: Test actual database content vs UI display

## 📝 Files Created/Modified

### New Files
- `scripts/rebuild-native-electron.cjs` - Core rebuild script
- `scripts/fix-native-addons.ps1` - Manual PowerShell tool
- `db/inspect-sqljs.mjs` - Alternative database access

### Modified Files
- `package.json` - Added postinstall and predev:electron scripts

### Existing Files (Already Correct)
- `.npmrc` - Electron target configuration (target=31.7.7)

## 🔍 Technical Notes

This fix ensures better-sqlite3 is always compiled against Electron's V8 engine (ABI 125) instead of the system Node.js (MODULE_VERSION 127). This resolves the fundamental incompatibility that prevented database access and blocked the status dropdown debugging process.

The implementation is robust with multiple fallback strategies and doesn't interfere with existing build processes or CI/CD pipelines.