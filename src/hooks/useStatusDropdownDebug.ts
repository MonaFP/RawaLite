// Debug Hook for Status Dropdown Problem
// Integrates debugging directly into React components
// Add this to AngebotePage.tsx and RechnungenPage.tsx

import { useEffect } from 'react';
import { usePersistence } from '../contexts/PersistenceContext';

export function useStatusDropdownDebug(componentName: string, data: any[], loading: boolean, error: any) {
  const { adapter, ready, error: persistenceError } = usePersistence();
  
  useEffect(() => {
    const debugInfo = {
      component: componentName,
      timestamp: new Date().toISOString(),
      persistenceContext: {
        ready,
        hasAdapter: !!adapter,
        error: persistenceError
      },
      dataState: {
        dataLength: data.length,
        loading,
        error: error?.message || null,
        sampleData: data.slice(0, 2)
      }
    };
    
    console.log(`🔧 [${componentName}] DEBUG INFO:`, debugInfo);
    
    // Test direct IPC if available
    if (typeof window !== 'undefined' && window.rawalite?.db) {
      const tableName = componentName.includes('ANGEBOT') ? 'offers' : 'invoices';
      
      window.rawalite.db.query(`SELECT COUNT(*) as count FROM ${tableName}`)
        .then(result => {
          console.log(`🔧 [${componentName}] Direct DB Count:`, result);
        })
        .catch(err => {
          console.error(`🔧 [${componentName}] Direct DB Error:`, err);
        });
        
      // Test simple query
      window.rawalite.db.query(`SELECT * FROM ${tableName} LIMIT 1`)
        .then(result => {
          console.log(`🔧 [${componentName}] Direct DB Sample:`, result);
        })
        .catch(err => {
          console.error(`🔧 [${componentName}] Direct DB Sample Error:`, err);
        });
    } else {
      console.log(`🔧 [${componentName}] window.rawalite.db not available`);
    }
    
  }, [componentName, data.length, loading, error, ready, adapter, persistenceError]);
  
  // Return debug actions
  return {
    testDirectQuery: async (tableName: string) => {
      if (window.rawalite?.db) {
        try {
          const result = await window.rawalite.db.query(`SELECT * FROM ${tableName}`);
          console.log(`🔧 Manual test query result:`, result);
          return result;
        } catch (error) {
          console.error(`🔧 Manual test query error:`, error);
          return null;
        }
      }
      return null;
    }
  };
}