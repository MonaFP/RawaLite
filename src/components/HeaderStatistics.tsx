import React from 'react';
import { useLocation } from 'react-router-dom';
import { useUnifiedSettings } from '../hooks/useUnifiedSettings';
import { useCustomers } from '../hooks/useCustomers';
import { useOffers } from '../hooks/useOffers';
import { useInvoices } from '../hooks/useInvoices';
import { usePackages } from '../hooks/usePackages';

interface HeaderStatisticsProps {
  title?: string;
}

export const HeaderStatistics: React.FC<HeaderStatisticsProps> = ({ title }) => {
  const location = useLocation();
  const { settings } = useUnifiedSettings();
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
    paidAmount: invoices.filter(inv => inv.status === 'paid').reduce((sum, invoice) => sum + invoice.total, 0),
    unpaidAmount: invoices.filter(inv => inv.status !== 'paid').reduce((sum, invoice) => sum + invoice.total, 0),
  };
  
  // Dynamic title based on current route
  const getPageTitle = () => {
    if (title) return title;
    
    switch (location.pathname) {
      case '/': return 'Dashboard';
      case '/kunden': return 'Kunden';
      case '/angebote': return 'Angebote';
      case '/pakete': return 'Pakete';
      case '/rechnungen': return 'Rechnungen';
      case '/leistungsnachweise': return 'Leistungsnachweise';
      case '/einstellungen': return 'Einstellungen';
      default: 
        if (location.pathname.startsWith('/angebote/')) return 'Angebot Details';
        return 'RawaLite';
    }
  };

  return (
    <div className="header-statistics" style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      width: '100%',
      padding: '12px 24px',
      gap: '16px'
    }}>
      {/* Page Title */}
      <div style={{
        fontSize: '1.2rem',
        fontWeight: '600',
        color: 'white',
        textShadow: '0 1px 2px rgba(0,0,0,0.2)',
        minWidth: '150px'
      }}>
        {getPageTitle()}
      </div>

      {/* Company Logo/Name */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        background: 'rgba(255,255,255,0.1)',
        borderRadius: '8px',
        padding: '8px 15px',
        border: '1px solid rgba(255,255,255,0.2)',
        minWidth: '180px'
      }}>
        {/* Logo */}
        {settings.companyData.logo ? (
          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: '6px',
            overflow: 'hidden',
            border: '1px solid rgba(255,255,255,0.3)'
          }}>
            <img
              src={settings.companyData.logo}
              alt="Logo"
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover'
              }}
            />
          </div>
        ) : (
          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: '6px',
            background: 'rgba(255,255,255,0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '14px',
            fontWeight: 'bold',
            color: 'white'
          }}>
            {settings.companyData.name ? settings.companyData.name.charAt(0).toUpperCase() : 'R'}
          </div>
        )}
        
        {/* Company Name */}
        <div style={{
          fontSize: '0.9rem',
          fontWeight: '600',
          color: 'white',
          maxWidth: '140px',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap'
        }}>
          {settings.companyData?.name || 'Firma'}
        </div>
      </div>

      {/* Statistics Cards */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
        flex: 1,
        justifyContent: 'center'
      }}>
        {/* Kunden */}
        <div style={{
          background: 'rgba(255,255,255,0.1)',
          borderRadius: '8px',
          padding: '10px 16px',
          border: '1px solid rgba(255,255,255,0.2)',
          textAlign: 'center',
          minWidth: '95px',
          width: '95px'
        }}>
          <div style={{
            fontSize: '1.1rem',
            marginBottom: '4px'
          }}>👥</div>
          <div style={{
            fontSize: '0.75rem',
            color: 'rgba(255,255,255,0.8)',
            marginBottom: '4px'
          }}>Kunden</div>
          <div style={{
            fontSize: '1.1rem',
            fontWeight: '700',
            color: 'white'
          }}>
            {stats.totalCustomers}
          </div>
        </div>

        {/* Angebote */}
        <div style={{
          background: 'rgba(255,255,255,0.1)',
          borderRadius: '8px',
          padding: '10px 16px',
          border: '1px solid rgba(255,255,255,0.2)',
          textAlign: 'center',
          minWidth: '95px',
          width: '95px'
        }}>
          <div style={{
            fontSize: '1.1rem',
            marginBottom: '4px'
          }}>📋</div>
          <div style={{
            fontSize: '0.75rem',
            color: 'rgba(255,255,255,0.8)',
            marginBottom: '4px'
          }}>Angebote</div>
          <div style={{
            fontSize: '0.8rem',
            lineHeight: '1.2'
          }}>
            <span style={{
              color: '#22c55e',
              fontWeight: '600'
            }}>
              {stats.acceptedOffers}
            </span>
            <span style={{
              color: 'rgba(255,255,255,0.6)',
              margin: '0 2px'
            }}>/</span>
            <span style={{
              color: 'rgba(255,255,255,0.7)',
              fontWeight: '500'
            }}>
              {stats.pendingOffers}
            </span>
          </div>
        </div>

        {/* Rechnungen */}
        <div style={{
          background: 'rgba(255,255,255,0.1)',
          borderRadius: '8px',
          padding: '10px 16px',
          border: '1px solid rgba(255,255,255,0.2)',
          textAlign: 'center',
          minWidth: '95px',
          width: '95px'
        }}>
          <div style={{
            fontSize: '1.1rem',
            marginBottom: '4px'
          }}>🧾</div>
          <div style={{
            fontSize: '0.75rem',
            color: 'rgba(255,255,255,0.8)',
            marginBottom: '4px'
          }}>Rechnungen</div>
          <div style={{
            fontSize: '0.8rem',
            lineHeight: '1.2'
          }}>
            <span style={{
              color: '#22c55e',
              fontWeight: '600'
            }}>
              {stats.paidInvoices}
            </span>
            <span style={{
              color: 'rgba(255,255,255,0.6)',
              margin: '0 2px'
            }}>/</span>
            <span style={{
              color: '#f59e0b',
              fontWeight: '500'
            }}>
              {stats.unpaidInvoices}
            </span>
          </div>
        </div>

        {/* Pakete */}
        <div style={{
          background: 'rgba(255,255,255,0.1)',
          borderRadius: '8px',
          padding: '10px 16px',
          border: '1px solid rgba(255,255,255,0.2)',
          textAlign: 'center',
          minWidth: '95px',
          width: '95px'
        }}>
          <div style={{
            fontSize: '1.1rem',
            marginBottom: '4px'
          }}>📦</div>
          <div style={{
            fontSize: '0.75rem',
            color: 'rgba(255,255,255,0.8)',
            marginBottom: '4px'
          }}>Pakete</div>
          <div style={{
            fontSize: '1.1rem',
            fontWeight: '700',
            color: 'white'
          }}>
            {stats.totalPackages}
          </div>
        </div>

        {/* Finanzen */}
        <div style={{
          background: 'rgba(255,255,255,0.1)',
          borderRadius: '8px',
          padding: '10px 16px',
          border: '1px solid rgba(255,255,255,0.2)',
          textAlign: 'center',
          minWidth: '95px',
          width: '95px'
        }}>
          <div style={{
            fontSize: '1.1rem',
            marginBottom: '4px'
          }}>💰</div>
          <div style={{
            fontSize: '0.75rem',
            color: 'rgba(255,255,255,0.8)',
            marginBottom: '4px'
          }}>Finanzen</div>
          <div style={{
            fontSize: '0.75rem',
            lineHeight: '1.2'
          }}>
            <div style={{
              color: '#22c55e',
              fontWeight: '600'
            }}>
              +€{stats.paidAmount.toFixed(0)}
            </div>
            <div style={{
              color: '#f59e0b',
              fontWeight: '500'
            }}>
              -€{stats.unpaidAmount.toFixed(0)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};