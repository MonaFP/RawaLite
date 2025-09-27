// Suche nach echten RawaLite LocalStorage-Daten
const fs = require('fs');
const path = require('path');

function findRawaLiteData() {
  console.log('🔍 [DATA-SEARCH] Suche nach echten RawaLite-Daten...');
  
  const userDataPath = "C:\\Users\\ramon\\AppData\\Roaming\\Electron";
  const possiblePaths = [
    path.join(userDataPath, "Local Storage"),
    path.join(userDataPath, "Session Storage"), 
    path.join(userDataPath, "IndexedDB"),
    path.join(userDataPath, "Shared Dictionary"),
    path.join(userDataPath, "databases"),
    path.join(userDataPath, "WebStorage"),
    userDataPath
  ];
  
  console.log('📁 Durchsuche mögliche Pfade...');
  
  for (const searchPath of possiblePaths) {
    console.log(`\n🔍 Pfad: ${searchPath}`);
    
    try {
      if (fs.existsSync(searchPath)) {
        console.log('  ✅ Pfad existiert');
        
        const items = fs.readdirSync(searchPath);
        items.forEach(item => {
          const fullPath = path.join(searchPath, item);
          const stats = fs.statSync(fullPath);
          
          if (stats.isFile()) {
            console.log(`  📄 ${item} (${stats.size} bytes)`);
            
            // Prüfe ob es RawaLite-Daten enthalten könnte
            if (item.includes('rawalite') || item.includes('Local Storage') || item.includes('.db')) {
              console.log(`    🎯 KANDIDAT: ${item}`);
              
              try {
                // Versuche Datei zu lesen und nach RawaLite-Inhalten zu suchen
                const content = fs.readFileSync(fullPath, 'utf8');
                if (content.includes('rawalite') || content.includes('customers') || content.includes('timesheets')) {
                  console.log(`    ✅ TREFFER: Enthält RawaLite-Begriffe`);
                  console.log(`    📋 Pfad: ${fullPath}`);
                  
                  // Sample des Inhalts zeigen (erste 200 Zeichen)
                  const sample = content.substring(0, 200).replace(/\n/g, '\\n');
                  console.log(`    📝 Sample: ${sample}...`);
                }
              } catch (error) {
                // Binary-Dateien oder Permissions-Probleme
                console.log(`    ⚠️ Kann nicht lesen: ${error.message}`);
              }
            }
          } else if (stats.isDirectory()) {
            console.log(`  📁 ${item}/`);
          }
        });
      } else {
        console.log('  ❌ Pfad existiert nicht');
      }
    } catch (error) {
      console.log(`  ❌ Fehler: ${error.message}`);
    }
  }
  
  console.log('\n🔍 [DATA-SEARCH] Suche abgeschlossen');
}

findRawaLiteData();