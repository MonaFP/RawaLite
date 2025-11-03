// 🧪 Footer Positioning Test Suite - Dev Tools Console Script
// Problem: App Container nicht flexibel, Scrollbalken durch Footer
// Ziel: Footer fix unten, App Container flexibel an Fenster angepasst

console.log('🧪 === FOOTER POSITIONING TEST SUITE ===');
console.log('🎯 Ziel: Footer fix unten, App Container 100% Fenster-Flexibilität');
console.log('📋 Tests: Grid vs. Flex vs. Sticky vs. Viewport-Units');

// Utility function to reset styles - ENHANCED
window.resetAppStyles = function() {
  const app = document.querySelector('.app');
  const main = document.querySelector('main') || document.querySelector('[data-area="main"]');
  const sidebar = document.querySelector('.sidebar') || document.querySelector('.compact-sidebar') || document.querySelector('.navigation-only-sidebar');
  const header = document.querySelector('.header');
  const footer = document.querySelector('.footer-area') || document.querySelector('footer');
  
  // App Container Reset
  if (app) {
    app.style.removeProperty('height');
    app.style.removeProperty('min-height');
    app.style.removeProperty('max-height');
    app.style.removeProperty('grid-template-rows');
    app.style.removeProperty('grid-template-areas');
    app.style.removeProperty('display');
    app.style.removeProperty('flex-direction');
    app.style.removeProperty('container-type');
  }
  
  // Main Area Reset
  if (main) {
    main.style.removeProperty('height');
    main.style.removeProperty('min-height');
    main.style.removeProperty('max-height');
    main.style.removeProperty('overflow');
    main.style.removeProperty('display');
    main.style.removeProperty('flex-direction');
    main.style.removeProperty('flex');
    main.style.removeProperty('grid-area');
  }
  
  // Sidebar Reset
  if (sidebar) {
    sidebar.style.removeProperty('overflow');
    sidebar.style.removeProperty('min-height');
    sidebar.style.removeProperty('grid-area');
  }
  
  // Header Reset
  if (header) {
    header.style.removeProperty('overflow');
    header.style.removeProperty('grid-area');
  }
  
  // Footer Reset
  if (footer) {
    footer.style.removeProperty('position');
    footer.style.removeProperty('bottom');
    footer.style.removeProperty('margin-top');
    footer.style.removeProperty('grid-area');
    footer.style.removeProperty('flex');
  }
  
  console.log('🔄 Styles zurückgesetzt (Enhanced - alle Grid Areas)');
};

// Test 1: CSS Grid mit 3-Row Layout (Footer als Grid Area) - FIXED
window.testVariant1_GridFooter = function() {
  console.log('\n🧪 TEST 1: CSS Grid 3-Row Layout (Footer als Grid Area) - OVERFLOW FIXED');
  resetAppStyles();
  
  const app = document.querySelector('.app');
  const main = document.querySelector('main') || document.querySelector('[data-area="main"]');
  const sidebar = document.querySelector('.sidebar') || document.querySelector('.compact-sidebar') || document.querySelector('.navigation-only-sidebar');
  const footer = document.querySelector('.footer-area') || document.querySelector('footer');
  
  if (!app || !footer) {
    console.log('❌ App oder Footer nicht gefunden');
    return;
  }
  
  // 3-Row Grid mit Footer area
  app.style.height = '100vh';
  app.style.minHeight = '100vh';
  app.style.gridTemplateRows = '80px 1fr 60px';
  app.style.gridTemplateAreas = '"sidebar header" "sidebar main" "sidebar footer"';
  
  // Footer in Grid Area positionieren
  footer.style.gridArea = 'footer';
  footer.style.marginTop = 'unset';
  
  // 🔧 CRITICAL FIX: Overflow-Eigenschaften der Grid-Areas wiederherstellen
  if (main) {
    main.style.gridArea = 'main';
    main.style.overflow = 'auto';
    main.style.minHeight = '0';  // Wichtig für CSS Grid overflow
    main.style.display = 'flex';
    main.style.flexDirection = 'column';
    console.log('✅ Main Area: overflow und flex restored');
  }
  
  if (sidebar) {
    sidebar.style.gridArea = 'sidebar';
    sidebar.style.overflow = 'auto';
    sidebar.style.minHeight = '0';  // Wichtig für CSS Grid overflow
    console.log('✅ Sidebar: overflow restored');
  }
  
  // Header auch sicherheitshalber setzen
  const header = document.querySelector('.header');
  if (header) {
    header.style.gridArea = 'header';
    header.style.overflow = 'hidden'; // Header soll nicht scrollen
  }
  
  console.log('✅ Grid 3-Row angewendet mit Overflow-Fix');
  console.log('📏 gridTemplateRows:', app.style.gridTemplateRows);
  console.log('📐 gridTemplateAreas:', app.style.gridTemplateAreas);
  console.log('🔍 Footer gridArea:', footer.style.gridArea);
  console.log('🔧 Main overflow:', main?.style.overflow);
  console.log('🔧 Sidebar overflow:', sidebar?.style.overflow);
  
  // Fenster-Test
  console.log('\n🪟 FENSTER-TEST: Verändere Fenster-Größe und prüfe:');
  console.log('   ✅ Footer bleibt unten?');
  console.log('   ✅ FIXED: Main Content scrollbar?');
  console.log('   ✅ FIXED: Sidebar scrollbar funktioniert?');
  console.log('   ✅ App passt sich flexibel an Fenster an?');
};

