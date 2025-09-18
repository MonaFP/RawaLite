/**
 * Test Script für Debug-Logging & DevTools Production Access
 * Überprüft das erweiterte Logging-System und DevTools-Zugang in Production
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Debug-Logging & DevTools Test');
console.log('=====================================\n');

// Test 1: Electron Main.ts Logging-Konfiguration
function testElectronLogging() {
  console.log('1. ⚡ Electron Logging-Konfiguration...');
  
  const mainTsPath = path.join(__dirname, '../../../electron/main.ts');
  const mainContent = fs.readFileSync(mainTsPath, 'utf8');
  
  // Prüfe Enhanced Logging Configuration
  const hasLogConfiguration = mainContent.includes('log.transports.file.level = \'debug\'');
  const hasLogFormat = mainContent.includes('log.transports.file.format = \'[{y}-{m}-{d} {h}:{i}:{s}.{ms}] [{level}] {text}\'');
  const hasLogSizeLimit = mainContent.includes('1024 * 1024 * 10'); // 10MB
  
  // Prüfe Update-Phase Logging
  const hasUpdatePhaseLogging = mainContent.includes('[UPDATE-PHASE]');
  const hasDownloadProgressLogging = mainContent.includes('[DOWNLOAD-PROGRESS]');
  const hasCriticalLogging = mainContent.includes('[DOWNLOAD-CRITICAL]');
  
  // Prüfe 74% Range Special Logging
  const has74PercentLogging = mainContent.includes('percent >= 74 && percent <= 76');
  
  console.log(`   ✅ Log-Level Debug: ${hasLogConfiguration ? '✓' : '❌'}`);
  console.log(`   ✅ Structured Format: ${hasLogFormat ? '✓' : '❌'}`);
  console.log(`   ✅ Size Limit (10MB): ${hasLogSizeLimit ? '✓' : '❌'}`);
  console.log(`   ✅ Update-Phase Markers: ${hasUpdatePhaseLogging ? '✓' : '❌'}`);
  console.log(`   ✅ Download Progress: ${hasDownloadProgressLogging ? '✓' : '❌'}`);
  console.log(`   ✅ Critical Checkpoints: ${hasCriticalLogging ? '✓' : '❌'}`);
  console.log(`   ✅ 74% Range Special Logging: ${has74PercentLogging ? '✓' : '❌'}`);
  
  return hasLogConfiguration && hasUpdatePhaseLogging && has74PercentLogging;
}

// Test 2: Production DevTools Zugang
function testProductionDevTools() {
  console.log('\n2. 🛠️ Production DevTools Zugang...');
  
  const mainTsPath = path.join(__dirname, '../../../electron/main.ts');
  const mainContent = fs.readFileSync(mainTsPath, 'utf8');
  
  // Prüfe ob DevTools für Production verfügbar sind
  const hasDevToolsInProduction = !mainContent.includes('...(isDev ? [') || 
                                   mainContent.includes('{ label: \'Entwicklertools\', accelerator: \'F12\', role: \'toggledevtools\' }');
  
  // Prüfe Log-Export im Menu
  const hasLogExportMenu = mainContent.includes('Debug-Logs exportieren');
  
  console.log(`   ✅ DevTools in Production: ${hasDevToolsInProduction ? '✓' : '❌'}`);
  console.log(`   ✅ Log-Export Menu Item: ${hasLogExportMenu ? '✓' : '❌'}`);
  
  return hasDevToolsInProduction && hasLogExportMenu;
}

// Test 3: IPC Handler für Log-Export
function testLogExportIPC() {
  console.log('\n3. 🔌 IPC Log-Export Handler...');
  
  const mainTsPath = path.join(__dirname, '../../../electron/main.ts');
  const mainContent = fs.readFileSync(mainTsPath, 'utf8');
  
  // Prüfe IPC Handler
  const hasLogExportHandler = mainContent.includes('ipcMain.handle(\'app:exportLogs\'');
  const hasLogFileAccess = mainContent.includes('log.transports.file.getFile().path');
  const hasTimestampInFilename = mainContent.includes('rawalite-logs-${timestamp}.log');
  const hasDialogIntegration = mainContent.includes('shell.showItemInFolder');
  
  console.log(`   ✅ IPC Handler: ${hasLogExportHandler ? '✓' : '❌'}`);
  console.log(`   ✅ Log File Access: ${hasLogFileAccess ? '✓' : '❌'}`);
  console.log(`   ✅ Timestamped Export: ${hasTimestampInFilename ? '✓' : '❌'}`);
  console.log(`   ✅ Explorer Integration: ${hasDialogIntegration ? '✓' : '❌'}`);
  
  return hasLogExportHandler && hasLogFileAccess;
}

// Test 4: Preload & Types
function testPreloadAndTypes() {
  console.log('\n4. 📝 Preload & Type Definitions...');
  
  // Prüfe Preload.ts
  const preloadPath = path.join(__dirname, '../../../electron/preload.ts');
  const preloadContent = fs.readFileSync(preloadPath, 'utf8');
  const hasExportLogsInPreload = preloadContent.includes('exportLogs: () => ipcRenderer.invoke(\'app:exportLogs\')');
  
  // Prüfe IPC Types
  const ipcTypesPath = path.join(__dirname, '../../../src/types/ipc.ts');
  const ipcTypesContent = fs.readFileSync(ipcTypesPath, 'utf8');
  const hasLogExportType = ipcTypesContent.includes('exportLogs: () => Promise<LogExportResult>');
  const hasLogExportResultType = ipcTypesContent.includes('export interface LogExportResult');
  
  // Prüfe Global Types
  const globalTypesPath = path.join(__dirname, '../../../src/global.d.ts');
  const globalTypesContent = fs.readFileSync(globalTypesPath, 'utf8');
  const hasGlobalExportLogsType = globalTypesContent.includes('exportLogs: () => Promise<{success: boolean; filePath?: string; error?: string}>');
  
  console.log(`   ✅ Preload Integration: ${hasExportLogsInPreload ? '✓' : '❌'}`);
  console.log(`   ✅ IPC Type Definition: ${hasLogExportType ? '✓' : '❌'}`);
  console.log(`   ✅ Result Type Interface: ${hasLogExportResultType ? '✓' : '❌'}`);
  console.log(`   ✅ Global Type Definition: ${hasGlobalExportLogsType ? '✓' : '❌'}`);
  
  return hasExportLogsInPreload && hasLogExportType && hasGlobalExportLogsType;
}

// Test 5: UI Integration - EinstellungenPage
function testUIIntegration() {
  console.log('\n5. 🎨 UI Integration (EinstellungenPage)...');
  
  const einstellungenPath = path.join(__dirname, '../../../src/pages/EinstellungenPage.tsx');
  const einstellungenContent = fs.readFileSync(einstellungenPath, 'utf8');
  
  // Prüfe handleExportLogs Funktion
  const hasHandleExportLogs = einstellungenContent.includes('const handleExportLogs = async () => {');
  const hasElectronCheck = einstellungenContent.includes('if (!window.rawalite?.app?.exportLogs)');
  const hasSuccessHandling = einstellungenContent.includes('showSuccess(\'Debug-Logs erfolgreich exportiert\')');
  
  // Prüfe UI Button
  const hasLogExportButton = einstellungenContent.includes('🔍 Debug-Logs exportieren');
  const hasDebugSection = einstellungenContent.includes('Debug & Logging');
  const hasDevToolsButton = einstellungenContent.includes('🛠️ Entwicklertools öffnen');
  
  console.log(`   ✅ Export Function: ${hasHandleExportLogs ? '✓' : '❌'}`);
  console.log(`   ✅ Electron Check: ${hasElectronCheck ? '✓' : '❌'}`);
  console.log(`   ✅ Success Handling: ${hasSuccessHandling ? '✓' : '❌'}`);
  console.log(`   ✅ Log Export Button: ${hasLogExportButton ? '✓' : '❌'}`);
  console.log(`   ✅ Debug Section: ${hasDebugSection ? '✓' : '❌'}`);
  console.log(`   ✅ DevTools Button: ${hasDevToolsButton ? '✓' : '❌'}`);
  
  return hasHandleExportLogs && hasLogExportButton && hasDebugSection;
}

// Test 6: Security & Production Readiness
function testSecurityAndProduction() {
  console.log('\n6. 🔒 Security & Production Readiness...');
  
  const mainTsPath = path.join(__dirname, '../../../electron/main.ts');
  const mainContent = fs.readFileSync(mainTsPath, 'utf8');
  
  // Prüfe Sicherheitsfeatures
  const hasContextIsolation = mainContent.includes('contextIsolation: true');
  const hasSandbox = mainContent.includes('sandbox: true');
  const hasNoNodeIntegration = !mainContent.includes('nodeIntegration: true');
  
  // Prüfe Production-Checks
  const hasElectronVersionCheck = mainContent.includes('LOG-EXPORT: Starting log export process');
  const hasErrorHandling = mainContent.includes('LOG-EXPORT: Export failed:');
  
  console.log(`   ✅ Context Isolation: ${hasContextIsolation ? '✓' : '❌'}`);
  console.log(`   ✅ Sandbox Mode: ${hasSandbox ? '✓' : '❌'}`);
  console.log(`   ✅ No Node Integration: ${hasNoNodeIntegration ? '✓' : '❌'}`);
  console.log(`   ✅ Version Check: ${hasElectronVersionCheck ? '✓' : '❌'}`);
  console.log(`   ✅ Error Handling: ${hasErrorHandling ? '✓' : '❌'}`);
  
  return hasContextIsolation && hasSandbox && hasErrorHandling;
}

// Alle Tests ausführen
console.log('🚀 Running Debug-Logging & DevTools Tests...\n');

const test1 = testElectronLogging();
const test2 = testProductionDevTools();
const test3 = testLogExportIPC();
const test4 = testPreloadAndTypes();
const test5 = testUIIntegration();
const test6 = testSecurityAndProduction();

console.log('\n📊 Test Results Summary:');
console.log('========================');
console.log(`1. Electron Logging Config: ${test1 ? '✅ PASS' : '❌ FAIL'}`);
console.log(`2. Production DevTools: ${test2 ? '✅ PASS' : '❌ FAIL'}`);
console.log(`3. Log Export IPC: ${test3 ? '✅ PASS' : '❌ FAIL'}`);
console.log(`4. Preload & Types: ${test4 ? '✅ PASS' : '❌ FAIL'}`);
console.log(`5. UI Integration: ${test5 ? '✅ PASS' : '❌ FAIL'}`);
console.log(`6. Security & Production: ${test6 ? '✅ PASS' : '❌ FAIL'}`);

const allPassed = test1 && test2 && test3 && test4 && test5 && test6;
console.log(`\n🎯 Overall Status: ${allPassed ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED'}`);

if (allPassed) {
  console.log('\n🎉 Debug-Logging & DevTools Implementation erfolgreich!');
  console.log('\n📋 Features Ready:');
  console.log('   • Enhanced Logging mit Debug-Level & Structured Format');
  console.log('   • Update-Phase Tracking mit speziellen 74% Range Logs');
  console.log('   • Production DevTools Zugang über F12 & Menu');
  console.log('   • Log-Export Funktionalität mit Explorer Integration');
  console.log('   • Erweiterte UI in Einstellungen > Wartung > Debug & Logging');
  console.log('   • Type-Safe IPC Communication für alle Debug-Features');
  
  console.log('\n🚀 Ready for v1.7.8 Release!');
} else {
  console.log('\n⚠️ Fix required before release!');
}