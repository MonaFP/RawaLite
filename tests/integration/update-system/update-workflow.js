/**
 * Test Script für Update-System
 * Testet die GitHub API und Versionserkennung
 */

import https from 'https';

async function testGitHubAPI() {
    console.log('🔍 Testing GitHub API...');
    
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'api.github.com',
            path: '/repos/MonaFP/RawaLite/releases/latest',
            method: 'GET',
            headers: {
                'Accept': 'application/vnd.github.v3+json',
                'User-Agent': 'RawaLite-App-Test'
            }
        };

        const req = https.request(options, (res) => {
            let data = '';
            
            res.on('data', (chunk) => {
                data += chunk;
            });
            
            res.on('end', () => {
                console.log(`📡 GitHub API Response Status: ${res.statusCode}`);
                
                if (res.statusCode === 200) {
                    try {
                        const release = JSON.parse(data);
                        console.log(`✅ Latest Release: ${release.tag_name}`);
                        console.log(`📅 Published: ${release.published_at}`);
                        console.log(`📝 Name: ${release.name}`);
                        resolve(release);
                    } catch (error) {
                        console.error('❌ Failed to parse GitHub response:', error);
                        reject(error);
                    }
                } else if (res.statusCode === 404) {
                    console.log('⚠️ Repository not found (probably private)');
                    resolve(null);
                } else {
                    console.log(`❌ GitHub API Error: ${res.statusCode}`);
                    console.log('Response:', data);
                    reject(new Error(`HTTP ${res.statusCode}`));
                }
            });
        });

        req.on('error', (error) => {
            console.error('❌ Network Error:', error.message);
            reject(error);
        });

        req.setTimeout(5000, () => {
            console.log('⏰ Request timeout');
            req.destroy();
            reject(new Error('Timeout'));
        });

        req.end();
    });
}

function compareVersions(current, latest) {
    console.log(`🔄 Comparing versions: ${current} vs ${latest}`);
    
    const currentParts = current.split('.').map(n => parseInt(n) || 0);
    const latestParts = latest.split('.').map(n => parseInt(n) || 0);

    const maxLength = Math.max(currentParts.length, latestParts.length);
    while (currentParts.length < maxLength) currentParts.push(0);
    while (latestParts.length < maxLength) latestParts.push(0);

    for (let i = 0; i < maxLength; i++) {
        if (latestParts[i] > currentParts[i]) {
            console.log(`✅ Update available: ${current} -> ${latest}`);
            return true;
        }
        if (latestParts[i] < currentParts[i]) {
            console.log(`ℹ️ Current version is newer: ${current} vs ${latest}`);
            return false;
        }
    }

    console.log(`ℹ️ Versions are equal: ${current} = ${latest}`);
    return false;
}

async function runTest() {
    console.log('🚀 RawaLite Update System Test\n');
    
    try {
        const release = await testGitHubAPI();
        
        if (release) {
            const latestVersion = release.tag_name.replace(/^v/, '');
            const testVersions = ['1.4.0', '1.4.1', '1.4.2', '1.5.0'];
            
            console.log('\n🧪 Testing version comparisons:');
            testVersions.forEach(currentVersion => {
                const hasUpdate = compareVersions(currentVersion, latestVersion);
                console.log(`   ${currentVersion} -> ${latestVersion}: ${hasUpdate ? '🔔 UPDATE' : '✅ CURRENT'}`);
            });
        } else {
            console.log('\n⚠️ Could not fetch release info (private repo)');
            console.log('Testing fallback version comparison:');
            compareVersions('1.4.0', '1.4.2');
        }
        
    } catch (error) {
        console.error('\n❌ Test failed:', error.message);
    }
}

runTest();
