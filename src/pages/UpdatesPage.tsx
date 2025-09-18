import { useState } from 'react';
import { useAutoUpdater } from '../hooks/useAutoUpdater';
import AutoUpdaterModal from '../components/AutoUpdaterModal';

export default function UpdatesPage() {
  const [showModal, setShowModal] = useState(false);

  // Sauberes electron-updater System
  const [state, actions] = useAutoUpdater({ autoCheckOnStart: false });

  return (
    <div className="updates-page">
      <div className="content-header">
        <h1>Updates & Neuigkeiten</h1>
        <p>Update-System basierend auf electron-updater</p>
      </div>

      <div className="content-body">
        <div className="card">
          <div className="card-header">
            <h2>Update-Status</h2>
          </div>
          <div className="card-content">
            <p>Status: {state.state}</p>
            <p>Version: {state.currentVersion}</p>
            
            <button 
              onClick={actions.checkForUpdates}
              disabled={state.state === 'checking'}
              className="btn btn-primary"
            >
              Nach Updates suchen
            </button>
            
            <button 
              onClick={() => setShowModal(true)}
              className="btn btn-secondary ml-3"
            >
              Update-Dialog
            </button>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h2>Changelog</h2>
          </div>
          <div className="card-content">
            <h3>v1.8.1 - Update System Consolidation</h3>
            <ul>
              <li>Konsolidierung zu electron-updater + useAutoUpdater</li>
              <li>Entfernung von Legacy Update-Services</li>
              <li>Dynamische BUILD_DATE Generierung</li>
            </ul>
          </div>
        </div>
      </div>

      {showModal && (
        <AutoUpdaterModal 
          isOpen={showModal}
          onClose={() => setShowModal(false)} 
        />
      )}
    </div>
  );
}
