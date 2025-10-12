// Test: v1.0.41 GitHubApiService OHNE redirect: 'follow'
// Simuliert exakt das Problem

const test_v1041_vs_v1042 = async () => {
  console.log('🧪 Testing v1.0.41 vs v1.0.42 redirect handling...\n');
  
  const v1041_url = 'https://github.com/MonaFP/RawaLite/releases/download/v1.0.41/RawaLite-Setup-1.0.41.exe';
  const v1042_url = 'https://github.com/MonaFP/RawaLite/releases/download/v1.0.42/RawaLite-Setup-1.0.42.exe';
  
  // 1. Test v1.0.41 Style (BROKEN - kein redirect: 'follow')
  console.log('❌ v1.0.41 Style (NO redirect follow):');
  try {
    const response_v1041 = await fetch(v1042_url, {
      headers: {
        'Accept': 'application/octet-stream',
        'User-Agent': 'RawaLite-UpdateChecker/1.0'
      }
      // MISSING: redirect: 'follow'
    });
    
    console.log(`Status: ${response_v1041.status}`);
    console.log(`Content-Type: ${response_v1041.headers.get('content-type')}`);
    
    if (response_v1041.status === 302) {
      const text = await response_v1041.text();
      console.log(`Body (first 100 chars): ${text.substring(0, 100)}`);
      
      // Simulated MZ header check
      const isHTML = text.includes('<html') || text.includes('<HTML');
      console.log(`❌ RESULT: ${isHTML ? 'HTML content (MISSING MZ HEADER!)' : 'Binary content'}`);
    }
  } catch (error) {
    console.log(`Error: ${error.message}`);
  }
  
  console.log('\n✅ v1.0.42+ Style (WITH redirect follow):');
  try {
    const response_v1042 = await fetch(v1042_url, {
      headers: {
        'Accept': 'application/octet-stream',
        'User-Agent': 'RawaLite-UpdateChecker/1.0'
      },
      redirect: 'follow'  // ✅ FIXED
    });
    
    console.log(`Status: ${response_v1042.status}`);
    console.log(`Content-Type: ${response_v1042.headers.get('content-type')}`);
    
    const buffer = await response_v1042.arrayBuffer();
    const bytes = new Uint8Array(buffer.slice(0, 4));
    const header = Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join(' ');
    console.log(`First 4 bytes: ${header}`);
    
    const isMZ = bytes[0] === 0x4D && bytes[1] === 0x5A; // 'MZ'
    console.log(`✅ RESULT: ${isMZ ? 'Valid PE executable (MZ header found!)' : 'Invalid executable'}`);
  } catch (error) {
    console.log(`Error: ${error.message}`);
  }
};

test_v1041_vs_v1042();