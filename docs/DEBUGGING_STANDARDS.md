# 🔬 RawaLite - Standard Debugging Patterns

## ✨ **Lesson Learned: Extended Debug First Approach**

**Nach erfolgreicher PDF-Template-Engine-Reparatur etabliert: IMMER umfassende Debug-Ausgabe implementieren BEVOR Problem-Diagnose.**

## 🎯 **Debug-First Pattern (Standard für alle zukünftigen Arbeiten)**

### **1. Template Engine Debugging**
```typescript
// ✅ ALWAYS: Comprehensive debug output for template processing
console.log('🔄 Processing conditionals and loops first...');
template = template.replace(/\{\{#if\s+([^}]+)\}\}(.*?)\{\{\/if\}\}/gs, (match, condition, content) => {
  const value = getNestedValue(data, condition.trim());
  const result = value ? content : '';
  console.log(`🔄 Conditional {{#if ${condition.trim()}}}: value=${!!value}, showing=${!!result}`);
  return result;
});

// ✅ ALWAYS: Step-by-step variable resolution
template = template.replace(/\{\{([^}]+)\}\}/g, (match, variable) => {
  // ... path resolution ...
  console.log(`✅ Replaced {{${variable.trim()}}} = "${result}"`);
  return result;
});
```

### **2. Data Structure Analysis**
```typescript
// ✅ ALWAYS: Log complete data structure before processing
console.log('📊 Template Data Structure:');
console.log('  - Offer exists:', !!templateData.offer);
console.log('  - Customer exists:', !!templateData.customer);
if (templateData.offer) {
  console.log('  - Offer Number:', templateData.offer.offerNumber);
  console.log('  - Line Items Count:', templateData.offer.lineItems?.length || 0);
}

