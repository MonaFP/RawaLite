import React from 'react';
import { useLocation } from 'react-router-dom';
import { useUnifiedSettings } from '../hooks/useUnifiedSettings';
import { useCustomers } from '../hooks/useCustomers';
import { useOffers } from '../hooks/useOffers';
import { useInvoices } from '../hooks/useInvoices';
import { usePackages } from '../hooks/usePackages';
import { useTimesheets } from '../hooks/useTimesheets';

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
      {/* App Logo + Page Title */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
        minWidth: '200px'
      }}>
        {/* App Logo entfernt - LOGO-D komplett weg */}
        
        {/* Page Title */}
        <div style={{
          fontSize: '1.2rem',
          fontWeight: '600',
          color: 'white',
          textShadow: '0 1px 2px rgba(0,0,0,0.2)'
        }}>
          {getPageTitle()}
        </div>
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
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '4px'
        }}>
          {settings.companyData.logo ? (
            <img
              src={settings.companyData.logo}
              alt="HeaderStatistics-Company"
              style={{
                width: '50px',
                height: '50px',
                objectFit: 'contain'
              }}
            />
          ) : (
            <div style={{
              width: '50px',
              height: '50px',
              background: 'rgba(255,255,255,0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '16px',
              fontWeight: 'bold',
              color: 'white'
            }}>
              F
            </div>
          )}
        </div>
        
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
            fontSize: '0.7rem',
            lineHeight: '1.2'
          }}>
            <div style={{ marginBottom: '1px' }}>
              <span style={{
                color: '#22c55e',
                fontWeight: '600'
              }}>
                {stats.paidInvoices}
              </span>
              <span style={{
                color: 'rgba(255,255,255,0.6)',
                margin: '0 1px'
              }}>/</span>
              <span style={{
                color: '#f59e0b',
                fontWeight: '500'
              }}>
                {stats.unpaidInvoices}
              </span>
            </div>
            {stats.overdueInvoices > 0 && (
              <div style={{
                color: '#ef4444',
                fontWeight: '600',
                fontSize: '0.65rem'
              }}>
                🚨 {stats.overdueInvoices} überfällig
              </div>
            )}
          </div>
        </div>

        {/* Leistungsnachweise */}
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
          }}>⏱️</div>
          <div style={{
            fontSize: '0.75rem',
            color: 'rgba(255,255,255,0.8)',
            marginBottom: '4px'
          }}>Leistungsn.</div>
          <div style={{
            fontSize: '0.8rem',
            lineHeight: '1.2'
          }}>
            <span style={{
              color: '#22c55e',
              fontWeight: '600'
            }}>
              {stats.acceptedTimesheets}
            </span>
            <span style={{
              color: 'rgba(255,255,255,0.6)',
              margin: '0 2px'
            }}>/</span>
            <span style={{
              color: 'rgba(255,255,255,0.7)',
              fontWeight: '500'
            }}>
              {stats.draftTimesheets}
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