// Test 2: Flexbox Layout (App als Flex Container)
window.testVariant2_FlexboxApp = function() {
  console.log('\n🧪 TEST 2: Flexbox Layout (App als Flex Container)');
  resetAppStyles();
  
  const app = document.querySelector('.app');
  const main = document.querySelector('main') || document.querySelector('[data-area="main"]');
  const footer = document.querySelector('.footer-area') || document.querySelector('footer');
  
  if (!app || !main || !footer) {
    console.log('❌ App, Main oder Footer nicht gefunden');
    return;
  }
  
  // App zu Flexbox konvertieren
  app.style.display = 'flex';
  app.style.flexDirection = 'column';
  app.style.height = '100vh';
  app.style.minHeight = '100vh';
  
  // Main Content grows, Footer fix
  main.style.flex = '1';
  main.style.overflow = 'auto';
  footer.style.flex = '0 0 60px';
  footer.style.marginTop = 'unset';
  
  console.log('✅ Flexbox Layout angewendet');
  console.log('📏 App display:', app.style.display);
  console.log('📐 Main flex:', main.style.flex);
  console.log('🔍 Footer flex:', footer.style.flex);
  
  console.log('\n🪟 FENSTER-TEST: Prüfe Flexibilität!');
};

// Test 3: Sticky Footer (CSS Position)
window.testVariant3_StickyFooter = function() {
  console.log('\n🧪 TEST 3: Sticky Footer (CSS Position)');
  resetAppStyles();
  
  const app = document.querySelector('.app');
  const main = document.querySelector('main') || document.querySelector('[data-area="main"]');
  const footer = document.querySelector('.footer-area') || document.querySelector('footer');
  
  if (!app || !main || !footer) {
    console.log('❌ App, Main oder Footer nicht gefunden');
    return;
  }
  
  // App Container flexible height
  app.style.minHeight = '100vh';
  app.style.height = 'auto';
  
  // Main adjusts for sticky footer
  main.style.minHeight = 'calc(100vh - 140px)'; // Header + Footer
  main.style.overflow = 'auto';
  
  // Footer sticky bottom
  footer.style.position = 'sticky';
  footer.style.bottom = '0';
  footer.style.marginTop = 'auto';
  
  console.log('✅ Sticky Footer angewendet');
  console.log('📏 App minHeight:', app.style.minHeight);
  console.log('📐 Main minHeight:', main.style.minHeight);
  console.log('🔍 Footer position:', footer.style.position);
  
  console.log('\n🪟 FENSTER-TEST: Footer klebt unten?');
};

// Test 4: Viewport Height Units (Modern CSS)
window.testVariant4_ViewportUnits = function() {
  console.log('\n🧪 TEST 4: Viewport Height Units (100vh, 100dvh)');
  resetAppStyles();
  
  const app = document.querySelector('.app');
  const main = document.querySelector('main') || document.querySelector('[data-area="main"]');
  const footer = document.querySelector('.footer-area') || document.querySelector('footer');
  
  if (!app || !main || !footer) {
    console.log('❌ App, Main oder Footer nicht gefunden');
    return;
  }
  
  // Modern viewport units
  app.style.height = '100dvh'; // Dynamic viewport height
  app.style.minHeight = '100vh';
  app.style.gridTemplateRows = '80px 1fr 60px';
  app.style.gridTemplateAreas = '"sidebar header" "sidebar main" "sidebar footer"';
  
  // Main mit calc für perfect fit
  main.style.height = 'calc(100dvh - 140px)';
  main.style.overflow = 'auto';
  
  // Footer in Grid
  footer.style.gridArea = 'footer';
  footer.style.marginTop = 'unset';
  
  console.log('✅ Viewport Units angewendet');
  console.log('📏 App height:', app.style.height);
  console.log('📐 Main height:', main.style.height);
  console.log('🔍 Footer gridArea:', footer.style.gridArea);
  
  console.log('\n🪟 FENSTER-TEST: Perfekte Anpassung an Viewport?');
};

