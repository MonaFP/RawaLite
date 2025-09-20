import React, { useState, useEffect } from "react";
import { useCustomers } from "../hooks/useCustomers";
import { useOffers } from "../hooks/useOffers";
import { useInvoices } from "../hooks/useInvoices";
import { usePackages } from "../hooks/usePackages";
import { useDesignSettings } from "../hooks/useDesignSettings";
import { useSettings } from "../contexts/SettingsContext";
import { useLogoSettings } from "../hooks/useLogoSettings";

interface DashboardPageProps{
  title?: string;
}

export default function DashboardPage({ title = "Dashboard" }: DashboardPageProps){
  const { customers } = useCustomers();
  const { offers } = useOffers();
  const { invoices } = useInvoices();
  const { packages } = usePackages();
  const { currentNavigationMode } = useDesignSettings();
  const { settings } = useSettings();
  const { logoUrl, hasLogo, getLogoUrl } = useLogoSettings();

  // Logo-URL laden beim Mount und wenn sich Logo-Settings ändern
  useEffect(() => {
    async function loadLogo() {
      try {
        if (hasLogo) {
          await getLogoUrl(); // This updates logoUrl state automatically
        }
      } catch (error) {
        console.error('Error loading logo:', error);
      }
    }
    loadLogo();
  }, [hasLogo, getLogoUrl]);

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
      case 'paid': return '#7dd3a0';        // Sanftes Pastellgrün
      case 'accepted': return '#7dd3a0';    // Sanftes Pastellgrün
      case 'sent': return '#f4c2a1';       // Sanftes Pastellorange
      case 'draft': return '#9fb8d3';      // Sanftes Pastellblau
      case 'rejected': return '#e6a8b8';   // Sanftes Pastellrosa
      case 'overdue': return '#e6a8b8';    // Sanftes Pastellrosa
      case 'cancelled': return '#b8b8c8';  // Sanftes Pastellgrau
      default: return '#b8b8c8';
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
      {/* Header mit Logo und Unternehmensdaten */}
      {(logoUrl || settings.companyData.name !== 'RawaLite') && (
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: "16px",
          marginBottom: "24px",
          padding: "16px",
          backgroundColor: "rgba(255,255,255,0.05)",
          border: "1px solid rgba(255,255,255,0.1)",
          borderRadius: "8px"
        }}>
          {logoUrl && (
            <div style={{
              flexShrink: 0,
              width: "80px",
              height: "80px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "8px",
              backgroundColor: "rgba(255,255,255,0.1)",
              borderRadius: "8px"
            }}>
              <img
                src={logoUrl}
                alt="Firmenlogo"
                style={{
                  maxWidth: "100%",
                  maxHeight: "100%",
                  objectFit: "contain"
                }}
              />
            </div>
          )}
          <div style={{ flex: 1 }}>
            <h3 style={{ 
              margin: "0 0 8px 0", 
              color: "var(--accent)",
              fontSize: "18px",
              fontWeight: "600"
            }}>
              {settings.companyData.name || 'RawaLite'}
            </h3>
            {(settings.companyData.street || settings.companyData.city) && (
              <div style={{ 
                fontSize: "14px", 
                opacity: 0.8, 
                lineHeight: "1.4",
                color: "var(--foreground)"
              }}>
                {settings.companyData.street && (
                  <div>{settings.companyData.street}</div>
                )}
                {(settings.companyData.postalCode || settings.companyData.city) && (
                  <div>
                    {settings.companyData.postalCode} {settings.companyData.city}
                  </div>
                )}
              </div>
            )}
            {/* TODO: Logo System temporarily disabled
            {(logoSettings.fileName || hasLogo) && (
              <div style={{
                fontSize: "12px",
                marginTop: "8px",
                padding: "4px 8px",
                backgroundColor: "rgba(0,255,0,0.1)",
                border: "1px solid rgba(0,255,0,0.3)",
                borderRadius: "4px",
                display: "inline-block",
                color: "var(--foreground)"
              }}>
                📸 Logo: {logoSettings.format?.toUpperCase()} 
                {logoSettings.width && logoSettings.height && 
                  ` (${logoSettings.width}×${logoSettings.height}px)`
                }
              </div>
            )}
            */}
          </div>
        </div>
      )}

      <h2 style={{marginTop:0}}>{title}</h2>
      <p>Willkommen in RaWaLite. Hier ist deine Übersicht:</p>
      
      {/* Haupt-Statistiken - IMMER anzeigen */}
      <div style={{display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(220px,1fr))", gap:16, marginBottom:24}}>
        <div className="card" style={{background:"linear-gradient(135deg, #9fb8d3 0%, #b5c9df 100%)"}}>
          <div style={{display:"flex", justifyContent:"space-between", alignItems:"center"}}>
            <div>
              <div style={{fontSize:"24px", fontWeight:"600", color:"#2d3748"}}>{stats.totalCustomers}</div>
              <div style={{opacity:0.8, color:"#4a5568"}}>Kunden</div>
            </div>
            <div style={{fontSize:"32px", opacity:0.6, color:"#2d3748"}}>👥</div>
          </div>
        </div>
        
        <div className="card" style={{background:"linear-gradient(135deg, #a8d5ba 0%, #b8e0c7 100%)"}}>
          <div style={{display:"flex", justifyContent:"space-between", alignItems:"center"}}>
            <div>
              <div style={{fontSize:"24px", fontWeight:"600", color:"#2d3748"}}>{stats.totalOffers}</div>
              <div style={{opacity:0.8, color:"#4a5568"}}>Angebote</div>
            </div>
            <div style={{fontSize:"32px", opacity:0.6, color:"#2d3748"}}>📋</div>
          </div>
          <div style={{marginTop:8, fontSize:"12px", opacity:0.7, color:"#4a5568"}}>
            {stats.pendingOffers} Entwürfe, {stats.acceptedOffers} Angenommen
          </div>
        </div>
        
        <div className="card" style={{background:"linear-gradient(135deg, #f4c2a1 0%, #f7d4b8 100%)"}}>
          <div style={{display:"flex", justifyContent:"space-between", alignItems:"center"}}>
            <div>
              <div style={{fontSize:"24px", fontWeight:"600", color:"#2d3748"}}>{stats.totalInvoices}</div>
              <div style={{opacity:0.8, color:"#4a5568"}}>Rechnungen</div>
            </div>
            <div style={{fontSize:"32px", opacity:0.6, color:"#2d3748"}}>🧾</div>
          </div>
          <div style={{marginTop:8, fontSize:"12px", opacity:0.7, color:"#4a5568"}}>
            {stats.paidInvoices} Bezahlt, {stats.unpaidInvoices} Offen
          </div>
        </div>
        
        <div className="card" style={{background:"linear-gradient(135deg, #d4b3e8 0%, #e0c4f0 100%)"}}>
          <div style={{display:"flex", justifyContent:"space-between", alignItems:"center"}}>
            <div>
              <div style={{fontSize:"24px", fontWeight:"600", color:"#2d3748"}}>{stats.totalPackages}</div>
              <div style={{opacity:0.8, color:"#4a5568"}}>Pakete</div>
            </div>
            <div style={{fontSize:"32px", opacity:0.6, color:"#2d3748"}}>📦</div>
          </div>
        </div>
      </div>

      {/* Finanzübersicht - IMMER anzeigen */}
      <div style={{display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(300px,1fr))", gap:16, marginBottom:24}}>
        <div className="card">
          <h3 style={{marginTop:0}}>💰 Finanzübersicht</h3>
          <div style={{display:"flex", flexDirection:"column", gap:8}}>
            <div style={{display:"flex", justifyContent:"space-between"}}>
              <span>Angebotswert gesamt:</span>
              <span style={{fontWeight:"600"}}>{stats.totalOfferValue.toFixed(2)} €</span>
            </div>
            <div style={{display:"flex", justifyContent:"space-between"}}>
              <span>Rechnungswert gesamt:</span>
              <span style={{fontWeight:"600"}}>{stats.totalInvoiceValue.toFixed(2)} €</span>
            </div>
            <div style={{display:"flex", justifyContent:"space-between", color:"#7dd3a0"}}>
              <span>Bezahlt:</span>
              <span style={{fontWeight:"600"}}>{stats.paidAmount.toFixed(2)} €</span>
            </div>
            <div style={{display:"flex", justifyContent:"space-between", color:"#f4c2a1"}}>
              <span>Offen:</span>
              <span style={{fontWeight:"600"}}>{stats.unpaidAmount.toFixed(2)} €</span>
            </div>
          </div>
        </div>
      </div>

      {/* Letzte Aktivitäten - IMMER anzeigen */}
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
                    <div style={{fontWeight:"600"}}>{offer.total.toFixed(2)} €</div>
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
                    <div style={{fontWeight:"600"}}>{invoice.total.toFixed(2)} €</div>
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

      {/* Update Test Version Info */}
      <div style={{ 
        marginTop: '20px', 
        padding: '12px', 
        backgroundColor: '#e8f5e8', 
        borderRadius: '6px', 
        border: '1px solid #a8d5ba',
        textAlign: 'center',
        fontSize: '14px',
        fontWeight: '500',
        color: '#2d5a3d'
      }}>
        🚀 Version 1.8.44 - Update-Test Version (mit Dashboard-Info)
      </div>

    </div>
  );
}
