// LIVE CSS DEBUG für Dashboard View Mode - GAP + HEADER ANALYSIS
// User Report: Sidebar-Content Lücke + KEIN Header + Überdimensioniertes Firmenlogo

console.log('=== LIVE CSS DEBUG - DASHBOARD VIEW MODE ANALYSIS ===');

// 1. App Container Grid Values
const app = document.querySelector('.app');
const computedStyle = getComputedStyle(app);

console.log('🔍 APP CONTAINER ANALYSIS:');
console.log('data-navigation-mode:', app.getAttribute('data-navigation-mode'));
console.log('gridTemplateColumns:', computedStyle.gridTemplateColumns);
console.log('gridTemplateRows:', computedStyle.gridTemplateRows);
console.log('gridTemplateAreas:', computedStyle.gridTemplateAreas);

// 2. Header Analysis - Dashboard View sollte HeaderStatistics haben
const header = document.querySelector('.header') || document.querySelector('.mode-dashboard-view');
console.log('\n🔍 HEADER ANALYSIS:');
if (header) {
  const headerStyle = getComputedStyle(header);
  console.log('Header found:', header.className);
  console.log('Header display:', headerStyle.display);
  console.log('Header gridArea:', headerStyle.gridArea);
  console.log('Header height:', headerStyle.height);
  console.log('Header visibility:', headerStyle.visibility);
} else {
  console.log('❌ NO HEADER FOUND! Expected .header or .mode-dashboard-view');
}

// 3. Sidebar Analysis - Compact Sidebar
const sidebar = document.querySelector('.compact-sidebar') || document.querySelector('.sidebar');
console.log('\n🔍 SIDEBAR ANALYSIS:');
if (sidebar) {
  const sidebarStyle = getComputedStyle(sidebar);
  const sidebarRect = sidebar.getBoundingClientRect();
  console.log('Sidebar found:', sidebar.className);
  console.log('Sidebar gridArea:', sidebarStyle.gridArea);
  console.log('Sidebar width (CSS):', sidebarStyle.width);
  console.log('Sidebar width (computed):', sidebarRect.width + 'px');
  console.log('Sidebar position:', sidebarRect.left, 'to', sidebarRect.right);
} else {
  console.log('❌ NO SIDEBAR FOUND! Expected .compact-sidebar');
}

// 4. Main Content Analysis
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

// 5. GAP CALCULATION
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
  } else {
    console.log('✅ No significant gap detected');
  }
}

// 6. Firmenlogo Analysis - Überdimensioniert?
const companyLogos = document.querySelectorAll('[data-company="logo"], .company-logo');
console.log('\n🔍 FIRMENLOGO ANALYSIS:');
console.log('Found company logos:', companyLogos.length);

companyLogos.forEach((logo, index) => {
  const logoStyle = getComputedStyle(logo);
  const logoRect = logo.getBoundingClientRect();
  console.log(`Logo ${index + 1}:`);
  console.log('  Element:', logo.tagName + (logo.className ? '.' + logo.className : ''));
  console.log('  CSS width:', logoStyle.width);
  console.log('  CSS height:', logoStyle.height);
  console.log('  Computed size:', logoRect.width + 'x' + logoRect.height + 'px');
  console.log('  Parent:', logo.parentElement?.className || 'unknown');
});

// 7. CSS Variables Dashboard View
console.log('\n🔍 CSS VARIABLES - DASHBOARD VIEW:');
console.log('--db-mode-dashboard-view-grid-template-columns:', computedStyle.getPropertyValue('--db-mode-dashboard-view-grid-template-columns'));
console.log('--db-mode-dashboard-view-grid-template-rows:', computedStyle.getPropertyValue('--db-mode-dashboard-view-grid-template-rows'));
console.log('--mode-dashboard-view-header-height:', computedStyle.getPropertyValue('--mode-dashboard-view-header-height'));

// 8. NavigationContext Debug Info aus Console Logs
console.log('\n🔍 NAVIGATION CONTEXT DATA:');
console.log('Expected from Console Logs:');
console.log('  sidebarWidth: 280 (but sidebar shows 240px!)');
console.log('  headerHeight: 160');
console.log('  gridTemplateColumns: "280px 1fr"');
console.log('  gridTemplateRows: "160px 1fr auto"');

console.log('\n=== DASHBOARD VIEW DEBUG COMPLETE ===');