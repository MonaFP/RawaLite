/**
 * Test für das echte Update-System von RawaLite v1.5.3
 */

// Test GitHub API Erreichbarkeit
async function testGitHubAPI() {
    console.log('🔍 Testing GitHub API...');
    
    try {
        const response = await fetch('https://api.github.com/repos/MonaFP/RawaLite/releases/latest', {
            headers: {
                'Accept': 'application/vnd.github.v3+json',
                'User-Agent': 'RawaLite-Test'
            }
        });
        
        if (response.ok) {
            const release = await response.json();
            console.log('✅ GitHub API funktioniert');
            console.log(`📦 Neueste Version: ${release.tag_name}`);
            console.log(`📅 Veröffentlicht: ${release.published_at}`);
            console.log(`📝 Release Notes: ${release.body?.substring(0, 100)}...`);
            return release;
        } else {
            console.log(`❌ GitHub API Fehler: ${response.status} ${response.statusText}`);
            return null;
        }
    } catch (error) {
        console.log(`❌ Netzwerk-Fehler: ${error.message}`);
        return null;
    }
}

// Test Update-Check Logic
function testVersionComparison() {
    console.log('\n🔍 Testing Version Comparison...');
    
    const testCases = [
        { current: '1.5.2', latest: '1.5.3', expected: true },
        { current: '1.5.3', latest: '1.5.3', expected: false },
        { current: '1.5.4', latest: '1.5.3', expected: false },
        { current: '1.4.9', latest: '1.5.0', expected: true }
    ];
    
    function isUpdateAvailable(current, latest) {
        const currentParts = current.split('.').map(n => parseInt(n) || 0);
        const latestParts = latest.split('.').map(n => parseInt(n) || 0);
        
        const maxLength = Math.max(currentParts.length, latestParts.length);
        while (currentParts.length < maxLength) currentParts.push(0);
        while (latestParts.length < maxLength) latestParts.push(0);
        
        for (let i = 0; i < maxLength; i++) {
            if (latestParts[i] > currentParts[i]) return true;
            if (latestParts[i] < currentParts[i]) return false;
        }
        return false;
    }
    
    testCases.forEach(test => {
        const result = isUpdateAvailable(test.current, test.latest);
        const status = result === test.expected ? '✅' : '❌';
        console.log(`${status} ${test.current} -> ${test.latest}: ${result} (erwartet: ${test.expected})`);
    });
}

// Haupttest
async function runTests() {
    console.log('🚀 RawaLite Update-System Test\n');
    
    // Test 1: GitHub API
    const release = await testGitHubAPI();
    
    // Test 2: Versionsvergleich
    testVersionComparison();
    
    // Test 3: Update-Workflow Simulation
    if (release) {
        console.log('\n🔄 Update-Workflow Simulation...');
        const currentVersion = '1.5.2';
        const latestVersion = release.tag_name.replace(/^v/, '');
        
        if (latestVersion !== currentVersion) {
            console.log(`✅ Update verfügbar: ${currentVersion} -> ${latestVersion}`);
            console.log('📝 Workflow:');
            console.log('  1. ✅ GitHub API-Check erfolgreich');
            console.log('  2. ✅ Neue Version erkannt');
            console.log('  3. ⚡ Benutzer-Benachrichtigung zeigen');
            console.log('  4. 🌐 GitHub Releases öffnen');
            console.log('  5. 📥 Manueller Download');
            console.log('  6. 🔄 .exe ersetzen (Daten bleiben erhalten)');
        } else {
            console.log('✅ Aktuelle Version ist bereits die neueste');
        }
    }
    
    console.log('\n🎉 Update-System Test abgeschlossen!');
    console.log('\n💡 Zum Testen in der App:');
    console.log('  • App starten (pnpm dev)');
    console.log('  • Auf Version im Header klicken');
    console.log('  • Update-Dialog sollte erscheinen');
    console.log('  • GitHub Releases sollte sich öffnen');
}

// Test ausführen
runTests().catch(console.error);
