// Echter Database-Hook mit SQLite-Verbindung
import { useState, useEffect } from 'react';
import { usePersistence } from '../contexts/PersistenceContext';
import { useUnifiedSettings } from './useUnifiedSettings';
import type { Customer } from '../persistence/adapter';

export const useCustomers = () => {
  const { adapter, ready } = usePersistence();
  const { getNextNumber } = useUnifiedSettings();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | undefined>(undefined);

  // Load customers from database
  useEffect(() => {
    if (!ready || !adapter) return;
    
    let active = true;
    const loadCustomers = async () => {
      try {
        setLoading(true);
        const data = await adapter.listCustomers();
        if (active) {
          setCustomers(data);
          setError(undefined);
        }
      } catch (err) {
        if (active) {
          setError(err instanceof Error ? err.message : 'Failed to load customers');
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    loadCustomers();
    return () => { active = false; };
  }, [ready, adapter]);

  const createCustomer = async (data: Partial<Customer> & Pick<Customer, 'name'>) => {
    if (!adapter) throw new Error('Database not ready');
    
    setLoading(true);
    try {
      // Generate number if not provided
      const number = data.number || await getNextNumber('customers');
      
      const newCustomer = await adapter.createCustomer({
        number,
        name: data.name,
        email: data.email || '',
        phone: data.phone || '',
        street: data.street || '',
        zip: data.zip || '',
        city: data.city || '',
        notes: data.notes || ''
      });
      
      setCustomers(prev => [...prev, newCustomer]);
      setError(undefined);
      return newCustomer;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to create customer';
      setError(errorMsg);
      throw new Error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const updateCustomer = async (id: number, data: Partial<Customer>) => {
    if (!adapter) throw new Error('Database not ready');
    
    setLoading(true);
    try {
      const updatedCustomer = await adapter.updateCustomer(id, data);
      
      setCustomers(prev => prev.map(customer => 
        customer.id === id ? updatedCustomer : customer
      ));
      
      setError(undefined);
      return updatedCustomer;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to update customer';
      setError(errorMsg);
      throw new Error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const deleteCustomer = async (id: number) => {
    if (!adapter) throw new Error('Database not ready');
    
    setLoading(true);
    try {
      await adapter.deleteCustomer(id);
      setCustomers(prev => prev.filter(customer => customer.id !== id));
      setError(undefined);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to delete customer';
      setError(errorMsg);
      throw new Error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return { 
    customers, 
    loading, 
    error, 
    createCustomer, 
    updateCustomer, 
    deleteCustomer 
  };
};