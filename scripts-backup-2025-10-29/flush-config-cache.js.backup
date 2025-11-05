// EMERGENCY CONFIG CACHE FLUSH
// Dieses Script invalidiert den Central Configuration Cache

console.log('=== FLUSH CONFIGURATION CACHE ===');

// Check if ConfigurationIpcService exists
try {
  // Get ConfigurationIpcService instance
  const configService = window.rawalite?.configurationIpc;
  
  if (configService && typeof configService.clearCache === 'function') {
    console.log('ConfigurationIpcService found - clearing cache...');
    configService.clearCache();
    console.log('✅ Cache cleared successfully!');
    
    // Force reload configuration
    console.log('Forcing configuration reload...');
    window.location.reload();
  } else {
    console.log('ConfigurationIpcService not found or clearCache method missing');
    console.log('Available rawalite services:', Object.keys(window.rawalite || {}));
  }
} catch (error) {
  console.error('Error during cache flush:', error);
}

// Alternative: Direct cache access via global
try {
  // Check if config cache is available globally  
  if (window.electronAPI && window.electronAPI.configuration) {
    console.log('Direct IPC invalidation attempt...');
    
    // Clear any cached values
    delete window.electronAPI.configuration._cache;
    console.log('✅ Direct cache cleared');
  }
} catch (error) {
  console.error('Direct cache clear failed:', error);
}

console.log('=== CACHE FLUSH COMPLETE ===');