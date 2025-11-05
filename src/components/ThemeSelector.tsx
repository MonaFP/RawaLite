import React, { useState } from 'react';
import { useDatabaseTheme } from '../contexts/DatabaseThemeManager';
import { useNavigation } from '../contexts/NavigationContext';

export const ThemeSelector: React.FC = () => {
  const { 
    allDatabaseThemes, 
    currentDatabaseTheme, 
    setDatabaseTheme, 
    createCustomTheme,
    isLoading, 
    error,
    fallbackInfo 
  } = useDatabaseTheme();
  const { mode } = useNavigation();

  // Helper function to get user-friendly navigation mode names
  const getNavigationModeName = (mode: string): string => {
    switch (mode) {
      case 'header-statistics':
        return 'Header Statistics';
      case 'header-navigation':
        return 'Header Navigation';
      case 'full-sidebar':
        return 'Full Sidebar';
      default:
        return mode;
    }
  };

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [customThemeData, setCustomThemeData] = useState({
    name: '',
    description: '',
    icon: '🎨',
    primary: '#1e3a2e',
    accent: '#8b9dc3',
    background: '#f1f5f9'
  });

  const handleThemeChange = async (themeKey: string) => {
    await setDatabaseTheme(themeKey);
  };

  const handleCreateCustomTheme = async () => {
    const success = await createCustomTheme({
      themeKey: `custom_${Date.now()}`,
      name: customThemeData.name,
      description: customThemeData.description,
      icon: customThemeData.icon,
      isSystemTheme: false,
      isActive: true,
      colors: {
        primary: customThemeData.primary,
        accent: customThemeData.accent,
        background: customThemeData.background
      }
    });

    if (success) {
      setShowCreateForm(false);
      setCustomThemeData({
        name: '',
        description: '',
        icon: '🎨',
        primary: '#1e3a2e',
        accent: '#8b9dc3',
        background: '#f1f5f9'
      });
    }
  };

  if (isLoading) {
    return (
      <div className="theme-selector">
        <h3 style={{ 
          fontSize: '1.1rem', 
          fontWeight: '600', 
          marginBottom: '12px',
          color: 'var(--text-primary, #1e293b)'
        }}>
          🎨 Theme Auswahl
        </h3>
        <div style={{ 
          padding: '2rem', 
          textAlign: 'center',
          color: 'var(--text-secondary, #6b7280)'
        }}>
          <div className="loading-spinner" style={{ margin: '0 auto 1rem' }}></div>
          Themes werden geladen...
        </div>
      </div>
    );
  }

  return (
    <div className="theme-selector">
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '12px'
      }}>
        <h3 style={{ 
          fontSize: '1.1rem', 
          fontWeight: '600', 
          margin: 0,
          color: 'var(--text-primary, #1e293b)'
        }}>
          🎨 Theme Auswahl
        </h3>
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          style={{
            backgroundColor: 'var(--accent)',
            color: 'white',
            border: 'none',
            padding: '6px 12px',
            borderRadius: '6px',
            fontSize: '0.85rem',
            cursor: 'pointer',
            fontWeight: '500'
          }}
        >
          {showCreateForm ? '✕ Abbrechen' : '+ Eigenes Theme'}
        </button>
      </div>

      <p style={{ 
        marginBottom: '16px', 
        color: 'var(--text-secondary, #6b7280)',
        fontSize: '0.9rem'
      }}>
        Wählen Sie Ihr bevorzugtes Farbthema für eine persönliche Atmosphäre
      </p>

      {/* Active Theme Status Information */}
      {currentDatabaseTheme && (
        <div style={{
          marginBottom: '16px',
          padding: '8px 12px',
          backgroundColor: !fallbackInfo || fallbackInfo.level === 'database' 
            ? 'rgba(34, 197, 94, 0.1)' 
            : fallbackInfo.level === 'css' 
              ? 'rgba(251, 146, 60, 0.1)' 
              : 'rgba(239, 68, 68, 0.1)',
          border: `1px solid ${
            !fallbackInfo || fallbackInfo.level === 'database' 
              ? 'rgba(34, 197, 94, 0.3)' 
              : fallbackInfo.level === 'css' 
                ? 'rgba(251, 146, 60, 0.3)' 
                : 'rgba(239, 68, 68, 0.3)'
          }`,
          borderRadius: '6px',
          fontSize: '0.85rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
            <span>{currentDatabaseTheme.icon}</span>
            <strong>Aktives Theme:</strong>
            <span style={{ fontWeight: '500' }}>{currentDatabaseTheme.name}</span>
            <span style={{ color: 'var(--text-secondary, #6b7280)', margin: '0 4px' }}>|</span>
            <strong>Aktiver Navigationsmodus:</strong>
            <span style={{ fontWeight: '500' }}>{getNavigationModeName(mode)}</span>
          </div>
          
          {/* Show fallback warning only when not using database */}
          {fallbackInfo && fallbackInfo.level !== 'database' && (
            <div style={{ 
              marginTop: '4px', 
              fontSize: '0.75rem', 
              opacity: 0.9,
              fontStyle: 'italic'
            }}>
              {fallbackInfo.level === 'css' ? (
                <span style={{ color: '#d97706' }}>
                  ⚠️ Verwendet CSS-Fallback (Datenbank nicht verfügbar)
                </span>
              ) : (
                <span style={{ color: '#dc2626' }}>
                  🚨 Notfall-Modus aktiv (System-Fallback)
                </span>
              )}
              {fallbackInfo.error && (
                <span style={{ marginLeft: '8px', opacity: 0.8 }}>
                  - {fallbackInfo.error}
                </span>
              )}
            </div>
          )}
        </div>
      )}

      {error && (
        <div style={{
          marginBottom: '16px',
          padding: '12px',
          backgroundColor: 'rgba(239, 68, 68, 0.1)',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          borderRadius: '6px',
          color: '#dc2626',
          fontSize: '0.85rem'
        }}>
          <strong>Fehler:</strong> {error}
        </div>
      )}

      {/* Custom Theme Creation Form */}
      {showCreateForm && (
        <div style={{
          marginBottom: '24px',
          padding: '16px',
          border: '1px solid rgba(0,0,0,0.1)',
          borderRadius: '8px',
          backgroundColor: 'rgba(255,255,255,0.05)'
        }}>
          <h4 style={{ 
            margin: '0 0 12px 0', 
            fontSize: '1rem',
            color: 'var(--text-primary)'
          }}>
            Eigenes Theme erstellen
          </h4>
          
          <div style={{ display: 'grid', gap: '12px', gridTemplateColumns: '1fr 1fr' }}>
            <div>
              <label style={{ 
                display: 'block', 
                marginBottom: '4px', 
                fontSize: '0.85rem',
                fontWeight: '500'
              }}>
                Name
              </label>
              <input
                type="text"
                value={customThemeData.name}
                onChange={(e) => setCustomThemeData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Mein Theme"
                style={{
                  width: '100%',
                  padding: '6px 8px',
                  borderRadius: '4px',
                  border: '1px solid rgba(0,0,0,0.2)',
                  backgroundColor: 'rgba(255,255,255,0.1)',
                  fontSize: '0.85rem'
                }}
              />
            </div>
            
            <div>
              <label style={{ 
                display: 'block', 
                marginBottom: '4px', 
                fontSize: '0.85rem',
                fontWeight: '500'
              }}>
                Icon
              </label>
              <input
                type="text"
                value={customThemeData.icon}
                onChange={(e) => setCustomThemeData(prev => ({ ...prev, icon: e.target.value }))}
                placeholder="🎨"
                style={{
                  width: '100%',
                  padding: '6px 8px',
                  borderRadius: '4px',
                  border: '1px solid rgba(0,0,0,0.2)',
                  backgroundColor: 'rgba(255,255,255,0.1)',
                  fontSize: '0.85rem'
                }}
              />
            </div>
            
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ 
                display: 'block', 
                marginBottom: '4px', 
                fontSize: '0.85rem',
                fontWeight: '500'
              }}>
                Beschreibung
              </label>
              <input
                type="text"
                value={customThemeData.description}
                onChange={(e) => setCustomThemeData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Ein einzigartiges Theme..."
                style={{
                  width: '100%',
                  padding: '6px 8px',
                  borderRadius: '4px',
                  border: '1px solid rgba(0,0,0,0.2)',
                  backgroundColor: 'rgba(255,255,255,0.1)',
                  fontSize: '0.85rem'
                }}
              />
            </div>
            
            <div>
              <label style={{ 
                display: 'block', 
                marginBottom: '4px', 
                fontSize: '0.85rem',
                fontWeight: '500'
              }}>
                Primärfarbe
              </label>
              <input
                type="color"
                value={customThemeData.primary}
                onChange={(e) => setCustomThemeData(prev => ({ ...prev, primary: e.target.value }))}
                style={{
                  width: '100%',
                  height: '32px',
                  borderRadius: '4px',
                  border: '1px solid rgba(0,0,0,0.2)',
                  cursor: 'pointer'
                }}
              />
            </div>
            
            <div>
              <label style={{ 
                display: 'block', 
                marginBottom: '4px', 
                fontSize: '0.85rem',
                fontWeight: '500'
              }}>
                Akzentfarbe
              </label>
              <input
                type="color"
                value={customThemeData.accent}
                onChange={(e) => setCustomThemeData(prev => ({ ...prev, accent: e.target.value }))}
                style={{
                  width: '100%',
                  height: '32px',
                  borderRadius: '4px',
                  border: '1px solid rgba(0,0,0,0.2)',
                  cursor: 'pointer'
                }}
              />
            </div>
            
            <div>
              <label style={{ 
                display: 'block', 
                marginBottom: '4px', 
                fontSize: '0.85rem',
                fontWeight: '500'
              }}>
                Hintergrund
              </label>
              <input
                type="color"
                value={customThemeData.background}
                onChange={(e) => setCustomThemeData(prev => ({ ...prev, background: e.target.value }))}
                style={{
                  width: '100%',
                  height: '32px',
                  borderRadius: '4px',
                  border: '1px solid rgba(0,0,0,0.2)',
                  cursor: 'pointer'
                }}
              />
            </div>
          </div>
          
          <div style={{ marginTop: '12px', display: 'flex', gap: '8px' }}>
            <button
              onClick={handleCreateCustomTheme}
              disabled={!customThemeData.name}
              style={{
                backgroundColor: 'var(--accent)',
                color: 'white',
                border: 'none',
                padding: '8px 16px',
                borderRadius: '6px',
                fontSize: '0.85rem',
                cursor: customThemeData.name ? 'pointer' : 'not-allowed',
                fontWeight: '500',
                opacity: customThemeData.name ? 1 : 0.6
              }}
            >
              Theme erstellen
            </button>
          </div>
        </div>
      )}
      
      <div className="theme-grid">
        {allDatabaseThemes.map((theme) => {
          const colors = theme.legacyColors || theme.colors;
          const isActive = currentDatabaseTheme?.themeKey === theme.themeKey;
          
          return (
            <div
              key={theme.themeKey}
              className={`theme-card ${isActive ? 'active' : ''}`}
              onClick={() => handleThemeChange(theme.themeKey)}
              style={{
                background: colors.background,
                border: isActive 
                  ? `2px solid ${colors.primary}` 
                  : '2px solid rgba(0,0,0,0.1)',
                borderRadius: '12px',
                padding: '16px',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                position: 'relative',
                overflow: 'hidden'
              }}
            >
              {/* System/Custom Theme Badge */}
              <div style={{
                position: 'absolute',
                top: '8px',
                right: '8px',
                fontSize: '0.7rem',
                padding: '2px 6px',
                borderRadius: '4px',
                backgroundColor: theme.isSystemTheme ? 'rgba(34, 197, 94, 0.2)' : 'rgba(99, 102, 241, 0.2)',
                color: theme.isSystemTheme ? '#166534' : '#4338ca',
                fontWeight: '500'
              }}>
                {theme.isSystemTheme ? 'System' : 'Custom'}
              </div>

              {/* Theme Preview Gradient */}
              <div 
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  height: '4px',
                  background: `linear-gradient(90deg, ${colors.primary} 0%, ${colors.accent} 100%)`
                }}
              />
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                <span style={{ fontSize: '1.5rem' }}>{theme.icon}</span>
                <div>
                  <h4 style={{ 
                    margin: 0, 
                    fontSize: '1rem', 
                    fontWeight: '600',
                    color: colors.primary,
                    paddingRight: '60px' // Space for badge
                  }}>
                    {theme.name}
                  </h4>
                </div>
              </div>
              
              <p style={{ 
                margin: 0, 
                fontSize: '0.85rem', 
                color: colors.accent,
                lineHeight: '1.4'
              }}>
                {theme.description}
              </p>
              
              {/* Color Preview Dots */}
              <div style={{ 
                display: 'flex', 
                gap: '6px', 
                marginTop: '12px',
                alignItems: 'center'
              }}>
                <div 
                  style={{
                    width: '16px',
                    height: '16px',
                    borderRadius: '50%',
                    background: colors.primary,
                    boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                  }}
                />
                <div 
                  style={{
                    width: '16px',
                    height: '16px',
                    borderRadius: '50%',
                    background: colors.accent,
                    boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                  }}
                />
                {isActive && (
                  <span style={{ 
                    marginLeft: '8px', 
                    fontSize: '0.8rem', 
                    color: colors.primary,
                    fontWeight: '600'
                  }}>
                    ✓ Aktiv
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <style>{`
        .theme-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 16px;
          margin-top: 16px;
        }
        
        .theme-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(0,0,0,0.15);
        }
        
        .theme-card.active {
          transform: translateY(-1px);
          box-shadow: 0 8px 25px rgba(0,0,0,0.2);
        }
        
        @media (max-width: 768px) {
          .theme-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
};