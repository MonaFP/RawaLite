import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useOffers } from '@/hooks/useOffers';
import type { Offer, OfferLineItem } from '@/persistence/adapter';

// Mock der Dependencies
const mockAdapter = {
  listOffers: vi.fn(),
  createOffer: vi.fn(),
  updateOffer: vi.fn(),
  deleteOffer: vi.fn(),
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

vi.mock('@/contexts/SettingsContext', () => ({
  useSettings: () => ({
    settings: {
      kleinunternehmer: false,
      vatRate: 19
    },
    updateSettings: vi.fn()
  })
}));

describe('useOffers Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUnifiedSettings.getNextNumber.mockResolvedValue('AN-2025-0001');
  });

  describe('Offer Creation', () => {
    it('should create offer with calculated totals', async () => {
      const lineItems: OfferLineItem[] = [
        {
          id: 1,
          title: 'Webentwicklung',
          description: 'Frontend Development',
          quantity: 10,
          unitPrice: 80,
          total: 800,
          parentItemId: undefined
        },
        {
          id: 2,
          title: 'Design',
          description: 'UI/UX Design',
          quantity: 5,
          unitPrice: 90,
          total: 450,
          parentItemId: undefined
        }
      ];

      const mockOffer: Offer = {
        id: 1,
        offerNumber: 'AN-2025-0001',
        customerId: 1,
        title: 'Website Entwicklung',
        status: 'draft',
        validUntil: '2025-10-12',
        lineItems,
        subtotal: 1250,
        vatRate: 19,
        vatAmount: 237.50,
        total: 1487.50,
        notes: undefined,
        createdAt: '2025-09-12T10:00:00.000Z',
        updatedAt: '2025-09-12T10:00:00.000Z'
      };

      mockAdapter.createOffer.mockResolvedValue(mockOffer);
      mockAdapter.listOffers.mockResolvedValue([mockOffer]);

      const { result } = renderHook(() => useOffers());

      await act(async () => {
        await result.current.createOffer({
          customerId: 1,
          title: 'Website Entwicklung',
          status: 'draft',
          validUntil: '2025-10-12',
          lineItems: [
            {
              id: 1,
              title: 'Webentwicklung',
              description: 'Frontend Development',
              quantity: 10,
              unitPrice: 80,
              total: 0, // Will be calculated
              parentItemId: undefined
            },
            {
              id: 2,
              title: 'Design',
              description: 'UI/UX Design',
              quantity: 5,
              unitPrice: 90,
              total: 0, // Will be calculated
              parentItemId: undefined
            }
          ],
          vatRate: 19
        });
      });

      expect(mockAdapter.createOffer).toHaveBeenCalledWith(
        expect.objectContaining({
          offerNumber: 'AN-2025-0001',
          customerId: 1,
          title: 'Website Entwicklung',
          subtotal: 1250,
          vatAmount: 237.50,
          total: 1487.50,
          lineItems: expect.arrayContaining([
            expect.objectContaining({
              title: 'Webentwicklung',
              quantity: 10,
              unitPrice: 80,
              total: 800
            }),
            expect.objectContaining({
              title: 'Design',
              quantity: 5,
              unitPrice: 90,
              total: 450
            })
          ])
        })
      );
    });

    it('should validate required fields', async () => {
      const { result } = renderHook(() => useOffers());

      // Test missing title
      await expect(
        result.current.createOffer({
          customerId: 1,
          title: '',
          status: 'draft',
          validUntil: '2025-10-12',
          lineItems: [],
          vatRate: 19
        })
      ).rejects.toThrow('Angebots-Titel ist erforderlich');

      // Test missing customer
      await expect(
        result.current.createOffer({
          customerId: 0,
          title: 'Test Offer',
          status: 'draft',
          validUntil: '2025-10-12',
          lineItems: [],
          vatRate: 19
        })
      ).rejects.toThrow('Kunde ist erforderlich');

      // Test empty line items
      await expect(
        result.current.createOffer({
          customerId: 1,
          title: 'Test Offer',
          status: 'draft',
          validUntil: '2025-10-12',
          lineItems: [],
          vatRate: 19
        })
      ).rejects.toThrow('Mindestens eine Position ist erforderlich');
    });

    it('should validate line item fields', async () => {
      const { result } = renderHook(() => useOffers());

      // Test line item without title
      await expect(
        result.current.createOffer({
          customerId: 1,
          title: 'Test Offer',
          status: 'draft',
          validUntil: '2025-10-12',
          lineItems: [{
            id: 1,
            title: '',
            description: '',
            quantity: 1,
            unitPrice: 100,
            total: 0,
            parentItemId: undefined
          }],
          vatRate: 19
        })
      ).rejects.toThrow('Titel für Position 1 ist erforderlich');

      // Test negative quantity
      await expect(
        result.current.createOffer({
          customerId: 1,
          title: 'Test Offer',
          status: 'draft',
          validUntil: '2025-10-12',
          lineItems: [{
            id: 1,
            title: 'Test Item',
            description: '',
            quantity: 0,
            unitPrice: 100,
            total: 0,
            parentItemId: undefined
          }],
          vatRate: 19
        })
      ).rejects.toThrow('Menge für Position 1 muss größer als 0 sein');

      // Test negative price
      await expect(
        result.current.createOffer({
          customerId: 1,
          title: 'Test Offer',
          status: 'draft',
          validUntil: '2025-10-12',
          lineItems: [{
            id: 1,
            title: 'Test Item',
            description: '',
            quantity: 1,
            unitPrice: -50,
            total: 0,
            parentItemId: undefined
          }],
          vatRate: 19
        })
      ).rejects.toThrow('Preis für Position 1 darf nicht negativ sein');
    });
  });

  describe('Offer Updates', () => {
    it('should update offer and recalculate totals', async () => {
      const updatedLineItems: OfferLineItem[] = [
        {
          id: 1,
          title: 'Updated Service',
          description: 'Updated description',
          quantity: 8,
          unitPrice: 100,
          total: 800,
          parentItemId: undefined
        }
      ];

      const updatedOffer: Offer = {
        id: 1,
        offerNumber: 'AN-2025-0001',
        customerId: 1,
        title: 'Updated Offer',
        status: 'sent',
        validUntil: '2025-11-12',
        lineItems: updatedLineItems,
        subtotal: 800,
        vatRate: 19,
        vatAmount: 152,
        total: 952,
        notes: 'Updated notes',
        createdAt: '2025-09-12T10:00:00.000Z',
        updatedAt: '2025-09-12T10:30:00.000Z'
      };

      mockAdapter.updateOffer.mockResolvedValue(updatedOffer);
      mockAdapter.listOffers.mockResolvedValue([updatedOffer]);

      const { result } = renderHook(() => useOffers());

      await act(async () => {
        await result.current.updateOffer(1, {
          title: 'Updated Offer',
          status: 'sent',
          lineItems: [{
            id: 1,
            title: 'Updated Service',
            description: 'Updated description',
            quantity: 8,
            unitPrice: 100,
            total: 0, // Will be recalculated
            parentItemId: undefined
          }],
          notes: 'Updated notes'
        });
      });

      expect(mockAdapter.updateOffer).toHaveBeenCalledWith(1, 
        expect.objectContaining({
          title: 'Updated Offer',
          status: 'sent',
          subtotal: 800,
          vatAmount: 152,
          total: 952,
          notes: 'Updated notes'
        })
      );
    });
  });

  describe('Offer Deletion', () => {
    it('should delete offer successfully', async () => {
      mockAdapter.deleteOffer.mockResolvedValue(undefined);
      mockAdapter.listOffers.mockResolvedValue([]);

      const { result } = renderHook(() => useOffers());

      await act(async () => {
        const result_value = await result.current.deleteOffer(1);
        expect(result_value).toBe(true);
      });

      expect(mockAdapter.deleteOffer).toHaveBeenCalledWith(1);
    });
  });

  describe('VAT Calculations', () => {
    it('should handle different VAT rates correctly', async () => {
      const lineItems: OfferLineItem[] = [
        {
          id: 1,
          title: 'Service',
          description: '',
          quantity: 1,
          unitPrice: 1000,
          total: 1000,
          parentItemId: undefined
        }
      ];

      // Test with 7% VAT rate
      const mockOffer7: Offer = {
        id: 1,
        offerNumber: 'AN-2025-0001',
        customerId: 1,
        title: 'Test Offer 7%',
        status: 'draft',
        validUntil: '2025-10-12',
        lineItems,
        subtotal: 1000,
        vatRate: 7,
        vatAmount: 70,
        total: 1070,
        notes: undefined,
        createdAt: '2025-09-12T10:00:00.000Z',
        updatedAt: '2025-09-12T10:00:00.000Z'
      };

      mockAdapter.createOffer.mockResolvedValue(mockOffer7);
      mockAdapter.listOffers.mockResolvedValue([mockOffer7]);

      const { result } = renderHook(() => useOffers());

      await act(async () => {
        await result.current.createOffer({
          customerId: 1,
          title: 'Test Offer 7%',
          status: 'draft',
          validUntil: '2025-10-12',
          lineItems: [{
            id: 1,
            title: 'Service',
            description: '',
            quantity: 1,
            unitPrice: 1000,
            total: 0,
            parentItemId: undefined
          }],
          vatRate: 7
        });
      });

      expect(mockAdapter.createOffer).toHaveBeenCalledWith(
        expect.objectContaining({
          subtotal: 1000,
          vatRate: 7,
          vatAmount: 70,
          total: 1070
        })
      );
    });
  });

  describe('Error Handling', () => {
    it('should handle database errors gracefully', async () => {
      mockAdapter.listOffers.mockRejectedValue(new Error('Database connection failed'));

      const { result } = renderHook(() => useOffers());

      // Wait for initial load to complete
      await new Promise(resolve => setTimeout(resolve, 100));

      expect(result.current.error).toBe('Database connection failed');
    });

    it('should handle auto-numbering fallback', async () => {
      // Mock settings failure
      mockUnifiedSettings.getNextNumber.mockRejectedValue(new Error('Settings not available'));

      const mockOffer: Offer = {
        id: 1,
        offerNumber: 'AN-2025-1234', // Fallback numbering
        customerId: 1,
        title: 'Fallback Test',
        status: 'draft',
        validUntil: '2025-10-12',
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

      mockAdapter.createOffer.mockResolvedValue(mockOffer);
      mockAdapter.listOffers.mockResolvedValue([mockOffer]);

      const { result } = renderHook(() => useOffers());

      await act(async () => {
        await result.current.createOffer({
          customerId: 1,
          title: 'Fallback Test',
          status: 'draft',
          validUntil: '2025-10-12',
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
      expect(mockAdapter.createOffer).toHaveBeenCalled();
      expect(result.current.error).toBeNull();
    });
  });
});