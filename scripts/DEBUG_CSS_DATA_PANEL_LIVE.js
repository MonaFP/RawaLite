// LIVE CSS DEBUG für Data Panel Mode - PERSISTENT GAP ANALYSIS
// User Report: Lücke zwischen Sidebar und Content immernoch da

console.log('=== LIVE CSS DEBUG - DATA PANEL MODE GAP ANALYSIS ===');

// 1. App Container Grid Values
const app = document.querySelector('.app');
const computedStyle = getComputedStyle(app);

console.log('🔍 APP CONTAINER ANALYSIS:');
console.log('data-navigation-mode:', app.getAttribute('data-navigation-mode'));
console.log('gridTemplateColumns:', computedStyle.gridTemplateColumns);
console.log('gridTemplateRows:', computedStyle.gridTemplateRows);
console.log('gridTemplateAreas:', computedStyle.gridTemplateAreas);

// 2. CSS Variables Check
console.log('\n🔍 CSS VARIABLES:');
console.log('--db-mode-data-panel-grid-template-columns:', computedStyle.getPropertyValue('--db-mode-data-panel-grid-template-columns'));
console.log('--active-header-height:', computedStyle.getPropertyValue('--active-header-height'));

// 3. Body/HTML Override Check
const body = document.body;
const html = document.documentElement;
const bodyStyle = getComputedStyle(body);
const htmlStyle = getComputedStyle(html);

console.log('\n🔍 BODY/HTML GRID CHECK:');
console.log('Body gridTemplateColumns:', bodyStyle.gridTemplateColumns);
console.log('HTML gridTemplateColumns:', htmlStyle.gridTemplateColumns);

// 4. Sidebar Element Analysis
const sidebar = document.querySelector('.sidebar');
const sidebarStyle = getComputedStyle(sidebar);

console.log('\n🔍 SIDEBAR ANALYSIS:');
console.log('Sidebar gridArea:', sidebarStyle.gridArea);
console.log('Sidebar width:', sidebarStyle.width);
console.log('Sidebar position:', sidebarStyle.position);

// 5. Main Content Analysis
const main = document.querySelector('main');
const mainStyle = getComputedStyle(main);

console.log('\n🔍 MAIN CONTENT ANALYSIS:');
console.log('Main gridArea:', mainStyle.gridArea);
console.log('Main marginLeft:', mainStyle.marginLeft);
console.log('Main paddingLeft:', mainStyle.paddingLeft);

// 6. Computed Layout Values
const appRect = app.getBoundingClientRect();
const sidebarRect = sidebar ? sidebar.getBoundingClientRect() : null;
const mainRect = main ? main.getBoundingClientRect() : null;

console.log('\n🔍 COMPUTED LAYOUT:');
console.log('App width:', appRect.width);
if (sidebarRect) {
  console.log('Sidebar left:', sidebarRect.left, 'width:', sidebarRect.width, 'right:', sidebarRect.right);
}
if (mainRect) {
  console.log('Main left:', mainRect.left, 'width:', mainRect.width);
}

// 7. GAP CALCULATION
if (sidebarRect && mainRect) {
  const gap = mainRect.left - sidebarRect.right;
  console.log('\n🚨 ACTUAL GAP:', gap, 'px');
  console.log('Expected Gap: 0px');
  
  if (gap > 5) {
    console.log('❌ CONFIRMED: Layout gap detected!');
    console.log('Sidebar right edge:', sidebarRect.right);
    console.log('Main left edge:', mainRect.left);
  } else {
    console.log('✅ No significant gap detected');
  }
}

// 8. CSS Rule Detection
console.log('\n🔍 ACTIVE CSS RULES:');
const allRules = [];
for (let sheet of document.styleSheets) {
  try {
    for (let rule of sheet.cssRules) {
      if (rule.selectorText && rule.selectorText.includes('data-navigation-mode')) {
        allRules.push({
          selector: rule.selectorText,
          declarations: rule.style.cssText
        });
      }
    }
  } catch(e) {
    console.log('Could not access stylesheet:', sheet.href);
  }
}

console.log('Found CSS rules:', allRules.length);
allRules.forEach(rule => {
  console.log('Rule:', rule.selector);
  console.log('  CSS:', rule.declarations);
});

console.log('\n=== DEBUG COMPLETE ===');