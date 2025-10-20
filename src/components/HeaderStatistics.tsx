import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useUnifiedSettings } from '../hooks/useUnifiedSettings';
import { useCustomers } from '../hooks/useCustomers';
import { useOffers } from '../hooks/useOffers';
import { useInvoices } from '../hooks/useInvoices';
import { useTheme } from '../hooks/useTheme';

interface HeaderStatisticsProps {
  title?: string;
  className?: string;
}

export const HeaderStatistics: React.FC<HeaderStatisticsProps> = ({ title, className = 'header-statistics' }) => {
  const location = useLocation();
  const { settings } = useUnifiedSettings();
  const { customers } = useCustomers();
  const { offers } = useOffers();
  const { invoices } = useInvoices();
  const { 
    getThemedPageTitle, 
    isLoading, 
    error,
    headerConfig,
    companyConfig,
    statisticsConfig 
  } = useTheme();
  
  // Dynamic title with theme integration
  const getPageTitle = () => {
    if (title) return title;
    return getThemedPageTitle(location.pathname);
  };

  // Statistiken berechnen
  const totalCustomers = customers.length;
  const totalOffers = offers.length;
  const totalInvoices = invoices.length;
  
  const openOffers = offers.filter(offer => 
    offer.status === 'draft' || offer.status === 'sent'
  ).length;
  
  const acceptedOffers = offers.filter(offer => 
    offer.status === 'accepted'
  ).length;
  
  const paidInvoices = invoices.filter(invoice => 
    invoice.status === 'paid'
  ).length;
  
  const unpaidInvoices = invoices.filter(invoice => 
    invoice.status === 'draft' || invoice.status === 'sent' || invoice.status === 'overdue'
  ).length;

  // Loading state mit CSS Variables
  if (isLoading) {
    return (
      <div className={className}>
        <div className="left-section">
          Loading theme...
        </div>
      </div>
    );
  }

  if (error) {
    console.warn('Theme loading error:', error);
    // Continue with fallback theme
  }

  return (
    <div className={className}>
      {/* Page Title Section */}
      <div className="page-title-section">
        <div className="page-title">
          {getPageTitle()}
        </div>
      </div>

      {/* Company Section mit CSS Variables */}
      <div className="company-section">
        <div className="company-logo">
          {settings.companyData?.logo ? (
            <img 
              src={settings.companyData.logo} 
              alt="HeaderStatistics-Company" 
              className="company-logo-img"
            />
          ) : (
            <div className="company-logo-fallback">
              {(settings.companyData?.name || 'Firma').charAt(0)}
            </div>
          )}
        </div>
        
        <div className="company-name">
          {settings.companyData?.name || 'Firma'}
        </div>
      </div>

      {/* Statistics Cards mit CSS Variables */}
      <div className="statistics-cards">
        {/* Kunden Card */}
        <div className="statistic-card">
          <div className="stat-icon">👥</div>
          <div className="stat-value">{totalCustomers}</div>
          <div className="stat-label">Kunden</div>
        </div>

        {/* Angebote Card */}
        <div className="statistic-card">
          <div className="stat-icon">📝</div>
          <div className="stat-value">{totalOffers}</div>
          <div className="stat-label">Angebote</div>
        </div>

        {/* Offene Angebote Card */}
        <div className="statistic-card">
          <div className="stat-icon">⏳</div>
          <div className="stat-value">{openOffers}</div>
          <div className="stat-label">Offen</div>
        </div>

        {/* Angenommene Angebote Card */}
        <div className="statistic-card success">
          <div className="stat-icon">✅</div>
          <div className="stat-value">{acceptedOffers}</div>
          <div className="stat-label">Angenommen</div>
        </div>

        {/* Rechnungen Card */}
        <div className="statistic-card">
          <div className="stat-icon">💰</div>
          <div className="stat-value">{totalInvoices}</div>
          <div className="stat-label">Rechnungen</div>
        </div>

        {/* Unbezahlte Rechnungen Card */}
        <div className="statistic-card warning">
          <div className="stat-icon">⏰</div>
          <div className="stat-value">{unpaidInvoices}</div>
          <div className="stat-label">Offen</div>
        </div>

        {/* Bezahlte Rechnungen Card */}
        <div className="statistic-card success">
          <div className="stat-icon">✅</div>
          <div className="stat-value">{paidInvoices}</div>
          <div className="stat-label">Bezahlt</div>
        </div>
      </div>
    </div>
  );
};