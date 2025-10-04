import React from 'react';
import { useUnifiedSettings } from '../hooks/useUnifiedSettings';
import { useCustomers } from '../hooks/useCustomers';
import { useOffers } from '../hooks/useOffers';
import { useInvoices } from '../hooks/useInvoices';
import { usePackages } from '../hooks/usePackages';

interface CompactSidebarProps {
  className?: string;
}

export const CompactSidebar: React.FC<CompactSidebarProps> = ({ className }) => {
  const { settings, loading } = useUnifiedSettings();
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

  return (
    <div className={`sidebar compact-sidebar ${className || ''}`} style={{
      width: '200px',
      display: 'flex',
      flexDirection: 'column',
      gap: '12px',
      padding: '16px 12px'
    }}>
      {/* Logo Section */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '8px',
        marginBottom: '8px',
        padding: '8px 0',
        borderBottom: '1px solid rgba(255,255,255,0.08)'
      }}>
        {/* Logo */}
        {settings.companyData.logo ? (
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '10px',
            overflow: 'hidden',
            border: '2px solid rgba(255,255,255,0.2)',
            background: 'rgba(255,255,255,0.05)'
          }}>
            <img
              src={settings.companyData.logo}
              alt="Firmenlogo"
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover'
              }}
            />
          </div>
        ) : (
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '10px',
            background: 'radial-gradient(circle at 30% 30%, var(--accent), var(--accent-2))',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '20px',
            fontWeight: 'bold',
            color: 'white',
            textShadow: '0 2px 4px rgba(0,0,0,0.3)'
          }}>
            {settings.companyData.name ? settings.companyData.name.charAt(0).toUpperCase() : 'R'}
          </div>
        )}
        
        {/* Version */}
        <div style={{
          fontSize: '8px',
          color: 'rgba(255,255,255,0.4)',
          fontWeight: '500'
        }}>
          v1.0.13
        </div>
      </div>

      {/* Firmen Info */}
      <div style={{
        background: 'rgba(255,255,255,0.02)',
        borderRadius: '8px',
        padding: '8px',
        border: '1px solid rgba(255,255,255,0.08)',
        textAlign: 'center'
      }}>
        <div style={{
          fontSize: '0.9rem',
          marginBottom: '4px'
        }}>🏢</div>
        <div style={{
          fontSize: '10px',
          fontWeight: '600',
          color: !loading && settings.companyData?.name ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.6)',
          lineHeight: '1.2',
          wordBreak: 'break-word'
        }}>
          {!loading && settings.companyData?.name 
            ? settings.companyData.name.length > 24
              ? settings.companyData.name.substring(0, 22) + '...'
              : settings.companyData.name
            : loading 
              ? 'Laden...' 
              : 'Firma'
          }
        </div>
      </div>

      {/* Kunden */}
      <div style={{
        background: 'rgba(255,255,255,0.02)',
        borderRadius: '8px',
        padding: '8px',
        border: '1px solid rgba(255,255,255,0.08)',
        textAlign: 'center'
      }}>
        <div style={{
          fontSize: '0.9rem',
          marginBottom: '4px'
        }}>👥</div>
        <div style={{
          fontSize: '9px',
          color: 'rgba(255,255,255,0.6)',
          marginBottom: '2px'
        }}>Kunden</div>
        <div style={{
          fontSize: '1.1rem',
          fontWeight: '700',
          color: 'var(--accent, #10b981)'
        }}>
          {stats.totalCustomers}
        </div>
      </div>

      {/* Angebote */}
      <div style={{
        background: 'rgba(255,255,255,0.02)',
        borderRadius: '8px',
        padding: '8px',
        border: '1px solid rgba(255,255,255,0.08)',
        textAlign: 'center'
      }}>
        <div style={{
          fontSize: '0.9rem',
          marginBottom: '4px'
        }}>📋</div>
        <div style={{
          fontSize: '9px',
          color: 'rgba(255,255,255,0.6)',
          marginBottom: '2px'
        }}>Angebote</div>
        <div style={{
          fontSize: '10px',
          lineHeight: '1.2'
        }}>
          <div style={{
            color: '#22c55e',
            fontWeight: '600',
            marginBottom: '1px'
          }}>
            ✓ {stats.acceptedOffers} Angenommen
          </div>
          <div style={{
            color: 'rgba(255,255,255,0.5)',
            fontWeight: '500'
          }}>
            📝 {stats.pendingOffers} Entwürfe
          </div>
        </div>
      </div>

      {/* Rechnungen */}
      <div style={{
        background: 'rgba(255,255,255,0.02)',
        borderRadius: '8px',
        padding: '8px',
        border: '1px solid rgba(255,255,255,0.08)',
        textAlign: 'center'
      }}>
        <div style={{
          fontSize: '0.9rem',
          marginBottom: '4px'
        }}>🧾</div>
        <div style={{
          fontSize: '9px',
          color: 'rgba(255,255,255,0.6)',
          marginBottom: '2px'
        }}>Rechnungen</div>
        <div style={{
          fontSize: '10px',
          lineHeight: '1.2'
        }}>
          <div style={{
            color: '#22c55e',
            fontWeight: '600',
            marginBottom: '1px'
          }}>
            ✓ {stats.paidInvoices} Bezahlt
          </div>
          <div style={{
            color: '#f59e0b',
            fontWeight: '500'
          }}>
            ⏳ {stats.unpaidInvoices} Offen
          </div>
        </div>
      </div>

      {/* Pakete */}
      <div style={{
        background: 'rgba(255,255,255,0.02)',
        borderRadius: '8px',
        padding: '8px',
        border: '1px solid rgba(255,255,255,0.08)',
        textAlign: 'center'
      }}>
        <div style={{
          fontSize: '0.9rem',
          marginBottom: '4px'
        }}>📦</div>
        <div style={{
          fontSize: '9px',
          color: 'rgba(255,255,255,0.6)',
          marginBottom: '2px'
        }}>Pakete</div>
        <div style={{
          fontSize: '1.1rem',
          fontWeight: '700',
          color: 'var(--accent, #10b981)'
        }}>
          {stats.totalPackages}
        </div>
      </div>

      {/* Finanzen */}
      <div style={{
        background: 'rgba(255,255,255,0.02)',
        borderRadius: '8px',
        padding: '8px',
        border: '1px solid rgba(255,255,255,0.08)',
        textAlign: 'center'
      }}>
        <div style={{
          fontSize: '0.9rem',
          marginBottom: '4px'
        }}>💰</div>
        <div style={{
          fontSize: '9px',
          color: 'rgba(255,255,255,0.6)',
          marginBottom: '2px'
        }}>Finanzen</div>
        <div style={{
          fontSize: '9px',
          lineHeight: '1.2'
        }}>
          <div style={{
            color: '#22c55e',
            fontWeight: '600',
            marginBottom: '1px'
          }}>
            +€{stats.paidAmount.toFixed(0)} bezahlt
          </div>
          <div style={{
            color: '#f59e0b',
            fontWeight: '500'
          }}>
            -€{stats.unpaidAmount.toFixed(0)} offen
          </div>
        </div>
      </div>

      {/* Spacer */}
      <div style={{ flex: 1 }}></div>
    </div>
  );
};