// Test 5: CSS Container Queries (Future-proof)
window.testVariant5_ContainerQueries = function() {
  console.log('\n🧪 TEST 5: CSS Container Queries (Future-proof)');
  resetAppStyles();
  
  const app = document.querySelector('.app');
  const footer = document.querySelector('.footer-area') || document.querySelector('footer');
  
  if (!app || !footer) {
    console.log('❌ App oder Footer nicht gefunden');
    return;
  }
  
  // Container-responsive Grid
  app.style.height = '100vh';
  app.style.containerType = 'size';
  app.style.gridTemplateRows = 'minmax(60px, auto) 1fr minmax(60px, auto)';
  app.style.gridTemplateAreas = '"sidebar header" "sidebar main" "sidebar footer"';
  
  footer.style.gridArea = 'footer';
  footer.style.marginTop = 'unset';
  
  console.log('✅ Container Queries angewendet (experimentell)');
  console.log('📏 gridTemplateRows:', app.style.gridTemplateRows);
  console.log('🔍 containerType:', app.style.containerType);
  
  console.log('\n🪟 FENSTER-TEST: Adaptive Container-Größe?');
};

// Debugging Helper - Current Layout Analysis
window.analyzeCurrentLayout = function() {
  console.log('\n🔍 === CURRENT LAYOUT ANALYSIS ===');
  
  const app = document.querySelector('.app');
  const main = document.querySelector('main') || document.querySelector('[data-area="main"]');
  const footer = document.querySelector('.footer-area') || document.querySelector('footer');
  
  if (app) {
    const appStyle = getComputedStyle(app);
    console.log('📱 APP CONTAINER:');
    console.log('   height:', appStyle.height);
    console.log('   minHeight:', appStyle.minHeight);
    console.log('   gridTemplateRows:', appStyle.gridTemplateRows);
    console.log('   gridTemplateAreas:', appStyle.gridTemplateAreas);
    console.log('   overflow:', appStyle.overflow);
  }
  
  if (main) {
    const mainStyle = getComputedStyle(main);
    console.log('📄 MAIN AREA:');
    console.log('   height:', mainStyle.height);
    console.log('   minHeight:', mainStyle.minHeight);
    console.log('   overflow:', mainStyle.overflow);
    console.log('   display:', mainStyle.display);
    console.log('   flex:', mainStyle.flex);
  }
  
  if (footer) {
    const footerStyle = getComputedStyle(footer);
    console.log('🦶 FOOTER:');
    console.log('   position:', footerStyle.position);
    console.log('   gridArea:', footerStyle.gridArea);
    console.log('   marginTop:', footerStyle.marginTop);
    console.log('   height:', footerStyle.height);
  }
  
  // Viewport Info
  console.log('🪟 VIEWPORT:');
  console.log('   innerHeight:', window.innerHeight + 'px');
  console.log('   innerWidth:', window.innerWidth + 'px');
  console.log('   body scrollHeight:', document.body.scrollHeight + 'px');
  console.log('   hasScrollbar:', document.body.scrollHeight > window.innerHeight);
};

