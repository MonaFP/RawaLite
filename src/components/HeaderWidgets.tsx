import { useOffers } from "../hooks/useOffers";
import { useInvoices } from "../hooks/useInvoices";
import { useTimesheets } from "../hooks/useTimesheets";

export default function HeaderWidgets() {
  const settings = { companyData: { logo: null, name: null } };
  const loading = false;
    const { offers } = useOffers();
  const { invoices } = useInvoices();
  const { timesheets } = useTimesheets();

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
    
    // Leistungsnachweise
    totalTimesheets: timesheets.length,
    approvedTimesheets: timesheets.filter(timesheet => timesheet.status === 'approved').length,
    pendingTimesheets: timesheets.filter(timesheet => timesheet.status === 'draft' || timesheet.status === 'sent').length,
    
    // Finanzen
    paidAmount: invoices.filter(inv => inv.status === 'paid').reduce((sum, invoice) => sum + invoice.total, 0),
    unpaidAmount: invoices.filter(inv => inv.status !== 'paid').reduce((sum, invoice) => sum + invoice.total, 0),
    timesheetValue: timesheets.reduce((sum, timesheet) => sum + timesheet.total, 0),
  };

  return (
    <div 
      className="header-widgets"
      style={{ 
        display: "flex", 
        alignItems: "center", 
        gap: "16px",
        fontSize: "13px",
        minHeight: "32px"
      }}
    >
      {/* Firmenbereich - Logo + Name */}
      <div style={{ 
        display: "flex", 
        alignItems: "center",
        gap: "8px",
        padding: "4px 12px",
        backgroundColor: "rgba(255,255,255,0.08)",
        borderRadius: "6px",
        border: "1px solid rgba(255,255,255,0.12)"
      }}>
        {/* Firmenlogo kompakt */}
        {!loading && settings.companyData?.logo ? (
          <img 
            src={settings.companyData.logo} 
            alt="Logo" 
            style={{ 
              height: "24px", 
              width: "auto", 
              objectFit: "contain",
              borderRadius: "3px",
              filter: "drop-shadow(0 1px 3px rgba(0,0,0,0.3))"
            }} 
            onError={(e) => {
              e.currentTarget.style.display = 'none';
            }}
          />
        ) : (
          <div style={{
            width: "24px",
            height: "24px",
            backgroundColor: "rgba(255,255,255,0.1)",
            borderRadius: "3px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "12px",
            color: "rgba(255,255,255,0.4)"
          }}>
            🏢
          </div>
        )}

        {/* Firmenname */}
        <div 
          style={{ 
            fontSize: "14px", 
            color: !loading && settings.companyData?.name ? "rgba(255,255,255,0.95)" : "rgba(255,255,255,0.6)", 
            fontWeight: "600",
            whiteSpace: "nowrap",
            maxWidth: "120px",
            overflow: "hidden",
            textOverflow: "ellipsis",
            fontStyle: !loading && settings.companyData?.name ? "normal" : "italic"
          }}
          title={!loading && settings.companyData?.name ? settings.companyData.name : "[Ihr Firmenname]"}
        >
          {!loading && settings.companyData?.name ? settings.companyData.name : "[Firmenname]"}
        </div>
      </div>

      {/* Kompakte Business-Widgets */}
      <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
        {/* Angebote Widget */}
        <div 
          className="header-widget-item"
          style={{
            padding: "4px 8px",
            backgroundColor: "rgba(255,255,255,0.1)",
            borderRadius: "4px",
            border: "1px solid rgba(255,255,255,0.1)",
            display: "flex",
            alignItems: "center",
            gap: "4px",
            whiteSpace: "nowrap"
          }}
        >
          <span style={{ fontSize: "12px" }}>📋</span>
          <span style={{ 
            fontSize: "12px", 
            color: "rgba(255,255,255,0.9)",
            fontWeight: "600"
          }}>
            {stats.totalOffers}
          </span>
          <span style={{ 
            fontSize: "10px", 
            color: "rgba(255,255,255,0.6)"
          }}>
            Angebote
          </span>
        </div>

        {/* Rechnungen Widget */}
        <div 
          className="header-widget-item"
          style={{
            padding: "4px 8px",
            backgroundColor: "rgba(255,255,255,0.1)",
            borderRadius: "4px",
            border: "1px solid rgba(255,255,255,0.1)",
            display: "flex",
            alignItems: "center",
            gap: "4px",
            whiteSpace: "nowrap"
          }}
        >
          <span style={{ fontSize: "12px" }}>🧾</span>
          <span style={{ 
            fontSize: "12px", 
            color: "rgba(255,255,255,0.9)",
            fontWeight: "600"
          }}>
            {stats.totalInvoices}
          </span>
          <span style={{ 
            fontSize: "10px", 
            color: "rgba(255,255,255,0.6)"
          }}>
            Rechnungen
          </span>
        </div>

        {/* Leistungsnachweise Widget */}
        <div 
          className="header-widget-item"
          style={{
            padding: "4px 8px",
            backgroundColor: "rgba(255,255,255,0.1)",
            borderRadius: "4px",
            border: "1px solid rgba(255,255,255,0.1)",
            display: "flex",
            alignItems: "center",
            gap: "4px",
            whiteSpace: "nowrap"
          }}
        >
          <span style={{ fontSize: "12px" }}>⏰</span>
          <span style={{ 
            fontSize: "12px", 
            color: "rgba(255,255,255,0.9)",
            fontWeight: "600"
          }}>
            {stats.totalTimesheets}
          </span>
          <span style={{ 
            fontSize: "10px", 
            color: "rgba(255,255,255,0.6)"
          }}>
            Leistungen
          </span>
        </div>

        {/* Finanzen Widget */}
        <div 
          className="header-widget-item"
          style={{
            padding: "4px 8px",
            backgroundColor: "rgba(255,255,255,0.1)",
            borderRadius: "4px",
            border: "1px solid rgba(255,255,255,0.1)",
            display: "flex",
            alignItems: "center",
            gap: "6px",
            whiteSpace: "nowrap"
          }}
        >
          <span style={{ fontSize: "12px" }}>💰</span>
          <div style={{ display: "flex", flexDirection: "column", gap: "1px" }}>
            <div style={{
              fontSize: "10px",
              color: "rgba(255,255,255,0.9)",
              fontWeight: "600",
              lineHeight: "1"
            }}>
              {(stats.paidAmount / 1000).toFixed(0)}k €
            </div>
            <div style={{
              fontSize: "8px",
              color: "rgba(255,255,255,0.5)",
              lineHeight: "1"
            }}>
              bezahlt
            </div>
          </div>
          {stats.unpaidAmount > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: "1px" }}>
              <div style={{
                fontSize: "10px",
                color: "rgba(255,255,255,0.9)",
                fontWeight: "600",
                lineHeight: "1"
              }}>
                {(stats.unpaidAmount / 1000).toFixed(0)}k €
              </div>
              <div style={{
                fontSize: "8px",
                color: "rgba(255,255,255,0.5)",
                lineHeight: "1"
              }}>
                offen
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}