import { NavLink } from "react-router-dom";
import { useSettings } from "../contexts/SettingsContext";
import { useOffers } from "../hooks/useOffers";
import { useInvoices } from "../hooks/useInvoices";
import rawaliteLogo from '../assets/rawalite-logo.png';

export default function Sidebar(){
  const { settings, loading, error } = useSettings();
  const { offers } = useOffers();
  const { invoices } = useInvoices();

  // Statistiken berechnen
  const stats = {
    // Angebote
    totalOffers: offers.length,
    pendingOffers: offers.filter(offer => offer.status === 'draft').length,
    acceptedOffers: offers.filter(offer => offer.status === 'accepted').length,
    
    // Rechnungen
    totalInvoices: invoices.length,
    paidInvoices: invoices.filter(invoice => invoice.status === 'paid').length,
    unpaidInvoices: invoices.filter(invoice => invoice.status === 'draft' || invoice.status === 'sent' || invoice.status === 'overdue').length,
    
    // Finanzen
    totalOfferValue: offers.reduce((sum, offer) => sum + offer.total, 0),
    paidAmount: invoices.filter(inv => inv.status === 'paid').reduce((sum, invoice) => sum + invoice.total, 0),
    unpaidAmount: invoices.filter(inv => inv.status !== 'paid').reduce((sum, invoice) => sum + invoice.total, 0),
  };

  const items = [
    { to: "/", label: "Dashboard" },
    { to: "/kunden", label: "Kunden" },
    { to: "/pakete", label: "Pakete" },
    { to: "/angebote", label: "Angebote" },
    { to: "/rechnungen", label: "Rechnungen" },
    { to: "/updates", label: "Updates" },
    { to: "/einstellungen", label: "Einstellungen" }
  ];
  return (
    <aside className="sidebar">
      <div style={{ marginBottom: "20px" }}>
        {/* RawaLite App Logo - in voller Spaltenbreite */}
        <div style={{ 
          width: "100%", 
          textAlign: "center", 
          padding: "16px 8px",
          marginBottom: "16px"
        }}>
          <img 
            src={rawaliteLogo} 
            alt="RawaLite" 
            style={{ 
              width: "100%", 
              maxWidth: "180px",
              height: "auto", 
              objectFit: "contain",
              filter: "drop-shadow(0 2px 8px rgba(0,0,0,0.3))" // Schöner Schatten für bessere Sichtbarkeit
            }} 
          />
        </div>
      </div>
      
      <ul className="nav">
        {items.map(i => (
          <li key={i.to}>
            <NavLink to={i.to} end={i.to === "/"}>
              {i.label}
            </NavLink>
          </li>
        ))}
      </ul>

      {/* Firmenbereich - immer anzeigen */}
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
          <div style={{ 
            width: "100%", 
            textAlign: "center",
            marginBottom: "12px",
            padding: "16px 10px",
            backgroundColor: "rgba(255,255,255,0.02)",
            borderRadius: "8px",
            border: "1px solid rgba(255,255,255,0.1)"
          }}>
            <div style={{ 
              fontSize: "20px", 
              marginBottom: "4px",
              opacity: 0.4 
            }}>
              ⚪
            </div>
            <div style={{ 
              fontSize: "10px", 
              color: "rgba(255,255,255,0.4)",
              fontWeight: "normal"
            }}>
              Kein Logo
            </div>
          </div>
        )}
        
        {/* Firmenname oder Platzhalter */}
        <div style={{ 
          fontSize: "16px", 
          color: !loading && settings.companyData?.name ? "rgba(255,255,255,0.95)" : "rgba(255,255,255,0.6)", 
          fontWeight: "600",
          textAlign: "center",
          marginBottom: "16px",
          fontStyle: !loading && settings.companyData?.name ? "normal" : "italic"
        }}>
          {!loading && settings.companyData?.name ? settings.companyData.name : "[Ihr Firmenname]"}
        </div>

        {/* Angebote & Rechnungen Übersicht - immer anzeigen */}
        <div style={{ 
          display: "flex", 
          flexDirection: "column", 
          gap: "8px",
          marginBottom: "12px"
        }}>
          {/* Angebote */}
          <div style={{
            padding: "8px 10px",
            backgroundColor: "rgba(255,255,255,0.03)",
            borderRadius: "6px",
            border: "1px solid rgba(255,255,255,0.08)"
          }}>
            <div style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "3px"
            }}>
              <span style={{ 
                fontSize: "12px", 
                color: "rgba(255,255,255,0.7)",
                fontWeight: "500"
              }}>
                📋 Angebote
              </span>
              <span style={{ 
                fontSize: "13px", 
                color: "rgba(255,255,255,0.9)",
                fontWeight: "600"
              }}>
                {stats.totalOffers}
              </span>
            </div>
            <div style={{
              fontSize: "10px",
              color: "rgba(255,255,255,0.5)",
              display: "flex",
              justifyContent: "space-between"
            }}>
              <span>{stats.pendingOffers} Entwürfe</span>
              <span>{stats.acceptedOffers} Angenommen</span>
            </div>
          </div>

          {/* Rechnungen */}
          <div style={{
            padding: "8px 10px",
            backgroundColor: "rgba(255,255,255,0.03)",
            borderRadius: "6px",
            border: "1px solid rgba(255,255,255,0.08)"
          }}>
            <div style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "3px"
            }}>
              <span style={{ 
                fontSize: "12px", 
                color: "rgba(255,255,255,0.7)",
                fontWeight: "500"
              }}>
                🧾 Rechnungen
              </span>
              <span style={{ 
                fontSize: "13px", 
                color: "rgba(255,255,255,0.9)",
                fontWeight: "600"
              }}>
                {stats.totalInvoices}
              </span>
            </div>
            <div style={{
              fontSize: "10px",
              color: "rgba(255,255,255,0.5)",
              display: "flex",
              justifyContent: "space-between"
            }}>
              <span>{stats.paidInvoices} Bezahlt</span>
              <span>{stats.unpaidInvoices} Offen</span>
            </div>
          </div>
        </div>

        {/* Finanzübersicht - immer anzeigen */}
        <div style={{
          padding: "8px 10px",
          backgroundColor: "rgba(255,255,255,0.03)",
          borderRadius: "6px",
          border: "1px solid rgba(255,255,255,0.08)"
        }}>
          <div style={{
            fontSize: "12px",
            color: "rgba(255,255,255,0.7)",
            fontWeight: "500",
            marginBottom: "6px",
            textAlign: "center"
          }}>
            💰 Finanzen
          </div>
          <div style={{
            display: "flex",
            flexDirection: "column",
            gap: "3px"
          }}>
            <div style={{
              display: "flex",
              justifyContent: "space-between",
              fontSize: "10px"
            }}>
              <span style={{ color: "rgba(255,255,255,0.6)" }}>Bezahlt:</span>
              <span style={{ 
                color: "rgba(255,255,255,0.8)", 
                fontWeight: "600" 
              }}>
                €{stats.paidAmount.toLocaleString('de-DE', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
              </span>
            </div>
            <div style={{
              display: "flex",
              justifyContent: "space-between",
              fontSize: "10px"
            }}>
              <span style={{ color: "rgba(255,255,255,0.6)" }}>Offen:</span>
              <span style={{ 
                color: "rgba(255,255,255,0.8)", 
                fontWeight: "600" 
              }}>
                €{stats.unpaidAmount.toLocaleString('de-DE', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
              </span>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
