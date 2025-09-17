import { useLocation } from 'react-router-dom';
import packageJson from '../../package.json';

export default function Header() {
  const location = useLocation();
  
  const getPageTitle = () => {
    switch (location.pathname) {
      case '/': return 'Dashboard';
      case '/updates': return 'Updates';
      default: return 'RawaLite';
    }
  };

  return (
    <header className="header">
      <h1>{getPageTitle()}</h1>
      <div>v{packageJson.version}</div>
    </header>
  );
}
