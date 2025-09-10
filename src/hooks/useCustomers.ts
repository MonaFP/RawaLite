import { useEffect, useState } from "react";
import { usePersistence } from "../contexts/PersistenceContext";
import { useUnifiedSettings } from "./useUnifiedSettings";
import { DatabaseError, ValidationError, handleError } from "../lib/errors";
import type { Customer } from "../persistence/adapter";

// Email validation helper
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function useCustomers() {
  const { adapter, ready, error } = usePersistence();
  const { getNextNumber } = useUnifiedSettings();
  const [data, setData] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const loadData = async () => {
    if (!adapter) return;
    setLoading(true);
    setLocalError(null);
    
    try {
      const rows = await adapter.listCustomers();
      setData(rows);
    } catch (err) {
      const appError = handleError(err);
      setLocalError(appError.message);
      console.error('Error loading customers:', appError);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!ready || !adapter) return;
    loadData();
  }, [ready, adapter]);

  const createCustomer = async (input: Omit<Customer, "id" | "createdAt" | "updatedAt" | "number">) => {
    if (!adapter) {
      throw new DatabaseError('Datenbank-Adapter nicht verfügbar');
    }
    
    // Validation
    if (!input.name?.trim()) {
      throw new ValidationError('Kundenname ist erforderlich', 'name');
    }
    
    // Email is optional, but if provided, should be valid
    if (input.email && !isValidEmail(input.email)) {
      throw new ValidationError('Ungültige E-Mail-Adresse', 'email');
    }
    
    setLocalError(null);
    
    try {
      console.log('Creating customer...');
      
      // Generate automatic customer number (now async)
      let customerNumber: string;
      try {
        console.log('Getting next customer number...');
        customerNumber = await getNextNumber('customers');
        console.log('Got customer number:', customerNumber);
      } catch (error) {
        // Fallback to timestamp-based numbering if settings not available
        console.warn('Settings not available, using fallback numbering:', error);
        customerNumber = `K-${Date.now()}`;
      }

      console.log('Creating customer with data:', { ...input, number: customerNumber });
      await adapter.createCustomer({
        ...input,
        number: customerNumber
      });
      
      console.log('Customer created successfully, refreshing data...');
      await loadData(); // Refresh data
      console.log('Data refreshed');
      return true;
    } catch (err) {
      const appError = handleError(err);
      setLocalError(appError.message);
      console.error('Error creating customer:', appError);
      throw appError; // Re-throw for component handling
    }
  };

  const updateCustomer = async (id: number, patch: Partial<Customer>) => {
    console.log('useCustomers updateCustomer called with:', id, patch);
    
    if (!adapter) {
      throw new DatabaseError('Datenbank-Adapter nicht verfügbar');
    }
    
    // Validation for required fields if they're being updated
    if (patch.name !== undefined && !patch.name.trim()) {
      throw new ValidationError('Kundenname ist erforderlich', 'name');
    }
    
    // Email is optional, but if provided, should be valid
    if (patch.email !== undefined && patch.email && !isValidEmail(patch.email)) {
      throw new ValidationError('Ungültige E-Mail-Adresse', 'email');
    }
    
    setLocalError(null);
    
    try {
      console.log('Updating customer with adapter...');
      await adapter.updateCustomer(id, patch);
      console.log('Customer updated successfully');
      await loadData(); // Refresh data
      return true;
    } catch (err) {
      console.error('Error in updateCustomer:', err);
      const appError = handleError(err);
      setLocalError(appError.message);
      console.error('Error updating customer:', appError);
      throw appError; // Re-throw for component handling
    }
  };

  const deleteCustomer = async (id: number) => {
    console.log('useCustomers deleteCustomer called with:', id);
    
    if (!adapter) {
      throw new DatabaseError('Datenbank-Adapter nicht verfügbar');
    }
    
    setLocalError(null);
    
    try {
      console.log('Deleting customer with adapter...');
      await adapter.deleteCustomer(id);
      console.log('Customer deleted successfully');
      await loadData(); // Refresh data
      return true;
    } catch (err) {
      console.error('Error in deleteCustomer:', err);
      const appError = handleError(err);
      setLocalError(appError.message);
      console.error('Error deleting customer:', appError);
      throw appError; // Re-throw for component handling
    }
  };

  return { 
    customers: data, 
    loading, 
    error: error || localError, // Combine persistence and local errors
    createCustomer,
    updateCustomer,
    deleteCustomer,
    refresh: loadData
  };
}
