import initSqlJs from 'sql.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Database Schema Explorer for Schema Direktfix
 */

async function exploreSchema() {
  console.log('🔍 DATABASE SCHEMA EXPLORER');
  console.log('='.repeat(50));
  
  try {
    const SQL = await initSqlJs({
      locateFile: file => {
        if (file.endsWith('.wasm')) {
          return path.join(__dirname, '..', 'node_modules', 'sql.js', 'dist', file);
        }
        return file;
      }
    });
    
    const dbPath = 'C:/Users/ramon/AppData/Roaming/Electron/database/rawalite.db';
    const data = fs.readFileSync(dbPath);
    const db = new SQL.Database(data);
    
    // Find navigation-related tables
    console.log('📋 Navigation-related tables:');
    const navTables = db.exec(`SELECT name FROM sqlite_master WHERE type='table' AND (name LIKE '%nav%' OR name LIKE '%mode%' OR name LIKE '%setting%')`);
    if (navTables[0]?.values.length > 0) {
      navTables[0].values.forEach(row => console.log(`   - ${row[0]}`));
    } else {
      console.log('   (no navigation tables found)');
    }
    
    // Check user_navigation_preferences table
    console.log('\n🔍 user_navigation_preferences schema:');
    try {
      const navSchema = db.exec('PRAGMA table_info(user_navigation_preferences)');
      if (navSchema[0]?.values.length > 0) {
        navSchema[0].values.forEach(row => {
          console.log(`   ${row[1]} (${row[2]})`);
        });
        
        // Show sample data
        console.log('\n📄 Sample user_navigation_preferences data:');
        const navData = db.exec('SELECT * FROM user_navigation_preferences LIMIT 3');
        if (navData[0]?.values.length > 0) {
          navData[0].values.forEach(row => {
            console.log(`   Record: ${JSON.stringify(row)}`);
          });
        } else {
          console.log('   (no data found)');
        }
      }
    } catch (error) {
      console.log(`   ❌ user_navigation_preferences: ${error.message}`);
    }
    
    // Check user_navigation_mode_settings table
    console.log('\n🔍 user_navigation_mode_settings schema:');
    try {
      const modeSchema = db.exec('PRAGMA table_info(user_navigation_mode_settings)');
      if (modeSchema[0]?.values.length > 0) {
        modeSchema[0].values.forEach(row => {
          console.log(`   ${row[1]} (${row[2]})`);
        });
        
        // Show sample data
        console.log('\n📄 Sample user_navigation_mode_settings data:');
        const modeData = db.exec('SELECT * FROM user_navigation_mode_settings LIMIT 3');
        if (modeData[0]?.values.length > 0) {
          modeData[0].values.forEach(row => {
            console.log(`   Record: ${JSON.stringify(row)}`);
          });
        } else {
          console.log('   (no data found)');
        }
      }
    } catch (error) {
      console.log(`   ❌ user_navigation_mode_settings: ${error.message}`);
    }
    
    // Check settings table for navigation data
    console.log('\n🔍 settings table for navigation:');
    try {
      const settingsSchema = db.exec('PRAGMA table_info(settings)');
      if (settingsSchema[0]?.values.length > 0) {
        settingsSchema[0].values.forEach(row => {
          console.log(`   ${row[1]} (${row[2]})`);
        });
        
        // Show navigation-related settings
        console.log('\n📄 Settings data:');
        const settingsData = db.exec('SELECT * FROM settings');
        if (settingsData[0]?.values.length > 0) {
          settingsData[0].values.forEach(row => {
            console.log(`   Record: ${JSON.stringify(row)}`);
          });
        }
      }
    } catch (error) {
      console.log(`   ❌ settings: ${error.message}`);
    }
    
    // Look for theme tables
    console.log('\n🔍 themes table schema:');
    try {
      const themeSchema = db.exec('PRAGMA table_info(themes)');
      if (themeSchema[0]?.values.length > 0) {
        themeSchema[0].values.forEach(row => {
          console.log(`   ${row[1]} (${row[2]})`);
        });
        
        // Show sample themes
        console.log('\n📄 Sample themes:');
        const themeData = db.exec('SELECT id, name, display_name, is_system FROM themes LIMIT 3');
        if (themeData[0]?.values.length > 0) {
          themeData[0].values.forEach(row => {
            console.log(`   Theme: ${JSON.stringify(row)}`);
          });
        }
      }
    } catch (error) {
      console.log(`   ❌ themes: ${error.message}`);
    }
    
    db.close();
    
  } catch (error) {
    console.error('❌ Schema exploration failed:', error.message);
    process.exit(1);
  }
}

exploreSchema();