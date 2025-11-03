import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { detectDatabaseSchema, getCachedSchema, clearSchemaCache } from '../src/lib/database-schema-detector';

/**
 * Unit Tests für database-schema-detector mit Mocks
 * 
 * WICHTIG: Diese Tests verwenden Mocks statt echter better-sqlite3 Datenbanken
 * um ABI-Kompatibilitätsprobleme zu vermeiden. Die PRAGMA-Logik wird vollständig
 * mit Mock-Objekten getestet.
 * 
 * PHASE 1 STEP 1.5 - Hybrid-Mapping-Layer Implementation
 */

// Mock database factory for testing
function createMockDatabase(tableInfo: Array<{ name: string; type: string; notnull: number; dflt_value: string | null; pk: number }>) {
  const pragmaResponses: Record<string, any> = {
    'table_info(user_navigation_mode_settings)': tableInfo,
  };

  return {
    pragma: (sql: string, options?: any) => {
      if (pragmaResponses[sql]) {
        return pragmaResponses[sql];
      }
      throw new Error(`Table or pragma not found: ${sql}`);
    }
  };
}

describe('database-schema-detector', () => {
  beforeEach(() => {
    clearSchemaCache();
  });

  afterEach(() => {
    clearSchemaCache();
  });

  describe('Migration 034 Schema Detection', () => {
    it('should correctly detect Migration 034 schema (with navigation_mode column)', () => {
      // Mock Migration 034 table structure
      const mockDb = createMockDatabase([
        { name: 'id', type: 'INTEGER', notnull: 1, dflt_value: null, pk: 1 },
        { name: 'user_id', type: 'INTEGER', notnull: 1, dflt_value: null, pk: 0 },
        { name: 'navigation_mode', type: 'TEXT', notnull: 1, dflt_value: "'full-sidebar'", pk: 0 },
        { name: 'header_height', type: 'INTEGER', notnull: 0, dflt_value: '36', pk: 0 },
        { name: 'created_at', type: 'DATETIME', notnull: 0, dflt_value: 'CURRENT_TIMESTAMP', pk: 0 },
        { name: 'updated_at', type: 'DATETIME', notnull: 0, dflt_value: 'CURRENT_TIMESTAMP', pk: 0 },
      ]);

      // Test schema detection
      const result = detectDatabaseSchema(mockDb as any);

      expect(result.schemaVersion).toBe('034');
      expect(result.hasNavigationModeColumn).toBe(true);
      expect(result.isCorrupted).toBe(false);
      expect(result.details.columnTypes['navigation_mode']).toBe('TEXT');
      expect(result.details.primaryKeyExists).toBe(true);
    });
  });

  describe('Migration 045 Schema Detection', () => {
    it('should correctly detect Migration 045 schema (with default_navigation_mode column)', () => {
      // Mock Migration 045 table structure (note: navigation_mode removed, default_navigation_mode added)
      const mockDb = createMockDatabase([
        { name: 'id', type: 'INTEGER', notnull: 1, dflt_value: null, pk: 1 },
        { name: 'user_id', type: 'INTEGER', notnull: 1, dflt_value: null, pk: 0 },
        { name: 'default_navigation_mode', type: 'TEXT', notnull: 1, dflt_value: "'header-navigation'", pk: 0 },
        { name: 'global_header_height', type: 'INTEGER', notnull: 0, dflt_value: '160', pk: 0 },
        { name: 'created_at', type: 'DATETIME', notnull: 0, dflt_value: 'CURRENT_TIMESTAMP', pk: 0 },
        { name: 'updated_at', type: 'DATETIME', notnull: 0, dflt_value: 'CURRENT_TIMESTAMP', pk: 0 },
      ]);

      // Test schema detection
      const result = detectDatabaseSchema(mockDb as any);

      expect(result.schemaVersion).toBe('045');
      expect(result.hasNavigationModeColumn).toBe(false);
      expect(result.isCorrupted).toBe(false);
      expect(result.details.columnTypes['default_navigation_mode']).toBe('TEXT');
      expect(result.details.primaryKeyExists).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    it('should handle corrupted DB - missing primary key', () => {
      // Mock table WITHOUT primary key (corruption simulation)
      const mockDb = createMockDatabase([
        { name: 'user_id', type: 'INTEGER', notnull: 1, dflt_value: null, pk: 0 },
        { name: 'navigation_mode', type: 'TEXT', notnull: 1, dflt_value: "'full-sidebar'", pk: 0 },
      ]);

      const result = detectDatabaseSchema(mockDb as any);

      expect(result.isCorrupted).toBe(true);
      expect(result.schemaVersion).toBe('034'); // Can still detect schema even if corrupted
      expect(result.details.primaryKeyExists).toBe(false);
    });

    it('should handle missing table gracefully', () => {
      // Mock database WITHOUT the expected table
      const mockDb = {
        pragma: (sql: string) => {
          if (sql === 'table_info(user_navigation_mode_settings)') {
            return []; // Empty result - table doesn't exist
          }
          throw new Error(`Pragma not found: ${sql}`);
        }
      };

      const result = detectDatabaseSchema(mockDb as any);

      expect(result.schemaVersion).toBe('unknown');
      expect(result.isCorrupted).toBe(true);
      expect(result.details.columns.length).toBe(0);
    });

    it('should handle partial column match (Migration 034 + extra columns)', () => {
      // Mock Migration 034 table with extra columns
      const mockDb = createMockDatabase([
        { name: 'id', type: 'INTEGER', notnull: 1, dflt_value: null, pk: 1 },
        { name: 'user_id', type: 'INTEGER', notnull: 1, dflt_value: null, pk: 0 },
        { name: 'navigation_mode', type: 'TEXT', notnull: 1, dflt_value: null, pk: 0 },
        { name: 'extra_column_1', type: 'TEXT', notnull: 0, dflt_value: null, pk: 0 },
        { name: 'extra_column_2', type: 'INTEGER', notnull: 0, dflt_value: null, pk: 0 },
        { name: 'created_at', type: 'DATETIME', notnull: 0, dflt_value: null, pk: 0 },
      ]);

      const result = detectDatabaseSchema(mockDb as any);

      expect(result.schemaVersion).toBe('034');
      expect(result.hasNavigationModeColumn).toBe(true);
      expect(result.isCorrupted).toBe(false);
      // Should detect extra columns
      expect(result.details.columns.length).toBeGreaterThan(4);
    });

    it('should handle wrong column types gracefully', () => {
      // Mock table with wrong type for navigation_mode (INTEGER instead of TEXT)
      const mockDb = createMockDatabase([
        { name: 'id', type: 'INTEGER', notnull: 1, dflt_value: null, pk: 1 },
        { name: 'user_id', type: 'INTEGER', notnull: 1, dflt_value: null, pk: 0 },
        { name: 'navigation_mode', type: 'INTEGER', notnull: 1, dflt_value: '1', pk: 0 },
        { name: 'created_at', type: 'DATETIME', notnull: 0, dflt_value: null, pk: 0 },
      ]);

      const result = detectDatabaseSchema(mockDb as any);

      // Should detect Migration 034 schema (column exists)
      expect(result.schemaVersion).toBe('034');
      // But should flag isCorrupted due to type mismatch
      expect(result.isCorrupted).toBe(true);
      expect(result.details.columnTypes['navigation_mode']).toBe('INTEGER');
    });
  });

  describe('Cache Mechanism', () => {
    it('should cache schema detection results', () => {
      const mockDb = createMockDatabase([
        { name: 'id', type: 'INTEGER', notnull: 1, dflt_value: null, pk: 1 },
        { name: 'user_id', type: 'INTEGER', notnull: 1, dflt_value: null, pk: 0 },
        { name: 'navigation_mode', type: 'TEXT', notnull: 1, dflt_value: "'full-sidebar'", pk: 0 },
      ]);

      // First call - should execute PRAGMA queries
      const result1 = detectDatabaseSchema(mockDb as any);

      // Second call - should return cached result
      const result2 = detectDatabaseSchema(mockDb as any);

      // Both should be identical
      expect(result1).toEqual(result2);
      expect(result1.schemaVersion).toBe('034');
      expect(result2.schemaVersion).toBe('034');
    });

    it('should clear cache when clearSchemaCache() is called', () => {
      const mockDb = createMockDatabase([
        { name: 'id', type: 'INTEGER', notnull: 1, dflt_value: null, pk: 1 },
        { name: 'navigation_mode', type: 'TEXT', notnull: 1, dflt_value: "'full-sidebar'", pk: 0 },
      ]);

      const result1 = detectDatabaseSchema(mockDb as any);
      const cached = getCachedSchema();

      expect(cached).toBeDefined();
      expect(cached?.schemaVersion).toBe('034');

      // Clear cache
      clearSchemaCache();

      const cachedAfter = getCachedSchema();
      expect(cachedAfter).toBeUndefined();
    });

    it('should return cached schema without re-querying PRAGMA', () => {
      let pragmaCallCount = 0;

      const mockDb = {
        pragma: (sql: string) => {
          pragmaCallCount++;
          if (sql === 'table_info(user_navigation_mode_settings)') {
            return [
              { name: 'id', type: 'INTEGER', notnull: 1, dflt_value: null, pk: 1 },
              { name: 'navigation_mode', type: 'TEXT', notnull: 1, dflt_value: null, pk: 0 },
            ];
          }
          throw new Error(`Pragma not found: ${sql}`);
        }
      };

      // First detection - should call pragma
      const result1 = detectDatabaseSchema(mockDb as any);
      const firstCallCount = pragmaCallCount;

      // Second detection - should NOT call pragma (use cache)
      const result2 = detectDatabaseSchema(mockDb as any);
      const secondCallCount = pragmaCallCount;

      // No additional pragma calls should be made
      expect(secondCallCount).toBe(firstCallCount);
      expect(result1).toEqual(result2);
    });
  });

  describe('Interface Compliance', () => {
    it('should return SchemaDetectionResult interface with all required properties', () => {
      const mockDb = createMockDatabase([
        { name: 'id', type: 'INTEGER', notnull: 1, dflt_value: null, pk: 1 },
        { name: 'user_id', type: 'INTEGER', notnull: 1, dflt_value: null, pk: 0 },
        { name: 'navigation_mode', type: 'TEXT', notnull: 1, dflt_value: null, pk: 0 },
      ]);

      const result = detectDatabaseSchema(mockDb as any);

      // Verify all required properties exist
      expect(result).toHaveProperty('schemaVersion');
      expect(result).toHaveProperty('hasNavigationModeColumn');
      expect(result).toHaveProperty('isCorrupted');
      expect(result).toHaveProperty('details');

      // Verify nested details properties
      expect(result.details).toHaveProperty('columns');
      expect(result.details).toHaveProperty('primaryKeyExists');
      expect(result.details).toHaveProperty('columnTypes');

      // Verify types
      expect(typeof result.schemaVersion).toBe('string');
      expect(['034', '045', 'unknown']).toContain(result.schemaVersion);
      expect(typeof result.hasNavigationModeColumn).toBe('boolean');
      expect(typeof result.isCorrupted).toBe('boolean');
      expect(Array.isArray(result.details.columns)).toBe(true);
      expect(typeof result.details.primaryKeyExists).toBe('boolean');
      expect(typeof result.details.columnTypes).toBe('object');
    });
  });
});
