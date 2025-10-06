import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';

interface HeaderNavigationProps {
  title?: string;
}

export const HeaderNavigation: React.FC<HeaderNavigationProps> = ({ title }) => {
  const location = useLocation();
  
  // Dynamic title based on current route
  const getPageTitle = () => {
    if (title) return title;
    
    switch (location.pathname) {
      case '/': return 'Dashboard';
      case '/kunden': return 'Kunden';
      case '/angebote': return 'Angebote';
      case '/pakete': return 'Pakete';
      case '/rechnungen': return 'Rechnungen';
      case '/leistungsnachweise': return 'Leistungsnachweise';
      case '/einstellungen': return 'Einstellungen';
      default: 
        if (location.pathname.startsWith('/angebote/')) return 'Angebot Details';
        return 'RawaLite';
    }
  };

  const navigationItems = [
    { to: '/', label: 'Dashboard', icon: '📊' },
    { to: '/kunden', label: 'Kunden', icon: '👥' },
    { to: '/angebote', label: 'Angebote', icon: '📝' },
    { to: '/pakete', label: 'Pakete', icon: '📦' },
    { to: '/rechnungen', label: 'Rechnungen', icon: '💰' },
    { to: '/leistungsnachweise', label: 'Leistungsnachweise', icon: '⏰' },
    { to: '/einstellungen', label: 'Einstellungen', icon: '⚙️' }
  ];

  return (
    <div className="header-navigation" style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      width: '100%',
      padding: '0 16px'
    }}>
      {/* App Logo + Page Title */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '16px'
      }}>
        {/* App Logo */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <img 
            src="/rawalite-logo.png" 
            alt="RawaLite" 
            style={{ 
              height: '32px',
              width: 'auto',
              objectFit: 'contain',
              filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.3))"
            }} 
          />
        </div>
        
        {/* Page Title */}
        <div style={{
          fontSize: '1.2rem',
          fontWeight: '600',
          color: 'white',
          textShadow: '0 1px 2px rgba(0,0,0,0.2)'
        }}>
          {getPageTitle()}
        </div>
      </div>

      {/* Navigation Menu - NUR das Menü! */}
      <nav style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px'
      }}>
        {navigationItems.map((item) => {
          const isActive = location.pathname === item.to || 
                          (item.to === '/angebote' && location.pathname.startsWith('/angebote/'));
          
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={`header-nav-item ${isActive ? 'active' : ''}`}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 12px',
                borderRadius: '8px',
                textDecoration: 'none',
                fontSize: '0.85rem',
                fontWeight: '500',
                transition: 'all 0.2s ease',
                background: isActive 
                  ? 'rgba(255,255,255,0.2)' 
                  : 'transparent',
                color: isActive 
                  ? 'white' 
                  : 'rgba(255,255,255,0.8)',
                border: isActive 
                  ? '1px solid rgba(255,255,255,0.3)' 
                  : '1px solid transparent'
              }}
            >
              <span style={{ fontSize: '14px' }}>{item.icon}</span>
              <span className="nav-label">{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      <style>{`
        .header-nav-item:hover {
          background: rgba(255,255,255,0.15) !important;
          color: white !important;
          transform: translateY(-1px);
          box-shadow: 0 2px 8px rgba(0,0,0,0.15);
        }
        
        .header-nav-item.active {
          box-shadow: 0 2px 8px rgba(0,0,0,0.2);
        }
        
        @media (max-width: 1200px) {
          .header-nav-item .nav-label {
            display: none;
          }
        }
      `}</style>
    </div>
  );
};