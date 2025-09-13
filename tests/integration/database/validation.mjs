// Test-Tool für Datenbankvalidierung
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

console.log('🧪 RawaLite Database Persistence Validator');
console.log('==========================================\n');

// Simuliere die echten AppData-Pfade
const possiblePaths = [
  path.join(process.env.APPDATA || '', 'rawalite'),
  path.join(process.env.APPDATA || '', 'RawaLite'), 
  path.join(process.env.APPDATA || '', 'RaWaLite'),
  path.join(process.env.APPDATA || '', 'rawalite-test')
];

async function checkDatabaseFiles() {
  console.log('🔍 Checking for database files in possible locations...\n');
  
  for (const appDataPath of possiblePaths) {
    const dbPath = path.join(appDataPath, 'database.sqlite');
    
    try {
      const stats = await fs.stat(dbPath);
      console.log('✅ FOUND:', dbPath);
      console.log('   📊 Size:', stats.size, 'bytes');
      console.log('   📅 Modified:', stats.mtime.toLocaleString());
      console.log('   📝 Created:', stats.birthtime.toLocaleString());
      
      // Lese ersten Bytes um SQLite-Header zu prüfen
      const handle = await fs.open(dbPath, 'r');
      const buffer = Buffer.alloc(16);
      await handle.read(buffer, 0, 16, 0);
      await handle.close();
      
      const header = buffer.toString('ascii', 0, 16);
      if (header.startsWith('SQLite format 3')) {
        console.log('   ✅ Valid SQLite file header detected');
      } else {
        console.log('   ⚠️  Non-SQLite header:', header);
      }
      console.log('');
      
    } catch (error) {
      console.log('❌ NOT FOUND:', dbPath);
    }
  }
}

async function createTestDatabase() {
  console.log('\n🧪 Creating test database to verify write permissions...');
  
  const testPath = path.join(process.env.APPDATA || '', 'rawalite-validation-test');
  const testDbPath = path.join(testPath, 'test-database.sqlite');
  
  try {
    // Erstelle Ordner
    await fs.mkdir(testPath, { recursive: true });
    
    // SQLite-Header + minimal content
    const sqliteHeader = 'SQLite format 3\x00';
    const padding = Buffer.alloc(100 - sqliteHeader.length, 0);
    const testData = Buffer.concat([Buffer.from(sqliteHeader, 'binary'), padding]);
    
    await fs.writeFile(testDbPath, testData);
    console.log('✅ Test database created:', testDbPath);
    
    // Teste Lesen
    const readData = await fs.readFile(testDbPath);
    console.log('✅ Test database read successful, size:', readData.length);
    
    // Cleanup
    await fs.unlink(testDbPath);
    await fs.rmdir(testPath);
    console.log('✅ Test cleanup completed');
    
  } catch (error) {
    console.error('❌ Test database creation failed:', error.message);
  }
}

async function validateElectronPathResolution() {
  console.log('\n🔍 Checking Electron app.getPath() potential values...');
  
  // Simuliere was Electron zurückgeben könnte
  const electronPaths = [
    path.join(process.env.APPDATA || '', 'rawalite'),  // package.json name
    path.join(process.env.APPDATA || '', 'RawaLite'),  // productName
    path.join(process.env.APPDATA || '', 'Electron')   // fallback
  ];
  
  for (const ePath of electronPaths) {
    try {
      const stats = await fs.stat(ePath);
      console.log('✅ Existing Electron path:', ePath);
      console.log('   📅 Last access:', stats.atime.toLocaleString());
    } catch {
      console.log('❌ No Electron path:', ePath);
    }
  }
}

// Main execution
async function main() {
  await checkDatabaseFiles();
  await createTestDatabase();
  await validateElectronPathResolution();
  
  console.log('\n📋 Summary:');
  console.log('- If no database.sqlite found: Persistence may be failing');
  console.log('- If test creation failed: Permission/path issues');
  console.log('- Check console logs in browser/Electron for detailed debugging');
  console.log('\n✅ Validation completed');
}

main().catch(console.error);