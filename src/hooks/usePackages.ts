import { useState } from 'react';
import type { Package } from '../persistence/adapter';

const initialPackage: Package = {
  id: 1,
  internalTitle: 'Mock Package',
  lineItems: [],
  parentPackageId: undefined,
  total: 500,
  addVat: true,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
};

export const usePackages = () => {
  const [packages, setPackages] = useState<Package[]>([initialPackage]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | undefined>(undefined);

  const createPackage = async (data: Partial<Package> & Pick<Package, 'internalTitle' | 'lineItems' | 'addVat'>) => {
    setLoading(true);
    try {
      const calculatedTotal = data.total || data.lineItems.reduce((sum, item) => sum + (item.quantity * item.amount), 0);
      
      const newPackage: Package = {
        id: Date.now(),
        internalTitle: data.internalTitle,
        lineItems: data.lineItems,
        parentPackageId: data.parentPackageId,
        total: calculatedTotal, // Auto-calculate if not provided
        addVat: data.addVat,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      setPackages(prev => [...prev, newPackage]);
      setError(undefined);
      return newPackage;
    } catch (err) {
      setError('Failed to create package');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updatePackage = async (id: number, data: Partial<Package>) => {
    setLoading(true);
    try {
      const updatedPackage = { ...data, id, updatedAt: new Date().toISOString() };
      
      setPackages(prev => prev.map(pkg => 
        pkg.id === id 
          ? { ...pkg, ...updatedPackage }
          : pkg
      ));
      
      const pkg = packages.find(p => p.id === id);
      if (!pkg) throw new Error('Package not found');
      
      const result = { ...pkg, ...updatedPackage };
      setError(undefined);
      return result;
    } catch (err) {
      setError('Failed to update package');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const deletePackage = async (id: number) => {
    setLoading(true);
    try {
      setPackages(prev => prev.filter(pkg => pkg.id !== id));
      setError(undefined);
    } catch (err) {
      setError('Failed to delete package');
      throw err;
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