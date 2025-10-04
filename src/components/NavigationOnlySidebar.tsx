import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';

export const NavigationOnlySidebar: React.FC = () => {
  const location = useLocation();

  const navigationItems = [
    {
      path: '/',
      label: 'Dashboard',
      icon: '📊',
      description: 'Übersicht und Statistiken'
    },
    {
      path: '/kunden',
      label: 'Kunden',
      icon: '👥',
      description: 'Kundenverwaltung'
    },
    {
      path: '/angebote',
      label: 'Angebote',
      icon: '📝',
      description: 'Angebote erstellen und verwalten'
    },
    {
      path: '/pakete',
      label: 'Pakete',
      icon: '📦',
      description: 'Service-Pakete'
    },
    {
      path: '/rechnungen',
      label: 'Rechnungen',
      icon: '💰',
      description: 'Rechnungsstellung'
    },
    {
      path: '/leistungsnachweise',
      label: 'Leistungsnachweise',
      icon: '⏰',
      description: 'Zeiterfassung'
    },
    {
      path: '/einstellungen',
      label: 'Einstellungen',
      icon: '⚙️',
      description: 'App-Konfiguration'
    }
  ];

  return (
    <div className="sidebar navigation-only-sidebar" style={{
      width: '240px',
      display: 'flex',
      flexDirection: 'column',
      padding: '16px 12px',
      gap: '8px'
    }}>
      {/* Logo Section */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        marginBottom: '24px',
        padding: '12px 8px',
        borderBottom: '1px solid rgba(255,255,255,0.08)'
      }}>
        <div style={{
          width: '40px',
          height: '40px',
          borderRadius: '10px',
          background: 'radial-gradient(circle at 30% 30%, var(--accent), var(--accent-2))',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '20px',
          fontWeight: 'bold',
          color: 'white',
          textShadow: '0 2px 4px rgba(0,0,0,0.3)'
        }}>
          Rw
        </div>
        
        <div>
          <div style={{
            fontSize: '1.1rem',
            fontWeight: '700',
            color: 'rgba(255,255,255,0.95)',
            lineHeight: '1.2'
          }}>
            RawaLite
          </div>
          <div style={{
            fontSize: '0.75rem',
            color: 'rgba(255,255,255,0.6)',
            fontWeight: '500'
          }}>
            Navigation
          </div>
        </div>
      </div>

      {/* Navigation Menu */}
      <nav style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '4px',
        flex: 1
      }}>
        {navigationItems.map((item) => {
          const isActive = location.pathname === item.path || 
                          (item.path === '/angebote' && location.pathname.startsWith('/angebote/'));
          
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={`nav-item ${isActive ? 'active' : ''}`}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '12px 16px',
                borderRadius: '10px',
                textDecoration: 'none',
                fontSize: '0.9rem',
                fontWeight: '500',
                transition: 'all 0.2s ease',
                background: isActive 
                  ? 'rgba(255,255,255,0.12)' 
                  : 'transparent',
                color: isActive 
                  ? 'rgba(255,255,255,0.98)' 
                  : 'rgba(255,255,255,0.8)',
                border: isActive 
                  ? '1px solid rgba(255,255,255,0.2)' 
                  : '1px solid transparent'
              }}
            >
              <span style={{ 
                fontSize: '1.2rem',
                minWidth: '20px',
                textAlign: 'center'
              }}>
                {item.icon}
              </span>
              
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                flex: 1
              }}>
                <span style={{
                  fontWeight: isActive ? '600' : '500',
                  lineHeight: '1.2'
                }}>
                  {item.label}
                </span>
                <span style={{
                  fontSize: '0.75rem',
                  color: isActive 
                    ? 'rgba(255,255,255,0.7)' 
                    : 'rgba(255,255,255,0.5)',
                  lineHeight: '1.1',
                  marginTop: '2px'
                }}>
                  {item.description}
                </span>
              </div>
            </NavLink>
          );
        })}
      </nav>

      {/* Version Info */}
      <div style={{
        marginTop: 'auto',
        padding: '12px 8px',
        textAlign: 'center',
        borderTop: '1px solid rgba(255,255,255,0.08)'
      }}>
        <div style={{
          fontSize: '0.7rem',
          color: 'rgba(255,255,255,0.4)',
          fontWeight: '500'
        }}>
          RawaLite v1.0.13
        </div>
        <div style={{
          fontSize: '0.65rem',
          color: 'rgba(255,255,255,0.3)',
          marginTop: '2px'
        }}>
          Header Statistics Mode
        </div>
      </div>

      <style>{`
        .nav-item:hover {
          background: rgba(255,255,255,0.08) !important;
          color: rgba(255,255,255,0.95) !important;
          transform: translateX(4px);
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        }
        
        .nav-item.active {
          box-shadow: 0 4px 12px rgba(0,0,0,0.2);
        }
        
        .nav-item.active:hover {
          background: rgba(255,255,255,0.15) !important;
        }
      `}</style>
    </div>
  );
};