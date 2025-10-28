/**
 * FooterStatus Component
 * 
 * Displays system status information in the footer area.
 * Includes database connection, version info, and current navigation mode.
 * 
 * @since v1.0.59 - Footer + Focus Mode Integration
 */

import React from 'react';

interface FooterStatusProps {
  compact?: boolean;
  className?: string;
}

export function FooterStatus({ compact = false, className = '' }: FooterStatusProps) {
  // Mock status data - in real implementation, this would come from context or props
  const statusInfo = {
    databaseConnected: true,
    version: '1.0.58',
    currentNavigationMode: 'mode-dashboard-view' as const,  // KI-safe mode instead of legacy
    themeName: 'sage'
  };

  if (compact) {
    return (
      <div className={`footer-status footer-status--compact ${className}`}>
        <div className="footer-status-item footer-status-item--active">
          <span className="status-indicator">●</span>
          <span className="status-value">DB</span>
        </div>
        <div className="footer-status-item">
          <span className="status-value">v{statusInfo.version}</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`footer-status ${className}`}>
      <div 
        className={`footer-status-item ${statusInfo.databaseConnected ? 'footer-status-item--active' : ''}`}
        title={`Database: ${statusInfo.databaseConnected ? 'Connected' : 'Disconnected'}`}
      >
        <span className="status-indicator">
          {statusInfo.databaseConnected ? '●' : '○'}
        </span>
        <span className="status-label">Database:</span>
        <span className="status-value">
          {statusInfo.databaseConnected ? 'Connected' : 'Disconnected'}
        </span>
      </div>
      
      <div className="footer-status-item" title={`Version: ${statusInfo.version}`}>
        <span className="status-label">Version:</span>
        <span className="status-value">v{statusInfo.version}</span>
      </div>
      
      <div className="footer-status-item" title={`Navigation Mode: ${statusInfo.currentNavigationMode}`}>
        <span className="status-label">Mode:</span>
        <span className="status-value">{statusInfo.currentNavigationMode}</span>
      </div>
      
      {statusInfo.themeName && (
        <div className="footer-status-item" title={`Theme: ${statusInfo.themeName}`}>
          <span className="status-label">Theme:</span>
          <span className="status-value">{statusInfo.themeName}</span>
        </div>
      )}
    </div>
  );
}