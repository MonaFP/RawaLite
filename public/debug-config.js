// Debug tool to inspect current configuration state
window.debugConfig = () => {
  console.log('=== NAVIGATION CONTEXT DEBUG ===');
  
  // Check if NavigationContext is available
  const appElement = document.querySelector('.app');
  if (appElement) {
    console.log('App element data-navigation-mode:', appElement.getAttribute('data-navigation-mode'));
  }

  // Check document.documentElement attributes
  console.log('documentElement data-navigation-mode:', document.documentElement.getAttribute('data-navigation-mode'));
  
  // Check CSS Custom Properties
  const computedStyles = getComputedStyle(document.documentElement);
  const dbVars = {};
  Array.from(document.documentElement.style).forEach(prop => {
    if (prop.startsWith('--db-') || prop.startsWith('--theme-')) {
      dbVars[prop] = document.documentElement.style.getPropertyValue(prop);
    }
  });
  console.log('CSS Custom Properties (style):', dbVars);
  
  // Check computed CSS variables
  const computedDbVars = {};
  ['--db-grid-template-areas', '--db-grid-template-columns', '--db-grid-template-rows', 
   '--theme-sidebar-width', '--theme-header-height'].forEach(prop => {
    computedDbVars[prop] = computedStyles.getPropertyValue(prop);
  });
  console.log('CSS Custom Properties (computed):', computedDbVars);
  
  // Check actual grid styles on app element
  if (appElement) {
    const appStyles = getComputedStyle(appElement);
    console.log('App computed grid styles:', {
      display: appStyles.display,
      gridTemplateAreas: appStyles.gridTemplateAreas,
      gridTemplateColumns: appStyles.gridTemplateColumns,
      gridTemplateRows: appStyles.gridTemplateRows
    });
  }
  
  return 'Debug completed - check console for details';
};

console.log('🔧 Debug tool loaded - run debugConfig() to inspect current state');