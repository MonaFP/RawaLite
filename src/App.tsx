import { Outlet, useLocation } from "react-router-dom";
import Sidebar from "./components/Sidebar";
import Header from "./components/Header";
import { CompactSidebar } from "./components/CompactSidebar";
import { HeaderNavigation } from "./components/HeaderNavigation";
import { NavigationOnlySidebar } from "./components/NavigationOnlySidebar";
import { HeaderStatistics } from "./components/HeaderStatistics";
import { useNavigation } from "./contexts/NavigationContext";

export default function App(){
  const { mode } = useNavigation();
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

  return (
    <div className="app">
      {/* Render appropriate sidebar based on navigation mode */}
      {mode === 'header' ? (
        <CompactSidebar />
      ) : mode === 'full-sidebar' ? (
        <Sidebar />
      ) : (
        <NavigationOnlySidebar />
      )}
      
      {/* Render appropriate header based on navigation mode */}
      {mode === 'header' ? (
        <div className="header">
          <HeaderNavigation title={getPageTitle()} />
        </div>
      ) : mode === 'full-sidebar' ? (
        <Header />
      ) : (
        <div className="header">
          <HeaderStatistics title={getPageTitle()} />
        </div>
      )}
      
      <main className="main">
        <Outlet />
      </main>
    </div>
  );
}
