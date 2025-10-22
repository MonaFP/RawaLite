// Database inspection via IPC from Electron renderer
const inspectDatabaseConfig = async () => {
  try {
    console.log('=== DATABASE CONFIGURATION INSPECTION ===');
    
    // Use ConfigurationIPC to get active config
    if (window.rawalite?.ipc?.invoke) {
      console.log('🔍 Getting active configuration...');
      const activeConfig = await window.rawalite.ipc.invoke('configuration:get-active-config', {
        userId: 'default',
        theme: 'sage',
        navigationMode: 'header-navigation',
        focusMode: false
      });
      
      console.log('📊 Active Configuration:', JSON.stringify(activeConfig, null, 2));
      
      // Check navigation preferences
      console.log('🔍 Getting navigation preferences...');
      const navPrefs = await window.rawalite.ipc.invoke('navigation:get-user-preferences', 'default');
      console.log('📊 Navigation Preferences:', JSON.stringify(navPrefs, null, 2));
      
      // Check navigation mode settings
      console.log('🔍 Getting navigation mode settings...');
      const navModeSettings = await window.rawalite.ipc.invoke('navigation:get-user-mode-settings', {
        userId: 'default',
        navigationMode: 'header-navigation'
      });
      console.log('📊 Navigation Mode Settings:', JSON.stringify(navModeSettings, null, 2));
      
    } else {
      console.error('❌ IPC not available - make sure this runs in Electron renderer');
    }
  } catch (error) {
    console.error('❌ Database inspection failed:', error);
  }
};

// Make available globally
window.inspectDatabaseConfig = inspectDatabaseConfig;
console.log('🔧 Database inspector loaded - run inspectDatabaseConfig() to check database state');