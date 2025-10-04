import React from "react";
import { useCustomers } from "../hooks/useCustomers";
import { useOffers } from "../hooks/useOffers";
import { useInvoices } from "../hooks/useInvoices";
import { usePackages } from "../hooks/usePackages";

interface DashboardPageProps{
  title?: string;
}

export default function DashboardPage({ title = "Dashboard" }: DashboardPageProps){
  const { customers } = useCustomers();
  const { offers } = useOffers();
  const { invoices } = useInvoices();
  const { packages } = usePackages();

  // Statistiken berechnen
  const stats = {
    totalCustomers: customers.length,
    totalOffers: offers.length,
    totalInvoices: invoices.length,
    totalPackages: packages.length,
    
    // Angebote Statistiken
    pendingOffers: offers.filter(offer => offer.status === 'draft').length,
    acceptedOffers: offers.filter(offer => offer.status === 'accepted').length,
    
    // Rechnungen Statistiken
    paidInvoices: invoices.filter(invoice => invoice.status === 'paid').length,
    unpaidInvoices: invoices.filter(invoice => invoice.status === 'draft' || invoice.status === 'sent' || invoice.status === 'overdue').length,
    
    // Finanzielle Übersicht
    totalOfferValue: offers.reduce((sum, offer) => sum + offer.total, 0),
    totalInvoiceValue: invoices.reduce((sum, invoice) => sum + invoice.total, 0),
    paidAmount: invoices.filter(inv => inv.status === 'paid').reduce((sum, invoice) => sum + invoice.total, 0),
    unpaidAmount: invoices.filter(inv => inv.status !== 'paid').reduce((sum, invoice) => sum + invoice.total, 0),
  };

  // Letzte Aktivitäten
  const recentOffers = offers
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);
    
  const recentInvoices = invoices
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return '#22c55e';
      case 'accepted': return '#22c55e';
      case 'sent': return '#f59e0b';
      case 'draft': return '#6b7280';
      case 'rejected': return '#ef4444';
      case 'overdue': return '#ef4444';
      case 'cancelled': return '#6b7280';
      default: return '#6b7280';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'paid': return 'Bezahlt';
      case 'accepted': return 'Angenommen';
      case 'sent': return 'Versendet';
      case 'draft': return 'Entwurf';
      case 'rejected': return 'Abgelehnt';
      case 'overdue': return 'Überfällig';
      case 'cancelled': return 'Storniert';
      default: return status;
    }
  };

  return (
    <div className="card">
      <h2 style={{marginTop:0}}>{title}</h2>
      <p>Willkommen in RaWaLite. Hier ist deine Übersicht:</p>
      
      {/* Haupt-Statistiken */}
      <div style={{display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(220px,1fr))", gap:16, marginBottom:24}}>
        <div className="card" style={{background:"linear-gradient(135deg, var(--accent) 0%, var(--accent-hover) 100%)"}}>
          <div style={{display:"flex", justifyContent:"space-between", alignItems:"center"}}>
            <div>
              <div style={{fontSize:"24px", fontWeight:"600", color:"white"}}>{stats.totalCustomers}</div>
              <div style={{opacity:0.9, color:"white"}}>Kunden</div>
            </div>
            <div style={{fontSize:"32px", opacity:0.7}}>👥</div>
          </div>
        </div>
        
        <div className="card" style={{background:"linear-gradient(135deg, var(--ok) 0%, #16a34a 100%)"}}>
          <div style={{display:"flex", justifyContent:"space-between", alignItems:"center"}}>
            <div>
              <div style={{fontSize:"24px", fontWeight:"600", color:"white"}}>{stats.totalOffers}</div>
              <div style={{opacity:0.9, color:"white"}}>Angebote</div>
            </div>
            <div style={{fontSize:"32px", opacity:0.7}}>📋</div>
          </div>
          <div style={{marginTop:8, fontSize:"12px", opacity:0.8, color:"white"}}>
            {stats.pendingOffers} Entwürfe, {stats.acceptedOffers} Angenommen
          </div>
        </div>
        
        <div className="card" style={{background:"linear-gradient(135deg, var(--warn) 0%, #f97316 100%)"}}>
          <div style={{display:"flex", justifyContent:"space-between", alignItems:"center"}}>
            <div>
              <div style={{fontSize:"24px", fontWeight:"600", color:"white"}}>{stats.totalInvoices}</div>
              <div style={{opacity:0.9, color:"white"}}>Rechnungen</div>
            </div>
            <div style={{fontSize:"32px", opacity:0.7}}>🧾</div>
          </div>
          <div style={{marginTop:8, fontSize:"12px", opacity:0.8, color:"white"}}>
            {stats.paidInvoices} Bezahlt, {stats.unpaidInvoices} Offen
          </div>
        </div>
        
        <div className="card" style={{background:"linear-gradient(135deg, var(--accent) 0%, var(--accent-hover) 100%)", opacity: 0.8}}>
          <div style={{display:"flex", justifyContent:"space-between", alignItems:"center"}}>
            <div>
              <div style={{fontSize:"24px", fontWeight:"600", color:"white"}}>{stats.totalPackages}</div>
              <div style={{opacity:0.9, color:"white"}}>Pakete</div>
            </div>
            <div style={{fontSize:"32px", opacity:0.7}}>📦</div>
          </div>
        </div>
      </div>

      {/* Finanzübersicht */}
      <div style={{display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(300px,1fr))", gap:16, marginBottom:24}}>
        <div className="card">
          <h3 style={{marginTop:0}}>💰 Finanzübersicht</h3>
          <div style={{display:"flex", flexDirection:"column", gap:8}}>
            <div style={{display:"flex", justifyContent:"space-between"}}>
              <span>Angebotswert gesamt:</span>
              <span style={{fontWeight:"600"}}>€{stats.totalOfferValue.toFixed(2)}</span>
            </div>
            <div style={{display:"flex", justifyContent:"space-between"}}>
              <span>Rechnungswert gesamt:</span>
              <span style={{fontWeight:"600"}}>€{stats.totalInvoiceValue.toFixed(2)}</span>
            </div>
            <div style={{display:"flex", justifyContent:"space-between", color:"#22c55e"}}>
              <span>Bezahlt:</span>
              <span style={{fontWeight:"600"}}>€{stats.paidAmount.toFixed(2)}</span>
            </div>
            <div style={{display:"flex", justifyContent:"space-between", color:"#f59e0b"}}>
              <span>Offen:</span>
              <span style={{fontWeight:"600"}}>€{stats.unpaidAmount.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Letzte Aktivitäten */}
      <div style={{display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(400px,1fr))", gap:16}}>
        <div className="card">
          <h3 style={{marginTop:0}}>📋 Letzte Angebote</h3>
          {recentOffers.length > 0 ? (
            <div style={{display:"flex", flexDirection:"column", gap:8}}>
              {recentOffers.map(offer => (
                <div key={offer.id} style={{
                  display:"flex", 
                  justifyContent:"space-between", 
                  alignItems:"center",
                  padding:"8px 12px",
                  background:"rgba(255,255,255,0.03)",
                  borderRadius:"6px",
                  border:"1px solid rgba(255,255,255,0.1)"
                }}>
                  <div>
                    <div style={{fontWeight:"500"}}>#{offer.offerNumber}</div>
                    <div style={{fontSize:"12px", opacity:0.7}}>
                      {new Date(offer.createdAt).toLocaleDateString('de-DE')}
                    </div>
                  </div>
                  <div style={{textAlign:"right"}}>
                    <div style={{fontWeight:"600"}}>€{offer.total.toFixed(2)}</div>
                    <div style={{
                      fontSize:"12px", 
                      color: getStatusColor(offer.status),
                      fontWeight:"500"
                    }}>
                      {getStatusText(offer.status)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p style={{opacity:0.7, fontStyle:"italic"}}>Noch keine Angebote vorhanden.</p>
          )}
        </div>

        <div className="card">
          <h3 style={{marginTop:0}}>🧾 Letzte Rechnungen</h3>
          {recentInvoices.length > 0 ? (
            <div style={{display:"flex", flexDirection:"column", gap:8}}>
              {recentInvoices.map(invoice => (
                <div key={invoice.id} style={{
                  display:"flex", 
                  justifyContent:"space-between", 
                  alignItems:"center",
                  padding:"8px 12px",
                  background:"rgba(255,255,255,0.03)",
                  borderRadius:"6px",
                  border:"1px solid rgba(255,255,255,0.1)"
                }}>
                  <div>
                    <div style={{fontWeight:"500"}}>#{invoice.invoiceNumber}</div>
                    <div style={{fontSize:"12px", opacity:0.7}}>
                      {new Date(invoice.createdAt).toLocaleDateString('de-DE')}
                    </div>
                  </div>
                  <div style={{textAlign:"right"}}>
                    <div style={{fontWeight:"600"}}>€{invoice.total.toFixed(2)}</div>
                    <div style={{
                      fontSize:"12px", 
                      color: getStatusColor(invoice.status),
                      fontWeight:"500"
                    }}>
                      {getStatusText(invoice.status)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p style={{opacity:0.7, fontStyle:"italic"}}>Noch keine Rechnungen vorhanden.</p>
          )}
        </div>
      </div>
    </div>
  );
}
