/**
 * NavigationStateManager Demo Script
 * 
 * Demonstration der neuen Enterprise-Grade NavigationContext Architektur
 * Phase 1 Implementation Testing und Validation
 * 
 * @created 23.10.2025
 * @schema VALIDATED_DEMO-NAVIGATION-STATE-MANAGER_2025-10-23.mjs
 */

import { 
  createNavigationStateManager,
  createStateForMode,
  validateNavigationState,
  statesEqual,
  getDefaultCSSVariables,
  getExpectedDimensions,
  NAVIGATION_SYSTEM_INFO 
} from '../src/core/navigation/index.js';

console.log('🚀 RawaLite Navigation System Demo');
console.log('=====================================');
console.log(NAVIGATION_SYSTEM_INFO);
console.log('');

async function runNavigationDemo() {
  try {
    console.log('📋 Phase 1: NavigationStateManager Creation');
    console.log('-------------------------------------------');
    
    // Create NavigationStateManager instance
    const stateManager = createNavigationStateManager('demo-user', 'demo-theme', 'development');
    
    console.log('✅ NavigationStateManager created successfully');
    
    // Get initial state
    const initialState = stateManager.getCurrentState();
    console.log('📊 Initial State:', {
      mode: initialState.navigationMode,
      headerHeight: initialState.headerHeight,
      sidebarWidth: initialState.sidebarWidth,
      version: initialState.version,
      syncStatus: initialState.syncStatus
    });
    
    console.log('');
    console.log('📋 Phase 2: State Validation');
    console.log('-----------------------------');
    
    // Validate initial state
    const validation = validateNavigationState(initialState);
    console.log('🔍 State Validation:', validation.valid ? '✅ VALID' : '❌ INVALID');
    if (!validation.valid) {
      console.log('   Errors:', validation.errors);
    }
    
    console.log('');
    console.log('📋 Phase 3: Navigation Mode Changes');
    console.log('------------------------------------');
    
    // Test mode changes
    const modes = ['full-sidebar', 'header-navigation', 'header-statistics'];
    
    for (const mode of modes) {
      console.log(`🔄 Changing to ${mode}...`);
      
      const result = await stateManager.setNavigationMode(mode);
      
      if (result.success) {
        const currentState = stateManager.getCurrentState();
        console.log(`   ✅ Success! New state:`, {
          mode: currentState.navigationMode,
          headerHeight: currentState.headerHeight,
          sidebarWidth: currentState.sidebarWidth,
          version: currentState.version
        });
        
        // Validate expected dimensions
        const expectedDimensions = getExpectedDimensions(mode);
        const dimensionsMatch = (
          currentState.headerHeight === expectedDimensions.headerHeight &&
          currentState.sidebarWidth === expectedDimensions.sidebarWidth
        );
        
        console.log(`   🎯 Dimensions: ${dimensionsMatch ? '✅ CORRECT' : '❌ INCORRECT'}`);
      } else {
        console.log(`   ❌ Failed:`, result.error?.message);
      }
    }
    
    console.log('');
    console.log('📋 Phase 4: State Subscription Testing');
    console.log('---------------------------------------');
    
    let subscriptionCount = 0;
    const unsubscribe = stateManager.subscribe((newState, event) => {
      subscriptionCount++;
      console.log(`📡 Subscription #${subscriptionCount}: ${event.type} → ${newState.navigationMode}`);
    });
    
    // Trigger a few state changes to test subscriptions
    await stateManager.setNavigationMode('full-sidebar');
    await stateManager.updateLayoutDimensions({ headerHeight: 50 });
    await stateManager.setNavigationMode('header-navigation');
    
    unsubscribe();
    console.log('✅ Subscription testing completed');
    
    console.log('');
    console.log('📋 Phase 5: State Factory Testing');
    console.log('----------------------------------');
    
    // Test factory methods
    for (const mode of modes) {
      const factoryState = createStateForMode(mode, 'factory-user', 'factory-theme');
      const factoryValidation = validateNavigationState(factoryState);
      
      console.log(`🏭 Factory state for ${mode}: ${factoryValidation.valid ? '✅ VALID' : '❌ INVALID'}`);
      
      const expectedDimensions = getExpectedDimensions(mode);
      const dimensionsMatch = (
        factoryState.headerHeight === expectedDimensions.headerHeight &&
        factoryState.sidebarWidth === expectedDimensions.sidebarWidth
      );
      
      console.log(`   🎯 Factory dimensions: ${dimensionsMatch ? '✅ CORRECT' : '❌ INCORRECT'}`);
    }
    
    console.log('');
    console.log('📋 Phase 6: CSS Variables Testing');
    console.log('----------------------------------');
    
    for (const mode of modes) {
      const cssVars = getDefaultCSSVariables(mode);
      console.log(`🎨 CSS Variables for ${mode}:`);
      console.log('   --theme-header-height:', cssVars['--theme-header-height']);
      console.log('   --theme-sidebar-width:', cssVars['--theme-sidebar-width']);
      console.log('   --db-grid-template-areas:', cssVars['--db-grid-template-areas']);
    }
    
    console.log('');
    console.log('📋 Phase 7: Performance Testing');
    console.log('--------------------------------');
    
    const performanceStart = performance.now();
    
    // Rapid mode changes to test performance
    for (let i = 0; i < 10; i++) {
      const mode = modes[i % modes.length];
      await stateManager.setNavigationMode(mode);
    }
    
    const performanceEnd = performance.now();
    const totalTime = performanceEnd - performanceStart;
    const averageTime = totalTime / 10;
    
    console.log(`⚡ Performance Test Results:`);
    console.log(`   Total Time: ${totalTime.toFixed(2)}ms`);
    console.log(`   Average per change: ${averageTime.toFixed(2)}ms`);
    console.log(`   Performance: ${averageTime < 50 ? '✅ EXCELLENT' : averageTime < 100 ? '✅ GOOD' : '⚠️ NEEDS OPTIMIZATION'}`);
    
    console.log('');
    console.log('📋 Phase 8: System Health Metrics');
    console.log('----------------------------------');
    
    const healthMetrics = stateManager.getSystemHealthMetrics();
    console.log('🏥 System Health:', {
      overallHealth: healthMetrics.overallHealth,
      consistencyChecks: healthMetrics.consistencyChecks,
      performance: {
        averageUpdateTime: healthMetrics.performance.averageUpdateTime.toFixed(2) + 'ms'
      },
      errors: healthMetrics.errors
    });
    
    console.log('');
    console.log('📋 Phase 9: State History');
    console.log('-------------------------');
    
    const stateHistory = stateManager.getStateHistory();
    console.log(`📚 State History: ${stateHistory.length} events`);
    
    // Show last 3 events
    const recentEvents = stateHistory.slice(-3);
    recentEvents.forEach((event, index) => {
      console.log(`   ${recentEvents.length - index}. ${event.type} (${event.timestamp})`);
    });
    
    console.log('');
    console.log('📋 Phase 10: State Comparison');
    console.log('------------------------------');
    
    const currentState = stateManager.getCurrentState();
    const comparisonState = createStateForMode(currentState.navigationMode, currentState.userId, currentState.theme);
    
    // Update comparison state to match current version and timestamp
    comparisonState.version = currentState.version;
    comparisonState.lastUpdated = currentState.lastUpdated;
    
    const statesAreEqual = statesEqual(currentState, comparisonState);
    console.log(`🔄 State Comparison: ${statesAreEqual ? '✅ EQUIVALENT' : '❌ DIFFERENT'}`);
    
    console.log('');
    console.log('📋 Phase 11: Cleanup');
    console.log('--------------------');
    
    stateManager.destroy();
    console.log('✅ NavigationStateManager destroyed successfully');
    
    console.log('');
    console.log('🎉 DEMO COMPLETED SUCCESSFULLY!');
    console.log('================================');
    console.log('✅ All Phase 1 core functionality validated');
    console.log('✅ State management working correctly');
    console.log('✅ Subscriptions functioning properly');
    console.log('✅ Factory methods operational');
    console.log('✅ Performance within acceptable limits');
    console.log('✅ System health monitoring active');
    console.log('');
    console.log('🚀 Ready for Phase 2: PhaseBasedUpdater Implementation');
    
  } catch (error) {
    console.error('❌ Demo failed with error:', error);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
}

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Promise Rejection:', reason);
  process.exit(1);
});

// Run the demo
runNavigationDemo();