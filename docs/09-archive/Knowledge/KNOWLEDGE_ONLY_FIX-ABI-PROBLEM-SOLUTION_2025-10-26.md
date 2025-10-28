# 🛠️ KNOWLEDGE_ONLY: ABI Problem Solution - Historical Build Debug Knowledge
CAVE:  **🤖 KI-AUTO-DETECTION SYSTEM NEEDED. KI HAS TO READ HANDBOOK FIRST**
> **⚠️ KI-USAGE WARNING:** This document is from Knowledge Archive  
> **Status:** KNOWLEDGE_ONLY - Historical build debugging insights  
> **Created:** 26.10.2025 | **Source:** SOLVED_FIX-ABI-PROBLEM-SOLUTION-2025-10-15.md  
> **Debug Validity:** ✅ VERIFIED - ABI version mismatch resolution patterns  
> **Problem:** better-sqlite3 ABI version conflicts between Node.js and Electron

## 📋 **KI-SAFE USAGE RULES**

**✅ SAFE to reference:**
- ABI version mismatch diagnostic patterns
- Native module compilation strategies for Electron
- PowerShell vs Command Prompt environment differences
- electron-rebuild usage patterns

**⚠️ VERIFY BEFORE USE:**
- Current Electron version and corresponding Node.js ABI
- Current better-sqlite3 version and compilation target
- Available rebuild scripts in package.json
- Node.js version in development environment

**🚫 DO NOT USE for:**
- Direct script execution without environment verification
- Assuming specific Node.js/Electron version numbers
- Copy-paste rebuild commands without version check

---

## 🎯 **HISTORICAL DEBUG PROBLEM OVERVIEW**

**Problem Date:** 15.10.2025  
**Problem Type:** Native Module ABI Version Mismatch  
**Impact:** Build failures and runtime crashes with better-sqlite3  

### **Root Cause Pattern:**
```
PowerShell 7 Environment → Node.js v22.18.0 (ABI 127)
Electron v31.7.7        → Node.js internal (ABI 125)
better-sqlite3          → Compiled for ABI 127 (wrong target)
```

### **Error Signature:**
```
Error: The module '...\better-sqlite3\build\Release\better_sqlite3.node'
was compiled against a different Node.js version using
NODE_MODULE_VERSION 127. This version of Node.js requires
NODE_MODULE_VERSION 125.
```

---

## 🔍 **ABI DEBUGGING STRATEGY INSIGHTS**

### **ABI Version Detection Pattern:**
```bash
# Historical Pattern: Environment version checking
node --version                    # Check Node.js version in environment
npx electron --version           # Check Electron version
npm list better-sqlite3           # Check better-sqlite3 version

# Historical Pattern: ABI mapping verification
# Node.js v22.x → ABI 127
# Node.js v20.x → ABI 115
# Electron v31.x uses internal Node.js with ABI 125
```

### **Native Module Compilation Verification:**
```bash
# Historical Pattern: Check compiled module target
file node_modules/better-sqlite3/build/Release/better_sqlite3.node
# Should show target architecture and ABI version

# Historical Pattern: Verify Electron compatibility
npx electron-rebuild --version
npx electron-rebuild --debug
```

### **Environment Difference Detection:**
```powershell
# Historical Pattern: PowerShell 7 vs Command Prompt differences
$PSVersionTable.PSVersion    # PowerShell version
Get-Command node             # Node.js path in PowerShell
```

---

## 🛠️ **RESOLUTION STRATEGY PATTERNS**

### **Electron Rebuild Integration:**
```json
// Historical Pattern: package.json scripts setup
{
  "scripts": {
    "rebuild:electron": "electron-rebuild -f -w better-sqlite3",
    "build:electron": "npm run rebuild:electron && vite build",
    "dev:safe": "npm run rebuild:electron && npm run dev"
  },
  "devDependencies": {
    "electron-rebuild": "^3.2.9"
  }
}
```

### **Automated Rebuild Strategy:**
```bash
# Historical Pattern: Safe build workflow
pnpm add -D electron-rebuild
pnpm rebuild:electron           # Rebuild native modules for Electron
pnpm build                      # Build application
pnpm dist                       # Create distribution
```

### **Alternative Solution Pattern:**
```bash
# Historical Pattern: PowerShell script automation
.\scripts\MAINTAIN_NATIVE_ADDONS_FIX.ps1

# Historical Pattern: Manual rebuild workflow
Remove-Item node_modules/better-sqlite3/build -Recurse -Force
pnpm install better-sqlite3 --force
pnpm rebuild:electron
```

---

## 🔧 **SPECIALIZED BUILD SCRIPTS PATTERNS**

