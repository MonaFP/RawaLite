import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import path from 'path';
import os from 'os';

// Connect to the real production database  
const userDataPath = path.join(os.homedir(), 'AppData', 'Roaming', 'rawalite');
const dbPath = path.join(userDataPath, 'database', 'rawalite.db');
console.log('🔍 Connecting to:', dbPath);

const db = new Database(dbPath);

try {
  console.log('\n📊 Current navigation preferences:');
  const prefs = db.prepare("SELECT * FROM user_navigation_preferences").all();
  prefs.forEach(pref => {
    console.log(`   User: ${pref.user_id}, Mode: ${pref.navigation_mode}`);
    console.log(`   Header Height: ${pref.header_height}px`);
    console.log(`   Sidebar Width: ${pref.sidebar_width}px`);
    console.log(`   ---`);
  });

  console.log('\n📊 Mode-specific settings (user_navigation_mode_settings):');
  const modeSettings = db.prepare("SELECT * FROM user_navigation_mode_settings").all();
  modeSettings.forEach(setting => {
    console.log(`   User: ${setting.user_id}, Mode: ${setting.navigation_mode}`);
    console.log(`   Header Height: ${setting.header_height}px`);
    console.log(`   Sidebar Width: ${setting.sidebar_width}px`);
    console.log(`   ---`);
  });

  // Test: Try to set full-sidebar to 36px
  console.log('\n🧪 Testing: Can we set full-sidebar to 36px?');
  try {
    db.prepare(`
      UPDATE user_navigation_mode_settings 
      SET header_height = 36 
      WHERE navigation_mode = 'full-sidebar'
    `).run();
    console.log('   ✅ SUCCESS: 36px update worked!');
    
    const updated = db.prepare("SELECT header_height FROM user_navigation_mode_settings WHERE navigation_mode = 'full-sidebar'").get();
    console.log(`   📏 New full-sidebar header height: ${updated.header_height}px`);
  } catch (error) {
    console.log('   ❌ FAILED:', error.message);
  }

  // Test: Try to set below 36px (should fail)
  console.log('\n🧪 Testing: Can we set below 36px? (Should fail)');
  try {
    db.prepare(`
      UPDATE user_navigation_mode_settings 
      SET header_height = 30 
      WHERE navigation_mode = 'full-sidebar'
    `).run();
    console.log('   ⚠️ UNEXPECTED: 30px update worked (constraint too loose!)');
  } catch (error) {
    console.log('   ✅ EXPECTED FAILURE:', error.message);
  }

} catch (error) {
  console.error('❌ Database error:', error);
} finally {
  db.close();
}