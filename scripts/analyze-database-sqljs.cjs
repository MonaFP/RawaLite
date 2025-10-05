// Database Structure and Data Analysis Tool (sql.js version)
// ABI-safe alternative to analyze-database.cjs
// Uses sql.js for Node.js context compatibility
// Run with: node scripts/analyze-database-sqljs.cjs

const fs = require('fs');
const path = require('path');
const os = require('os');

async function analyzeDatabase() {
  console.log('🔍 RawaLite Database Analysis Tool (sql.js)');
  console.log('=============================================\n');

  try {
    // Load sql.js
    const initSqlJs = require('sql.js');
    const SQL = await initSqlJs();
    
    // Get database path from Electron userData
    const dbPath = path.join(os.homedir(), 'AppData', 'Roaming', 'RawaLite', 'database', 'rawalite.db');
    console.log(`📁 Database Path: ${dbPath}`);

    if (!fs.existsSync(dbPath)) {
      console.error('❌ Database not found. Make sure the Electron app has been started.');
      process.exit(1);
    }

    // Load database with sql.js
    const filebuffer = fs.readFileSync(dbPath);
    const db = new SQL.Database(filebuffer);
    console.log('✅ Database opened successfully\n');

    // 1. Database Info
    console.log('📊 DATABASE INFORMATION');
    console.log('========================');
    const dbStat = fs.statSync(dbPath);
    console.log(`Size: ${(dbStat.size / 1024).toFixed(2)} KB`);
    console.log(`Last Modified: ${dbStat.mtime.toISOString()}`);
    console.log();

    // 2. Tables Overview
    console.log('📋 TABLES OVERVIEW');
    console.log('===================');
    const tablesResult = db.exec(`
      SELECT name, sql 
      FROM sqlite_master 
      WHERE type = 'table' 
      AND name NOT LIKE 'sqlite_%'
      ORDER BY name
    `);

    if (tablesResult.length > 0 && tablesResult[0].values.length > 0) {
      const tables = tablesResult[0].values.map(row => ({
        name: row[0],
        sql: row[1]
      }));

      console.log(`Found ${tables.length} tables:`);
      for (const table of tables) {
        try {
          const countResult = db.exec(`SELECT COUNT(*) as count FROM "${table.name}"`);
          const count = countResult[0]?.values[0]?.[0] || 0;
          console.log(`  - ${table.name}: ${count} rows`);
        } catch (e) {
          console.log(`  - ${table.name}: Error counting rows`);
        }
      }
    } else {
      console.log('No tables found');
    }
    console.log();

    // 3. Offers Table Analysis
    console.log('🎯 OFFERS TABLE ANALYSIS');
    console.log('=========================');
    
    try {
      // Schema
      const offerSchemaResult = db.exec(`PRAGMA table_info(offers)`);
      if (offerSchemaResult.length > 0 && offerSchemaResult[0].values.length > 0) {
        console.log('Schema:');
        const columns = offerSchemaResult[0].values.map(row => {
          const [cid, name, type, notnull, dflt_value, pk] = row;
          const pkText = pk ? ' (PRIMARY KEY)' : '';
          const notNullText = notnull ? ' NOT NULL' : '';
          const defaultText = dflt_value ? ` DEFAULT ${dflt_value}` : '';
          return `  ${name}: ${type}${pkText}${notNullText}${defaultText}`;
        });
        columns.forEach(col => console.log(col));
        
        // Row count and status distribution
        const offerCountResult = db.exec(`SELECT COUNT(*) as count FROM offers`);
        const offerCount = offerCountResult[0]?.values[0]?.[0] || 0;
        console.log(`\nTotal offers: ${offerCount}`);
        
        if (offerCount > 0) {
          const statusDistResult = db.exec(`
            SELECT status, COUNT(*) as count 
            FROM offers 
            GROUP BY status 
            ORDER BY count DESC
          `);
          
          if (statusDistResult.length > 0 && statusDistResult[0].values.length > 0) {
            console.log('Status distribution:');
            statusDistResult[0].values.forEach(row => {
              const [status, count] = row;
              console.log(`  ${status || 'NULL'}: ${count}`);
            });
          }
          
          // Sample data
          console.log('\nSample offers (first 3):');
          const sampleResult = db.exec(`
            SELECT id, offer_number, customer_id, status, total_amount, created_at 
            FROM offers 
            ORDER BY created_at DESC 
            LIMIT 3
          `);
          
          if (sampleResult.length > 0 && sampleResult[0].values.length > 0) {
            sampleResult[0].values.forEach(row => {
              const [id, offer_number, customer_id, status, total_amount, created_at] = row;
              console.log(`  ID ${id}: ${offer_number} | Status: ${status} | Amount: ${total_amount} | Customer: ${customer_id}`);
            });
          }
        }
      }
    } catch (error) {
      console.log(`❌ Error analyzing offers: ${error.message}`);
    }
    console.log();

    // 4. Invoices Table Analysis  
    console.log('💰 INVOICES TABLE ANALYSIS');
    console.log('===========================');
    
    try {
      // Schema
      const invoiceSchemaResult = db.exec(`PRAGMA table_info(invoices)`);
      if (invoiceSchemaResult.length > 0 && invoiceSchemaResult[0].values.length > 0) {
        console.log('Schema:');
        const columns = invoiceSchemaResult[0].values.map(row => {
          const [cid, name, type, notnull, dflt_value, pk] = row;
          const pkText = pk ? ' (PRIMARY KEY)' : '';
          const notNullText = notnull ? ' NOT NULL' : '';
          const defaultText = dflt_value ? ` DEFAULT ${dflt_value}` : '';
          return `  ${name}: ${type}${pkText}${notNullText}${defaultText}`;
        });
        columns.forEach(col => console.log(col));
        
        // Row count and status distribution
        const invoiceCountResult = db.exec(`SELECT COUNT(*) as count FROM invoices`);
        const invoiceCount = invoiceCountResult[0]?.values[0]?.[0] || 0;
        console.log(`\nTotal invoices: ${invoiceCount}`);
        
        if (invoiceCount > 0) {
          const statusDistResult = db.exec(`
            SELECT status, COUNT(*) as count 
            FROM invoices 
            GROUP BY status 
            ORDER BY count DESC
          `);
          
          if (statusDistResult.length > 0 && statusDistResult[0].values.length > 0) {
            console.log('Status distribution:');
            statusDistResult[0].values.forEach(row => {
              const [status, count] = row;
              console.log(`  ${status || 'NULL'}: ${count}`);
            });
          }
          
          // Sample data
          console.log('\nSample invoices (first 3):');
          const sampleResult = db.exec(`
            SELECT id, invoice_number, customer_id, status, total_amount, created_at 
            FROM invoices 
            ORDER BY created_at DESC 
            LIMIT 3
          `);
          
          if (sampleResult.length > 0 && sampleResult[0].values.length > 0) {
            sampleResult[0].values.forEach(row => {
              const [id, invoice_number, customer_id, status, total_amount, created_at] = row;
              console.log(`  ID ${id}: ${invoice_number} | Status: ${status} | Amount: ${total_amount} | Customer: ${customer_id}`);
            });
          }
        }
      }
    } catch (error) {
      console.log(`❌ Error analyzing invoices: ${error.message}`);
    }
    console.log();

    // 5. Status Field Comparison
    console.log('🔄 STATUS FIELDS COMPARISON');
    console.log('============================');
    
    try {
      // Check if both tables have the same status columns
      const offerColsResult = db.exec(`PRAGMA table_info(offers)`);
      const invoiceColsResult = db.exec(`PRAGMA table_info(invoices)`);
      
      const offerCols = offerColsResult[0]?.values?.map(row => row[1]) || [];
      const invoiceCols = invoiceColsResult[0]?.values?.map(row => row[1]) || [];
      
      const statusColumns = ['status', 'sent_at', 'paid_at', 'overdue_at', 'cancelled_at'];
      
      console.log('Status-related columns:');
      statusColumns.forEach(col => {
        const inOffers = offerCols.includes(col);
        const inInvoices = invoiceCols.includes(col);
        const status = (inOffers && inInvoices) ? '✅' : 
                      (inOffers || inInvoices) ? '⚠️' : '❌';
        console.log(`  ${col}: Offers ${inOffers ? '✅' : '❌'} | Invoices ${inInvoices ? '✅' : '❌'} ${status}`);
      });
    } catch (error) {
      console.log(`❌ Error comparing status fields: ${error.message}`);
    }
    console.log();

    // 6. Customers Table (for context)
    console.log('👥 CUSTOMERS TABLE CONTEXT');
    console.log('===========================');
    
    try {
      const customerCountResult = db.exec(`SELECT COUNT(*) as count FROM customers`);
      const customerCount = customerCountResult[0]?.values[0]?.[0] || 0;
      console.log(`Total customers: ${customerCount}`);
      
      if (customerCount > 0) {
        const sampleResult = db.exec(`
          SELECT id, name, company 
          FROM customers 
          ORDER BY created_at DESC 
          LIMIT 3
        `);
        
        if (sampleResult.length > 0 && sampleResult[0].values.length > 0) {
          console.log('Sample customers:');
          sampleResult[0].values.forEach(row => {
            const [id, name, company] = row;
            console.log(`  ID ${id}: ${name} (${company || 'No company'})`);
          });
        }
      }
    } catch (error) {
      console.log(`❌ Error analyzing customers: ${error.message}`);
    }
    console.log();

    // 7. Settings Table (for logo context)
    console.log('⚙️ SETTINGS TABLE CONTEXT');
    console.log('==========================');
    
    try {
      const settingsCountResult = db.exec(`SELECT COUNT(*) as count FROM settings`);
      const settingsCount = settingsCountResult[0]?.values[0]?.[0] || 0;
      console.log(`Settings rows: ${settingsCount}`);
      
      if (settingsCount > 0) {
        const logoResult = db.exec(`
          SELECT id, logo
          FROM settings 
          WHERE id = 1
        `);
        
        if (logoResult.length > 0 && logoResult[0].values.length > 0) {
          const [id, logo] = logoResult[0].values[0];
          let logoStatus;
          
          if (logo === null) {
            logoStatus = 'NULL';
          } else if (logo.length === 0) {
            logoStatus = 'EMPTY';
          } else if (logo.startsWith('data:image/')) {
            logoStatus = `DATA_URL (${logo.length} chars)`;
          } else {
            logoStatus = `OTHER (${logo.length} chars)`;
          }
          
          console.log(`Logo setting (ID 1): ${logoStatus}`);
        } else {
          console.log('No settings found with ID 1');
        }
      }
    } catch (error) {
      console.log(`❌ Error analyzing settings: ${error.message}`);
    }

    console.log('\n🎯 ANALYSIS COMPLETE');
    console.log('====================');
    console.log('Database structure and data analyzed successfully.');
    console.log('Ready for status dropdown debugging.');
    console.log('💡 This version uses sql.js (Node-context safe)');

    db.close();

  } catch (error) {
    console.error('❌ Database analysis failed:', error.message);
    console.log('\n💡 Make sure sql.js is installed: pnpm add sql.js');
    process.exit(1);
  }
}

analyzeDatabase();