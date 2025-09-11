import React, { useEffect, useState } from 'react';
import { MigrationService } from '../services/MigrationService';

interface MigrationInitializerProps {
  children: React.ReactNode;
}

export const MigrationInitializer: React.FC<MigrationInitializerProps> = ({ children }) => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initializeMigrations = async () => {
      try {
        const migrationService = new MigrationService();
        await migrationService.initialize();
        setIsInitialized(true);
      } catch (error) {
        console.error('Migration initialization failed:', error);
        setError(error instanceof Error ? error.message : 'Migration initialization failed');
        // Auch bei Fehlern die App starten lassen, aber den Fehler loggen
        setIsInitialized(true);
      }
    };

    initializeMigrations();
  }, []);

  if (!isInitialized) {
    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: '#1a1a1a',
        color: 'white',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 9999
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ 
            width: '40px', 
            height: '40px', 
            border: '4px solid #333', 
            borderTop: '4px solid #007acc', 
            borderRadius: '50%', 
            animation: 'spin 1s linear infinite',
            margin: '0 auto 20px'
          }}></div>
          <h3 style={{ margin: '0 0 10px 0' }}>🔧 Initialisiere Datenbank...</h3>
          <p style={{ margin: 0, opacity: 0.7 }}>Migrations werden geprüft und ausgeführt</p>
        </div>
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  if (error) {
    console.warn('Migration error on startup:', error);
    // App trotzdem starten, auch wenn Migration fehlschlägt
  }

  return <>{children}</>;
};
