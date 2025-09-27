// Test-Script um Migration von LocalStorage zu IPC zu validieren
const fs = require('fs');
const path = require('path');

// Legacy LocalStorage Simulation
const mockLocalStorage = {
  getItem: (key) => {
    if (key === "rawalite.db") {
      // Versuche echte LocalStorage-Daten zu lesen
      const legacyDbPath = "C:\\Users\\ramon\\AppData\\Roaming\\Electron\\Shared Dictionary\\db";
      try {
        if (fs.existsSync(legacyDbPath)) {
          console.log('📦 Found legacy database file');
          const legacyData = fs.readFileSync(legacyDbPath);
          console.log(`📊 Legacy database size: ${legacyData.length} bytes`);
          
          // Base64 encode like the legacy system would
          const base64Data = legacyData.toString('base64');
          console.log(`📋 Base64 encoded size: ${base64Data.length} chars`);
          return base64Data;
        }
      } catch (error) {
        console.error('❌ Failed to read legacy database:', error);
      }
    }
    return null;
  }
};

// Simulate Base64 decode
function u8FromBase64(b64) {
  const bin = Buffer.from(b64, 'base64').toString('binary');
  const len = bin.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

// Test migration logic
console.log('🔄 Testing migration logic...');

const legacyData = mockLocalStorage.getItem("rawalite.db");
if (legacyData) {
  console.log('✅ Found legacy LocalStorage data');
  
  try {
    const bytes = u8FromBase64(legacyData);
    console.log(`✅ Decoded to ${bytes.length} bytes`);
    
    // Simulate save to new location
    const newDbPath = "C:\\Users\\ramon\\AppData\\Roaming\\Electron\\data\\rawalite.db";
    const newDbDir = path.dirname(newDbPath);
    
    if (!fs.existsSync(newDbDir)) {
      fs.mkdirSync(newDbDir, { recursive: true });
      console.log('📁 Created data directory');
    }
    
    fs.writeFileSync(newDbPath, bytes);
    console.log(`💾 Migration successful! Saved ${bytes.length} bytes to ${newDbPath}`);
    
    // Verify
    const verifyData = fs.readFileSync(newDbPath);
    console.log(`✅ Verification: ${verifyData.length} bytes saved correctly`);
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
  }
} else {
  console.log('❌ No legacy LocalStorage data found');
}