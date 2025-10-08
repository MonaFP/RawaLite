import React from 'react';
import { useUnifiedSettings } from '../hooks/useUnifiedSettings';
import { useCustomers } from '../hooks/useCustomers';
import { useOffers } from '../hooks/useOffers';
import { useInvoices } from '../hooks/useInvoices';
import { usePackages } from '../hooks/usePackages';
import { useTimesheets } from '../hooks/useTimesheets';

interface CompactSidebarProps {
  className?: string;
}

export const CompactSidebar: React.FC<CompactSidebarProps> = ({ className }) => {
  const { settings, loading } = useUnifiedSettings();
  const { customers } = useCustomers();
  const { offers } = useOffers();
  const { invoices } = useInvoices();
  const { packages } = usePackages();
  const { timesheets } = useTimesheets();
  
  // Statistiken berechnen
  const stats = {
    totalCustomers: customers.length,
    totalOffers: offers.length,
    totalInvoices: invoices.length,
    totalPackages: packages.length,
    totalTimesheets: timesheets.length,
    
    // Angebote Statistiken - alle Status
    draftOffers: offers.filter(offer => offer.status === 'draft').length,
    sentOffers: offers.filter(offer => offer.status === 'sent').length,
    acceptedOffers: offers.filter(offer => offer.status === 'accepted').length,
    rejectedOffers: offers.filter(offer => offer.status === 'rejected').length,
    pendingOffers: offers.filter(offer => offer.status === 'draft').length, // Für Kompatibilität
    
    // Rechnungen Statistiken - alle Status
    draftInvoices: invoices.filter(invoice => invoice.status === 'draft').length,
    sentInvoices: invoices.filter(invoice => invoice.status === 'sent').length,
    paidInvoices: invoices.filter(invoice => invoice.status === 'paid').length,
    overdueInvoices: invoices.filter(invoice => invoice.status === 'overdue').length,
    cancelledInvoices: invoices.filter(invoice => invoice.status === 'cancelled').length,
    unpaidInvoices: invoices.filter(invoice => invoice.status === 'draft' || invoice.status === 'sent' || invoice.status === 'overdue').length,
    
    // Leistungsnachweise Statistiken - alle Status
    draftTimesheets: timesheets.filter(timesheet => timesheet.status === 'draft').length,
    sentTimesheets: timesheets.filter(timesheet => timesheet.status === 'sent').length,
    acceptedTimesheets: timesheets.filter(timesheet => timesheet.status === 'accepted').length,
    rejectedTimesheets: timesheets.filter(timesheet => timesheet.status === 'rejected').length,
    
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
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '4px'
        }}>
          <img
            src="/rawalite-logo.png"
            alt="CompactSidebar-App"
            style={{
              width: "100%", 
              maxWidth: "120px",
              height: "auto", 
              objectFit: "contain",
              filter: "drop-shadow(0 2px 8px rgba(0,0,0,0.3))"
            }}
          />
        </div>
        
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
          fontSize: '9px',
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
            color: '#f59e0b',
            fontWeight: '500',
            marginBottom: '1px'
          }}>
            📤 {stats.sentOffers} Versendet
          </div>
          <div style={{
            color: 'rgba(255,255,255,0.5)',
            fontWeight: '500'
          }}>
            📝 {stats.draftOffers} Entwürfe
          </div>
          {stats.rejectedOffers > 0 && (
            <div style={{
              color: '#ef4444',
              fontWeight: '500'
            }}>
              ❌ {stats.rejectedOffers} Abgelehnt
            </div>
          )}
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
          fontSize: '9px',
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
            color: '#ef4444',
            fontWeight: '600',
            marginBottom: '1px'
          }}>
            🚨 {stats.overdueInvoices} Überfällig
          </div>
          <div style={{
            color: '#f59e0b',
            fontWeight: '500',
            marginBottom: '1px'
          }}>
            📤 {stats.sentInvoices} Versendet
          </div>
          <div style={{
            color: 'rgba(255,255,255,0.5)',
            fontWeight: '500'
          }}>
            📝 {stats.draftInvoices} Entwürfe
          </div>
          {stats.cancelledInvoices > 0 && (
            <div style={{
              color: '#6b7280',
              fontWeight: '500'
            }}>
              ❌ {stats.cancelledInvoices} Storniert
            </div>
          )}
        </div>
      </div>

      {/* Leistungsnachweise */}
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
        }}>⏱️</div>
        <div style={{
          fontSize: '9px',
          color: 'rgba(255,255,255,0.6)',
          marginBottom: '2px'
        }}>Leistungsnachweise</div>
        <div style={{
          fontSize: '9px',
          lineHeight: '1.2'
        }}>
          <div style={{
            color: '#22c55e',
            fontWeight: '600',
            marginBottom: '1px'
          }}>
            ✓ {stats.acceptedTimesheets} Akzeptiert
          </div>
          <div style={{
            color: '#f59e0b',
            fontWeight: '500',
            marginBottom: '1px'
          }}>
            📤 {stats.sentTimesheets} Versendet
          </div>
          <div style={{
            color: '#6b7280',
            fontWeight: '500'
          }}>
            📝 {stats.draftTimesheets} Entwürfe
          </div>
          {stats.rejectedTimesheets > 0 && (
            <div style={{
              color: '#ef4444',
              fontWeight: '500'
            }}>
              ❌ {stats.rejectedTimesheets} Abgelehnt
            </div>
          )}
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