import { NavLink } from "react-router-dom";
import { useSettings } from "../contexts/SettingsContext";
import { useDesignSettings } from "../hooks/useDesignSettings";
import SidebarWidgets from "./SidebarWidgets";
// 🚨 CRITICAL v1.8.10: Robust logo loading for production builds
// Import logo with fallback strategy
import logoImg from "../../assets/rawalite-logo.png";

export default function Sidebar(){
  const { settings, loading } = useSettings();
  const { currentNavigationMode } = useDesignSettings();

  const items = [
    { to: "/", label: "Dashboard" },
    { to: "/kunden", label: "Kunden" },
    { to: "/pakete", label: "Pakete" },
    { to: "/angebote", label: "Angebote" },
    { to: "/rechnungen", label: "Rechnungen" },
    { to: "/leistungsnachweise", label: "Leistungsnachweise" },
    { to: "/einstellungen", label: "Einstellungen" }
  ];
  return (
    <aside className={`sidebar ${currentNavigationMode === 'header' ? 'sidebar-compact' : ''}`}>
      <div style={{ marginBottom: "20px" }}>
        {/* RawaLite App Logo - in voller Spaltenbreite */}
        <div style={{ 
          width: "100%", 
          textAlign: "center", 
          padding: "16px 8px",
          marginBottom: "16px"
        }}>
          <img 
            src={logoImg} 
            alt="RawaLite" 
            style={{ 
              width: "100%", 
              maxWidth: "180px",
              height: "auto", 
              objectFit: "contain",
              filter: "drop-shadow(0 2px 8px rgba(0,0,0,0.3))" // Schöner Schatten für bessere Sichtbarkeit
            }}
            onError={(e) => {
              console.warn('🚨 RawaLite Logo ES6 import failed, trying production fallbacks...');
              
              // 🚨 CRITICAL: Multi-level fallback with GitHub CDN for v1.8.4 compatibility
              const fallbacks = [
                '/rawalite-logo.png',                    // Public folder
                './assets/rawalite-logo.png',            // Relative assets  
                './rawalite-logo.png',                   // Current directory
                'https://raw.githubusercontent.com/MonaFP/RawaLite/main/rawalite-logo.png', // GitHub CDN - v1.8.4 emergency fix
                'https://github.com/MonaFP/RawaLite/raw/main/rawalite-logo.png',           // GitHub CDN alternative
                'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjgwIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjx0ZXh0IHg9IjEwIiB5PSI0MCIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjI0IiBmaWxsPSIjZmZmIj5SYXdhTGl0ZTwvdGV4dD48L3N2Zz4='  // SVG fallback
              ];
              
              const currentTarget = e.currentTarget;
              let attemptedFallback = currentTarget.dataset.fallbackIndex || '0';
              const nextFallbackIndex = parseInt(attemptedFallback) + 1;
              
              if (nextFallbackIndex < fallbacks.length) {
                console.warn(`🔄 Trying fallback ${nextFallbackIndex}: ${fallbacks[nextFallbackIndex]}`);
                currentTarget.dataset.fallbackIndex = nextFallbackIndex.toString();
                currentTarget.src = fallbacks[nextFallbackIndex];
              } else {
                console.error('❌ All logo fallbacks exhausted - using text fallback');
                // Hide image, show text fallback
                currentTarget.style.display = 'none';
                const textFallback = document.createElement('div');
                textFallback.textContent = 'RawaLite';
                textFallback.style.cssText = 'font-size: 24px; font-weight: bold; color: white; text-align: center; padding: 10px;';
                currentTarget.parentNode?.appendChild(textFallback);
              }
            }}
          />
        </div>
      </div>
      
      {/* Navigation nur im Sidebar-Modus anzeigen */}
      {currentNavigationMode === 'sidebar' && (
        <ul className="nav">
          {items.map(i => (
            <li key={i.to}>
              <NavLink to={i.to} end={i.to === "/"}>
                {i.label}
              </NavLink>
            </li>
          ))}
        </ul>
      )}

      {/* Firmenbereich - nur bei Header-Navigation anzeigen */}
      {currentNavigationMode === 'header' && (
        <div style={{ 
          marginTop: "20px",
          padding: "16px 12px",
          backgroundColor: "rgba(255,255,255,0.04)",
          borderRadius: "12px",
          border: "1px solid rgba(255,255,255,0.08)"
        }}>
        {/* Firmenlogo oder Platzhalter */}
        {!loading && settings.companyData?.logo ? (
          <div style={{ 
            width: "100%", 
            textAlign: "center",
            marginBottom: "12px"
          }}>
            <img 
              src={settings.companyData.logo} 
              alt="Firmenlogo" 
              style={{ 
                maxWidth: "100%", 
                maxHeight: "60px", 
                objectFit: "contain",
                borderRadius: "6px",
                filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.2))"
              }} 
              onError={(e) => {
                console.error('Firmenlogo konnte nicht geladen werden');
                e.currentTarget.style.display = 'none';
              }}
            />
          </div>
        ) : (
          <div 
            className="logo-placeholder"
            style={{ 
              width: "100%", 
              textAlign: "center",
              marginBottom: "12px",
              padding: "16px 10px",
              backgroundColor: "rgba(255,255,255,0.02)",
              borderRadius: "8px",
              border: "1px solid rgba(255,255,255,0.1)"
            }}
          >
            <div 
              className="placeholder-icon"
              style={{ 
                fontSize: "20px", 
                marginBottom: "4px",
                opacity: 0.4 
              }}
            >
              ⚪
            </div>
            <div 
              className="placeholder-text"
              style={{ 
                fontSize: "10px", 
                color: "rgba(255,255,255,0.4)",
                fontWeight: "normal"
              }}
            >
              Kein Logo
            </div>
          </div>
        )}
        
        {/* Firmenname oder Platzhalter */}
        <div 
          className="company-name"
          style={{ 
            fontSize: "16px", 
            color: !loading && settings.companyData?.name ? "rgba(255,255,255,0.95)" : "rgba(255,255,255,0.6)", 
            fontWeight: "600",
            textAlign: "center",
            fontStyle: !loading && settings.companyData?.name ? "normal" : "italic"
          }}
        >
          {!loading && settings.companyData?.name ? settings.companyData.name : "[Ihr Firmenname]"}
        </div>
      </div>
      )}

      {/* Dashboard-Widgets bei Header-Navigation anzeigen */}
      {currentNavigationMode === 'header' && (
        <SidebarWidgets />
      )}
    </aside>
  );
}
