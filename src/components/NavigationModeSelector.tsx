import React from 'react';
import { useNavigation } from '../contexts/NavigationContext';
import { type NavigationMode, NAVIGATION_MODE_DESCRIPTIONS, NAVIGATION_MODE_ICONS } from '../types/navigation-safe';

export const NavigationModeSelector: React.FC = () => {
  const { mode, setMode } = useNavigation();

  const modes = [
    {
      id: 'mode-dashboard-view' as NavigationMode,
      name: 'Dashboard View',
      description: NAVIGATION_MODE_DESCRIPTIONS['mode-dashboard-view'],
      icon: NAVIGATION_MODE_ICONS['mode-dashboard-view'],
      features: ['Übersichtliche Darstellung', 'Statistiken im Fokus', 'Dashboard-Layout']
    },
    {
      id: 'mode-data-panel' as NavigationMode,
      name: 'Data Panel',
      description: NAVIGATION_MODE_DESCRIPTIONS['mode-data-panel'],
      icon: NAVIGATION_MODE_ICONS['mode-data-panel'],
      features: ['Erweiterte Datenansicht', 'Navigation im Panel', 'Strukturierte Darstellung']
    },
    {
      id: 'mode-compact-focus' as NavigationMode,
      name: 'Compact Focus',
      description: NAVIGATION_MODE_DESCRIPTIONS['mode-compact-focus'],
      icon: NAVIGATION_MODE_ICONS['mode-compact-focus'],
      features: ['Minimale Oberfläche', 'Konzentriertes Arbeiten', 'Kompakte Darstellung']
    }
  ];

  return (
    <div className="navigation-mode-selector">
      <h3 style={{ 
        fontSize: '1.1rem', 
        fontWeight: '600', 
        marginBottom: '12px',
        color: 'var(--text-primary, #1e293b)'
      }}>
        🧭 Navigation Modus
      </h3>
      <p style={{ 
        marginBottom: '16px', 
        color: 'var(--text-secondary, #6b7280)',
        fontSize: '0.9rem'
      }}>
        Wählen Sie Ihren bevorzugten Navigation-Stil für optimale Bedienbarkeit
      </p>
      
      <div className="mode-grid">
        {modes.map((modeOption) => (
          <div
            key={modeOption.id}
            className={`mode-card ${mode === modeOption.id ? 'active' : ''}`}
            onClick={() => setMode(modeOption.id)}
            style={{
              background: 'rgba(255,255,255,0.95)',
              border: mode === modeOption.id 
                ? '2px solid var(--accent)' 
                : '2px solid rgba(0,0,0,0.1)',
              borderRadius: '12px',
              padding: '20px',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              position: 'relative'
            }}
          >
            {/* Active Indicator */}
            {mode === modeOption.id && (
              <div style={{
                position: 'absolute',
                top: '12px',
                right: '12px',
                background: 'var(--accent)',
                color: 'white',
                borderRadius: '12px',
                padding: '4px 8px',
                fontSize: '0.7rem',
                fontWeight: '600'
              }}>
                AKTIV
              </div>
            )}
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
              <span style={{ fontSize: '2rem' }}>{modeOption.icon}</span>
              <div>
                <h4 style={{ 
                  margin: 0, 
                  fontSize: '1.1rem', 
                  fontWeight: '600',
                  color: 'var(--text-primary)'
                }}>
                  {modeOption.name}
                </h4>
              </div>
            </div>
            
            <p style={{ 
              margin: '0 0 16px 0', 
              fontSize: '0.9rem', 
              color: 'var(--text-secondary)',
              lineHeight: '1.4'
            }}>
              {modeOption.description}
            </p>
            
            {/* Features List */}
            <ul style={{
              margin: 0,
              padding: 0,
              listStyle: 'none'
            }}>
              {modeOption.features.map((feature, index) => (
                <li key={index} style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '4px 0',
                  fontSize: '0.8rem',
                  color: 'var(--text-secondary)'
                }}>
                  <span style={{ color: 'var(--accent)' }}>✓</span>
                  {feature}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <style>{`
        .mode-grid {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr;
          gap: 16px;
          margin-top: 16px;
        }
        
        .mode-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(0,0,0,0.1);
        }
        
        .mode-card.active {
          transform: translateY(-1px);
          box-shadow: 0 8px 25px rgba(0,0,0,0.15);
        }
        
        @media (max-width: 768px) {
          .mode-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
};