// ✅ ALWAYS: Test critical template variables
console.log('🧪 TEMPLATE VARIABLE RESOLUTION TEST:');
const testVars = ['offer.offerNumber', 'customer.name', 'company.name'];
testVars.forEach(varPath => {
  const value = getNestedValue(templateData, varPath);
  console.log(`  {{${varPath}}} = ${value !== undefined ? `"${value}"` : 'UNDEFINED'}`);
});
```

### **3. Formatter Function Debugging**
```typescript
// ✅ ALWAYS: Log formatter inputs and outputs
template = template.replace(/\{\{formatDate\s+([^}]+)\}\}/g, (match, dateVar) => {
  const dateValue = getNestedValue(data, dateVar.trim());
  console.log(`📅 Formatting date: ${dateVar.trim()} = ${dateValue}`);
  if (dateValue) {
    const formatted = new Date(dateValue).toLocaleDateString('de-DE');
    console.log(`✅ Date formatted: ${dateValue} → ${formatted}`);
    return formatted;
  }
  console.log(`⚠️ Empty date value for: ${dateVar.trim()}`);
  return '';
});
```

## 🚀 **Why This Approach Saves Time**

### **Previous Approach (Inefficient):**
1. Implement change → Test → Problem → Guess cause → Implement fix → Test → Still broken → Repeat
2. **Result**: 5-10 cycles, 30+ minutes debugging

### **Extended Debug Approach (Efficient):**
1. Implement comprehensive debug first → Test → **Immediate problem identification** → Targeted fix → Success
2. **Result**: 1-2 cycles, 5-10 minutes debugging

## 📋 **Standard Debug Template für alle Features**

```typescript
// 🔬 COMPREHENSIVE DEBUG PATTERN
async function debugAnyFeature(data: any) {
  console.log('🚀 === FEATURE DEBUG START ===');
  
  // Step 1: Data Structure Analysis
  console.log('📊 Input Data Analysis:');
  console.log('  - Data exists:', !!data);
  if (data) {
    console.log('  - Data keys:', Object.keys(data));
    // Log specific critical properties
  }
  
  // Step 2: Process Step Logging
  console.log('🔄 Processing Steps:');
  // Each transformation with before/after logging
  
  // Step 3: Variable Resolution Testing
  console.log('🧪 Critical Variable Test:');
  // Test specific values that must work
  
  // Step 4: Output Validation
  console.log('✅ Output Validation:');
  // Verify expected results
  
  console.log('🏁 === FEATURE DEBUG END ===');
}
```

## 🎯 **Anwendung für RawaLite Features**

### **PDF Generation**: ✅ Implementiert
### **Database Operations**: Apply pattern
### **Theme System**: Apply pattern  
### **Electron IPC**: Apply pattern
### **Form Validation**: Apply pattern

## 💡 **Key Benefits Realized**

1. **Immediate Problem Detection**: Siehst sofort wo Daten fehlen/falsch sind
2. **Precise Error Location**: Exakte Zeile/Variable die problematisch ist
3. **Data Flow Visibility**: Verstehst kompletten Datenfluss durch System
4. **Faster Iterations**: Weniger Trial-and-Error, mehr targeted fixes
5. **Better Documentation**: Debug-Ausgabe dokumentiert erwartetes Verhalten

---

## 🔌 **IPC & Namespace Debugging (v1.8.5+)**

### **Namespace Consolidation Debugging Pattern**
```typescript
// ✅ STANDARD: Debug namespace availability and structure
function debugIPCNamespace() {
  console.log('🔌 === IPC NAMESPACE DEBUG START ===');
  
  // Step 1: Window Object Analysis
  console.log('🪟 Window Object Analysis:');
  console.log('  - window exists:', typeof window !== 'undefined');
  console.log('  - window.rawalite exists:', !!(window as any).rawalite);
  console.log('  - window.electronAPI exists (deprecated):', !!(window as any).electronAPI);
  console.log('  - window.api exists (deprecated):', !!(window as any).api);
  
  if ((window as any).rawalite) {
    const rawalite = (window as any).rawalite;
    console.log('✅ RAWALITE NAMESPACE STRUCTURE:');
    console.log('  - updater service:', !!rawalite.updater);
    console.log('  - pdf service:', !!rawalite.pdf);
    console.log('  - app service:', !!rawalite.app);
    console.log('  - backup service:', !!rawalite.backup);
    
    // Test Each Service Method
    if (rawalite.updater) {
      console.log('  - updater.checkForUpdates:', typeof rawalite.updater.checkForUpdates);
      console.log('  - updater.getVersion:', typeof rawalite.updater.getVersion);
    }
    
    if (rawalite.pdf) {
      console.log('  - pdf.generateInvoicePDF:', typeof rawalite.pdf.generateInvoicePDF);
      console.log('  - pdf.generateOfferPDF:', typeof rawalite.pdf.generateOfferPDF);
    }
    
    if (rawalite.app) {
      console.log('  - app.getVersion:', typeof rawalite.app.getVersion);
    }
  }
  
  console.log('🏁 === IPC NAMESPACE DEBUG END ===');
}

// ✅ USAGE: Call at component mount
useEffect(() => {
  debugIPCNamespace();
}, []);
```

### **IPC Communication Debugging**
```typescript
// ✅ STANDARD: Debug IPC method calls with comprehensive logging
async function debugIPCCall<T>(
  serviceName: string, 
  methodName: string, 
  method: () => Promise<T>,
  ...args: any[]
): Promise<T> {
  console.log(`🔌 === IPC CALL: ${serviceName}.${methodName} ===`);
  
  // Step 1: Pre-call Validation
  console.log('📤 Pre-call Analysis:');
  console.log('  - Service:', serviceName);
  console.log('  - Method:', methodName);
  console.log('  - Arguments:', args);
  console.log('  - Method type:', typeof method);
  
  // Step 2: Execute with timing
  const startTime = performance.now();
  try {
    const result = await method();
    const duration = performance.now() - startTime;
    
    console.log('📥 IPC Response Success:');
    console.log('  - Duration:', `${duration.toFixed(2)}ms`);
    console.log('  - Result type:', typeof result);
    console.log('  - Result preview:', result);
    
    return result;
  } catch (error) {
    const duration = performance.now() - startTime;
    
    console.error('❌ IPC Response Error:');
    console.error('  - Duration:', `${duration.toFixed(2)}ms`);
    console.error('  - Error type:', error instanceof Error ? error.constructor.name : typeof error);
    console.error('  - Error message:', error instanceof Error ? error.message : String(error));
    console.error('  - Full error:', error);
    
    throw error;
  } finally {
    console.log(`🏁 === IPC CALL END: ${serviceName}.${methodName} ===`);
  }
}

