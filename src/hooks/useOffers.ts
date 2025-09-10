import { useState, useEffect } from "react";
import { usePersistence } from "../contexts/PersistenceContext";
import { useUnifiedSettings } from "./useUnifiedSettings";
import { DatabaseError, ValidationError, handleError } from "../lib/errors";
import type { Offer } from "../persistence/adapter";

export function useOffers() {
  const { adapter } = usePersistence();
  const { getNextNumber } = useUnifiedSettings();
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function loadOffers() {
    if (!adapter) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const data = await adapter.listOffers();
      setOffers(data);
    } catch (err) {
      const appError = handleError(err);
      setError(appError.message);
      console.error('Error loading offers:', appError);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadOffers();
  }, [adapter]);

  async function createOffer(offerData: Omit<Offer, "id" | "createdAt" | "updatedAt" | "offerNumber" | "subtotal" | "vatAmount" | "total">) {
    if (!adapter) {
      throw new DatabaseError("Datenbank-Adapter nicht verfügbar");
    }

    // Validation
    if (!offerData.title?.trim()) {
      throw new ValidationError("Angebots-Titel ist erforderlich", "title");
    }
    
    if (!offerData.customerId) {
      throw new ValidationError("Kunde ist erforderlich", "customerId");
    }

    if (!offerData.lineItems || offerData.lineItems.length === 0) {
      throw new ValidationError("Mindestens eine Position ist erforderlich", "lineItems");
    }

    // Validate line items and calculate totals
    let subtotal = 0;
    offerData.lineItems.forEach((item, index) => {
      if (!item.title?.trim()) {
        throw new ValidationError(`Titel für Position ${index + 1} ist erforderlich`, `lineItems.${index}.title`);
      }
      if (item.quantity <= 0) {
        throw new ValidationError(`Menge für Position ${index + 1} muss größer als 0 sein`, `lineItems.${index}.quantity`);
      }
      if (item.unitPrice < 0) {
        throw new ValidationError(`Preis für Position ${index + 1} darf nicht negativ sein`, `lineItems.${index}.unitPrice`);
      }
      
      const itemTotal = item.quantity * item.unitPrice;
      subtotal += itemTotal;
      // Update item total
      item.total = itemTotal;
    });

    const vatAmount = subtotal * (offerData.vatRate / 100);
    const total = subtotal + vatAmount;

    setError(null);

    try {
      let offerNumber: string;
      
      try {
        // Generate automatic offer number
        offerNumber = await getNextNumber('offers');
      } catch (error) {
        // Fallback to timestamp-based numbering if settings not available
        console.warn('Settings not available, using fallback numbering:', error);
        const year = new Date().getFullYear();
        const timestamp = Date.now().toString().slice(-4);
        offerNumber = `AN-${year}-${timestamp}`;
      }
      
      const newOffer = await adapter.createOffer({
        ...offerData,
        offerNumber,
        subtotal,
        vatAmount,
        total
      });
      await loadOffers();
      return newOffer;
    } catch (err) {
      const appError = handleError(err);
      setError(appError.message);
      console.error('Error creating offer:', appError);
      throw appError;
    }
  }

  async function updateOffer(id: number, patch: Partial<Offer>) {
    if (!adapter) {
      throw new DatabaseError("Datenbank-Adapter nicht verfügbar");
    }

    // Validation for required fields if they're being updated
    if (patch.title !== undefined && !patch.title.trim()) {
      throw new ValidationError("Angebots-Titel ist erforderlich", "title");
    }

    if (patch.lineItems !== undefined) {
      if (patch.lineItems.length === 0) {
        throw new ValidationError("Mindestens eine Position ist erforderlich", "lineItems");
      }

      // Validate line items and recalculate totals
      let subtotal = 0;
      patch.lineItems.forEach((item, index) => {
        if (!item.title?.trim()) {
          throw new ValidationError(`Titel für Position ${index + 1} ist erforderlich`, `lineItems.${index}.title`);
        }
        if (item.quantity <= 0) {
          throw new ValidationError(`Menge für Position ${index + 1} muss größer als 0 sein`, `lineItems.${index}.quantity`);
        }
        if (item.unitPrice < 0) {
          throw new ValidationError(`Preis für Position ${index + 1} darf nicht negativ sein`, `lineItems.${index}.unitPrice`);
        }
        
        const itemTotal = item.quantity * item.unitPrice;
        subtotal += itemTotal;
        // Update item total
        item.total = itemTotal;
      });

      const vatRate = patch.vatRate ?? 19; // Default VAT rate
      const vatAmount = subtotal * (vatRate / 100);
      const total = subtotal + vatAmount;

      patch.subtotal = subtotal;
      patch.vatAmount = vatAmount;
      patch.total = total;
    }

    setError(null);

    try {
      const updatedOffer = await adapter.updateOffer(id, patch);
      await loadOffers();
      return updatedOffer;
    } catch (err) {
      const appError = handleError(err);
      setError(appError.message);
      console.error('Error updating offer:', appError);
      throw appError;
    }
  }

  async function deleteOffer(id: number) {
    if (!adapter) {
      throw new DatabaseError("Datenbank-Adapter nicht verfügbar");
    }

    setError(null);

    try {
      await adapter.deleteOffer(id);
      await loadOffers();
      return true;
    } catch (err) {
      const appError = handleError(err);
      setError(appError.message);
      console.error('Error deleting offer:', appError);
      throw appError;
    }
  }

  return {
    offers,
    loading,
    error,
    createOffer,
    updateOffer,
    deleteOffer,
    refresh: loadOffers
  };
}
