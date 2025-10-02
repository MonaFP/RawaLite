import { useState } from 'react';
import type { Invoice } from '../persistence/adapter';

const initialInvoice: Invoice = {
  id: 1,
  invoiceNumber: 'R-2024-001',
  customerId: 1,
  title: 'Mock Invoice',
  status: 'draft',
  dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
  lineItems: [],
  subtotal: 1200,
  vatRate: 19,
  vatAmount: 228,
  total: 1428,
  notes: 'Mock invoice notes',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
};

export const useInvoices = () => {
  const [invoices, setInvoices] = useState<Invoice[]>([initialInvoice]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | undefined>(undefined);

  const createInvoice = async (data: Omit<Invoice, 'id' | 'createdAt' | 'updatedAt'>) => {
    setLoading(true);
    try {
      const newInvoice: Invoice = {
        ...data,
        id: Date.now(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      setInvoices(prev => [...prev, newInvoice]);
      setError(undefined);
      return newInvoice;
    } catch (err) {
      setError('Failed to create invoice');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateInvoice = async (id: number, data: Partial<Invoice>) => {
    setLoading(true);
    try {
      const updatedInvoice = { ...data, id, updatedAt: new Date().toISOString() };
      
      setInvoices(prev => prev.map(invoice => 
        invoice.id === id 
          ? { ...invoice, ...updatedInvoice }
          : invoice
      ));
      
      const invoice = invoices.find(i => i.id === id);
      if (!invoice) throw new Error('Invoice not found');
      
      const result = { ...invoice, ...updatedInvoice };
      setError(undefined);
      return result;
    } catch (err) {
      setError('Failed to update invoice');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const deleteInvoice = async (id: number) => {
    setLoading(true);
    try {
      setInvoices(prev => prev.filter(invoice => invoice.id !== id));
      setError(undefined);
    } catch (err) {
      setError('Failed to delete invoice');
      throw err;
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