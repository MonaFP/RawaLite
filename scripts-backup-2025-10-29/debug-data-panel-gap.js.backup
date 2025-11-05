// LIVE CSS DEBUG für Data Panel Mode - GAP + SIDEBAR TYPE ANALYSIS
// User Report: Data Panel hat immernoch eine 40px Lücke zwischen Sidebar und Content

console.log('=== LIVE CSS DEBUG - DATA PANEL MODE ANALYSIS ===');

// 1. App Container Grid Values
const app = document.querySelector('.app');
const computedStyle = getComputedStyle(app);

console.log('🔍 APP CONTAINER ANALYSIS:');
console.log('data-navigation-mode:', app.getAttribute('data-navigation-mode'));
console.log('gridTemplateColumns:', computedStyle.gridTemplateColumns);
console.log('gridTemplateRows:', computedStyle.gridTemplateRows);
console.log('gridTemplateAreas:', computedStyle.gridTemplateAreas);

// 2. Expected vs Actual Navigation Mode
console.log('\n🔍 NAVIGATION MODE VERIFICATION:');
const expectedMode = 'mode-data-panel';
const actualMode = app.getAttribute('data-navigation-mode');
console.log('Expected Mode:', expectedMode);
console.log('Actual Mode:', actualMode);
if (actualMode === expectedMode) {
  console.log('✅ Mode is correct');
} else {
  console.log('❌ MODE MISMATCH! Expected data panel but found:', actualMode);
}

// 3. Header Analysis - Data Panel sollte HeaderNavigation haben
const header = document.querySelector('.header');
console.log('\n🔍 HEADER ANALYSIS:');
if (header) {
  const headerStyle = getComputedStyle(header);
  const headerChildren = Array.from(header.children).map(child => child.className || child.tagName);
  console.log('Header found:', header.className);
  console.log('Header children:', headerChildren);
  console.log('Header display:', headerStyle.display);
  console.log('Header gridArea:', headerStyle.gridArea);
  console.log('Header height:', headerStyle.height);
  
  // Check for HeaderNavigation vs HeaderStatistics
  const hasNavigation = header.querySelector('.header-navigation');
  const hasStatistics = header.querySelector('.header-statistics');
  console.log('Has HeaderNavigation:', !!hasNavigation);
  console.log('Has HeaderStatistics:', !!hasStatistics);
} else {
  console.log('❌ NO HEADER FOUND!');
}

// 4. Sidebar Analysis - Data Panel sollte CompactSidebar haben
const sidebar = document.querySelector('.sidebar');
console.log('\n🔍 SIDEBAR TYPE ANALYSIS:');
if (sidebar) {
  const sidebarStyle = getComputedStyle(sidebar);
  const sidebarRect = sidebar.getBoundingClientRect();
  
  console.log('Sidebar found:', sidebar.className);
  console.log('Sidebar gridArea:', sidebarStyle.gridArea);
  console.log('Sidebar width (CSS):', sidebarStyle.width);
  console.log('Sidebar width (computed):', sidebarRect.width + 'px');
  console.log('Sidebar position:', sidebarRect.left, 'to', sidebarRect.right);
  
  // Check sidebar type
  const isCompactSidebar = sidebar.classList.contains('compact-sidebar');
  const isNavigationOnly = sidebar.classList.contains('navigation-only-sidebar');
  
  console.log('\n🔍 SIDEBAR TYPE CHECK:');
  console.log('Is CompactSidebar:', isCompactSidebar);
  console.log('Is NavigationOnlySidebar:', isNavigationOnly);
  
  if (actualMode === 'mode-data-panel') {
    if (isCompactSidebar) {
      console.log('✅ Correct: Data Panel uses CompactSidebar');
    } else if (isNavigationOnly) {
      console.log('❌ WRONG SIDEBAR TYPE! Data Panel should use CompactSidebar, not NavigationOnlySidebar');
    } else {
      console.log('❓ Unknown sidebar type for Data Panel');
    }
  }
  
  // Check sidebar content
  console.log('\n🔍 SIDEBAR CONTENT ANALYSIS:');
  const hasCompanySection = sidebar.querySelector('.company-section');
  const hasNavigationMenu = sidebar.querySelector('.navigation-menu');
  const hasStatisticsCards = sidebar.querySelector('.statistics-cards');
  
  console.log('Has Company Section:', !!hasCompanySection);
  console.log('Has Navigation Menu:', !!hasNavigationMenu);
  console.log('Has Statistics Cards:', !!hasStatisticsCards);
  
  if (actualMode === 'mode-data-panel') {
    // Data Panel sollte Company + Statistics haben
    if (hasCompanySection && hasStatisticsCards && !hasNavigationMenu) {
      console.log('✅ Correct Data Panel content: Company + Statistics');
    } else if (hasNavigationMenu && !hasCompanySection) {
      console.log('❌ WRONG CONTENT! Data Panel should have Company+Statistics, not Navigation Menu');
    } else {
      console.log('❓ Mixed or unexpected content in Data Panel sidebar');
    }
  }
} else {
  console.log('❌ NO SIDEBAR FOUND!');
}