### **BUILD_NATIVE_ELECTRON_REBUILD Script:**
```javascript
// Historical Pattern: Dedicated rebuild script
const rebuild = require('electron-rebuild');

rebuild({
  buildPath: process.cwd(),
  electronVersion: '31.7.7',
  arch: process.arch,
  force: true,
  onlyModules: ['better-sqlite3']
});
```

### **Environment Detection Pattern:**
```typescript
// Historical Pattern: Runtime environment detection
const isElectron = process.versions && process.versions.electron;
const nodeABI = process.versions.modules;

console.log('Environment:', isElectron ? 'Electron' : 'Node.js');
console.log('ABI Version:', nodeABI);
```

### **Version Compatibility Matrix:**
```
Historical Pattern: Electron-Node.js-ABI mapping
Electron v31.x → Node.js ~20.x → ABI 125
Electron v30.x → Node.js ~20.x → ABI 115
Electron v29.x → Node.js ~20.x → ABI 115

Development Node.js v22.x → ABI 127 (mismatch!)
Development Node.js v20.x → ABI 115 (compatible)
```

---

## 📊 **DIAGNOSIS AND PREVENTION PATTERNS**

### **Pre-Build Validation:**
```bash
# Historical Pattern: Build environment validation
npm run validate:environment || {
  echo "Environment validation failed"
  echo "Running electron-rebuild..."
  npm run rebuild:electron
}
```

### **CI/CD Integration Pattern:**
```yaml
# Historical Pattern: GitHub Actions ABI handling
- name: Rebuild native modules for Electron
  run: |
    npm install -g electron-rebuild
    electron-rebuild -f -w better-sqlite3
    
- name: Verify ABI compatibility
  run: |
    node -e "console.log('Node ABI:', process.versions.modules)"
    npx electron -e "console.log('Electron ABI:', process.versions.modules)"
```

### **Runtime Detection Pattern:**
```typescript
// Historical Pattern: ABI mismatch early detection
try {
  const Database = require('better-sqlite3');
  console.log('✅ better-sqlite3 loaded successfully');
} catch (error) {
  if (error.message.includes('NODE_MODULE_VERSION')) {
    console.error('❌ ABI version mismatch detected');
    console.error('Run: npm run rebuild:electron');
  }
  throw error;
}
```

---

## 🔍 **LESSONS LEARNED (Historical Context)**

### **Build Environment Best Practices:**
1. **Always Rebuild**: Run electron-rebuild before distribution builds
2. **Version Awareness**: Track Electron-Node.js-ABI version relationships
3. **Environment Isolation**: Use consistent Node.js versions across development
4. **Automated Validation**: Include ABI checks in build scripts

### **Development Workflow Patterns:**
1. **PowerShell 7 Considerations**: Be aware of Node.js version differences
2. **Native Module Management**: better-sqlite3 requires platform-specific compilation
3. **CI/CD Integration**: Include electron-rebuild in automated build pipelines
4. **Error Recognition**: ABI error signatures are distinctive and actionable

### **Prevention Strategies:**
1. **Version Consistency**: Align development Node.js with Electron's Node.js version
2. **Build Script Integration**: Automate electron-rebuild in development workflow
3. **Documentation**: Clear instructions for build environment setup
4. **Testing**: Verify native modules work in both development and packaged builds

---

## ⚠️ **CURRENT VERIFICATION STATUS**

**✅ VERIFIED (2025-10-26):**
- ✅ electron-rebuild available in package.json devDependencies
- ✅ rebuild:electron script functional
- ✅ BUILD_NATIVE_ELECTRON_REBUILD.cjs script available
- ✅ MAINTAIN_NATIVE_ADDONS_FIX.ps1 PowerShell script available

**📍 SOURCE TRUTH:** For current ABI resolution:
- `package.json` (rebuild scripts)
- `scripts/BUILD_NATIVE_ELECTRON_REBUILD.cjs`
- `scripts/MAINTAIN_NATIVE_ADDONS_FIX.ps1`
- Current Electron version in package.json

---

## 📚 **KNOWLEDGE ARCHIVE METADATA**

**Original Document:** `docs/09-archive/Knowledge/LESSON_FIX/SOLVED_FIX-ABI-PROBLEM-SOLUTION-2025-10-15.md`  
**Archive Date:** 2025-10-26  
**Archive Reason:** Critical build issue pattern preserved for development troubleshooting  
**Verification Scope:** Native module compilation and ABI version management  
**Next Review:** When Electron version or build system changes significantly  

**Cross-References:**
- [KNOWLEDGE_ONLY_IMPL-SQLITE-ADAPTER-COMPLETE](KNOWLEDGE_ONLY_IMPL-SQLITE-ADAPTER-COMPLETE_2025-10-26.md)
- [Build and distribution scripts](../../scripts/)

---

**🧠 KI RECOGNITION:** This document uses `KNOWLEDGE_ONLY_FIX-` prefix for safe historical build debugging reference without current environment assumptions.