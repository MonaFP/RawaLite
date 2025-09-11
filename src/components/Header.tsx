import { useLocation } from "react-router-dom";
import { useVersion } from "../hooks/useVersion";

const titles: Record<string,string> = {
  "/": "Dashboard",
  "/kunden": "Kunden",
  "/pakete": "Pakete",
  "/angebote": "Angebote",
  "/rechnungen": "Rechnungen",
  "/leistungsnachweise": "Leistungsnachweise",
  "/einstellungen": "Einstellungen"
};

interface HeaderProps {
  title?: string;
  right?: React.ReactNode;
}

export default function Header({ title: propTitle, right }: HeaderProps = {}){
  const { pathname } = useLocation();
  const { displayVersion, updateAvailable, isUpdating, performUpdate, checkForUpdates } = useVersion();
  
  const title = propTitle ?? titles[pathname] ?? "RaWaLite";
  
  const handleVersionClick = async () => {
    if (isUpdating) return; // Verhindere Mehrfach-Klicks während Update
    
    if (updateAvailable) {
      // Update verfügbar - führe Update durch
      if (confirm('Update verfügbar! Jetzt installieren?')) {
        try {
          await performUpdate();
          alert('Update erfolgreich installiert!');
        } catch (error) {
          console.error('Update failed:', error);
          alert('Update fehlgeschlagen: ' + (error instanceof Error ? error.message : String(error)));
        }
      }
    } else {
      // Kein Update verfügbar - prüfe nach Updates
      try {
        await checkForUpdates();
        if (!updateAvailable) {
          alert('Sie verwenden bereits die neueste Version.');
        }
      } catch (error) {
        console.error('Update check failed:', error);
        alert('Update-Prüfung fehlgeschlagen: ' + (error instanceof Error ? error.message : String(error)));
      }
    }
  };
  
  return (
    <header className="header">
      <div className="title">{title}</div>
      {right && <div className="header-right">{right}</div>}
      <div 
        style={{
          opacity: isUpdating ? 0.6 : 1,
          cursor: isUpdating ? 'wait' : 'pointer',
          color: updateAvailable ? '#22c55e' : '#3b82f6',
          fontWeight: updateAvailable ? '600' : '500',
          transition: 'all 0.2s ease',
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          padding: '4px 8px',
          borderRadius: '4px',
          backgroundColor: updateAvailable ? 'rgba(34, 197, 94, 0.1)' : 'rgba(59, 130, 246, 0.1)',
          border: `1px solid ${updateAvailable ? 'rgba(34, 197, 94, 0.3)' : 'rgba(59, 130, 246, 0.3)'}`,
          userSelect: 'none'
        }}
        onClick={handleVersionClick}
        title={
          isUpdating 
            ? 'Update wird durchgeführt...' 
            : updateAvailable 
              ? 'Update verfügbar - Klicken zum Installieren' 
              : 'Klicken um nach Updates zu suchen'
        }
      >
        {isUpdating ? '🔄' : updateAvailable ? '🔔' : '🔍'} {displayVersion}
      </div>
    </header>
  );
}
