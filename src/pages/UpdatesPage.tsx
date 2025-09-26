import { useState } from 'react';
import CustomAutoUpdaterModal from '../components/CustomAutoUpdaterModal';

export default function UpdatesPage() {
  const [showModal, setShowModal] = useState(false);

  // Custom In-App Updater System

  return (
    <div className="updates-page">
      <div className="content-header">
        <h1>Updates & Neuigkeiten</h1>
        <p>🚀 Custom In-App Updater System (SHA512-Verifizierung + NSIS)</p>
      </div>

      <div className="content-body">
        <div className="card">
          <div className="card-header">
            <h2>Update-Manager</h2>
          </div>
          <div className="card-content">
            <p>Custom Update System mit GitHub Manifest-Integration</p>
            
            <button 
              onClick={() => setShowModal(true)}
              className="btn btn-primary"
            >
              🔍 Update-Manager öffnen
            </button>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h2>Changelog</h2>
          </div>
          <div className="card-content">
            <h3>v1.8.45 - Custom In-App Updater</h3>
            <ul>
              <li>✅ Native Custom Update System</li>
              <li>🔐 SHA512-Hash Verifikation für Sicherheit</li>
              <li>📦 NSIS Installer mit runAfterFinish</li>
              <li>🎯 GitHub Manifest-basierte Updates (update.json)</li>
              <li>📡 Streaming-Downloads mit Live-Progress</li>
            </ul>
          </div>
        </div>
      </div>

      {showModal && (
        <CustomAutoUpdaterModal 
          isOpen={showModal}
          onClose={() => setShowModal(false)} 
        />
      )}
    </div>
  );
}

