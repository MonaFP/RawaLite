// Test better-sqlite3 in Electron context and apply Schema Direktfix
// This will be executed in the renderer process via IPC

window.electronAPI.invoke('test-better-sqlite3-and-direktfix').then(result => {
  console.log('✅ Schema Direktfix Result:', result);
}).catch(error => {
  console.error('❌ Schema Direktfix Error:', error);
});