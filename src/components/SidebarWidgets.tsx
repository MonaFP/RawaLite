import { useOffers } from "../hooks/useOffers";
import { useInvoices } from "../hooks/useInvoices";
import { useTimesheets } from "../hooks/useTimesheets";
import { useCustomers } from "../hooks/useCustomers";

export default function SidebarWidgets() {
    const { offers } = useOffers();
  const { invoices } = useInvoices();
  const { timesheets } = useTimesheets();
  const { customers } = useCustomers();

  // Statistiken berechnen
  const stats = {
    // Grunddaten
    totalCustomers: customers.length,
    totalOffers: offers.length,
    totalInvoices: invoices.length,
    totalTimesheets: timesheets.length,
    
    // Angebote Statistiken
    pendingOffers: offers.filter(offer => offer.status === 'draft').length,
    acceptedOffers: offers.filter(offer => offer.status === 'accepted').length,
    
    // Rechnungen Statistiken
    paidInvoices: invoices.filter(invoice => invoice.status === 'paid').length,
    unpaidInvoices: invoices.filter(invoice => invoice.status === 'draft' || invoice.status === 'sent' || invoice.status === 'overdue').length,
    
    // Leistungsnachweise Statistiken
    approvedTimesheets: timesheets.filter(timesheet => timesheet.status === 'approved').length,
    pendingTimesheets: timesheets.filter(timesheet => timesheet.status === 'draft' || timesheet.status === 'sent').length,
    
    // Finanzielle Übersicht
    totalOfferValue: offers.reduce((sum, offer) => sum + offer.total, 0),
    totalInvoiceValue: invoices.reduce((sum, invoice) => sum + invoice.total, 0),
    paidAmount: invoices.filter(inv => inv.status === 'paid').reduce((sum, invoice) => sum + invoice.total, 0),
    unpaidAmount: invoices.filter(inv => inv.status !== 'paid').reduce((sum, invoice) => sum + invoice.total, 0),
    timesheetValue: timesheets.reduce((sum, timesheet) => sum + timesheet.total, 0),
  };

  // Letzte Aktivitäten
  const recentOffers = offers
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 3);
    
  const recentInvoices = invoices
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 3);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return '#22c55e';
      case 'accepted': return '#22c55e';
      case 'sent': return '#f59e0b';
      case 'approved': return '#22c55e';
      case 'draft': return '#6b7280';
      case 'rejected': return '#ef4444';
      case 'overdue': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'paid': return 'Bezahlt';
      case 'accepted': return 'Angenommen';
      case 'sent': return 'Versendet';
      case 'approved': return 'Genehmigt';
      case 'draft': return 'Entwurf';
      case 'rejected': return 'Abgelehnt';
      case 'overdue': return 'Überfällig';
      default: return status;
    }
  };

  return (
    <div style={{ 
      display: "flex", 
      flexDirection: "column", 
      gap: "16px",
      marginTop: "20px"
    }}>
      {/* Angebote Widget */}
      <div 
        className="sidebar-widget-card"
        style={{
          padding: "12px",
          backgroundColor: "rgba(255,255,255,0.06)",
          borderRadius: "8px",
          border: "1px solid rgba(255,255,255,0.1)",
          background: "linear-gradient(135deg, rgba(5, 150, 105, 0.3) 0%, rgba(16, 185, 129, 0.2) 100%)"
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
          <span style={{ fontSize: "18px" }}>�</span>
          <span style={{ fontSize: "14px", color: "rgba(255,255,255,0.9)", fontWeight: "600" }}>Angebote</span>
        </div>
        <div style={{ fontSize: "24px", fontWeight: "600", color: "white", marginBottom: "4px" }}>
          {stats.totalOffers}
        </div>
        <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.7)" }}>
          {stats.pendingOffers} Entwürfe • {stats.acceptedOffers} Angenommen
        </div>
        <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.6)", marginTop: "2px" }}>
          Wert: {stats.totalOfferValue.toFixed(0)} €
        </div>
      </div>

      {/* Rechnungen Widget */}
      <div 
        className="sidebar-widget-card"
        style={{
          padding: "12px",
          backgroundColor: "rgba(255,255,255,0.06)",
          borderRadius: "8px",
          border: "1px solid rgba(255,255,255,0.1)",
          background: "linear-gradient(135deg, rgba(220, 38, 38, 0.3) 0%, rgba(239, 68, 68, 0.2) 100%)"
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
          <span style={{ fontSize: "18px" }}>🧾</span>
          <span style={{ fontSize: "14px", color: "rgba(255,255,255,0.9)", fontWeight: "600" }}>Rechnungen</span>
        </div>
        <div style={{ fontSize: "24px", fontWeight: "600", color: "white", marginBottom: "4px" }}>
          {stats.totalInvoices}
        </div>
        <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.7)" }}>
          {stats.paidInvoices} Bezahlt • {stats.unpaidInvoices} Offen
        </div>
        <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.6)", marginTop: "2px" }}>
          Wert: {stats.totalInvoiceValue.toFixed(0)} €
        </div>
      </div>

      {/* Finanzübersicht */}
      <div 
        className="sidebar-widget-card"
        style={{
          padding: "12px",
          backgroundColor: "rgba(255,255,255,0.04)",
          borderRadius: "8px",
          border: "1px solid rgba(255,255,255,0.08)"
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
          <span style={{ fontSize: "18px" }}>💰</span>
          <span style={{ fontSize: "14px", color: "rgba(255,255,255,0.9)", fontWeight: "600" }}>Finanzen</span>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "12px", color: "rgba(255,255,255,0.7)" }}>Bezahlt:</span>
            <span style={{ fontSize: "14px", fontWeight: "600", color: "#22c55e" }}>
              {stats.paidAmount.toFixed(0)} €
            </span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "12px", color: "rgba(255,255,255,0.7)" }}>Offen:</span>
            <span style={{ fontSize: "14px", fontWeight: "600", color: "#f59e0b" }}>
              {stats.unpaidAmount.toFixed(0)} €
            </span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "12px", color: "rgba(255,255,255,0.7)" }}>Leistungen:</span>
            <span style={{ fontSize: "14px", fontWeight: "600", color: "#8b5cf6" }}>
              {stats.timesheetValue.toFixed(0)} €
            </span>
          </div>
        </div>
      </div>

      {/* Letzte Aktivitäten */}
      <div 
        className="sidebar-widget-card"
        style={{
          padding: "12px",
          backgroundColor: "rgba(255,255,255,0.04)",
          borderRadius: "8px",
          border: "1px solid rgba(255,255,255,0.08)"
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "10px" }}>
          <span style={{ fontSize: "18px" }}>📊</span>
          <span style={{ fontSize: "14px", color: "rgba(255,255,255,0.9)", fontWeight: "600" }}>Letzte Aktivitäten</span>
        </div>
        
        {/* Letzte Angebote */}
        {recentOffers.length > 0 && (
          <div style={{ marginBottom: "10px" }}>
            <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.6)", marginBottom: "6px", fontWeight: "500" }}>
              Angebote:
            </div>
            {recentOffers.map(offer => (
              <div 
                key={offer.id} 
                style={{
                  display: "flex", 
                  justifyContent: "space-between", 
                  alignItems: "center",
                  fontSize: "11px",
                  padding: "4px 0",
                  borderBottom: "1px solid rgba(255,255,255,0.05)"
                }}
              >
                <span style={{ color: "rgba(255,255,255,0.8)", fontWeight: "500" }}>
                  #{offer.offerNumber}
                </span>
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <span style={{ color: "rgba(255,255,255,0.9)", fontWeight: "600" }}>
                    {offer.total.toFixed(0)}€
                  </span>
                  <span 
                    style={{ 
                      color: getStatusColor(offer.status),
                      fontSize: "10px",
                      fontWeight: "500"
                    }}
                  >
                    {getStatusText(offer.status)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Letzte Rechnungen */}
        {recentInvoices.length > 0 && (
          <div>
            <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.6)", marginBottom: "6px", fontWeight: "500" }}>
              Rechnungen:
            </div>
            {recentInvoices.map(invoice => (
              <div 
                key={invoice.id} 
                style={{
                  display: "flex", 
                  justifyContent: "space-between", 
                  alignItems: "center",
                  fontSize: "11px",
                  padding: "4px 0",
                  borderBottom: "1px solid rgba(255,255,255,0.05)"
                }}
              >
                <span style={{ color: "rgba(255,255,255,0.8)", fontWeight: "500" }}>
                  #{invoice.invoiceNumber}
                </span>
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <span style={{ color: "rgba(255,255,255,0.9)", fontWeight: "600" }}>
                    {invoice.total.toFixed(0)}€
                  </span>
                  <span 
                    style={{ 
                      color: getStatusColor(invoice.status),
                      fontSize: "10px",
                      fontWeight: "500"
                    }}
                  >
                    {getStatusText(invoice.status)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        {recentOffers.length === 0 && recentInvoices.length === 0 && (
          <div style={{ 
            fontSize: "11px", 
            color: "rgba(255,255,255,0.5)", 
            fontStyle: "italic",
            textAlign: "center",
            padding: "8px 0"
          }}>
            Noch keine Aktivitäten
          </div>
        )}
      </div>
    </div>
  );
}

