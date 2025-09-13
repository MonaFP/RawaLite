import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useCustomers } from '@/hooks/useCustomers';
import type { Customer } from '@/persistence/adapter';

// Mock der PersistenceContext
const mockAdapter = {
  listCustomers: vi.fn(),
  createCustomer: vi.fn(),
  updateCustomer: vi.fn(),
  deleteCustomer: vi.fn(),
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

describe('useCustomers Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUnifiedSettings.getNextNumber.mockResolvedValue('K-0001');
  });

  describe('Customer Creation', () => {
    it('should create customer with auto-generated number', async () => {
      const mockCustomer: Customer = {
        id: 1,
        number: 'K-0001',
        name: 'Test Customer',
        email: 'test@example.com',
        phone: undefined,
        street: undefined,
        zip: undefined,
        city: undefined,
        notes: undefined,
        createdAt: '2025-09-12T10:00:00.000Z',
        updatedAt: '2025-09-12T10:00:00.000Z'
      };

      mockAdapter.createCustomer.mockResolvedValue(mockCustomer);
      mockAdapter.listCustomers.mockResolvedValue([mockCustomer]);

      const { result } = renderHook(() => useCustomers());

      await act(async () => {
        await result.current.createCustomer({
          name: 'Test Customer',
          email: 'test@example.com'
        });
      });

      expect(mockAdapter.createCustomer).toHaveBeenCalledWith({
        name: 'Test Customer',
        email: 'test@example.com',
        number: 'K-0001'
      });
    });

    it('should validate required name field', async () => {
      const { result } = renderHook(() => useCustomers());

      await expect(
        result.current.createCustomer({ name: '' })
      ).rejects.toThrow('Kundenname ist erforderlich');
    });

    it('should validate email format', async () => {
      const { result } = renderHook(() => useCustomers());

      await expect(
        result.current.createCustomer({
          name: 'Test Customer',
          email: 'invalid-email'
        })
      ).rejects.toThrow('Ungültige E-Mail-Adresse');
    });
  });

  describe('Customer Updates', () => {
    it('should update customer successfully', async () => {
      const updatedCustomer: Customer = {
        id: 1,
        number: 'K-0001',
        name: 'Updated Customer',
        email: 'updated@example.com',
        phone: undefined,
        street: undefined,
        zip: undefined,
        city: undefined,
        notes: undefined,
        createdAt: '2025-09-12T10:00:00.000Z',
        updatedAt: '2025-09-12T10:30:00.000Z'
      };

      mockAdapter.updateCustomer.mockResolvedValue(updatedCustomer);
      mockAdapter.listCustomers.mockResolvedValue([updatedCustomer]);

      const { result } = renderHook(() => useCustomers());

      await act(async () => {
        await result.current.updateCustomer(1, {
          name: 'Updated Customer',
          email: 'updated@example.com'
        });
      });

      expect(mockAdapter.updateCustomer).toHaveBeenCalledWith(1, {
        name: 'Updated Customer',
        email: 'updated@example.com'
      });
    });
  });

  describe('Customer Deletion', () => {
    it('should delete customer successfully', async () => {
      mockAdapter.deleteCustomer.mockResolvedValue(undefined);
      mockAdapter.listCustomers.mockResolvedValue([]);

      const { result } = renderHook(() => useCustomers());

      await act(async () => {
        await result.current.deleteCustomer(1);
      });

      expect(mockAdapter.deleteCustomer).toHaveBeenCalledWith(1);
    });
  });

  describe('Error Handling', () => {
    it('should handle database errors gracefully', async () => {
      mockAdapter.listCustomers.mockRejectedValue(new Error('Database connection failed'));

      const { result } = renderHook(() => useCustomers());

      // Wait for initial load to complete
      await new Promise(resolve => setTimeout(resolve, 100));

      expect(result.current.error).toBe('Database connection failed');
    });
  });
});