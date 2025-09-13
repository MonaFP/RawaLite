// Test für Database-Loading
import fs from 'fs';
import path from 'path';
import os from 'os';

// Simuliere das Database-Loading wie in der App
async function testDatabaseLoad() {
  const dbPath = path.join(os.homedir(), 'AppData', 'Roaming', 'RaWaLite', 'database.sqlite');
  
  console.log('🔍 Testing database load...');
  console.log('📁 Database path:', dbPath);
  
  // Prüfe ob Datei existiert
  if (!fs.existsSync(dbPath)) {
    console.log('❌ Database file does not exist!');
    return;
  }
  
  // Prüfe Dateigröße
  const stats = fs.statSync(dbPath);
  console.log('📊 Database size:', stats.size, 'bytes');
  console.log('📅 Last modified:', stats.mtime);
  
  // Lade Datei als Buffer
  const dbBuffer = fs.readFileSync(dbPath);
  console.log('📦 Buffer loaded, size:', dbBuffer.length, 'bytes');
  
  // Prüfe erste Bytes (SQLite Header)
  const header = dbBuffer.subarray(0, 16).toString();
  console.log('📋 SQLite header:', header);
  
  if (header.startsWith('SQLite format 3')) {
    console.log('✅ Valid SQLite database detected');
  } else {
    console.log('❌ Invalid SQLite header!');
  }
  
  console.log('✅ Database load test completed');
}

testDatabaseLoad().catch(console.error);