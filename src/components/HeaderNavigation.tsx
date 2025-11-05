import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useUnifiedSettings } from '../hooks/useUnifiedSettings';
import { useTheme } from '../hooks/useTheme';

interface HeaderNavigationProps {
  title?: string;
  className?: string;
}

export const HeaderNavigation: React.FC<HeaderNavigationProps> = ({ title, className = 'header-navigation' }) => {
  const location = useLocation();
  const { settings } = useUnifiedSettings();
  const { 
    getThemedPageTitle, 
    isLoading, 
    error, 
    headerConfig,
    companyConfig,
    navigationConfig 
  } = useTheme();
  
  // Dynamic title with theme integration
  const getPageTitle = () => {
    if (title) return title;
    return getThemedPageTitle(location.pathname);
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

  // Loading and error handling for theme
  if (isLoading) {
    return (
      <div className="header-navigation">
        <div className="left-section">
          Loading theme...
        </div>
      </div>
    );
  }

  if (error) {
    console.warn('Theme loading error:', error);
    // Continue with fallback theme
  }

  return (
    <div className="header-navigation">
      {/* Firmenname + Logo + Page Title */}
      <div className="left-section">
        {/* Company Section */}
        <div className="company-section">
          <div className="company-name">
            {settings.companyData?.name || 'Firma'}
          </div>
          
          {/* Company Logo */}
          {settings.companyData?.logo ? (
            <img 
              src={settings.companyData.logo} 
              alt="HeaderNavigation-Company" 
              className="company-logo"
            />
          ) : (
            <div className="company-logo">
              G
            </div>
          )}
        </div>
        
        {/* Page Title */}
        <div className="page-title">
          {getPageTitle()}
        </div>
      </div>

      {/* Navigation Menu */}
      <nav className="navigation-section">
        {navigationItems.map((item) => {
          const isActive = location.pathname === item.to || 
                          (item.to === '/angebote' && location.pathname.startsWith('/angebote/'));
          
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={isActive ? 'nav-item active' : 'nav-item'}
            >
              <span className="nav-icon">{item.icon}</span>
              <span className="nav-label">{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* Settings Link */}
      <div className="right-section">
        <NavLink
          to="/einstellungen"
          className={location.pathname === '/einstellungen' ? 'settings-link active' : 'settings-link'}
          style={{
            backgroundColor: location.pathname === '/einstellungen' ? navigationConfig.activeBg : navigationConfig.itemBg,
            color: location.pathname === '/einstellungen' ? navigationConfig.activeText : navigationConfig.itemText,
            border: `1px solid ${navigationConfig.itemBorder}`
          }}
        >
          ⚙️
        </NavLink>
      </div>
    </div>
  );
};