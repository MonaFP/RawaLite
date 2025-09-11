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
  const { displayVersion, updateAvailable, isUpdating, performUpdate } = useVersion();
  
  const title = propTitle ?? titles[pathname] ?? "RaWaLite";
  
  const handleVersionClick = () => {
    if (updateAvailable && !isUpdating) {
      if (confirm('Update verfügbar! Jetzt installieren?')) {
        performUpdate().catch(error => {
          console.error('Update failed:', error);
          alert('Update fehlgeschlagen: ' + error.message);
        });
      }
    }
  };
  
  return (
    <header className="header">
      <div className="title">{title}</div>
      {right && <div className="header-right">{right}</div>}
      <div 
        style={{
          opacity: updateAvailable ? 1 : 0.7,
          cursor: updateAvailable ? 'pointer' : 'default',
          color: updateAvailable ? '#22c55e' : 'inherit',
          fontWeight: updateAvailable ? '600' : 'normal',
          transition: 'all 0.2s ease',
          display: 'flex',
          alignItems: 'center',
          gap: '4px'
        }}
        onClick={handleVersionClick}
        title={updateAvailable ? 'Update verfügbar - Klicken zum Installieren' : 'Aktuelle Version'}
      >
        {isUpdating ? '🔄' : updateAvailable ? '🔔' : ''} {displayVersion}
      </div>
    </header>
  );
}