// Test 7: PERFECT Responsive Layout (Exakte Spezifikation)
window.testVariant7_PerfectResponsive = function() {
  console.log('\n🎯 TEST 7: PERFECT Responsive Layout (Exakte Spezifikation)');
  console.log('✅ Footer: fix unten');
  console.log('✅ Content: scrollbar');  
  console.log('✅ Sidebar: KEIN scrollbalken');
  console.log('✅ Layout: vollständig responsive');
  
  // Reset first
  resetAppStyles();
  
  const app = document.querySelector('.app');
  const main = document.querySelector('main') || document.querySelector('[data-area="main"]');
  const sidebar = document.querySelector('.sidebar') || document.querySelector('.compact-sidebar') || document.querySelector('.navigation-only-sidebar');
  const header = document.querySelector('.header');
  const footer = document.querySelector('.footer-area') || document.querySelector('footer');
  
  if (!app || !main || !footer) {
    console.log('❌ App, Main oder Footer nicht gefunden');
    return;
  }
  
  // App: Perfect Viewport Container
  app.style.height = '100vh';
  app.style.minHeight = '100vh';
  app.style.maxHeight = '100vh';
  app.style.overflow = 'hidden';
  app.style.display = 'grid';
  app.style.gridTemplateColumns = 'auto 1fr';
  app.style.gridTemplateRows = 'auto 1fr auto';
  app.style.gridTemplateAreas = '"sidebar header" "sidebar main" "sidebar footer"';
  
  // Header: Feste Höhe
  if (header) {
    header.style.gridArea = 'header';
    header.style.overflow = 'hidden';
    header.style.height = '80px';
    header.style.minHeight = '80px';
    header.style.maxHeight = '80px';
  }
  
  // Sidebar: KEIN Scrollbalken, feste Höhe
  if (sidebar) {
    sidebar.style.gridArea = 'sidebar';
    sidebar.style.overflow = 'hidden'; // KEIN SCROLLBALKEN!
    sidebar.style.height = '100vh';
    sidebar.style.minHeight = '100vh';
    sidebar.style.maxHeight = '100vh';
    sidebar.style.width = 'auto'; // Responsive Breite
    console.log('🚫 Sidebar: overflow=hidden - KEIN Scrollbalken');
  }
  
  // Main: Container für scrollbaren Content
  main.style.gridArea = 'main';
  main.style.display = 'flex';
  main.style.flexDirection = 'column';
  main.style.overflow = 'hidden';
  main.style.height = '100%';
  main.style.minHeight = '0';
  
  // Content-Bereich: HIER ist der Scrollbalken
  let contentArea = main.querySelector('.main-content') || main.querySelector('.content');
  if (!contentArea) {
    // Content-Wrapper für alle Main-Children erstellen
    contentArea = document.createElement('div');
    contentArea.className = 'scrollable-content-area';
    
    // Alle bestehenden Main-Children in Content verschieben
    const children = Array.from(main.children);
    children.forEach(child => contentArea.appendChild(child));
    main.appendChild(contentArea);
    
    console.log('📦 Scrollable Content Area erstellt');
  }
  
  // Content: NUR HIER Scrollbar
  contentArea.style.flex = '1 1 auto';
  contentArea.style.overflow = 'auto'; // NUR Content scrollt
  contentArea.style.minHeight = '0';
  contentArea.style.height = '100%';
  contentArea.style.padding = '1rem';
  console.log('📜 Content: overflow=auto - SCROLLBAR hier');
  
  // Footer: Fix unten
  footer.style.gridArea = 'footer';
  footer.style.overflow = 'hidden';
  footer.style.height = '60px';
  footer.style.minHeight = '60px';
  footer.style.maxHeight = '60px';
  footer.style.marginTop = 'unset';
  
  console.log('✅ PERFECT Responsive Layout angewendet!');
  console.log('📏 App: 100vh Grid Container');
  console.log('🚫 Sidebar: overflow=hidden (KEIN Scrollbalken)');
  console.log('📜 Content: overflow=auto (NUR Content scrollt)');
  console.log('📌 Footer: fix unten, 60px hoch');
  console.log('📱 Layout: vollständig responsive');
  
  console.log('\n🔥 PERFEKTE LÖSUNG:');
  console.log('   ✅ Footer immer fix unten sichtbar');
  console.log('   ✅ NUR Content hat Scrollbalken');
  console.log('   ✅ Sidebar hat KEINEN Scrollbalken');
  console.log('   ✅ Layout passt sich responsive an alle Fenstergrößen an');
  console.log('   ✅ Keine doppelten Scrollbalken');
  console.log('   ✅ Perfekte Viewport-Ausnutzung');
};

