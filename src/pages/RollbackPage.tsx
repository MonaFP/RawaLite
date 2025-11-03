/**
 * RollbackPage - Database Rollback & Recovery Management
 * 
 * Phase 2: Rollback System Frontend Integration
 * Page wrapper for RollbackManager component with routing integration.
 * 
 * @since v1.0.73
 */

import React from 'react';
import RollbackManager from '../components/RollbackManager';

/**
 * RollbackPage - Main page for database rollback operations
 * 
 * Provides:
 * - Full-page access to RollbackManager component
 * - Navigation menu integration
 * - Rollback workflow execution
 */
export default function RollbackPage() {
  const handleRollbackComplete = (result: any) => {
    console.log('[RollbackPage] Rollback completed:', result);
    // Could show success message or redirect here
  };

  const handleClose = () => {
    console.log('[RollbackPage] Rollback manager closed');
    // Could navigate back or update state here
  };

  return (
    <div className="rollback-page" style={{ padding: '20px' }}>
      <h1>Datenbank-Wiederherstellung</h1>
      <p style={{ color: '#666', marginBottom: '20px' }}>
        Verwalten Sie Datenbank-Backups und führen Sie Rollbacks zu früheren Versionen durch.
      </p>
      
      <RollbackManager
        onRollbackComplete={handleRollbackComplete}
        onClose={handleClose}
        className="rollback-manager-page"
      />
    </div>
  );
}
