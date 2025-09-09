import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Sidebar from '@components/Sidebar';
import { PersistenceProvider } from './contexts/PersistenceContext';
import DashboardPage from '@pages/DashboardPage';
import KundenPage from '@pages/KundenPage';
import PaketePage from '@pages/PaketePage';
import AngebotePage from '@pages/AngebotePage';
import RechnungenPage from '@pages/RechnungenPage';
import EinstellungenPage from '@pages/EinstellungenPage';
import NotFoundPage from '@pages/NotFoundPage';

const App: React.FC = () => {
  return (
    <PersistenceProvider><Router>
      <div className="layout">
        <Sidebar />
        <main className="content">
          <Routes>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/kunden" element={<KundenPage />} />
            <Route path="/pakete" element={<PaketePage />} />
            <Route path="/angebote" element={<AngebotePage />} />
            <Route path="/rechnungen" element={<RechnungenPage />} />
            <Route path="/einstellungen" element={<EinstellungenPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </main>
      </div>
    </Router></PersistenceProvider>
  );
};

export default App;