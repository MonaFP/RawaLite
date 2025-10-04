import React from 'react';
import { useTheme, Theme, THEMES } from '../contexts/ThemeContext';

export const ThemeSelector: React.FC = () => {
  const { currentTheme, setTheme, themes } = useTheme();

  const handleThemeChange = (themeId: Theme) => {
    setTheme(themeId);
  };

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
      <p style={{ 
        marginBottom: '16px', 
        color: 'var(--text-secondary, #6b7280)',
        fontSize: '0.9rem'
      }}>
        Wählen Sie Ihr bevorzugtes Farbthema für eine persönliche Atmosphäre
      </p>
      
      <div className="theme-grid">
        {Object.values(themes).map((theme) => (
          <div
            key={theme.id}
            className={`theme-card ${currentTheme === theme.id ? 'active' : ''}`}
            onClick={() => handleThemeChange(theme.id)}
            style={{
              background: theme.colors.background,
              border: currentTheme === theme.id 
                ? `2px solid ${theme.colors.primary}` 
                : '2px solid rgba(0,0,0,0.1)',
              borderRadius: '12px',
              padding: '16px',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              position: 'relative',
              overflow: 'hidden'
            }}
          >
            {/* Theme Preview Gradient */}
            <div 
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: '4px',
                background: `linear-gradient(90deg, ${theme.colors.primary} 0%, ${theme.colors.accent} 100%)`
              }}
            />
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
              <span style={{ fontSize: '1.5rem' }}>{theme.icon}</span>
              <div>
                <h4 style={{ 
                  margin: 0, 
                  fontSize: '1rem', 
                  fontWeight: '600',
                  color: theme.colors.primary
                }}>
                  {theme.name}
                </h4>
              </div>
            </div>
            
            <p style={{ 
              margin: 0, 
              fontSize: '0.85rem', 
              color: theme.colors.accent,
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
                  background: theme.colors.primary,
                  boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                }}
              />
              <div 
                style={{
                  width: '16px',
                  height: '16px',
                  borderRadius: '50%',
                  background: theme.colors.accent,
                  boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                }}
              />
              {currentTheme === theme.id && (
                <span style={{ 
                  marginLeft: '8px', 
                  fontSize: '0.8rem', 
                  color: theme.colors.primary,
                  fontWeight: '600'
                }}>
                  ✓ Aktiv
                </span>
              )}
            </div>
          </div>
        ))}
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