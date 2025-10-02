// Funktionale Mock-Hooks mit echtem React State Management
import { useState } from 'react';
import type { Customer, Offer, Invoice, Package } from '../persistence/adapter';

// Initial Mock Data
const initialCustomer: Customer = {
  id: 1,
  number: 'K-001',
  name: 'Mock Customer',
  email: 'mock@customer.com',
  phone: '123456789',
  street: 'Mock Street',
  zip: '12345',
  city: 'Mock City',
  notes: 'Mock notes',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
};

export const useCustomers = () => {
  const [customers, setCustomers] = useState<Customer[]>([initialCustomer]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | undefined>(undefined);

  const createCustomer = async (data: Partial<Customer> & Pick<Customer, 'name'>) => {
    setLoading(true);
    try {
      const customerCount = customers.length + 1;
      const newCustomer: Customer = {
        id: Date.now(), // Simple ID generation
        number: data.number || `K-${String(customerCount).padStart(3, '0')}`, // Auto-generate if not provided
        name: data.name,
        email: data.email || '',
        phone: data.phone || '',
        street: data.street || '',
        zip: data.zip || '',
        city: data.city || '',
        notes: data.notes || '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      setCustomers(prev => [...prev, newCustomer]);
      setError(undefined);
      return newCustomer;
    } catch (err) {
      setError('Failed to create customer');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateCustomer = async (id: number, data: Partial<Customer>) => {
    setLoading(true);
    try {
      const updatedCustomer = { ...data, id, updatedAt: new Date().toISOString() };
      
      setCustomers(prev => prev.map(customer => 
        customer.id === id 
          ? { ...customer, ...updatedCustomer }
          : customer
      ));
      
      const customer = customers.find(c => c.id === id);
      if (!customer) throw new Error('Customer not found');
      
      const result = { ...customer, ...updatedCustomer };
      setError(undefined);
      return result;
    } catch (err) {
      setError('Failed to update customer');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const deleteCustomer = async (id: number) => {
    setLoading(true);
    try {
      setCustomers(prev => prev.filter(customer => customer.id !== id));
      setError(undefined);
    } catch (err) {
      setError('Failed to delete customer');
      throw err;
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

// useUpdateChecker Export für Kompatibilität
export const useUpdateChecker = () => ({
  state: { currentPhase: 'idle' },
  isChecking: false,
  isDownloading: false,
  isInstalling: false,
  hasUpdate: false,
  currentVersion: '1.0.5',
  latestVersion: undefined,
  updateInfo: undefined,
  downloadProgress: undefined,
  error: undefined,
  checkForUpdates: async () => {},
  startDownload: async () => {},
  cancelDownload: async () => {},
  installUpdate: async () => {},
  restartApp: async () => {},
  grantConsent: () => {},
  denyConsent: () => {},
  clearError: () => {},
  config: {},
  updateConfig: async () => {}
});