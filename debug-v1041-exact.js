// DEBUG: Warum schlägt v1.0.41 GitHubApiService fehl?
// Exakte v1.0.41 Download Logic nachstellen

const debug_v1041_download = async () => {
  console.log('🔍 Debugging v1.0.41 GitHubApiService failure...\n');
  
  const asset_url = 'https://github.com/MonaFP/RawaLite/releases/download/v1.0.42/RawaLite-Setup-1.0.42.exe';
  
  try {
    console.log('1️⃣ Fetching asset with v1.0.41 settings...');
    const response = await fetch(asset_url, {
      headers: {
        'Accept': 'application/octet-stream',
        'User-Agent': 'RawaLite-UpdateChecker/1.0'
      },
      redirect: 'follow'  // v1.0.41 has this
    });
    
    console.log(`✅ Response Status: ${response.status}`);
    console.log(`✅ Response OK: ${response.ok}`);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    // v1.0.41 Content-Type Check
    console.log('\n2️⃣ Content-Type validation...');
    const contentType = response.headers.get('content-type') || '';
    console.log(`Content-Type: ${contentType}`);
    
    if (contentType.includes('text/html') || contentType.includes('text/plain')) {
      throw new Error(`Invalid content type: ${contentType}. Expected binary download.`);
    }
    console.log('✅ Content-Type OK');
    
    // v1.0.41 MZ Header Check
    console.log('\n3️⃣ MZ Header validation...');
    const reader = response.body?.getReader();
    if (!reader) throw new Error('No readable stream');
    
    const { value: firstChunk } = await reader.read();
    if (!firstChunk || firstChunk.length < 2) {
      throw new Error('Could not read first chunk');
    }
    
    console.log(`First 4 bytes: ${Array.from(firstChunk.slice(0, 4)).map(b => '0x' + b.toString(16).padStart(2, '0')).join(' ')}`);
    
    if (firstChunk[0] !== 0x4D || firstChunk[1] !== 0x5A) {
      throw new Error('Not an executable file: Missing MZ header');
    }
    
    console.log('✅ MZ Header found!');
    console.log('\n🎉 v1.0.41 download logic should work perfectly!');
    
    reader.releaseLock();
    
  } catch (error) {
    console.error(`❌ ERROR: ${error.message}`);
    console.error('🚨 This is why v1.0.41 update fails!');
  }
};

debug_v1041_download();