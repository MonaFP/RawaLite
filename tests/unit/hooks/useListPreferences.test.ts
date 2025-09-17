/**
 * RawaLite - Tests für useListPreferences Hook
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useListPreferences } from '@/hooks/useListPreferences';
import type { ListPreferences, EntityKey } from '@/lib/listPreferences';
import { defaultListPreferences } from '@/lib/listPreferences';

// Mock der PersistenceContext
const mockAdapter = {
  getListPreferences: vi.fn(),
  updateListPreference: vi.fn(),
  setListPreferences: vi.fn(),
};

const mockPersistenceContext = {
  adapter: mockAdapter,
  ready: true,
  error: null
};

// Mock hooks
vi.mock('@/contexts/PersistenceContext', () => ({
  usePersistence: () => mockPersistenceContext
}));

vi.mock('@/lib/errors', () => ({
  handleError: (err: any) => ({ message: err.message || String(err) })
}));

describe('useListPreferences Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Initial Load', () => {
    it('sollte Defaults verwenden wenn keine Preferences gespeichert sind', async () => {
      mockAdapter.getListPreferences.mockResolvedValue({});
      
      const { result } = renderHook(() => useListPreferences('customers'));

      // Initial loading state
      expect(result.current.loading).toBe(true);
      expect(result.current.preferences).toEqual(defaultListPreferences.customers);

      // Wait for load to complete
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      expect(result.current.loading).toBe(false);
      expect(result.current.preferences).toEqual(defaultListPreferences.customers);
      expect(mockAdapter.getListPreferences).toHaveBeenCalledTimes(1);
    });

    it('sollte gespeicherte Preferences mit Defaults mergen', async () => {
      const savedPrefs: ListPreferences = {
        customers: {
          sortBy: 'email',
          sortDir: 'desc',
          pageSize: 50
        }
      };
      mockAdapter.getListPreferences.mockResolvedValue(savedPrefs);
      
      const { result } = renderHook(() => useListPreferences('customers'));

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      expect(result.current.preferences).toEqual({
        ...defaultListPreferences.customers,
        sortBy: 'email',
        sortDir: 'desc',
        pageSize: 50
      });
    });

    it('sollte Fehler beim Laden behandeln', async () => {
      mockAdapter.getListPreferences.mockRejectedValue(new Error('Database error'));
      
      const { result } = renderHook(() => useListPreferences('customers'));

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBe('Database error');
      expect(result.current.preferences).toEqual(defaultListPreferences.customers);
    });
  });

  describe('Update Preference', () => {
    beforeEach(() => {
      mockAdapter.getListPreferences.mockResolvedValue({});
    });

    it('sollte optimistic update durchführen', async () => {
      const { result } = renderHook(() => useListPreferences('customers'));

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      const patch = { sortBy: 'name', sortDir: 'desc' as const };
      
      await act(async () => {
        await result.current.updatePreference(patch);
      });

      expect(result.current.preferences.sortBy).toBe('name');
      expect(result.current.preferences.sortDir).toBe('desc');
      expect(mockAdapter.updateListPreference).toHaveBeenCalledWith('customers', patch);
    });

    it('sollte rollback bei Fehler durchführen', async () => {
      mockAdapter.updateListPreference.mockRejectedValue(new Error('Update failed'));
      
      const { result } = renderHook(() => useListPreferences('customers'));

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      const originalPrefs = result.current.preferences;
      const patch = { sortBy: 'email' };

      await act(async () => {
        try {
          await result.current.updatePreference(patch);
        } catch (error) {
          // Expected error
        }
      });

      // Should rollback to original
      expect(result.current.preferences).toEqual(originalPrefs);
      expect(result.current.error).toBe('Update failed');
    });
  });

  describe('Reset to Defaults', () => {
    it('sollte auf Standardwerte zurücksetzen', async () => {
      mockAdapter.getListPreferences.mockResolvedValue({
        customers: { sortBy: 'email', pageSize: 100 }
      });
      mockAdapter.updateListPreference.mockResolvedValue(undefined);
      
      const { result } = renderHook(() => useListPreferences('customers'));

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      // Verify custom settings loaded
      expect(result.current.preferences.sortBy).toBe('email');
      expect(result.current.preferences.pageSize).toBe(100);

      // Reset to defaults
      await act(async () => {
        await result.current.resetToDefaults();
      });

      expect(result.current.preferences).toEqual(defaultListPreferences.customers);
      expect(mockAdapter.updateListPreference).toHaveBeenCalledWith(
        'customers', 
        defaultListPreferences.customers
      );
    });
  });

  describe('Different Entity Keys', () => {
    const entities: EntityKey[] = ['customers', 'offers', 'invoices', 'packages', 'timesheets'];

    entities.forEach(entity => {
      it(`sollte mit ${entity} Entity funktionieren`, async () => {
        mockAdapter.getListPreferences.mockResolvedValue({});
        mockAdapter.updateListPreference.mockResolvedValue(undefined);
        
        const { result } = renderHook(() => useListPreferences(entity));

        await act(async () => {
          await new Promise(resolve => setTimeout(resolve, 0));
        });

        expect(result.current.preferences).toEqual(defaultListPreferences[entity]);
        
        const patch = { pageSize: 50 as const };
        await act(async () => {
          await result.current.updatePreference(patch);
        });

        expect(mockAdapter.updateListPreference).toHaveBeenCalledWith(entity, patch);
      });
    });
  });
});