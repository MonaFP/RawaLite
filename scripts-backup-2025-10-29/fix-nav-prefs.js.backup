import initSqlJs from 'sql.js';
import fs from 'fs';

(async () => {
  try {
    const SQL = await initSqlJs();
    const dbPath = 'C:/Users/ramon/AppData/Roaming/Electron/database/rawalite.db';
    const filebuffer = fs.readFileSync(dbPath);
    const db = new SQL.Database(filebuffer);

    console.log('🔧 FIXING NAVIGATION PREFERENCES');
    console.log('=================================');
    
    // Update user_navigation_preferences to match user_navigation_mode_settings
    console.log('Updating user_navigation_preferences header_height: 160 → 80');
    
    db.run('UPDATE user_navigation_preferences SET header_height = 80 WHERE user_id = "default"');
    
    console.log('✅ Update completed');
    
    // Save the corrected database
    const data = db.export();
    fs.writeFileSync(dbPath, Buffer.from(data));
    
    console.log('✅ Database saved successfully');
    
    // Verify the change
    const verify = db.exec('SELECT user_id, navigation_mode, header_height, sidebar_width FROM user_navigation_preferences');
    if (verify.length > 0) {
      console.log('\n📋 Verified user_navigation_preferences:');
      verify[0].values.forEach(row => {
        console.log(`User: ${row[0]}, Mode: ${row[1]}, Header: ${row[2]}px, Sidebar: ${row[3]}px`);
      });
    }
    
    db.close();
    console.log('\n🎯 Fix completed! App restart required to reload corrected values.');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
})();