// ✅ USAGE: Wrap all IPC calls
const versionInfo = await debugIPCCall(
  'updater', 
  'getVersion',
  () => window.rawalite.updater.getVersion()
);
```

### **Version Service Multi-Source Debugging**
```typescript
// ✅ STANDARD: Debug version detection fallback cascade
async function debugVersionDetection() {
  console.log('🏷️ === VERSION DETECTION DEBUG ===');
  
  // Test Primary Source: electron-updater
  console.log('1️⃣ Testing electron-updater IPC...');
  try {
    if (window.rawalite?.updater) {
      const version = await window.rawalite.updater.getVersion();
      console.log('✅ electron-updater version:', version);
    } else {
      console.log('❌ electron-updater service unavailable');
    }
  } catch (error) {
    console.log('❌ electron-updater failed:', error);
  }
  
  // Test Fallback: Direct Electron app
  console.log('2️⃣ Testing direct Electron app IPC...');
  try {
    if (window.rawalite?.app) {
      const version = await window.rawalite.app.getVersion();
      console.log('✅ Electron app version:', version);
    } else {
      console.log('❌ App service unavailable');
    }
  } catch (error) {
    console.log('❌ Electron app IPC failed:', error);
  }
  
  // Test Emergency: Package.json fallback
  console.log('3️⃣ Testing package.json fallback...');
  try {
    // This reads the hardcoded fallback in VersionService.ts
    const fallbackVersion = "1.8.5"; // Current fallback value
    console.log('✅ Package.json fallback:', fallbackVersion);
  } catch (error) {
    console.log('❌ Package.json fallback failed:', error);
  }
  
  console.log('🏁 === VERSION DETECTION DEBUG END ===');
}
```

## 🛠️ **Development Environment Debugging**

### **Electron Process Communication**
```typescript
// ✅ STANDARD: Debug main ↔ renderer communication
// In Main Process (electron/main.ts)
ipcMain.handle('debug-ping', async (event, data) => {
  console.log('[Main] Debug ping received:', data);
  console.log('[Main] Sender frame info:', {
    url: event.sender.getURL(),
    title: event.sender.getTitle()
  });
  return { 
    timestamp: new Date().toISOString(),
    process: 'main',
    received: data 
  };
});

