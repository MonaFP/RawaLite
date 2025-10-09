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
        return 'RawaLite';
    }
  };

  // Render sidebar based on navigation mode and focus mode
  const renderSidebar = () => {
    if (active) return null; // Hide sidebar in all focus modes
    
    if (mode === 'header') {
      return <CompactSidebar />;
    } else if (mode === 'full-sidebar') {
      return <Sidebar />;
    } else {
      return <NavigationOnlySidebar />;
    }
  };

  // Render header based on navigation mode and focus mode
  const renderHeader = () => {
    if (active && variant === 'free') return null; // Hide header in free mode
    
    if (!active) {
      // Normal navigation modes
      if (mode === 'header') {
        return (
          <div className="header">
            <HeaderNavigation title={getPageTitle()} />
          </div>
        );
      } else if (mode === 'full-sidebar') {
        return <Header />;
      } else {
        return (
          <div className="header">
            <HeaderStatistics title={getPageTitle()} />
          </div>
        );
      }
    } else {
      // Focus modes
      if (variant === 'zen') {
        // Zen mode: Normal header
        return mode === 'header' ? (
          <div className="header">
            <HeaderNavigation title={getPageTitle()} />
          </div>
        ) : (
          <Header title={getPageTitle()} />
        );
      } else if (variant === 'mini') {
        // Mini mode: Compact header
        return <Header title={getPageTitle()} miniVersion={true} />;
      }
    }
    
    return null;
  };

  return (
    <div className="app">
      {renderSidebar()}
      
      {/* Header - erste Zeile */}
      <div className="header">
        {renderHeader()}
      </div>
      
      {/* Focus Bar - zweite Zeile direkt unter Header */}
      <div className="focus-bar-area">
        <FocusNavigation />
        <FocusModeToggle />
      </div>
      
      <main className="main">
        <Outlet />
      </main>
    </div>
  );
}
