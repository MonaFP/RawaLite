/**
 * FooterInfo Component
 * 
 * Displays application information and additional context in the footer area.
 * Includes copyright, license info, and other metadata.
 * 
 * @since v1.0.59 - Footer + Focus Mode Integration
 */

import React from 'react';

interface FooterInfoProps {
  compact?: boolean;
  className?: string;
}

export function FooterInfo({ compact = false, className = '' }: FooterInfoProps) {
  
  if (compact) {
    return (
      <div className={`footer-info footer-info--compact ${className}`}>
        <span className="footer-info-text">RawaLite © 2025</span>
      </div>
    );
  }

  return (
    <div className={`footer-info ${className}`}>
      <div className="footer-info-item">
        <span className="footer-info-label">Application:</span>
        <span className="footer-info-value">RawaLite Invoice Management</span>
      </div>
      
      <div className="footer-info-item">
        <span className="footer-info-label">Copyright:</span>
        <span className="footer-info-value">© 2025 RawaLite</span>
      </div>
      
      <div className="footer-info-item">
        <span className="footer-info-label">License:</span>
        <span className="footer-info-value">Proprietary</span>
      </div>
    </div>
  );
}