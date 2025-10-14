// Echter Database-Hook mit SQLite-Verbindung
import { useState, useEffect } from 'react';
import { usePersistence } from '../contexts/PersistenceContext';
import { useUnifiedSettings } from './useUnifiedSettings';
import type { Package } from '../persistence/adapter';

export const usePackages = () => {
  const { adapter, ready } = usePersistence();
  const { getNextNumber } = useUnifiedSettings();
  const [packages, setPackages] = useState<Package[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | undefined>(undefined);

  // Load packages from database
  useEffect(() => {
    if (!ready || !adapter) return;
    
    let active = true;
    const loadPackages = async () => {
      try {
        setLoading(true);
        const data = await adapter.listPackages();
        if (active) {
          setPackages(data);
          setError(undefined);
        }
      } catch (err) {
        if (active) {
          setError(err instanceof Error ? err.message : 'Failed to load packages');
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    loadPackages();
    return () => { active = false; };
  }, [ready, adapter]);

  const createPackage = async (data: Partial<Package> & Pick<Package, 'internalTitle' | 'lineItems' | 'addVat'>) => {
    if (!adapter) throw new Error('Database not ready');
    
    setLoading(true);
    try {
      // Calculate total if not provided
      const calculatedTotal = data.total || data.lineItems.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
      
      const newPackage = await adapter.createPackage({
        internalTitle: data.internalTitle,
        lineItems: data.lineItems,
        parentPackageId: data.parentPackageId,
        total: calculatedTotal,
        addVat: data.addVat
      });
      
      setPackages(prev => [...prev, newPackage]);
      setError(undefined);
      return newPackage;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to create package';
      setError(errorMsg);
      throw new Error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const updatePackage = async (id: number, data: Partial<Package>) => {
    if (!adapter) throw new Error('Database not ready');
    
    setLoading(true);
    try {
      const updatedPackage = await adapter.updatePackage(id, data);
      
      setPackages(prev => prev.map(pkg => 
        pkg.id === id ? updatedPackage : pkg
      ));
      
      setError(undefined);
      return updatedPackage;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to update package';
      setError(errorMsg);
      throw new Error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const deletePackage = async (id: number) => {
    if (!adapter) throw new Error('Database not ready');
    
    setLoading(true);
    try {
      await adapter.deletePackage(id);
      setPackages(prev => prev.filter(pkg => pkg.id !== id));
      setError(undefined);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to delete package';
      setError(errorMsg);
      throw new Error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return { 
    packages, 
    loading, 
    error, 
    createPackage, 
    updatePackage, 
    deletePackage 
  };
};