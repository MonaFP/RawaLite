import { Routes, Route, Navigate } from "react-router-dom";
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
  return <Layout />;
}
