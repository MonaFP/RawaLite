import { Routes, Route, Navigate } from "react-router-dom";
import { useEffect } from "react";
import Sidebar from "./components/Sidebar";
import Header from "./components/Header";
import { useDesignSettings } from "./hooks/useDesignSettings";

// Import pages
import DashboardPage from "./pages/DashboardPage";
import KundenPage from "./pages/KundenPage";
import AngebotePage from "./pages/AngebotePage";
import AngebotDetailPage from "./pages/AngebotDetailPage";
import PaketePage from "./pages/PaketePage";
import RechnungenPage from "./pages/RechnungenPage";
import TimesheetsPage from "./pages/TimesheetsPage";
import EinstellungenPage from "./pages/EinstellungenPage";
import NotFoundPage from "./pages/NotFoundPage";

// Layout component that includes Header inside Router context
function Layout() {
  const { currentNavigationMode } = useDesignSettings();
  
  return (
    <div className="app" data-nav-mode={currentNavigationMode}>
      <Sidebar />
      <Header />
      <main className="main">
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/kunden" element={<KundenPage />} />
          <Route path="/angebote" element={<AngebotePage />} />
          <Route path="/angebote/:id" element={<AngebotDetailPage />} />
          <Route path="/pakete" element={<PaketePage />} />
          <Route path="/rechnungen" element={<RechnungenPage />} />
          <Route path="/leistungsnachweise" element={<TimesheetsPage />} />
          <Route path="/einstellungen" element={<EinstellungenPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </main>
    </div>
  );
}

export default function App(){
  // Check for installation results on app startup
  useEffect(() => {
    const checkInstallationResults = async () => {
      try {
        const resultCheck = await window.rawalite?.updater?.checkResults?.();
        
        if (resultCheck?.ok && resultCheck.hasResults && resultCheck.results) {
          const results = resultCheck.results;
          console.log('🚀 [APP-STARTUP] Installation results found:', results);
          
          if (results.success) {
            // Show success notification
            setTimeout(() => {
              alert(`✅ Update erfolgreich installiert!\n\nVersion wurde erfolgreich aktualisiert.\nDauer: ${Math.round(results.duration)}s`);
            }, 1000); // Delay to allow UI to fully load
          } else {
            // Show failure notification
            setTimeout(() => {
              alert(`❌ Update-Installation fehlgeschlagen\n\nFehler: ${results.message}\nExit Code: ${results.exitCode}`);
            }, 1000);
          }
        }
      } catch (error) {
        console.error('❌ [APP-STARTUP] Error checking installation results:', error);
      }
    };
    
    // Check results after app loads
    setTimeout(checkInstallationResults, 2000);
  }, []);
  
  return <Layout />;
}
