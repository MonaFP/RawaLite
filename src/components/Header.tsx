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
}

export default function Header({ title: propTitle, right }: HeaderProps = {}){
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
    <header className="header">
      <div className="title">{getPageTitle()}</div>
      
      {/* Im Sidebar-Modus zeigen wir zusätzliche Informationen */}
      {mode === 'sidebar' && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
          fontSize: '0.9rem',
          color: 'rgba(255,255,255,0.8)'
        }}>
          <span>📍 {pathname}</span>
          <span>🕒 {new Date().toLocaleDateString('de-DE', { 
            weekday: 'short', 
            day: '2-digit', 
            month: '2-digit',
            year: 'numeric'
          })}</span>
        </div>
      )}
      
      {right && <div className="header-right">{right}</div>}
      
      <div style={{opacity:.7}}>
        v{versionInfo.version} {versionInfo.buildEnvironment !== 'production' ? `(${versionInfo.buildEnvironment})` : ''}
      </div>
    </header>
  );
}
