import { useState, useEffect } from "react";
import { usePersistence } from "../contexts/PersistenceContext";
import { DatabaseError, ValidationError, handleError } from "../lib/errors";
import type { Package } from "../persistence/adapter";

export function usePackages() {
  const { adapter } = usePersistence();
  const [packages, setPackages] = useState<Package[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function loadPackages() {
    if (!adapter) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const data = await adapter.listPackages();
      setPackages(data);
    } catch (err) {
      const appError = handleError(err);
      setError(appError.message);
      console.error('Error loading packages:', appError);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadPackages();
  }, [adapter]);

  async function createPackage(packageData: Omit<Package, "id" | "createdAt" | "updatedAt" | "total">) {
    if (!adapter) {
      throw new DatabaseError("Datenbank-Adapter nicht verfügbar");
    }

    // Validation
    if (!packageData.internalTitle?.trim()) {
      throw new ValidationError("Paket-Titel ist erforderlich", "internalTitle");
    }
    
    if (!packageData.lineItems || packageData.lineItems.length === 0) {
      throw new ValidationError("Mindestens eine Position ist erforderlich", "lineItems");
    }

    // Validate line items
    packageData.lineItems.forEach((item, index) => {
      if (!item.title?.trim()) {
        throw new ValidationError(`Titel für Position ${index + 1} ist erforderlich`, `lineItems.${index}.title`);
      }
      if (item.quantity <= 0) {
        throw new ValidationError(`Menge für Position ${index + 1} muss größer als 0 sein`, `lineItems.${index}.quantity`);
      }
      if (item.amount < 0) {
        throw new ValidationError(`Preis für Position ${index + 1} darf nicht negativ sein`, `lineItems.${index}.amount`);
      }
    });

    // Calculate total
    const total = packageData.lineItems.reduce((sum, item) => {
      if (!item.parentItemId) { // Only main items count towards total
        return sum + (item.quantity * item.amount);
      }
      return sum;
    }, 0);

    setError(null);
    
    try {
      const newPackage = await adapter.createPackage({
        ...packageData,
        total
      });
      await loadPackages(); // Refresh list
      return newPackage;
    } catch (err) {
      const appError = handleError(err);
      setError(appError.message);
      console.error('Error creating package:', appError);
      throw appError;
    }
  }

  async function updatePackage(id: number, patch: Partial<Package>) {
    if (!adapter) {
      throw new DatabaseError("Datenbank-Adapter nicht verfügbar");
    }

    // Validation for required fields if they're being updated
    if (patch.internalTitle !== undefined && !patch.internalTitle.trim()) {
      throw new ValidationError("Paket-Titel ist erforderlich", "internalTitle");
    }

    if (patch.lineItems !== undefined) {
      if (patch.lineItems.length === 0) {
        throw new ValidationError("Mindestens eine Position ist erforderlich", "lineItems");
      }

      patch.lineItems.forEach((item, index) => {
        if (!item.title?.trim()) {
          throw new ValidationError(`Titel für Position ${index + 1} ist erforderlich`, `lineItems.${index}.title`);
        }
        if (item.quantity <= 0) {
          throw new ValidationError(`Menge für Position ${index + 1} muss größer als 0 sein`, `lineItems.${index}.quantity`);
        }
        if (item.amount < 0) {
          throw new ValidationError(`Preis für Position ${index + 1} darf nicht negativ sein`, `lineItems.${index}.amount`);
        }
      });

      // Recalculate total if line items are updated
      const total = patch.lineItems.reduce((sum, item) => {
        if (!item.parentItemId) { // Only main items count towards total
          return sum + (item.quantity * item.amount);
        }
        return sum;
      }, 0);
      
      patch.total = total;
    }

    setError(null);
    
    try {
      const updatedPackage = await adapter.updatePackage(id, patch);
      await loadPackages(); // Refresh list
      return updatedPackage;
    } catch (err) {
      const appError = handleError(err);
      setError(appError.message);
      console.error('Error updating package:', appError);
      throw appError;
    }
  }

  async function deletePackage(id: number) {
    if (!adapter) {
      throw new DatabaseError("Datenbank-Adapter nicht verfügbar");
    }

    setError(null);
    
    try {
      await adapter.deletePackage(id);
      await loadPackages(); // Refresh list
      return true;
    } catch (err) {
      const appError = handleError(err);
      setError(appError.message);
      console.error('Error deleting package:', appError);
      throw appError;
    }
  }

  return {
    packages,
    loading,
    error,
    createPackage,
    updatePackage,
    deletePackage,
    refresh: loadPackages
  };
}
