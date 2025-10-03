// Echter Database-Hook mit SQLite-Verbindung
import { useState, useEffect } from 'react';
import { usePersistence } from '../contexts/PersistenceContext';
import { useUnifiedSettings } from './useUnifiedSettings';
import type { Invoice } from '../persistence/adapter';

export const useInvoices = () => {
  const { adapter, ready } = usePersistence();
  const { getNextNumber } = useUnifiedSettings();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | undefined>(undefined);

  // Load invoices from database
  useEffect(() => {
    if (!ready || !adapter) return;
    
    let active = true;
    const loadInvoices = async () => {
      try {
        setLoading(true);
        const data = await adapter.listInvoices();
        if (active) {
          setInvoices(data);
          setError(undefined);
        }
      } catch (err) {
        if (active) {
          setError(err instanceof Error ? err.message : 'Failed to load invoices');
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    loadInvoices();
    return () => { active = false; };
  }, [ready, adapter]);

  const createInvoice = async (data: Omit<Invoice, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (!adapter) throw new Error('Database not ready');
    
    setLoading(true);
    try {
      // Generate invoice number if not provided
      const invoiceNumber = data.invoiceNumber || await getNextNumber('invoices');
      
      const newInvoice = await adapter.createInvoice({
        ...data,
        invoiceNumber
      });
      
      setInvoices(prev => [...prev, newInvoice]);
      setError(undefined);
      return newInvoice;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to create invoice';
      setError(errorMsg);
      throw new Error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const updateInvoice = async (id: number, data: Partial<Invoice>) => {
    if (!adapter) throw new Error('Database not ready');
    
    setLoading(true);
    try {
      const updatedInvoice = await adapter.updateInvoice(id, data);
      
      setInvoices(prev => prev.map(invoice => 
        invoice.id === id ? updatedInvoice : invoice
      ));
      
      setError(undefined);
      return updatedInvoice;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to update invoice';
      setError(errorMsg);
      throw new Error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const deleteInvoice = async (id: number) => {
    if (!adapter) throw new Error('Database not ready');
    
    setLoading(true);
    try {
      await adapter.deleteInvoice(id);
      setInvoices(prev => prev.filter(invoice => invoice.id !== id));
      setError(undefined);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to delete invoice';
      setError(errorMsg);
      throw new Error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return { 
    invoices, 
    loading, 
    error, 
    createInvoice, 
    updateInvoice, 
    deleteInvoice 
  };
};