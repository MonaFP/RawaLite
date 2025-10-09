/**
 * Direct Progress Test - Simuliert Download-Fortschritt über IPC
 */

const { ipcRenderer } = require('electron');

console.log('🚀 Starting Direct Progress Test...');

// Simulate checking for updates
ipcRenderer.invoke('updates:check').then(result => {
  console.log('✅ Update check result:', result);
  
  if (result.hasUpdate) {
    console.log('🔄 Starting download...');
    
    // Listen for progress updates
    ipcRenderer.on('update-download-progress', (event, progress) => {
      console.log('📊 Progress update:', {
        percent: progress.percent,
        transferred: progress.transferred,
        total: progress.total,
        speed: progress.speed
      });
    });
    
    // Start download
    ipcRenderer.invoke('updates:download').then(() => {
      console.log('✅ Download completed!');
    }).catch(error => {
      console.error('❌ Download failed:', error);
    });
  } else {
    console.log('ℹ️ No update available');
  }
}).catch(error => {
  console.error('❌ Update check failed:', error);
});