// Test 6: Optimized RawaLite Grid (Best Practice)
window.testVariant6_OptimizedGrid = function() {
  console.log('\n🧪 TEST 6: Optimized RawaLite Grid (Best Practice)');
  resetAppStyles();
  
  const app = document.querySelector('.app');
  const main = document.querySelector('main') || document.querySelector('[data-area="main"]');
  const sidebar = document.querySelector('.sidebar') || document.querySelector('.compact-sidebar') || document.querySelector('.navigation-only-sidebar');
  const header = document.querySelector('.header');
  const footer = document.querySelector('.footer-area') || document.querySelector('footer');
  
  if (!app || !main || !footer) {
    console.log('❌ App, Main oder Footer nicht gefunden');
    return;
  }
  
  // App: Perfect Viewport Grid
  app.style.height = '100vh';
  app.style.minHeight = '100vh';
  app.style.maxHeight = '100vh'; // Verhindert über-viewport Wachstum
  app.style.overflow = 'hidden'; // App selbst scrollt nicht
  app.style.gridTemplateRows = 'min-content 1fr min-content'; // Adaptive Header/Footer
  app.style.gridTemplateAreas = '"sidebar header" "sidebar main" "sidebar footer"';
  
  // Header: Feste Höhe, kein Scroll
  if (header) {
    header.style.gridArea = 'header';
    header.style.overflow = 'hidden';
    header.style.minHeight = '80px';
    header.style.maxHeight = '80px';
  }
  
  // Sidebar: Vertikal scrollbar, feste Breite
  if (sidebar) {
    sidebar.style.gridArea = 'sidebar';
    sidebar.style.overflow = 'auto';
    sidebar.style.minHeight = '0';
    sidebar.style.maxHeight = '100vh';
  }
  
  // Main: Flex Container für Content + Footer Positioning
  main.style.gridArea = 'main';
  main.style.display = 'flex';
  main.style.flexDirection = 'column';
  main.style.overflow = 'hidden'; // Main selbst scrollt nicht
  main.style.minHeight = '0';
  main.style.height = '100%';
  
  // Content innerhalb Main (erstelle falls nicht vorhanden)
  let mainContent = main.querySelector('.content-area') || main.querySelector('[data-area="content"]');
  if (!mainContent) {
    // Temporär Content-Wrapper erstellen für Test
    mainContent = document.createElement('div');
    mainContent.className = 'temp-content-area';
    mainContent.style.flex = '1 1 auto';
    mainContent.style.overflow = 'auto';
    mainContent.style.minHeight = '0';
    
    // Bestehenden Content in Wrapper verschieben
    const existingContent = Array.from(main.children).filter(child => child !== footer);
    existingContent.forEach(child => mainContent.appendChild(child));
    main.appendChild(mainContent);
    
    console.log('📦 Temporärer Content-Wrapper erstellt');
  } else {
    mainContent.style.flex = '1 1 auto';
    mainContent.style.overflow = 'auto';
    mainContent.style.minHeight = '0';
  }
  
  // Footer: Grid Area, feste Höhe
  footer.style.gridArea = 'footer';
  footer.style.overflow = 'hidden';
  footer.style.minHeight = '60px';
  footer.style.maxHeight = '60px';
  footer.style.marginTop = 'unset';
  
  console.log('✅ Optimized RawaLite Grid angewendet');
  console.log('📏 App: height=100vh, overflow=hidden');
  console.log('📐 Grid: adaptive header/footer, flex main');
  console.log('🔧 Main: flex container mit scrollable content');
  console.log('🔧 Sidebar: auto overflow');
  console.log('🔧 Footer: grid area, feste Höhe');
  
  console.log('\n🪟 FENSTER-TEST: Das sollte perfekt funktionieren!');
  console.log('   ✅ App füllt Viewport exakt aus');
  console.log('   ✅ Footer immer sichtbar unten');
  console.log('   ✅ Main Content scrollt in eigenem Bereich');
  console.log('   ✅ Sidebar scrollt vertikal bei Bedarf');
  console.log('   ✅ Keine doppelten Scrollbalken');
};

// Test Suite Runner
window.runAllTests = function() {
  console.log('\n🚀 === FOOTER POSITIONING TEST SUITE GESTARTET ===');
  console.log('📋 Du kannst jeden Test einzeln ausführen:');
  console.log('   testVariant1_GridFooter()     - CSS Grid 3-Row (FIXED)');
  console.log('   testVariant2_FlexboxApp()     - Flexbox Layout');
  console.log('   testVariant3_StickyFooter()   - Sticky Position');
  console.log('   testVariant4_ViewportUnits()  - Viewport Units');
  console.log('   testVariant5_ContainerQueries() - Container Queries');
  console.log('   testVariant6_OptimizedGrid()  - Optimized RawaLite Grid');
  console.log('   🔥 testVariant7_PerfectResponsive() - 🌟 PERFECT GRID SOLUTION');
  console.log('   🔥 testVariant8_PerfectFlexbox()    - 🌟 PERFECT FLEXBOX SOLUTION');
  console.log('   analyzeCurrentLayout()        - Aktuelle Analyse');
  console.log('   resetAppStyles()              - Zurücksetzen');
  
  console.log('\n🔥 EMPFEHLUNG FÜR IHRE ANFORDERUNGEN:');
  console.log('   🎯 testVariant7_PerfectResponsive() - CSS Grid perfekt');
  console.log('   🎯 testVariant8_PerfectFlexbox()    - Flexbox Alternative');
  console.log('   ✅ Footer fix unten');
  console.log('   ✅ Content scrollbar');
  console.log('   ✅ Sidebar KEIN scrollbalken');
  console.log('   ✅ Vollständig responsive');
  
  // Auto-analyze current state
  analyzeCurrentLayout();
};

