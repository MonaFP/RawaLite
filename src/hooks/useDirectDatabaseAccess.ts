// EMERGENCY STATUS DROPDOWN FIX
// Bypasses potential field-mapping issues with direct IPC calls
// Add this to AngebotePage.tsx and RechnungenPage.tsx

import { useState, useEffect } from 'react';

export function useDirectDatabaseAccess() {
  const [directOffers, setDirectOffers] = useState<any[]>([]);
  const [directInvoices, setDirectInvoices] = useState<any[]>([]);
  const [directLoading, setDirectLoading] = useState(true);
  const [directError, setDirectError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    
    const loadDirectData = async () => {
      if (typeof window === 'undefined' || !window.rawalite?.db) {
        console.log('🔧 [DirectDB] window.rawalite.db not available yet...');
        return;
      }
      
      try {
        console.log('🔧 [DirectDB] Loading data directly via IPC...');
        
        // Direct offers query - NO field mapping
        const rawOffers = await window.rawalite.db.query('SELECT * FROM offers ORDER BY created_at DESC');
        console.log('🔧 [DirectDB] Raw offers:', rawOffers);
        
        // Direct invoices query - NO field mapping  
        const rawInvoices = await window.rawalite.db.query('SELECT * FROM invoices ORDER BY created_at DESC');
        console.log('🔧 [DirectDB] Raw invoices:', rawInvoices);
        
        if (active) {
          setDirectOffers(rawOffers);
          setDirectInvoices(rawInvoices);
          setDirectError(null);
        }
        
      } catch (error) {
        console.error('🔧 [DirectDB] Direct database access failed:', error);
        if (active) {
          setDirectError(error instanceof Error ? error.message : 'Direct DB access failed');
        }
      } finally {
        if (active) {
          setDirectLoading(false);
        }
      }
    };
    
    // Initial load
    loadDirectData();
    
    // Retry mechanism every 2 seconds until data is loaded
    const retryInterval = setInterval(() => {
      if (directOffers.length === 0 && directInvoices.length === 0 && !directError) {
        console.log('🔧 [DirectDB] Retrying data load...');
        loadDirectData();
      } else {
        clearInterval(retryInterval);
      }
    }, 2000);
    
    return () => {
      active = false;
      clearInterval(retryInterval);
    };
  }, [directOffers.length, directInvoices.length, directError]);

  // Direct status update function - bypasses adapter
  const updateStatusDirect = async (tableName: 'offers' | 'invoices', id: number, newStatus: string) => {
    console.log('🔧 [DirectDB] Direct status update:', { tableName, id, newStatus });
    
    try {
      const statusDates: Record<string, string> = {};
      const now = new Date().toISOString();
      
      // Set appropriate status date
      switch (newStatus) {
        case 'sent':
          statusDates.sent_at = now;
          break;
        case 'accepted':
          statusDates.accepted_at = now;
          break;
        case 'rejected':
          statusDates.rejected_at = now;
          break;
        case 'paid':
          statusDates.paid_at = now;
          break;
        case 'overdue':
          statusDates.overdue_at = now;
          break;
        case 'cancelled':
          statusDates.cancelled_at = now;
          break;
      }
      
      // Direct SQL update - NO field mapping
      let updateQuery = `UPDATE ${tableName} SET status = ?, updated_at = ?`;
      let params: any[] = [newStatus, now];
      
      // Add status date fields
      Object.entries(statusDates).forEach(([field, value]) => {
        updateQuery += `, ${field} = ?`;
        params.push(value);
      });
      
      updateQuery += ' WHERE id = ?';
      params.push(id);
      
      console.log('🔧 [DirectDB] Executing update:', updateQuery, params);
      
      const result = await window.rawalite.db.exec(updateQuery, params);
      console.log('🔧 [DirectDB] Update result:', result);
      
      // Reload data after update
      if (tableName === 'offers') {
        const newOffers = await window.rawalite.db.query('SELECT * FROM offers ORDER BY created_at DESC');
        setDirectOffers(newOffers);
      } else {
        const newInvoices = await window.rawalite.db.query('SELECT * FROM invoices ORDER BY created_at DESC');
        setDirectInvoices(newInvoices);
      }
      
      return result;
      
    } catch (error) {
      console.error('🔧 [DirectDB] Status update failed:', error);
      throw error;
    }
  };

  return {
    directOffers,
    directInvoices,
    directLoading,
    directError,
    updateStatusDirect
  };
}