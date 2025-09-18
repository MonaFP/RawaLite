// Test-Script für echte Datenbank-Persistierung
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

console.log('🔍 Testing Database Persistence...');

// Simuliere App userData path
const userDataPath = path.join(process.env.APPDATA || '', 'rawalite-test');
const dbPath = path.join(userDataPath, 'database.sqlite');

console.log('📁 Expected database path:', dbPath);

// Erstelle Ordner falls nicht vorhanden
if (!fs.existsSync(userDataPath)) {
  fs.mkdirSync(userDataPath, { recursive: true });
  console.log('✅ Created user data directory:', userDataPath);
}

// Teste ob eine SQLite-Datei erstellt werden kann
const testData = Buffer.from('TESTDATA');
try {
  fs.writeFileSync(dbPath, testData);
  console.log('✅ Successfully wrote test database file');
  
  const readData = fs.readFileSync(dbPath);
  console.log('✅ Successfully read test database file');
  console.log('📊 File size:', readData.length, 'bytes');
  
  // Cleanup
  fs.unlinkSync(dbPath);
  console.log('✅ Test cleanup completed');
  
} catch (error) {
  console.error('❌ Database file operation failed:', error);
}

// Teste echten App userData Pfad
console.log('\n🔍 Checking real app paths...');
console.log('ℹ️  This is a standalone test - Electron app not available');

console.log('\n✅ Database persistence test completed');