// 5. Main Content Analysis
const main = document.querySelector('main') || document.querySelector('[data-area="main"]');
console.log('\n🔍 MAIN CONTENT ANALYSIS:');
if (main) {
  const mainStyle = getComputedStyle(main);
  const mainRect = main.getBoundingClientRect();
  console.log('Main found:', main.tagName + (main.className ? '.' + main.className : ''));
  console.log('Main gridArea:', mainStyle.gridArea);
  console.log('Main position:', mainRect.left, 'to', mainRect.right);
  console.log('Main width:', mainRect.width + 'px');
} else {
  console.log('❌ NO MAIN FOUND! Expected main or [data-area="main"]');
}

// 6. GAP CALCULATION
if (sidebar && main) {
  const sidebarRect = sidebar.getBoundingClientRect();
  const mainRect = main.getBoundingClientRect();
  const gap = mainRect.left - sidebarRect.right;
  
  console.log('\n🚨 GAP ANALYSIS:');
  console.log('Sidebar right edge:', sidebarRect.right + 'px');
  console.log('Main left edge:', mainRect.left + 'px');
  console.log('ACTUAL GAP:', gap + 'px');
  console.log('Expected Gap: 0px');
  
  if (gap > 5) {
    console.log('❌ CONFIRMED: Layout gap detected!');
    
    // Gap diagnosis
    console.log('\n🔍 GAP DIAGNOSIS:');
    if (sidebar.classList.contains('compact-sidebar')) {
      console.log('CompactSidebar width should be 240px, CSS Grid expects 280px → 40px gap');
    } else if (sidebar.classList.contains('navigation-only-sidebar')) {
      console.log('NavigationOnlySidebar width is 280px, matches CSS Grid → Should be no gap');
      console.log('But we are in Data Panel mode → Wrong sidebar type!');
    }
  } else {
    console.log('✅ No significant gap detected');
  }
}

// 7. CSS Variables Data Panel
console.log('\n🔍 CSS VARIABLES - DATA PANEL:');
console.log('--db-mode-data-panel-grid-template-columns:', computedStyle.getPropertyValue('--db-mode-data-panel-grid-template-columns'));
console.log('--db-mode-data-panel-grid-template-rows:', computedStyle.getPropertyValue('--db-mode-data-panel-grid-template-rows'));
console.log('--mode-data-panel-header-height:', computedStyle.getPropertyValue('--mode-data-panel-header-height'));

// 8. NavigationContext Debug Info
console.log('\n🔍 NAVIGATION CONTEXT DATA:');
console.log('From Console Logs we expect:');
console.log('  navigationMode: mode-data-panel');
console.log('  sidebarWidth: 280 (but CompactSidebar is only 240px!)');
console.log('  headerHeight: 160');
console.log('  gridTemplateColumns: "280px 1fr"');
console.log('  gridTemplateRows: "160px 1fr auto"');

// 9. SOLUTION ANALYSIS
console.log('\n🔧 SOLUTION ANALYSIS:');
if (actualMode === 'mode-data-panel') {
  if (sidebar.classList.contains('navigation-only-sidebar')) {
    console.log('PROBLEM 1: Wrong Sidebar Type');
    console.log('  Current: NavigationOnlySidebar (280px, Navigation Menu)');
    console.log('  Expected: CompactSidebar (240px, Company + Statistics)');
    console.log('  Fix: App.tsx routing - Data Panel should use CompactSidebar');
  }
  
  if (gap > 5) {
    console.log('PROBLEM 2: CSS Grid Width Mismatch');
    console.log('  CSS Grid expects: 280px sidebar');
    console.log('  CompactSidebar provides: 240px');
    console.log('  Fix: layout-grid.css fallback "280px" → "240px"');
  }
}

console.log('\n=== DATA PANEL DEBUG COMPLETE ===');