// Dashboard View CSS Test - Navigation-Only-Sidebar
(function() {
  console.log('=== DASHBOARD VIEW CSS TEST (Navigation-Only-Sidebar) ===');
  console.log('Navigation mode:', document.documentElement.getAttribute('data-navigation-mode'));

  // Dashboard View uses .navigation-only-sidebar, NOT .compact-sidebar!
  const sidebar = document.querySelector('.navigation-only-sidebar');
  if (sidebar) {
    const styles = window.getComputedStyle(sidebar);
    console.log('NavigationOnlySidebar computed width:', styles.width);
    console.log('NavigationOnlySidebar offsetWidth:', sidebar.offsetWidth);
    
    // Check CSS rules for navigation-only-sidebar
    const rules = Array.from(document.styleSheets)
      .flatMap(sheet => {
        try { return Array.from(sheet.cssRules || []); }
        catch { return []; }
      })
      .filter(rule => 
        rule.selectorText && 
        rule.selectorText.includes('.navigation-only-sidebar') &&
        rule.style && rule.style.width
      );
      
    console.log('CSS rules for .navigation-only-sidebar:');
    rules.forEach(rule => {
      console.log(`- ${rule.selectorText}: width=${rule.style.width} (priority: ${rule.style.getPropertyPriority('width')})`);
    });
  } else {
    console.log('❌ No .navigation-only-sidebar element found!');
  }

  // Check grid layout
  const appLayout = document.querySelector('#app-layout');
  if (appLayout) {
    const styles = window.getComputedStyle(appLayout);
    console.log('Grid template columns:', styles.gridTemplateColumns);
  }
  
  console.log('=== TEST COMPLETED ===');
})();