import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useFocusMode } from '../contexts/FocusModeContext';

interface NavigationItem {
  path: string;
  label: string;
  icon: string;
}

const navigationItems: NavigationItem[] = [
  { path: '/', label: 'Dashboard', icon: '📊' },
  { path: '/kunden', label: 'Kunden', icon: '👥' },
  { path: '/angebote', label: 'Angebote', icon: '📄' },
  { path: '/rechnungen', label: 'Rechnungen', icon: '💰' },
  { path: '/leistungsnachweise', label: 'Leistungsnachweise', icon: '📋' },
  { path: '/pakete', label: 'Pakete', icon: '📦' },
  { path: '/einstellungen', label: 'Einstellungen', icon: '⚙️' },
];

export const FocusNavigation: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { active, variant } = useFocusMode();
  const navigate = useNavigate();
  const location = useLocation();
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close dropdown on route change
  useEffect(() => {
    setIsOpen(false);
  }, [location.pathname]);

  // Only show navigation dropdown when in focus mode
  if (!active) return null;

  const handleNavigation = (path: string) => {
    navigate(path);
    setIsOpen(false);
  };

  const getCurrentPageInfo = () => {
    const currentItem = navigationItems.find(item => item.path === location.pathname);
    return currentItem || { path: location.pathname, label: 'Seite', icon: '📄' };
  };

  const currentPage = getCurrentPageInfo();

  return (
    <div className="focus-navigation" ref={dropdownRef}>
      <button
        className={`focus-nav-button ${variant}`}
        onClick={() => setIsOpen(!isOpen)}
        title="Navigation öffnen"
      >
        <span className="focus-nav-icon">☰</span>
        <span className="focus-nav-label">Navigation</span>
      </button>

      {isOpen && (
        <div className={`focus-nav-dropdown ${variant}`}>
          <div className="focus-nav-header">
            <span className="current-page">
              <span className="current-icon">{currentPage.icon}</span>
              <span className="current-label">{currentPage.label}</span>
            </span>
          </div>
          <div className="focus-nav-divider"></div>
          <div className="focus-nav-items">
            {navigationItems.map((item) => (
              <button
                key={item.path}
                className={`focus-nav-item ${location.pathname === item.path ? 'active' : ''}`}
                onClick={() => handleNavigation(item.path)}
              >
                <span className="nav-item-icon">{item.icon}</span>
                <span className="nav-item-label">{item.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};