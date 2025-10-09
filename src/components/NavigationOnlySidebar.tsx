import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import logoUrl from '../assets/rawalite-logo.png';
import SidebarUpdateWidget from './SidebarUpdateWidget';

export const NavigationOnlySidebar: React.FC = () => {
  const location = useLocation();

  // 🎯 NEW: Open UpdateManager via IPC instead of old UpdateDialog
  const handleUpdateClick = async () => {
    try {
      await (window as any).rawalite?.updates?.openManager();
      console.log('✅ UpdateManager opened via IPC');
    } catch (error) {
      console.error('❌ Failed to open UpdateManager:', error);
    }
  };

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
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: '24px',
        padding: '12px 8px',
        borderBottom: '1px solid rgba(255,255,255,0.08)'
      }}>
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '4px'
        }}>
          <img
            src={logoUrl}
            alt="NavigationOnlySidebar"
            style={{
              width: "100%", 
              maxWidth: "120px",
              height: "auto", 
              objectFit: "contain",
              filter: "drop-shadow(0 2px 8px rgba(0,0,0,0.3))"
            }}
          />
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

      {/* Smart Update Widget */}
      <SidebarUpdateWidget 
        checkOnMount={true}
        onUpdateClick={handleUpdateClick}
        position="sidebar"
      />

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