/**
 * RawaLite - Integration Tests für List Preferences Persistierung
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { SQLiteAdapter } from '@/adapters/SQLiteAdapter';
import type { ListPreferences, EntityKey } from '@/lib/listPreferences';

// Helper: Frische SQLiteAdapter-Instanz für jeden Test
function createFreshAdapter(): SQLiteAdapter {
  const adapter = new SQLiteAdapter();
  return adapter;
}

describe('List Preferences Persistierung', () => {
  let adapter: SQLiteAdapter;

  beforeEach(async () => {
    adapter = createFreshAdapter();
    await adapter.ready(); // Initialize database
  });

  describe('SQLiteAdapter ListPreferences Methods', () => {
    it('sollte leeres Objekt zurückgeben wenn keine Preferences gespeichert', async () => {
      const preferences = await adapter.getListPreferences();
      expect(preferences).toEqual({});
    });

    it('sollte Preferences speichern und laden können', async () => {
      const testPreferences: ListPreferences = {
        customers: {
          sortBy: 'name',
          sortDir: 'desc',
          pageSize: 50,
          visibleColumns: ['name', 'email', 'city'],
          lastSearch: 'test search',
          defaultFilters: { city: ['Hamburg', 'Berlin'] }
        },
        offers: {
          sortBy: 'createdAt',
          sortDir: 'asc',
          pageSize: 25,
          defaultFilters: { status: ['draft', 'sent'] }
        }
      };

      await adapter.setListPreferences(testPreferences);
      const loaded = await adapter.getListPreferences();

      expect(loaded).toEqual(testPreferences);
    });

    it('sollte einzelne Entity-Preference updaten können', async () => {
      // Initial preferences
      await adapter.setListPreferences({
        customers: { sortBy: 'name', pageSize: 25 },
        offers: { sortBy: 'createdAt', pageSize: 10 }
      });

      // Update only customers
      await adapter.updateListPreference('customers', {
        sortBy: 'email',
        sortDir: 'desc',
        pageSize: 100
      });

      const loaded = await adapter.getListPreferences();

      expect(loaded.customers).toEqual({
        sortBy: 'email',
        sortDir: 'desc',
        pageSize: 100
      });
      
      // Offers should remain unchanged
      expect(loaded.offers).toEqual({
        sortBy: 'createdAt',
        pageSize: 10
      });
    });

    it('sollte neue Entity zu existierenden Preferences hinzufügen', async () => {
      // Start with one entity
      await adapter.setListPreferences({
        customers: { sortBy: 'name', pageSize: 25 }
      });

      // Add another entity
      await adapter.updateListPreference('offers', {
        sortBy: 'offerNumber',
        sortDir: 'desc',
        pageSize: 50
      });

      const loaded = await adapter.getListPreferences();

      expect(loaded).toEqual({
        customers: { sortBy: 'name', pageSize: 25 },
        offers: { sortBy: 'offerNumber', sortDir: 'desc', pageSize: 50 }
      });
    });

    it('sollte komplexe Filter-Objekte korrekt serialisieren', async () => {
      const complexPreferences: ListPreferences = {
        customers: {
          defaultFilters: {
            city: ['Hamburg', 'München', 'Berlin'],
            hasEmail: true,
            createdDateRange: {
              from: '2025-01-01',
              to: '2025-12-31'
            }
          }
        },
        invoices: {
          defaultFilters: {
            status: ['sent', 'paid'],
            isOverdue: false,
            totalRange: { min: 100, max: 5000 }
          }
        }
      };

      await adapter.setListPreferences(complexPreferences);
      const loaded = await adapter.getListPreferences();

      expect(loaded).toEqual(complexPreferences);
    });

    it('sollte ungültige JSON-Daten behandeln', async () => {
      // Direkt ungültiges JSON in DB schreiben (simuliert Datenbeschädigung)
      const settings = await adapter.getSettings();
      await adapter.updateSettings({ 
        ...settings, 
        listPreferences: 'invalid json {' 
      });

      // getListPreferences sollte fallback auf leeres Objekt
      const preferences = await adapter.getListPreferences();
      expect(preferences).toEqual({});
    });
  });

  describe('Roundtrip-Tests (Speichern → Reload → Anwenden)', () => {
    it('sollte alle EntityKeys unterstützen', async () => {
      const entityKeys: EntityKey[] = ['customers', 'packages', 'offers', 'invoices', 'timesheets'];
      
      const testPreferences: ListPreferences = {};
      
      entityKeys.forEach((entity, index) => {
        testPreferences[entity] = {
          sortBy: 'createdAt',
          sortDir: index % 2 === 0 ? 'asc' : 'desc',
          pageSize: (index + 1) * 25 as any, // 25, 50, 75, 100, 125
          visibleColumns: [`col1_${entity}`, `col2_${entity}`],
          lastSearch: `search_${entity}`,
          defaultFilters: { testFilter: `value_${entity}` }
        };
      });

      // Save all preferences
      await adapter.setListPreferences(testPreferences);

      // Create new adapter instance (simuliert App-Reload)
      const newAdapter = createFreshAdapter();
      await newAdapter.ready();

      // Load and verify
      const loadedPreferences = await newAdapter.getListPreferences();
      expect(loadedPreferences).toEqual(testPreferences);
    });

    it('sollte Migration von Settings mit listPreferences=NULL handhaben', async () => {
      // Simuliere alte Settings ohne listPreferences Spalte
      const settings = await adapter.getSettings();
      
      // Setze auf NULL zurück
      await adapter.updateSettings({ 
        ...settings, 
        listPreferences: null as any 
      });

      // Sollte leeres Objekt zurückgeben
      const preferences = await adapter.getListPreferences();
      expect(preferences).toEqual({});

      // Sollte normal speichern können
      await adapter.setListPreferences({ 
        customers: { sortBy: 'name', pageSize: 25 } 
      });

      const savedPreferences = await adapter.getListPreferences();
      expect(savedPreferences).toEqual({ 
        customers: { sortBy: 'name', pageSize: 25 } 
      });
    });
  });

  describe('Performance Tests', () => {
    it('sollte große Preference-Objekte effizient handhaben', async () => {
      const largePreferences: ListPreferences = {
        customers: {
          visibleColumns: new Array(50).fill(0).map((_, i) => `column_${i}`),
          defaultFilters: {
            cities: new Array(100).fill(0).map((_, i) => `city_${i}`),
            tags: new Array(200).fill(0).map((_, i) => `tag_${i}`)
          }
        }
      };

      const startTime = performance.now();
      await adapter.setListPreferences(largePreferences);
      const loaded = await adapter.getListPreferences();
      const endTime = performance.now();

      expect(loaded).toEqual(largePreferences);
      expect(endTime - startTime).toBeLessThan(100); // Should be fast < 100ms
    });
  });
});