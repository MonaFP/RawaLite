import { useLocation } from "react-router-dom";
import VersionService from "../services/VersionService";
import { useNavigation } from "../contexts/NavigationContext";

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
  miniVersion?: boolean;
  className?: string;
}

export default function Header({ title: propTitle, right, miniVersion = false, className = 'header' }: HeaderProps = {}){
  const { pathname } = useLocation();
  const { mode } = useNavigation();
  const versionInfo = VersionService.getAppVersion();
  
  const getPageTitle = () => {
    if (propTitle) return propTitle;
    if (titles[pathname]) return titles[pathname];
    if (pathname.startsWith('/angebote/')) return 'Angebot Details';
    return "RaWaLite";
  };
  
  return (
    <header className={`${className} ${miniVersion ? 'header-mini' : ''}`}>
      <div className="title">{getPageTitle()}</div>
      
      {/* Header Controls - Focus Mode Toggle und weitere Controls */}
      <div className="header-controls">
        
        {/* Im Data-Panel-Modus zeigen wir zusätzliche Informationen (außer Mini-Version) */}
        {mode === 'mode-data-panel' && !miniVersion && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px', /* ✅ REDUZIERT von 16px auf 12px für bessere Platznutzung */
            fontSize: '0.85rem', /* ✅ KLEINER von 0.9rem auf 0.85rem */
            color: 'rgba(255,255,255,0.8)'
          }}>
            <span>📍 {pathname}</span>
            <span>🕒 {new Date().toLocaleDateString('de-DE', { 
              weekday: 'short', 
              day: '2-digit', 
              month: '2-digit'
              /* ✅ JAHR ENTFERNT für kompaktere Darstellung */
            })}</span>
          </div>
        )}
        
        {right && <div className="header-right">{right}</div>}
        
        {!miniVersion && (
          <div style={{opacity:.7, fontSize: '0.8rem'}}> {/* ✅ KLEINER für kompaktere Version-Info */}
            v{versionInfo.version} {versionInfo.buildEnvironment !== 'production' ? `(${versionInfo.buildEnvironment})` : ''}
          </div>
        )}
      </div>
    </header>
  );
}
