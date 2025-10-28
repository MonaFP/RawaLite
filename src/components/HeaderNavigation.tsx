import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useUnifiedSettings } from '../hooks/useUnifiedSettings';
import { useTheme } from '../hooks/useTheme';
import { useNavigation } from '../contexts/NavigationContext';

interface HeaderNavigationProps {
  title?: string;
  className?: string;
}

export const HeaderNavigation: React.FC<HeaderNavigationProps> = ({ title, className = 'header', ...props }) => {
  const location = useLocation();
  const { settings } = useUnifiedSettings();
  const { mode: navigationMode } = useNavigation();
  const { 
    getThemedPageTitle, 
    isLoading, 
    error, 
    headerConfig,
    companyConfig,
    navigationConfig 
  } = useTheme();
  
  // CRITICAL FIX: Defensive check for undefined navigation mode
  if (!navigationMode || (navigationMode as any) === 'undefined') {
    console.warn('[HeaderNavigation] Navigation mode is undefined, rendering fallback');
    return (
      <div className="header" data-navigation-mode="mode-data-panel" data-fallback="true">
        <div className="left-section">
          <div className="loading-message">Navigation wird geladen...</div>
        </div>
      </div>
    );
  }
  
  // Only render HeaderNavigation content for mode-data-panel mode
  if (navigationMode !== 'mode-data-panel') {  // was: header-navigation
    console.log('[HeaderNavigation] Current mode is not mode-data-panel:', navigationMode);
    return null;
  }
  
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
      <div className="header" data-navigation-mode="mode-data-panel">
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
    <div className="header" data-navigation-mode="mode-data-panel">
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
              data-company="logo"
            />
          ) : (
            <div data-company="logo">
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
      <nav data-navigation-section="primary-navigation">
        {navigationItems.map((item) => {
          const isActive = location.pathname === item.to || 
                          (item.to === '/angebote' && location.pathname.startsWith('/angebote/'));
          
          return (
            <NavLink
              key={item.to}
              to={item.to}
              data-navigation-item={isActive ? 'active' : 'default'}
            >
              <span data-icon="navigation">{item.icon}</span>
              <span data-label="navigation">{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* Settings Link */}
      <div data-navigation-section="settings">
        <NavLink
          to="/einstellungen"
          data-navigation-settings={location.pathname === '/einstellungen' ? 'active' : 'default'}
          style={{
            backgroundColor: location.pathname === '/einstellungen' ? navigationConfig?.activeBg || 'blue' : navigationConfig?.itemBg || 'gray',
            color: location.pathname === '/einstellungen' ? navigationConfig?.activeText || 'white' : navigationConfig?.itemText || 'black',
            border: `1px solid ${navigationConfig?.itemBorder || 'black'}`,
            padding: '5px'
          }}
        >
          ⚙️
        </NavLink>
      </div>
    </div>
  );
};