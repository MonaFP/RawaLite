import { Outlet, useLocation } from "react-router-dom";
import Sidebar from "./components/Sidebar";
import Header from "./components/Header";
import { CompactSidebar } from "./components/CompactSidebar";
import { HeaderNavigation } from "./components/HeaderNavigation";
import { NavigationOnlySidebar } from "./components/NavigationOnlySidebar";
import { HeaderStatistics } from "./components/HeaderStatistics";
import { useNavigation } from "./contexts/NavigationContext";
import { useFocusMode } from "./contexts/FocusModeContext";
import { Footer } from "./components/Footer";
import { useEffect } from "react";

export default function App(){
  const { mode } = useNavigation();
  const { active, variant } = useFocusMode();
  const location = useLocation();

  // 🐛 DEBUG: Log navigation state
  useEffect(() => {
    console.log('[DEBUG App] Navigation mode:', mode);
    console.log('[DEBUG App] Focus mode active:', active, 'variant:', variant);
    console.log('[DEBUG App] Current path:', location.pathname);
  }, [mode, active, variant, location.pathname]);

  
  // Get page title based on current route
  const getPageTitle = () => {
    switch (location.pathname) {
      case '/': return 'Dashboard';
      case '/kunden': return 'Kunden';
      case '/angebote': return 'Angebote';
      case '/pakete': return 'Pakete';
      case '/rechnungen': return 'Rechnungen';
      case '/leistungsnachweise': return 'Leistungsnachweise';
      case '/einstellungen': return 'Einstellungen';
      default: 
        if (location.pathname.startsWith('/angebote/')) return 'Angebot Details';
        if (location.pathname.startsWith('/pakete/') && location.pathname.endsWith('/edit')) return 'Paket bearbeiten';
        return 'RawaLite';
    }
  };

  // Render sidebar based on navigation mode and focus mode
  const renderSidebar = () => {
    if (active) return null; // Hide sidebar in all focus modes
    
    if (mode === 'mode-dashboard-view') {  // was: header-statistics
      return <NavigationOnlySidebar className="compact-sidebar" />; // Only navigation in sidebar when statistics are in header
    } else if (mode === 'mode-compact-focus') {  // was: full-sidebar
      return <Sidebar className="sidebar" />;
    } else {
      return <CompactSidebar className="compact-sidebar" />; // Compact sidebar with statistics when navigation is in header
    }
  };

  // Render header based on navigation mode and focus mode
  const renderHeader = () => {
    console.log('[DEBUG renderHeader] Mode:', mode, 'Active:', active, 'Variant:', variant);
    
    // Free mode: No header at all
    if (active && variant === 'free') {
      console.log('[DEBUG renderHeader] Returning null (free mode)');
      return null;
    }
    
    if (!active) {
      // Navigation modes - Database Configuration System Integration
      if (mode === 'mode-dashboard-view') {
        console.log('[DEBUG renderHeader] Returning HeaderStatistics');
        return <HeaderStatistics title={getPageTitle()} data-navigation-mode="mode-dashboard-view" />;
      } else if (mode === 'mode-compact-focus') {
        console.log('[DEBUG renderHeader] Returning Header (mode-compact-focus)');
        return <Header title={getPageTitle()} className="header" />;
      } else if (mode === 'mode-data-panel') {
        console.log('[DEBUG renderHeader] Returning HeaderNavigation');
        return <HeaderNavigation title={getPageTitle()} data-navigation-mode="mode-data-panel" />; // KI-safe data-attribute for CSS targeting
      } else {
        console.log('[DEBUG renderHeader] Returning Header (fallback)');
        // Default fallback for any unknown mode
        return <Header title={getPageTitle()} className="header" />;
      }
    } else {
      // Focus modes - ALWAYS return a valid component (except free mode handled above)
      if (variant === 'zen') {
        // Zen mode: Normal header based on navigation mode
        if (mode === 'mode-dashboard-view') {  // was: header-statistics
          console.log('[DEBUG renderHeader] Returning HeaderStatistics (zen)');
          return <HeaderStatistics title={getPageTitle()} data-navigation-mode="mode-dashboard-view" />; // KI-safe data-attribute for CSS targeting
        } else {
          console.log('[DEBUG renderHeader] Returning Header (zen)');
          return <Header title={getPageTitle()} className="header" />;
        }
      } else if (variant === 'mini') {
        console.log('[DEBUG renderHeader] Returning Header (mini)');
        // Mini mode: Compact header
        return <Header title={getPageTitle()} className="header" miniVersion={true} />;
      } else {
        console.log('[DEBUG renderHeader] Returning Header (unknown variant)');
        // Unknown focus variant - show normal header as fallback
        return <Header title={getPageTitle()} className="header" />;
      }
    }
  };

  return (
    <div className="app" data-navigation-mode={mode}>
      {renderSidebar()}
      
      {renderHeader()}
      
      <main className="main">
        <Outlet />
      </main>
      
      <Footer />
    </div>
  );
}