// In Renderer Process 
async function debugMainProcessCommunication() {
  console.log('🔄 === MAIN PROCESS COMMUNICATION DEBUG ===');
  
  try {
    const response = await window.rawalite.app.debugPing?.({ 
      test: 'renderer-to-main', 
      timestamp: new Date().toISOString() 
    });
    console.log('✅ Main process response:', response);
  } catch (error) {
    console.error('❌ Main process communication failed:', error);
  }
  
  console.log('🏁 === MAIN PROCESS COMMUNICATION DEBUG END ===');
}
```

### **Build Process Debugging**
```powershell
# ✅ STANDARD: Debug build with comprehensive logging
function Debug-Build {
    Write-Host "🔨 === BUILD PROCESS DEBUG ===" -ForegroundColor Cyan
    
    # Step 1: Environment Check
    Write-Host "`n📋 Environment Check:" -ForegroundColor Yellow
    Write-Host "  Node.js: $(node --version)" -ForegroundColor Gray
    Write-Host "  pnpm: $(pnpm --version)" -ForegroundColor Gray
    Write-Host "  TypeScript: $(& pnpm tsc --version)" -ForegroundColor Gray
    
    # Step 2: Clean State
    Write-Host "`n🧹 Cleaning Build State:" -ForegroundColor Yellow
    if (Test-Path "dist") { 
        Remove-Item -Recurse -Force "dist"
        Write-Host "  ✅ Removed dist/" -ForegroundColor Green
    }
    if (Test-Path "dist-electron") { 
        Remove-Item -Recurse -Force "dist-electron"
        Write-Host "  ✅ Removed dist-electron/" -ForegroundColor Green
    }
    
    # Step 3: TypeScript Compilation
    Write-Host "`n📝 TypeScript Compilation:" -ForegroundColor Yellow
    try {
        & pnpm typecheck
        if ($LASTEXITCODE -eq 0) {
            Write-Host "  ✅ TypeScript compilation successful" -ForegroundColor Green
        } else {
            Write-Host "  ❌ TypeScript compilation failed" -ForegroundColor Red
            return
        }
    } catch {
        Write-Host "  ❌ TypeScript check error: $($_.Exception.Message)" -ForegroundColor Red
        return
    }
    
    # Step 4: Vite Build
    Write-Host "`n⚡ Vite Build:" -ForegroundColor Yellow
    try {
        & pnpm build
        if ($LASTEXITCODE -eq 0) {
            Write-Host "  ✅ Vite build successful" -ForegroundColor Green
            
            # Validate critical output files
            $indexHtml = "dist/index.html"
            $assets = Get-ChildItem "dist/assets" -Filter "*.js" 2>$null
            
            if (Test-Path $indexHtml) {
                Write-Host "  ✅ index.html generated" -ForegroundColor Green
            } else {
                Write-Host "  ❌ index.html missing" -ForegroundColor Red
            }
            
            if ($assets.Count -gt 0) {
                Write-Host "  ✅ JavaScript assets generated ($($assets.Count) files)" -ForegroundColor Green
            } else {
                Write-Host "  ❌ No JavaScript assets found" -ForegroundColor Red
            }
        } else {
            Write-Host "  ❌ Vite build failed" -ForegroundColor Red
            return
        }
    } catch {
        Write-Host "  ❌ Vite build error: $($_.Exception.Message)" -ForegroundColor Red
        return
    }
    
    # Step 5: Electron Build
    Write-Host "`n⚡ Electron Preload & Main:" -ForegroundColor Yellow
    try {
        & pnpm run build:preload
        if (Test-Path "dist-electron/preload.js") {
            Write-Host "  ✅ Preload script built" -ForegroundColor Green
        } else {
            Write-Host "  ❌ Preload script missing" -ForegroundColor Red
        }
        
        & pnpm run build:main
        if (Test-Path "dist-electron/main.js") {
            Write-Host "  ✅ Main script built" -ForegroundColor Green
        } else {
            Write-Host "  ❌ Main script missing" -ForegroundColor Red
        }
    } catch {
        Write-Host "  ❌ Electron build error: $($_.Exception.Message)" -ForegroundColor Red
        return
    }
    
    Write-Host "`n🎉 BUILD DEBUG COMPLETED" -ForegroundColor Green
}

# Usage: Debug-Build
```

### **Database Operation Debugging**
```typescript
// ✅ STANDARD: Debug SQLite operations with transaction logging
async function debugDatabaseOperation<T>(
  operationName: string,
  operation: () => Promise<T>
): Promise<T> {
  console.log(`💾 === DATABASE OPERATION: ${operationName} ===`);
  
  // Step 1: Pre-operation state
  console.log('📊 Pre-operation Analysis:');
  try {
    const db = getDatabase(); // Your database instance
    const tables = db.exec("SELECT name FROM sqlite_master WHERE type='table';");
    console.log('  - Available tables:', tables[0]?.values?.map(row => row[0]) || []);
    console.log('  - Database ready:', !!db);
  } catch (error) {
    console.error('  - Database state check failed:', error);
  }
  
  // Step 2: Execute with timing and transaction logging
  const startTime = performance.now();
  try {
    console.log('🔄 Executing operation...');
    const result = await operation();
    const duration = performance.now() - startTime;
    
    console.log('✅ Operation Success:');
    console.log('  - Duration:', `${duration.toFixed(2)}ms`);
    console.log('  - Result type:', typeof result);
    if (Array.isArray(result)) {
      console.log('  - Result count:', result.length);
    }
    
    return result;
  } catch (error) {
    const duration = performance.now() - startTime;
    
    console.error('❌ Operation Failed:');
    console.error('  - Duration:', `${duration.toFixed(2)}ms`);
    console.error('  - Error type:', error instanceof Error ? error.constructor.name : typeof error);
    console.error('  - SQL Error:', error);
    
    throw error;
  } finally {
    console.log(`🏁 === DATABASE OPERATION END: ${operationName} ===`);
  }
}

