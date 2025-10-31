import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useUnifiedSettings } from '../hooks/useUnifiedSettings';
import { useCustomers } from '../hooks/useCustomers';
import { useOffers } from '../hooks/useOffers';
import { useInvoices } from '../hooks/useInvoices';
import { useTheme } from '../hooks/useTheme';
import { useNavigation } from '../contexts/NavigationContext';

interface HeaderStatisticsProps {
  title?: string;
  className?: string;
}

export const HeaderStatistics: React.FC<HeaderStatisticsProps> = ({ title, ...props }) => {
  const location = useLocation();
  const { settings } = useUnifiedSettings();
  const { customers } = useCustomers();
  const { offers } = useOffers();
  const { invoices } = useInvoices();
  const { mode: currentNavigationMode } = useNavigation(); // ✅ LEGACY FIX: Dynamic navigation mode
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
      <div data-component="statistics-header" data-loading="true">
        <div data-section="left">
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
    <div data-component="statistics-header" data-navigation-mode={currentNavigationMode}>
      {/* Page Title Section */}
      <div data-section="page-title">
        <div data-element="title">
          {getPageTitle()}
        </div>
      </div>

      {/* Company Section mit CSS Variables */}
      <div data-section="company">
        <div data-element="logo">
          {settings.companyData?.logo ? (
            <img 
              src={settings.companyData.logo} 
              alt="HeaderStatistics-Company" 
              data-element="logo-image"
            />
          ) : (
            <div data-element="logo-fallback">
              {(settings.companyData?.name || 'Firma').charAt(0)}
            </div>
          )}
        </div>
        
        <div data-element="company-name">
          {settings.companyData?.name || 'Firma'}
        </div>
      </div>

      {/* Statistics Cards mit CSS Variables */}
      <div data-section="statistics-cards">
        {/* Kunden Card */}
        <div data-component="statistic-card">
          <div data-element="icon">👥</div>
          <div data-element="value">{totalCustomers}</div>
          <div data-element="label">Kunden</div>
        </div>

        {/* Angebote Card */}
        <div data-component="statistic-card">
          <div data-element="icon">📝</div>
          <div data-element="value">{totalOffers}</div>
          <div data-element="label">Angebote</div>
        </div>

        {/* Offene Angebote Card */}
        <div data-component="statistic-card">
          <div data-element="icon">⏳</div>
          <div data-element="value">{openOffers}</div>
          <div data-element="label">Offen</div>
        </div>

        {/* Angenommene Angebote Card */}
        <div data-component="statistic-card" data-status="success">
          <div data-element="icon">✅</div>
          <div data-element="value">{acceptedOffers}</div>
          <div data-element="label">Angenommen</div>
        </div>

        {/* Rechnungen Card */}
        <div data-component="statistic-card">
          <div data-element="icon">💰</div>
          <div data-element="value">{totalInvoices}</div>
          <div data-element="label">Rechnungen</div>
        </div>

        {/* Unbezahlte Rechnungen Card */}
        <div data-component="statistic-card" data-status="warning">
          <div data-element="icon">⏰</div>
          <div data-element="value">{unpaidInvoices}</div>
          <div data-element="label">Offen</div>
        </div>

        {/* Bezahlte Rechnungen Card */}
        <div data-component="statistic-card" data-status="success">
          <div data-element="icon">✅</div>
          <div data-element="value">{paidInvoices}</div>
          <div data-element="label">Bezahlt</div>
        </div>
      </div>
    </div>
  );
};