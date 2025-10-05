// SQLite Database Inspector using sql.js
// Alternative database access for debugging when better-sqlite3 fails
// Usage: node db/inspect-sqljs.mjs

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🔍 SQLite Database Inspector (sql.js fallback)');

// Database path detection with Electron data paths
const possibleDbPaths = [
  // Development paths
  path.join(__dirname, '..', 'src', 'database.db'),
  path.join(__dirname, '..', 'database.db'),
  path.join(__dirname, '..', 'rawalite.db'),
  path.join(__dirname, '..', 'db', 'rawalite.db'),
  
  // Electron userData paths (Windows)
  path.join(process.env.APPDATA || '', 'RawaLite', 'database.db'),
  path.join(process.env.LOCALAPPDATA || '', 'RawaLite', 'database.db'),
  
  // Alternative Electron paths
  path.join(process.env.USERPROFILE || '', 'AppData', 'Roaming', 'RawaLite', 'database.db'),
  path.join(process.env.USERPROFILE || '', 'AppData', 'Local', 'RawaLite', 'database.db'),
  
  // Fallback paths
  path.join(process.env.HOME || __dirname, 'RawaLite', 'database.db'),
  path.join(__dirname, '..', '..', 'database.db')
];

let dbPath = null;
for (const candidate of possibleDbPaths) {
  if (fs.existsSync(candidate)) {
    dbPath = candidate;
    console.log(`✅ Found database: ${dbPath}`);
    break;
  }
}

if (!dbPath) {
  console.log('❌ No database found in standard locations:');
  possibleDbPaths.forEach(p => console.log(`   - ${p}`));
  console.log('\n💡 To inspect a specific database:');
  console.log('   node db/inspect-sqljs.mjs /path/to/your/database.db');
  
  if (process.argv[2]) {
    dbPath = process.argv[2];
    if (!fs.existsSync(dbPath)) {
      console.log(`❌ Specified database not found: ${dbPath}`);
      process.exit(1);
    }
    console.log(`📁 Using specified database: ${dbPath}`);
  } else {
    process.exit(1);
  }
}

try {
  // Try to use sql.js if available
  let SQL;
  try {
    const initSqlJs = (await import('sql.js')).default;
    SQL = await initSqlJs();
  } catch (e) {
    console.log('⚠️ sql.js not available. Install with: pnpm add sql.js');
    console.log('📋 Basic file inspection instead...\n');
    
    // Fallback: Basic file info
    const stats = fs.statSync(dbPath);
    console.log(`📊 Database File Info:`);
    console.log(`   Size: ${(stats.size / 1024).toFixed(2)} KB`);
    console.log(`   Modified: ${stats.mtime.toISOString()}`);
    console.log(`   Created: ${stats.birthtime.toISOString()}`);
    
    // Check if it's a valid SQLite file
    const buffer = fs.readFileSync(dbPath, { start: 0, end: 16 });
    const header = buffer.toString('ascii');
    
    if (header.startsWith('SQLite format 3')) {
      console.log(`✅ Valid SQLite database`);
      console.log(`\n💡 To inspect content, install sql.js:`);
      console.log(`   pnpm add sql.js`);
      console.log(`   node db/inspect-sqljs.mjs`);
    } else {
      console.log(`❌ Not a valid SQLite database`);
      console.log(`   Header: ${header}`);
    }
    
    process.exit(0);
  }

  // Load and inspect database with sql.js
  console.log('📚 Loading database with sql.js...');
  
  const filebuffer = fs.readFileSync(dbPath);
  const db = new SQL.Database(filebuffer);
  
  console.log('✅ Database loaded successfully\n');
  
  // Get table list
  console.log('📋 Tables in database:');
  const tables = db.exec("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name");
  
  if (tables.length === 0) {
    console.log('   No tables found');
  } else {
    const tableNames = tables[0].values.map(row => row[0]);
    tableNames.forEach(name => console.log(`   - ${name}`));
    
    console.log('\n📊 Table Statistics:');
    
    for (const tableName of tableNames) {
      try {
        // Get row count
        const countResult = db.exec(`SELECT COUNT(*) as count FROM "${tableName}"`);
        const count = countResult[0]?.values[0]?.[0] || 0;
        
        // Get column info
        const pragmaResult = db.exec(`PRAGMA table_info("${tableName}")`);
        const columns = pragmaResult[0]?.values?.map(row => ({
          name: row[1],
          type: row[2],
          notNull: row[3],
          defaultValue: row[4],
          primaryKey: row[5]
        })) || [];
        
        console.log(`\n   ${tableName}:`);
        console.log(`     Rows: ${count}`);
        console.log(`     Columns: ${columns.length}`);
        
        if (tableName === 'offers' || tableName === 'invoices') {
          console.log(`     Schema:`);
          columns.forEach(col => {
            const pk = col.primaryKey ? ' (PK)' : '';
            const nn = col.notNull ? ' NOT NULL' : '';
            console.log(`       ${col.name}: ${col.type}${pk}${nn}`);
          });
          
          // Sample data for key tables
          if (count > 0 && count <= 5) {
            console.log(`     Sample Data:`);
            const sampleResult = db.exec(`SELECT * FROM "${tableName}" LIMIT 3`);
            if (sampleResult[0]) {
              const headers = sampleResult[0].columns;
              const rows = sampleResult[0].values;
              
              console.log(`       ${headers.join(' | ')}`);
              console.log(`       ${headers.map(h => '-'.repeat(h.length)).join('-+-')}`);
              
              rows.forEach(row => {
                const displayRow = row.map(cell => {
                  if (cell === null) return 'NULL';
                  if (typeof cell === 'string' && cell.length > 20) {
                    return cell.substring(0, 17) + '...';
                  }
                  return cell;
                });
                console.log(`       ${displayRow.join(' | ')}`);
              });
            }
          }
        }
        
      } catch (e) {
        console.log(`   ${tableName}: Error reading (${e.message})`);
      }
    }
  }
  
  // Check for status-related data specifically
  console.log('\n🎯 Status Investigation:');
  
  try {
    const offerStatusQuery = db.exec(`
      SELECT status, COUNT(*) as count 
      FROM offers 
      GROUP BY status 
      ORDER BY count DESC
    `);
    
    if (offerStatusQuery[0]) {
      console.log('   Offer Status Distribution:');
      offerStatusQuery[0].values.forEach(([status, count]) => {
        console.log(`     ${status}: ${count}`);
      });
    }
  } catch (e) {
    console.log(`   Offers status check failed: ${e.message}`);
  }
  
  try {
    const invoiceStatusQuery = db.exec(`
      SELECT status, COUNT(*) as count 
      FROM invoices 
      GROUP BY status 
      ORDER BY count DESC
    `);
    
    if (invoiceStatusQuery[0]) {
      console.log('   Invoice Status Distribution:');
      invoiceStatusQuery[0].values.forEach(([status, count]) => {
        console.log(`     ${status}: ${count}`);
      });
    }
  } catch (e) {
    console.log(`   Invoices status check failed: ${e.message}`);
  }
  
  console.log('\n✅ Database inspection complete');
  console.log('💡 This tool uses sql.js for read-only access when better-sqlite3 fails');
  
  db.close();
  
} catch (error) {
  console.error('❌ Database inspection failed:', error.message);
  console.log('\n🔧 Troubleshooting:');
  console.log('   1. Verify database path is correct');
  console.log('   2. Check database file permissions');
  console.log('   3. Ensure database is not locked by another process');
  console.log('   4. Try: pnpm add sql.js');
  process.exit(1);
}