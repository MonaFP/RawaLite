import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useInvoices } from '@/hooks/useInvoices';
import type { Invoice, InvoiceLineItem } from '@/persistence/adapter';

// Mock der Dependencies
const mockAdapter = {
  listInvoices: vi.fn(),
  createInvoice: vi.fn(),
  updateInvoice: vi.fn(),
  deleteInvoice: vi.fn(),
};

const mockPersistenceContext = {
  adapter: mockAdapter,
  ready: true,
  error: null
};

const mockUnifiedSettings = {
  getNextNumber: vi.fn()
};

// Mock hooks
vi.mock('@/contexts/PersistenceContext', () => ({
  usePersistence: () => mockPersistenceContext
}));

vi.mock('@/hooks/useUnifiedSettings', () => ({
  useUnifiedSettings: () => mockUnifiedSettings
}));

describe('useInvoices Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUnifiedSettings.getNextNumber.mockResolvedValue('RE-2025-0001');
  });

  describe('Invoice Creation', () => {
    it('should create invoice with calculated totals', async () => {
      const lineItems: InvoiceLineItem[] = [
        {
          id: 1,
          title: 'Consulting Services',
          description: 'Business Analysis',
          quantity: 20,
          unitPrice: 75,
          total: 1500,
          parentItemId: undefined
        },
        {
          id: 2,
          title: 'Implementation',
          description: 'System Setup',
          quantity: 40,
          unitPrice: 85,
          total: 3400,
          parentItemId: undefined
        }
      ];

      const mockInvoice: Invoice = {
        id: 1,
        invoiceNumber: 'RE-2025-0001',
        customerId: 1,
        offerId: 1,
        title: 'Consulting Project',
        status: 'draft',
        dueDate: '2025-10-12',
        lineItems,
        subtotal: 4900,
        vatRate: 19,
        vatAmount: 931,
        total: 5831,
        notes: undefined,
        createdAt: '2025-09-12T10:00:00.000Z',
        updatedAt: '2025-09-12T10:00:00.000Z'
      };

      mockAdapter.createInvoice.mockResolvedValue(mockInvoice);
      mockAdapter.listInvoices.mockResolvedValue([mockInvoice]);

      const { result } = renderHook(() => useInvoices());

      await act(async () => {
        await result.current.createInvoice({
          customerId: 1,
          offerId: 1,
          title: 'Consulting Project',
          status: 'draft',
          dueDate: '2025-10-12',
          lineItems: [
            {
              id: 1,
              title: 'Consulting Services',
              description: 'Business Analysis',
              quantity: 20,
              unitPrice: 75,
              total: 0, // Will be calculated
              parentItemId: undefined
            },
            {
              id: 2,
              title: 'Implementation',
              description: 'System Setup',
              quantity: 40,
              unitPrice: 85,
              total: 0, // Will be calculated
              parentItemId: undefined
            }
          ],
          vatRate: 19
        });
      });

      expect(mockAdapter.createInvoice).toHaveBeenCalledWith(
        expect.objectContaining({
          invoiceNumber: 'RE-2025-0001',
          customerId: 1,
          offerId: 1,
          title: 'Consulting Project',
          subtotal: 4900,
          vatAmount: 931,
          total: 5831,
          lineItems: expect.arrayContaining([
            expect.objectContaining({
              title: 'Consulting Services',
              quantity: 20,
              unitPrice: 75,
              total: 1500
            }),
            expect.objectContaining({
              title: 'Implementation',
              quantity: 40,
              unitPrice: 85,
              total: 3400
            })
          ])
        })
      );
    });

    it('should create invoice without offer reference', async () => {
      const mockInvoice: Invoice = {
        id: 1,
        invoiceNumber: 'RE-2025-0001',
        customerId: 1,
        offerId: undefined,
        title: 'Direct Invoice',
        status: 'draft',
        dueDate: '2025-10-12',
        lineItems: [{
          id: 1,
          title: 'One-time Service',
          description: '',
          quantity: 1,
          unitPrice: 500,
          total: 500,
          parentItemId: undefined
        }],
        subtotal: 500,
        vatRate: 19,
        vatAmount: 95,
        total: 595,
        notes: undefined,
        createdAt: '2025-09-12T10:00:00.000Z',
        updatedAt: '2025-09-12T10:00:00.000Z'
      };

      mockAdapter.createInvoice.mockResolvedValue(mockInvoice);
      mockAdapter.listInvoices.mockResolvedValue([mockInvoice]);

      const { result } = renderHook(() => useInvoices());

      await act(async () => {
        await result.current.createInvoice({
          customerId: 1,
          title: 'Direct Invoice',
          status: 'draft',
          dueDate: '2025-10-12',
          lineItems: [{
            id: 1,
            title: 'One-time Service',
            description: '',
            quantity: 1,
            unitPrice: 500,
            total: 0,
            parentItemId: undefined
          }],
          vatRate: 19
        });
      });

      expect(mockAdapter.createInvoice).toHaveBeenCalledWith(
        expect.objectContaining({
          invoiceNumber: 'RE-2025-0001',
          customerId: 1,
          title: 'Direct Invoice',
          status: 'draft',
          dueDate: '2025-10-12',
          subtotal: 500,
          vatRate: 19,
          vatAmount: 95,
          total: 595,
          lineItems: expect.arrayContaining([
            expect.objectContaining({
              title: 'One-time Service',
              quantity: 1,
              unitPrice: 500,
              total: 500
            })
          ])
        })
      );
    });

    it('should validate required fields', async () => {
      const { result } = renderHook(() => useInvoices());

      // Test missing title
      await expect(
        result.current.createInvoice({
          customerId: 1,
          title: '',
          status: 'draft',
          dueDate: '2025-10-12',
          lineItems: [],
          vatRate: 19
        })
      ).rejects.toThrow('Rechnungs-Titel ist erforderlich');

      // Test missing customer
      await expect(
        result.current.createInvoice({
          customerId: 0,
          title: 'Test Invoice',
          status: 'draft',
          dueDate: '2025-10-12',
          lineItems: [],
          vatRate: 19
        })
      ).rejects.toThrow('Kunde ist erforderlich');

      // Test missing due date
      await expect(
        result.current.createInvoice({
          customerId: 1,
          title: 'Test Invoice',
          status: 'draft',
          dueDate: '',
          lineItems: [{
            id: 1,
            title: 'Test Item',
            description: '',
            quantity: 1,
            unitPrice: 100,
            total: 0,
            parentItemId: undefined
          }],
          vatRate: 19
        })
      ).rejects.toThrow('Fälligkeitsdatum ist erforderlich');

      // Test empty line items
      await expect(
        result.current.createInvoice({
          customerId: 1,
          title: 'Test Invoice',
          status: 'draft',
          dueDate: '2025-10-12',
          lineItems: [],
          vatRate: 19
        })
      ).rejects.toThrow('Mindestens eine Position ist erforderlich');
    });
  });

  describe('Invoice Status Management', () => {
    it('should update invoice status to sent', async () => {
      const updatedInvoice: Invoice = {
        id: 1,
        invoiceNumber: 'RE-2025-0001',
        customerId: 1,
        offerId: undefined,
        title: 'Test Invoice',
        status: 'sent',
        dueDate: '2025-10-12',
        lineItems: [{
          id: 1,
          title: 'Service',
          description: '',
          quantity: 1,
          unitPrice: 1000,
          total: 1000,
          parentItemId: undefined
        }],
        subtotal: 1000,
        vatRate: 19,
        vatAmount: 190,
        total: 1190,
        notes: undefined,
        sentAt: '2025-09-12T10:15:00.000Z',
        createdAt: '2025-09-12T10:00:00.000Z',
        updatedAt: '2025-09-12T10:15:00.000Z'
      };

      mockAdapter.updateInvoice.mockResolvedValue(updatedInvoice);
      mockAdapter.listInvoices.mockResolvedValue([updatedInvoice]);

      const { result } = renderHook(() => useInvoices());

      await act(async () => {
        await result.current.updateInvoice(1, {
          status: 'sent',
          sentAt: '2025-09-12T10:15:00.000Z'
        });
      });

      expect(mockAdapter.updateInvoice).toHaveBeenCalledWith(1, {
        status: 'sent',
        sentAt: '2025-09-12T10:15:00.000Z'
      });
    });

    it('should update invoice status to paid', async () => {
      const paidInvoice: Invoice = {
        id: 1,
        invoiceNumber: 'RE-2025-0001',
        customerId: 1,
        offerId: undefined,
        title: 'Test Invoice',
        status: 'paid',
        dueDate: '2025-10-12',
        lineItems: [{
          id: 1,
          title: 'Service',
          description: '',
          quantity: 1,
          unitPrice: 1000,
          total: 1000,
          parentItemId: undefined
        }],
        subtotal: 1000,
        vatRate: 19,
        vatAmount: 190,
        total: 1190,
        notes: undefined,
        sentAt: '2025-09-12T10:15:00.000Z',
        paidAt: '2025-09-20T14:30:00.000Z',
        createdAt: '2025-09-12T10:00:00.000Z',
        updatedAt: '2025-09-20T14:30:00.000Z'
      };

      mockAdapter.updateInvoice.mockResolvedValue(paidInvoice);
      mockAdapter.listInvoices.mockResolvedValue([paidInvoice]);

      const { result } = renderHook(() => useInvoices());

      await act(async () => {
        await result.current.updateInvoice(1, {
          status: 'paid',
          paidAt: '2025-09-20T14:30:00.000Z'
        });
      });

      expect(mockAdapter.updateInvoice).toHaveBeenCalledWith(1, {
        status: 'paid',
        paidAt: '2025-09-20T14:30:00.000Z'
      });
    });

    it('should handle overdue status', async () => {
      const overdueInvoice: Invoice = {
        id: 1,
        invoiceNumber: 'RE-2025-0001',
        customerId: 1,
        offerId: undefined,
        title: 'Test Invoice',
        status: 'overdue',
        dueDate: '2025-09-01', // Past due date
        lineItems: [{
          id: 1,
          title: 'Service',
          description: '',
          quantity: 1,
          unitPrice: 1000,
          total: 1000,
          parentItemId: undefined
        }],
        subtotal: 1000,
        vatRate: 19,
        vatAmount: 190,
        total: 1190,
        notes: undefined,
        sentAt: '2025-08-20T10:00:00.000Z',
        overdueAt: '2025-09-02T00:00:00.000Z',
        createdAt: '2025-08-20T10:00:00.000Z',
        updatedAt: '2025-09-02T00:00:00.000Z'
      };

      mockAdapter.updateInvoice.mockResolvedValue(overdueInvoice);
      mockAdapter.listInvoices.mockResolvedValue([overdueInvoice]);

      const { result } = renderHook(() => useInvoices());

      await act(async () => {
        await result.current.updateInvoice(1, {
          status: 'overdue',
          overdueAt: '2025-09-02T00:00:00.000Z'
        });
      });

      expect(mockAdapter.updateInvoice).toHaveBeenCalledWith(1, {
        status: 'overdue',
        overdueAt: '2025-09-02T00:00:00.000Z'
      });
    });
  });

  describe('Invoice Updates', () => {
    it('should update invoice and recalculate totals', async () => {
      const updatedLineItems: InvoiceLineItem[] = [
        {
          id: 1,
          title: 'Updated Service',
          description: 'Revised description',
          quantity: 10,
          unitPrice: 120,
          total: 1200,
          parentItemId: undefined
        }
      ];

      const updatedInvoice: Invoice = {
        id: 1,
        invoiceNumber: 'RE-2025-0001',
        customerId: 1,
        offerId: undefined,
        title: 'Updated Invoice',
        status: 'draft',
        dueDate: '2025-11-12',
        lineItems: updatedLineItems,
        subtotal: 1200,
        vatRate: 19,
        vatAmount: 228,
        total: 1428,
        notes: 'Updated invoice notes',
        createdAt: '2025-09-12T10:00:00.000Z',
        updatedAt: '2025-09-12T10:30:00.000Z'
      };

      mockAdapter.updateInvoice.mockResolvedValue(updatedInvoice);
      mockAdapter.listInvoices.mockResolvedValue([updatedInvoice]);

      const { result } = renderHook(() => useInvoices());

      await act(async () => {
        await result.current.updateInvoice(1, {
          title: 'Updated Invoice',
          dueDate: '2025-11-12',
          lineItems: [{
            id: 1,
            title: 'Updated Service',
            description: 'Revised description',
            quantity: 10,
            unitPrice: 120,
            total: 0, // Will be recalculated
            parentItemId: undefined
          }],
          notes: 'Updated invoice notes'
        });
      });

      expect(mockAdapter.updateInvoice).toHaveBeenCalledWith(1, 
        expect.objectContaining({
          title: 'Updated Invoice',
          dueDate: '2025-11-12',
          subtotal: 1200,
          vatAmount: 228,
          total: 1428,
          notes: 'Updated invoice notes'
        })
      );
    });
  });

  describe('Invoice Deletion', () => {
    it('should delete invoice successfully', async () => {
      mockAdapter.deleteInvoice.mockResolvedValue(undefined);
      mockAdapter.listInvoices.mockResolvedValue([]);

      const { result } = renderHook(() => useInvoices());

      await act(async () => {
        const result_value = await result.current.deleteInvoice(1);
        expect(result_value).toBe(true);
      });

      expect(mockAdapter.deleteInvoice).toHaveBeenCalledWith(1);
    });
  });

  describe('Zero VAT Handling (Kleinunternehmer)', () => {
    it('should handle zero VAT rate correctly', async () => {
      const mockInvoice: Invoice = {
        id: 1,
        invoiceNumber: 'RE-2025-0001',
        customerId: 1,
        offerId: undefined,
        title: 'Kleinunternehmer Invoice',
        status: 'draft',
        dueDate: '2025-10-12',
        lineItems: [{
          id: 1,
          title: 'Service',
          description: '',
          quantity: 1,
          unitPrice: 1000,
          total: 1000,
          parentItemId: undefined
        }],
        subtotal: 1000,
        vatRate: 0,
        vatAmount: 0,
        total: 1000,
        notes: 'Umsatzsteuerbefreit nach §19 UStG',
        createdAt: '2025-09-12T10:00:00.000Z',
        updatedAt: '2025-09-12T10:00:00.000Z'
      };

      mockAdapter.createInvoice.mockResolvedValue(mockInvoice);
      mockAdapter.listInvoices.mockResolvedValue([mockInvoice]);

      const { result } = renderHook(() => useInvoices());

      await act(async () => {
        await result.current.createInvoice({
          customerId: 1,
          title: 'Kleinunternehmer Invoice',
          status: 'draft',
          dueDate: '2025-10-12',
          lineItems: [{
            id: 1,
            title: 'Service',
            description: '',
            quantity: 1,
            unitPrice: 1000,
            total: 0,
            parentItemId: undefined
          }],
          vatRate: 0,
          notes: 'Umsatzsteuerbefreit nach §19 UStG'
        });
      });

      expect(mockAdapter.createInvoice).toHaveBeenCalledWith(
        expect.objectContaining({
          subtotal: 1000,
          vatRate: 0,
          vatAmount: 0,
          total: 1000
        })
      );
    });
  });

  describe('Error Handling', () => {
    it('should handle database errors gracefully', async () => {
      mockAdapter.listInvoices.mockRejectedValue(new Error('Database connection failed'));

      const { result } = renderHook(() => useInvoices());

      // Wait for initial load to complete
      await new Promise(resolve => setTimeout(resolve, 100));

      expect(result.current.error).toBe('Database connection failed');
    });

    it('should handle auto-numbering fallback', async () => {
      // Mock settings failure
      mockUnifiedSettings.getNextNumber.mockRejectedValue(new Error('Settings not available'));

      const mockInvoice: Invoice = {
        id: 1,
        invoiceNumber: 'RE-2025-1234', // Fallback numbering
        customerId: 1,
        offerId: undefined,
        title: 'Fallback Test',
        status: 'draft',
        dueDate: '2025-10-12',
        lineItems: [{
          id: 1,
          title: 'Test Item',
          description: '',
          quantity: 1,
          unitPrice: 100,
          total: 100,
          parentItemId: undefined
        }],
        subtotal: 100,
        vatRate: 19,
        vatAmount: 19,
        total: 119,
        notes: undefined,
        createdAt: '2025-09-12T10:00:00.000Z',
        updatedAt: '2025-09-12T10:00:00.000Z'
      };

      mockAdapter.createInvoice.mockResolvedValue(mockInvoice);
      mockAdapter.listInvoices.mockResolvedValue([mockInvoice]);

      const { result } = renderHook(() => useInvoices());

      await act(async () => {
        await result.current.createInvoice({
          customerId: 1,
          title: 'Fallback Test',
          status: 'draft',
          dueDate: '2025-10-12',
          lineItems: [{
            id: 1,
            title: 'Test Item',
            description: '',
            quantity: 1,
            unitPrice: 100,
            total: 0,
            parentItemId: undefined
          }],
          vatRate: 19
        });
      });

      // Should succeed with fallback numbering
      expect(mockAdapter.createInvoice).toHaveBeenCalled();
      expect(result.current.error).toBeNull();
    });
  });
});