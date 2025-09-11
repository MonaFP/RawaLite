import { Outlet, useLocation, Navigate } from "react-router-dom";
import Sidebar from "./components/Sidebar";
import Header from "./components/Header";
import { useDesignSettings } from "./hooks/useDesignSettings";

export default function App(){
  const { currentNavigationMode } = useDesignSettings();
  const location = useLocation();
  
  // Redirect zu Dashboard wenn wir auf einer unbekannten Route sind
  if (location.pathname === '/' || location.pathname === '') {
    // Wir sind bereits auf der Root-Route, das ist okay
  }
  
  return (
    <div className="app" data-nav-mode={currentNavigationMode}>
      {currentNavigationMode === 'sidebar' && <Sidebar />}
      <Header />
      <main className="main">
        <Outlet />
      </main>
    </div>
  );
}
