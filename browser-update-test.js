// UpdateService Test - Zu verwenden in Browser-Konsole wenn App läuft
// Copy-Paste diesen Code in die Browser DevTools Console

console.log('🧪 TESTING UPDATESERVICE VERSION FIX');
console.log('=====================================');

async function testUpdateService() {
  console.log('\n📊 1. CURRENT VERSION TEST:');
  
  // Test IPC Version Call
  try {
    const ipcVersion = await window.rawalite?.app.getVersion();
    console.log(`   ✅ IPC Version Call: ${ipcVersion}`);
  } catch (error) {
    console.log(`   ❌ IPC Version Call failed: ${error.message}`);
  }

  console.log('\n📊 2. UPDATER STATUS TEST:');
  
  // Test Updater Version Call
  try {
    const updaterInfo = await window.rawalite?.updater.getVersion();
    console.log(`   ✅ Updater Version: ${updaterInfo?.current}`);
    console.log(`   ✅ App Name: ${updaterInfo?.appName}`);
  } catch (error) {
    console.log(`   ❌ Updater Version Call failed: ${error.message}`);
  }

  console.log('\n📊 3. GITHUB API TEST:');
  
  // Test GitHub API direkt
  try {
    const response = await fetch('https://api.github.com/repos/MonaFP/RawaLite/releases/latest');
    const data = await response.json();
    console.log(`   ✅ GitHub Latest: ${data.tag_name}`);
    console.log(`   ✅ Published: ${data.published_at}`);
    
    // Manual Version Comparison
    const currentFromIPC = await window.rawalite?.app.getVersion();
    const latestFromGitHub = data.tag_name.replace('v', '');
    
    console.log(`\n🔍 VERSION COMPARISON:`);
    console.log(`   - Current (IPC): ${currentFromIPC}`);
    console.log(`   - Latest (GitHub): ${latestFromGitHub}`);
    
    // Einfacher String-Vergleich (für Demo)
    if (currentFromIPC === latestFromGitHub) {
      console.log(`   ℹ️  Versionen sind gleich - kein Update nötig`);
    } else {
      console.log(`   🎯 UPDATE VERFÜGBAR: ${currentFromIPC} → ${latestFromGitHub}`);
    }
    
  } catch (error) {
    console.log(`   ❌ GitHub API failed: ${error.message}`);
  }

  console.log('\n📊 4. UPDATE CHECK TEST:');
  
  // Test den echten UpdateService (falls verfügbar)
  try {
    console.log('   🔄 Triggering update check...');
    const updateResult = await window.rawalite?.updater.checkForUpdates();
    console.log(`   ✅ Update Check Result:`, updateResult);
  } catch (error) {
    console.log(`   ❌ Update Check failed: ${error.message}`);
  }

  console.log('\n🎯 MANUAL HEADER CHECK:');
  console.log('   1. Schaue im App-Header nach der angezeigten Version');
  console.log('   2. Schaue nach farbigen Update-Indikatoren');
  console.log('   3. Klicke auf Update-Button falls vorhanden');
  console.log('   4. Prüfe Update-Modal Inhalte');
}

// Run the test
testUpdateService().catch(console.error);