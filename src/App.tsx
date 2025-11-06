import { Outlet, useLocation } from "react-router-dom";
import Sidebar from "./components/Sidebar";
import Header from "./components/Header";
import { CompactSidebar } from "./components/CompactSidebar";
import { HeaderNavigation } from "./components/HeaderNavigation";
import { NavigationOnlySidebar } from "./components/NavigationOnlySidebar";
import { HeaderStatistics } from "./components/HeaderStatistics";
import { useNavigation } from "./contexts/NavigationContext";
import { useFocusMode } from "./contexts/FocusModeContext";
import { FocusModeToggle } from "./components/FocusModeToggle";
import { FocusNavigation } from "./components/FocusNavigation";

// CSS Imports - Database-Theme-System Grid Layout (FIX-016/017/018)
import "./styles/layout-grid.css";
import "./styles/header-styles.css";
import "./styles/sidebar-styles.css";
import "./styles/main-content.css";

export default function App(){
  const { mode } = useNavigation();
  const { active, variant } = useFocusMode();
  const location = useLocation();
  
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
    
    if (mode === 'header-statistics') {
      return <NavigationOnlySidebar className="compact-sidebar" />; // Only navigation in sidebar when statistics are in header
    } else if (mode === 'full-sidebar') {
      return <Sidebar className="sidebar" />;
    } else {
      return <CompactSidebar className="compact-sidebar" />; // Compact sidebar with statistics when navigation is in header
    }
  };

  // Render header based on navigation mode and focus mode
  const renderHeader = () => {
    // Free mode: No header at all
    if (active && variant === 'free') return null;
    
    if (!active) {
      // Normal navigation modes - ALWAYS return a valid component
      if (mode === 'header-statistics') {
        return <HeaderStatistics title={getPageTitle()} className="header-statistics" />; // "header-statistics" mode = statistics in header
      } else if (mode === 'full-sidebar') {
        return <Header title={getPageTitle()} className="header" />;
      } else if (mode === 'header-navigation') {
        return <HeaderNavigation title={getPageTitle()} className="header-navigation" />; // "header-navigation" mode = navigation in header
      } else {
        // Default fallback for any unknown mode
        return <Header title={getPageTitle()} className="header" />;
      }
    } else {
      // Focus modes - ALWAYS return a valid component (except free mode handled above)
      if (variant === 'zen') {
        // Zen mode: Normal header based on navigation mode
        if (mode === 'header-statistics') {
          return <HeaderStatistics title={getPageTitle()} className="header-statistics" />;
        } else {
          return <Header title={getPageTitle()} className="header" />;
        }
      } else if (variant === 'mini') {
        // Mini mode: Compact header
        return <Header title={getPageTitle()} className="header" miniVersion={true} />;
      } else {
        // Unknown focus variant - show normal header as fallback
        return <Header title={getPageTitle()} className="header" />;
      }
    }
  };

  return (
    <div className="app" data-navigation-mode={mode}>
      {renderSidebar()}
      
      {/* Header - erste Zeile - DIREKT ohne zusätzlichen Wrapper */}
      {renderHeader()}
      
      {/* Main Content Area */}
      <main className="main">
        <Outlet />
      </main>
      
      {/* Footer - dritte Zeile mit Navigation Controls */}
      <footer className="footer">
        <FocusNavigation />
        <FocusModeToggle />
      </footer>
    </div>
  );
}