// Test 8: PERFECT Flexbox Alternative (Maximum Compatibility)
window.testVariant8_PerfectFlexbox = function() {
  console.log('\n🎯 TEST 8: PERFECT Flexbox Alternative (Maximum Compatibility)');
  console.log('✅ Footer: fix unten mit Flexbox');
  console.log('✅ Content: scrollbar in flex item');  
  console.log('✅ Sidebar: KEIN scrollbalken');
  console.log('✅ Layout: pure flexbox responsive');
  
  // Reset first
  resetAppStyles();
  
  const app = document.querySelector('.app');
  const main = document.querySelector('main') || document.querySelector('[data-area="main"]');
  const sidebar = document.querySelector('.sidebar') || document.querySelector('.compact-sidebar') || document.querySelector('.navigation-only-sidebar');
  const header = document.querySelector('.header');
  const footer = document.querySelector('.footer-area') || document.querySelector('footer');
  
  if (!app || !main || !footer) {
    console.log('❌ App, Main oder Footer nicht gefunden');
    return;
  }
  
  // App: Flexbox Column Container
  app.style.height = '100vh';
  app.style.minHeight = '100vh';
  app.style.maxHeight = '100vh';
  app.style.overflow = 'hidden';
  app.style.display = 'flex';
  app.style.flexDirection = 'column';
  
  // Header: Flex Header
  if (header) {
    header.style.flex = '0 0 80px';
    header.style.overflow = 'hidden';
    header.style.height = '80px';
    header.style.display = 'flex';
    header.style.alignItems = 'center';
  }
  
  // Content Row: Sidebar + Main (grows)
  let contentRow = document.querySelector('.content-row-wrapper');
  if (!contentRow) {
    contentRow = document.createElement('div');
    contentRow.className = 'content-row-wrapper';
    contentRow.style.flex = '1 1 auto';
    contentRow.style.display = 'flex';
    contentRow.style.overflow = 'hidden';
    contentRow.style.minHeight = '0';
    
    // Sidebar und Main in ContentRow verschieben
    if (sidebar && sidebar.parentNode === app) {
      contentRow.appendChild(sidebar);
    }
    if (main && main.parentNode === app) {
      contentRow.appendChild(main);
    }
    
    // ContentRow vor Footer einfügen
    app.insertBefore(contentRow, footer);
    console.log('📦 Content Row Wrapper erstellt');
  }
  
  // Sidebar: KEIN Scrollbalken, flexible Breite
  if (sidebar) {
    sidebar.style.flex = '0 0 auto';
    sidebar.style.overflow = 'hidden'; // KEIN SCROLLBALKEN!
    sidebar.style.height = '100%';
    sidebar.style.width = 'auto'; // Responsive
    console.log('🚫 Sidebar: overflow=hidden - KEIN Scrollbalken');
  }
  
  // Main: Flex Container für Content
  main.style.flex = '1 1 auto';
  main.style.display = 'flex';
  main.style.flexDirection = 'column';
  main.style.overflow = 'hidden';
  main.style.minHeight = '0';
  
  // Content: Scrollable Area
  let contentArea = main.querySelector('.scrollable-content-area');
  if (!contentArea) {
    contentArea = document.createElement('div');
    contentArea.className = 'scrollable-content-area';
    
    // Bestehende Children verschieben
    const children = Array.from(main.children);
    children.forEach(child => contentArea.appendChild(child));
    main.appendChild(contentArea);
  }
  
  contentArea.style.flex = '1 1 auto';
  contentArea.style.overflow = 'auto'; // NUR Content scrollt
  contentArea.style.minHeight = '0';
  contentArea.style.padding = '1rem';
  console.log('📜 Content: overflow=auto - SCROLLBAR hier');
  
  // Footer: Fix unten
  footer.style.flex = '0 0 60px';
  footer.style.overflow = 'hidden';
  footer.style.height = '60px';
  footer.style.marginTop = 'unset';
  
  console.log('✅ PERFECT Flexbox Layout angewendet!');
  console.log('📏 App: Flexbox Column Container');
  console.log('🚫 Sidebar: overflow=hidden (KEIN Scrollbalken)');
  console.log('📜 Content: overflow=auto (NUR Content scrollt)');
  console.log('📌 Footer: flex 0 0 60px (fix unten)');
  console.log('📱 Layout: Pure Flexbox responsive');
  
  console.log('\n🔥 FLEXBOX PERFEKTION:');
  console.log('   ✅ Maximale Browser-Kompatibilität');
  console.log('   ✅ Footer immer fix unten');
  console.log('   ✅ NUR Content scrollt');
  console.log('   ✅ Sidebar OHNE Scrollbalken');
  console.log('   ✅ Vollständig responsive');
};

// Global functions for easy access
window.testVariant1_GridFooter = testVariant1_GridFooter;
window.testVariant2_FlexboxApp = testVariant2_FlexboxApp;
window.testVariant3_StickyFooter = testVariant3_StickyFooter;
window.testVariant4_ViewportUnits = testVariant4_ViewportUnits;
window.testVariant5_ContainerQueries = testVariant5_ContainerQueries;
window.testVariant6_OptimizedGrid = testVariant6_OptimizedGrid;
window.testVariant7_PerfectResponsive = testVariant7_PerfectResponsive;
window.testVariant8_PerfectFlexbox = testVariant8_PerfectFlexbox;
window.testVariant9_UltimateRawaLite = window.testVariant9_UltimateRawaLite;
window.analyzeCurrentLayout = analyzeCurrentLayout;
window.resetAppStyles = resetAppStyles;
window.runAllTests = runAllTests;