// ✅ USAGE: Wrap database operations
const customers = await debugDatabaseOperation(
  'getCustomers',
  () => adapter.getCustomers()
);
```

## 🎨 **Theme & UI Debugging**

### **Theme Application Debugging**
```typescript
// ✅ STANDARD: Debug theme switching and persistence
function debugThemeApplication(themeName: string) {
  console.log(`🎨 === THEME APPLICATION: ${themeName} ===`);
  
  // Step 1: Theme Configuration Validation
  console.log('🎯 Theme Configuration:');
  const themes = getAvailableThemes(); // Your theme service
  const theme = themes[themeName];
  
  if (!theme) {
    console.error('❌ Theme not found:', themeName);
    console.log('  - Available themes:', Object.keys(themes));
    return;
  }
  
  console.log('✅ Theme configuration:');
  console.log('  - Primary color:', theme.primary);
  console.log('  - Secondary color:', theme.secondary);
  console.log('  - Accent color:', theme.accent);
  console.log('  - Gradient:', theme.gradient);
  
  // Step 2: CSS Variable Application
  console.log('🎨 CSS Variable Application:');
  const root = document.documentElement;
  
  const beforeColors = {
    primary: getComputedStyle(root).getPropertyValue('--color-primary').trim(),
    secondary: getComputedStyle(root).getPropertyValue('--color-secondary').trim(),
    accent: getComputedStyle(root).getPropertyValue('--color-accent').trim()
  };
  
  console.log('  - Before colors:', beforeColors);
  
  // Apply theme
  root.style.setProperty('--color-primary', theme.primary);
  root.style.setProperty('--color-secondary', theme.secondary);
  root.style.setProperty('--color-accent', theme.accent);
  
  const afterColors = {
    primary: getComputedStyle(root).getPropertyValue('--color-primary').trim(),
    secondary: getComputedStyle(root).getPropertyValue('--color-secondary').trim(),
    accent: getComputedStyle(root).getPropertyValue('--color-accent').trim()
  };
  
  console.log('  - After colors:', afterColors);
  console.log('  - Colors changed:', JSON.stringify(beforeColors) !== JSON.stringify(afterColors));
  
  // Step 3: Persistence Check
  console.log('💾 Theme Persistence:');
  const savedTheme = localStorage.getItem('selectedTheme'); // Or your persistence method
  console.log('  - Saved theme:', savedTheme);
  console.log('  - Matches current:', savedTheme === themeName);
  
  console.log(`🏁 === THEME APPLICATION END: ${themeName} ===`);
}
```

## 📋 **Standard Debug Checklist für alle Features**

### **Pre-Implementation Debug Setup**
```markdown
- [ ] ✅ Implement comprehensive debug logging first
- [ ] ✅ Log all input data structures
- [ ] ✅ Log each processing step
- [ ] ✅ Test critical path variables
- [ ] ✅ Validate output expectations
- [ ] ✅ Add error boundary logging
```

### **IPC-Specific Debug Setup (v1.8.5+)**
```markdown
- [ ] ✅ Validate window.rawalite namespace exists
- [ ] ✅ Test all required service methods
- [ ] ✅ Log IPC call timing and responses
- [ ] ✅ Implement fallback debugging
- [ ] ✅ Test error scenarios
```

### **Database-Specific Debug Setup**
```markdown
- [ ] ✅ Log database connection state
- [ ] ✅ Log SQL query parameters
- [ ] ✅ Time database operations
- [ ] ✅ Test transaction boundaries
- [ ] ✅ Validate data integrity
```

**🎉 STANDARD ESTABLISHED: Immer Extended Debug First + IPC/Namespace Debugging!**

**Für alle zukünftigen Features und Bugfixes in RawaLite wird das Extended Debug Pattern mit speziellen IPC- und Namespace-Debugging-Mustern als Erstschritt implementiert.**

---

## 💡 **Debugging Best Practices Summary**

### **DO's** ✅
- **Implement debug logging BEFORE implementing features**
- **Use unified window.rawalite namespace for all IPC calls**
- **Wrap all IPC calls with debugIPCCall helper**
- **Test version detection cascade thoroughly**
- **Log complete data structures, not just values**
- **Time all asynchronous operations**
- **Validate critical path variables individually**

### **DON'Ts** ❌
- **Mixed namespace usage** (window.api, window.electronAPI deprecated)
- **Silent IPC failures** without comprehensive error logging
- **Assumptions about data availability** without validation
- **Manual debugging** without standardized patterns
- **Trial-and-error approaches** without systematic analysis

---

*Letzte Aktualisierung: 18. September 2025*  
*Version: 2.0.0 (Enhanced with IPC & Namespace Debugging)*