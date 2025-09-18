import packageJson from '../../package.json';

export default function Header() {
  // 🔧 FIX: Remove useLocation to prevent Router hook errors outside Routes context
  const getPageTitle = () => {
    return 'RawaLite'; // Simplified - always show app name
  };

  return (
    <header className="header">
      <h1>{getPageTitle()}</h1>
      <div>v{packageJson.version}</div>
    </header>
  );
}
