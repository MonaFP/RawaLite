import { useState, useEffect } from "react";
import { usePersistence } from "../contexts/PersistenceContext";
import { useUnifiedSettings } from "./useUnifiedSettings";
import { DatabaseError, ValidationError, handleError } from "../lib/errors";
import type { Invoice } from "../persistence/adapter";

export function useInvoices() {
  const { adapter } = usePersistence();
  const { getNextNumber } = useUnifiedSettings();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function loadInvoices() {
    if (!adapter) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const data = await adapter.listInvoices();
      setInvoices(data);
    } catch (err) {
      const appError = handleError(err);
      setError(appError.message);
      console.error('Error loading invoices:', appError);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadInvoices();
  }, [adapter]);

  async function createInvoice(invoiceData: Omit<Invoice, "id" | "createdAt" | "updatedAt" | "invoiceNumber" | "subtotal" | "vatAmount" | "total">) {
    if (!adapter) {
      throw new DatabaseError("Datenbank-Adapter nicht verfügbar");
    }

    // Validation
    if (!invoiceData.title?.trim()) {
      throw new ValidationError("Rechnungs-Titel ist erforderlich", "title");
    }
    
    if (!invoiceData.customerId) {
      throw new ValidationError("Kunde ist erforderlich", "customerId");
    }

    if (!invoiceData.lineItems || invoiceData.lineItems.length === 0) {
      throw new ValidationError("Mindestens eine Position ist erforderlich", "lineItems");
    }

    // Validate line items and calculate totals
    let subtotal = 0;
    invoiceData.lineItems.forEach((item, index) => {
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

    const vatAmount = subtotal * (invoiceData.vatRate / 100);
    const total = subtotal + vatAmount;

    setError(null);

    try {
      let invoiceNumber: string;
      
      try {
        // Generate automatic invoice number
        invoiceNumber = await getNextNumber('invoices');
      } catch (error) {
        // Fallback to timestamp-based numbering if settings not available
        console.warn('Settings not available, using fallback numbering:', error);
        const year = new Date().getFullYear();
        const timestamp = Date.now().toString().slice(-4);
        invoiceNumber = `RE-${year}-${timestamp}`;
      }
      
      const newInvoice = await adapter.createInvoice({
        ...invoiceData,
        invoiceNumber,
        subtotal,
        vatAmount,
        total
      });
      await loadInvoices();
      return newInvoice;
    } catch (err) {
      const appError = handleError(err);
      setError(appError.message);
      console.error('Error creating invoice:', appError);
      throw appError;
    }
  }

  async function updateInvoice(id: number, patch: Partial<Invoice>) {
    if (!adapter) {
      throw new DatabaseError("Datenbank-Adapter nicht verfügbar");
    }

    // Validation for required fields if they're being updated
    if (patch.title !== undefined && !patch.title.trim()) {
      throw new ValidationError("Rechnungs-Titel ist erforderlich", "title");
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
      const updatedInvoice = await adapter.updateInvoice(id, patch);
      await loadInvoices();
      return updatedInvoice;
    } catch (err) {
      const appError = handleError(err);
      setError(appError.message);
      console.error('Error updating invoice:', appError);
      throw appError;
    }
  }

  async function deleteInvoice(id: number) {
    if (!adapter) {
      throw new DatabaseError("Datenbank-Adapter nicht verfügbar");
    }

    setError(null);

    try {
      await adapter.deleteInvoice(id);
      await loadInvoices();
      return true;
    } catch (err) {
      const appError = handleError(err);
      setError(appError.message);
      console.error('Error deleting invoice:', appError);
      throw appError;
    }
  }

  return {
    invoices,
    loading,
    error,
    createInvoice,
    updateInvoice,
    deleteInvoice,
    refresh: loadInvoices
  };
}