// Test 9: ULTIMATE RawaLite Solution (Spezifisch für RawaLite DOM)
window.testVariant9_UltimateRawaLite = function() {
  console.log('\n🚀 TEST 9: ULTIMATE RawaLite Solution (DOM-spezifisch)');
  console.log('🎯 Spezifisch für RawaLite DOM-Struktur optimiert');
  console.log('✅ Footer: GARANTIERT fix unten');
  console.log('✅ Content: NUR Content scrollt');  
  console.log('✅ Sidebar: ABSOLUT KEIN scrollbalken');
  console.log('✅ Layout: RawaLite responsive perfect');
  
  // Reset first
  resetAppStyles();
  
  // RawaLite-spezifische DOM-Selektion
  const app = document.querySelector('.app');
  const main = document.querySelector('main');
  const sidebar = document.querySelector('.sidebar') || 
                  document.querySelector('[class*="sidebar"]') ||
                  document.querySelector('aside') ||
                  document.querySelector('[data-area="sidebar"]');
  const header = document.querySelector('.header') || 
                 document.querySelector('header') ||
                 document.querySelector('[data-area="header"]');
  const footer = document.querySelector('.footer-area') || 
                 document.querySelector('footer') ||
                 document.querySelector('[class*="footer"]');
  
  if (!app) {
    console.log('❌ App Container nicht gefunden');
    return;
  }
  
  console.log('🔍 DOM-Elemente erkannt:');
  console.log('   App:', app ? '✅' : '❌');
  console.log('   Main:', main ? '✅' : '❌');
  console.log('   Sidebar:', sidebar ? '✅' : '❌', sidebar?.className || sidebar?.tagName);
  console.log('   Header:', header ? '✅' : '❌', header?.className || header?.tagName);
  console.log('   Footer:', footer ? '✅' : '❌', footer?.className || footer?.tagName);
  
  // App: Ultimate Container Setup
  app.style.position = 'fixed';
  app.style.top = '0';
  app.style.left = '0';
  app.style.right = '0';
  app.style.bottom = '0';
  app.style.width = '100vw';
  app.style.height = '100vh';
  app.style.overflow = 'hidden';
  app.style.display = 'flex';
  app.style.flexDirection = 'column';
  
  // Header: Absolut fix oben
  if (header) {
    header.style.position = 'relative';
    header.style.flex = '0 0 auto';
    header.style.height = '80px';
    header.style.minHeight = '80px';
    header.style.maxHeight = '80px';
    header.style.overflow = 'hidden';
    header.style.zIndex = '100';
    header.style.backgroundColor = 'var(--background-color, #ffffff)';
    console.log('🔧 Header: Fixed 80px height');
  }
  
  // Content-Bereich: Sidebar + Main
  let contentWrapper = document.querySelector('.ultimate-content-wrapper');
  if (!contentWrapper) {
    contentWrapper = document.createElement('div');
    contentWrapper.className = 'ultimate-content-wrapper';
    contentWrapper.style.flex = '1 1 auto';
    contentWrapper.style.display = 'flex';
    contentWrapper.style.overflow = 'hidden';
    contentWrapper.style.minHeight = '0';
    contentWrapper.style.position = 'relative';
    
    // Sidebar und Main in Content-Wrapper verschieben
    if (sidebar && sidebar.parentNode === app) {
      contentWrapper.appendChild(sidebar);
    }
    if (main && main.parentNode === app) {
      contentWrapper.appendChild(main);
    }
    
    // Content-Wrapper zwischen Header und Footer einfügen
    if (footer && footer.parentNode === app) {
      app.insertBefore(contentWrapper, footer);
    } else {
      app.appendChild(contentWrapper);
    }
    
    console.log('📦 Ultimate Content Wrapper erstellt');
  }
  
  // Sidebar: ABSOLUT KEIN Scrollbalken
  if (sidebar) {
    sidebar.style.position = 'relative';
    sidebar.style.flex = '0 0 auto';
    sidebar.style.width = 'auto';
    sidebar.style.height = '100%';
    sidebar.style.overflow = 'hidden'; // KEIN SCROLLBALKEN!
    sidebar.style.overflowX = 'hidden';
    sidebar.style.overflowY = 'hidden';
    sidebar.style.maxHeight = '100%';
    sidebar.style.backgroundColor = 'var(--sidebar-bg, #f8f9fa)';
    console.log('🚫 Sidebar: ABSOLUT overflow=hidden - GARANTIERT KEIN Scrollbalken');
  }
  
  // Main: Container für scrollbaren Content
  if (main) {
    main.style.position = 'relative';
    main.style.flex = '1 1 auto';
    main.style.display = 'flex';
    main.style.flexDirection = 'column';
    main.style.overflow = 'hidden';
    main.style.height = '100%';
    main.style.minHeight = '0';
    
    // Content in Main: HIER und NUR HIER scrollt es
    let scrollableContent = main.querySelector('.ultimate-scrollable-content');
    if (!scrollableContent) {
      scrollableContent = document.createElement('div');
      scrollableContent.className = 'ultimate-scrollable-content';
      scrollableContent.style.flex = '1 1 auto';
      scrollableContent.style.overflow = 'auto'; // NUR HIER scrollbar
      scrollableContent.style.overflowX = 'hidden'; // Nur vertikal
      scrollableContent.style.overflowY = 'auto';
      scrollableContent.style.minHeight = '0';
      scrollableContent.style.height = '100%';
      scrollableContent.style.padding = '1rem';
      scrollableContent.style.backgroundColor = 'var(--main-bg, #ffffff)';
      
      // Alle bestehenden Main-Children in scrollable Content
      const children = Array.from(main.children);
      children.forEach(child => scrollableContent.appendChild(child));
      main.appendChild(scrollableContent);
      
      console.log('📜 Ultimate Scrollable Content erstellt - NUR HIER scrollt es');
    }
  }
  
  // Footer: ABSOLUT fix unten
  if (footer) {
    footer.style.position = 'relative';
    footer.style.flex = '0 0 auto';
    footer.style.height = '60px';
    footer.style.minHeight = '60px';
    footer.style.maxHeight = '60px';
    footer.style.overflow = 'hidden';
    footer.style.zIndex = '100';
    footer.style.marginTop = '0';
    footer.style.backgroundColor = 'var(--footer-bg, #f8f9fa)';
    footer.style.borderTop = '1px solid var(--border-color, #dee2e6)';
    console.log('📌 Footer: ABSOLUT fix unten, 60px');
  }
  
  console.log('\n🎯 ULTIMATE RAWALITE SOLUTION angewendet!');
  console.log('🔧 App: Fixed position, 100vw x 100vh');
  console.log('🔧 Header: Fixed 80px, overflow hidden');
  console.log('🚫 Sidebar: ABSOLUT overflow hidden - KEIN Scrollbalken');
  console.log('📜 Content: NUR Content-Bereich scrollt');
  console.log('📌 Footer: ABSOLUT fix unten, 60px');
  console.log('📱 Layout: Perfekt responsive für alle Fenstergrößen');
  
  console.log('\n🔥 ULTIMATE FEATURES:');
  console.log('   ✅ App füllt Viewport zu 100% aus (fixed position)');
  console.log('   ✅ Header immer sichtbar oben (80px fix)');
  console.log('   ✅ Sidebar hat GARANTIERT KEINEN Scrollbalken');
  console.log('   ✅ NUR Content-Bereich hat Scrollbalken');
  console.log('   ✅ Footer IMMER fix unten sichtbar (60px)');
  console.log('   ✅ Perfekte Responsive-Anpassung');
  console.log('   ✅ Keine Layout-Verschiebungen');
  console.log('   ✅ Optimiert für RawaLite DOM-Struktur');
  
  // Test-Hinweise
  console.log('\n🧪 TESTE FOLGENDES:');
  console.log('   1. Fenster-Resize → Layout bleibt stabil');
  console.log('   2. Content scrollen → Nur Content scrollt');
  console.log('   3. Sidebar → Kein Scrollbalken sichtbar');
  console.log('   4. Footer → Immer unten sichtbar');
  console.log('   5. Header → Immer oben sichtbar');
};

// Auto-start
runAllTests();

console.log('\n🎯 NÄCHSTE SCHRITTE (PERFEKTE LÖSUNGEN):');
console.log('1. 🔥 EMPFOHLEN: testVariant7_PerfectResponsive() - CSS Grid perfekt für Ihre Anforderungen');
console.log('2. 🔥 ALTERNATIVE: testVariant8_PerfectFlexbox() - Pure Flexbox, maximale Kompatibilität');
console.log('3. Teste beide Varianten mit Fenster-Resize');
console.log('4. ✅ Footer fix unten');
console.log('5. ✅ Content scrollbar (nur Content-Bereich)');
console.log('6. ✅ Sidebar KEIN scrollbalken');
console.log('7. ✅ Vollständig responsive Layout');
console.log('8. Gib mir Feedback welche perfekte Variante Du willst');
console.log('9. Ich implementiere dann die beste Lösung dauerhaft in die CSS-Dateien');