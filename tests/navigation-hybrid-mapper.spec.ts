/**
 * Unit Tests für Phase 2: Hybrid-Mapping-Layer
 * 
 * Tests die dual-path SQL routing logic für beide Schema-Versionen
 * - Migration 034 (per-mode) queries und updates
 * - Migration 045 (global-mode) queries und updates
 * - Edge cases und graceful fallbacks
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as HybridMapper from '../src/lib/navigation-hybrid-mapper';
import type Database from 'better-sqlite3';

// Mock Database Helper
function createMockDatabase(schemaVersion: string): Partial<Database.Database> {
  const mockData: Record<string, any> = {};

  const dbMock = {
    prepare: (sql: string) => ({
      get: (userId: string, mode?: string) => {
        if (schemaVersion === '034' && mode) {
          return mockData[`${userId}-${mode}`] || null;
        } else if (schemaVersion === '045') {
          return mockData[userId] || null;
        }
        return null;
      },
      all: (userId: string) => {
        if (schemaVersion === '034') {
          return Object.values(mockData).filter((item: any) => item.user_id === userId);
        }
        return [];
      },
      run: (height: number, width: number, collapse: number, focus: number, userId: string, ...rest: any) => {
        const key = schemaVersion === '034' ? `${userId}-${rest[0]}` : userId;
        mockData[key] = {
          user_id: userId,
          header_height: height,
          sidebar_width: width,
          auto_collapse: collapse,
          remember_focus_mode: focus,
          navigation_mode: rest[0],
          default_navigation_mode: rest[0]
        };
        return { changes: 1 };
      }
    }),
    // CRITICAL: db.transaction returns a wrapped function that executes the callback
    // Usage: db.transaction(callback)() - note the double ()
    transaction: (fn: Function) => {
      return () => fn();  // Return a function that executes fn when called
    }
  };

  return dbMock as Partial<Database.Database>;
}

describe('Phase 2: Navigation Hybrid-Mapping-Layer', () => {
  describe('getNavigationSettingsBySchema', () => {
    it('should retrieve per-mode settings for Migration 034', () => {
      // Use vi.spyOn BEFORE accessing the prepare method
      const mockDb = createMockDatabase('034') as any;
      const prepareSpy = vi.spyOn(mockDb, 'prepare');
      
      prepareSpy.mockReturnValue({
        get: vi.fn().mockReturnValue({
          user_id: 'user1',
          navigation_mode: 'mode-dashboard-view',
          header_height: 160,
          sidebar_width: 200
        })
      });

      const result = HybridMapper.getNavigationSettingsBySchema(mockDb, '034', 'user1', 'mode-dashboard-view');
      
      expect(result).toBeTruthy();
      // Check mapped result (camelCase from field-mapper)
      expect(result.userId || result.user_id).toBe('user1');
    });

    it('should retrieve global settings for Migration 045', () => {
      const mockDb = createMockDatabase('045') as any;
      const prepareSpy = vi.spyOn(mockDb, 'prepare');
      
      prepareSpy.mockReturnValue({
        get: vi.fn().mockReturnValue({
          user_id: 'user1',
          default_navigation_mode: 'mode-dashboard-view',
          header_height: 160,
          sidebar_width: 200
        })
      });

      const result = HybridMapper.getNavigationSettingsBySchema(mockDb, '045', 'user1');
      
      expect(result).toBeTruthy();
      expect(result.userId || result.user_id).toBe('user1');
    });

    it('should return null for unknown schema', () => {
      const db = createMockDatabase('unknown') as any;
      const result = HybridMapper.getNavigationSettingsBySchema(db, 'unknown', 'user1');
      
      expect(result).toBeNull();
    });
  });

  describe('setNavigationSettingsBySchema', () => {
    it('should update per-mode settings for Migration 034', () => {
      const mockDb = createMockDatabase('034') as any;
      
      // Mock the prepare return value
      mockDb.prepare = vi.fn(() => ({
        run: vi.fn(() => ({ changes: 1 }))
      }));

      const result = HybridMapper.setNavigationSettingsBySchema(
        mockDb,
        '034',
        'user1',
        { headerHeight: 180, sidebarWidth: 220 },
        'mode-dashboard-view'
      );
      
      expect(result).toBe(true);
    });

    it('should update global settings for Migration 045', () => {
      const mockDb = createMockDatabase('045') as any;
      
      mockDb.prepare = vi.fn(() => ({
        run: vi.fn(() => ({ changes: 1 }))
      }));

      const result = HybridMapper.setNavigationSettingsBySchema(
        mockDb,
        '045',
        'user1',
        { headerHeight: 180, sidebarWidth: 220 }
      );
      
      expect(result).toBe(true);
    });
  });

  describe('getAllModeSettingsBySchema', () => {
    it('should return all mode settings for Migration 034', () => {
      const db = createMockDatabase('034') as any;
      
      const prepareSpy = vi.spyOn(db, 'prepare');
      prepareSpy.mockReturnValue({
        all: vi.fn(() => [
          { userId: 'user1', navigationMode: 'mode-dashboard-view', headerHeight: 160 },
          { userId: 'user1', navigationMode: 'mode-data-panel', headerHeight: 160 }
        ])
      });

      const result = HybridMapper.getAllModeSettingsBySchema(db as any, '034', 'user1');
      
      expect(Object.keys(result).length).toBeGreaterThan(0);
    });

    it('should return empty for Migration 045', () => {
      const db = createMockDatabase('045') as any;

      const result = HybridMapper.getAllModeSettingsBySchema(db as any, '045', 'user1');
      
      expect(Object.keys(result).length).toBe(0);
    });
  });

  describe('validateSchemaVersionForOperations', () => {
    it('should return true for valid 034 schema', () => {
      const result = HybridMapper.validateSchemaVersionForOperations('034', false);
      expect(result).toBe(true);
    });

    it('should return true for valid 045 schema', () => {
      const result = HybridMapper.validateSchemaVersionForOperations('045', false);
      expect(result).toBe(true);
    });

    it('should return false for unknown schema', () => {
      const result = HybridMapper.validateSchemaVersionForOperations('unknown' as any, false);
      expect(result).toBe(false);
    });

    it('should return false if schema is corrupted', () => {
      const result = HybridMapper.validateSchemaVersionForOperations('034', true);
      expect(result).toBe(false);
    });
  });

  describe('normalizeSettingsBySchema', () => {
    it('should normalize settings for Migration 034', () => {
      const result = HybridMapper.normalizeSettingsBySchema(
        '034',
        { navigationMode: 'mode-dashboard-view' },
        {}
      );
      
      expect(result.navigationMode).toBeDefined();
    });

    it('should normalize settings for Migration 045', () => {
      const result = HybridMapper.normalizeSettingsBySchema(
        '045',
        { navigationMode: 'mode-dashboard-view' },
        {}
      );
      
      expect(result.navigationMode).toBeDefined();
    });

    it('should validate dimensions', () => {
      const result = HybridMapper.normalizeSettingsBySchema(
        '034',
        { headerHeight: 999, sidebarWidth: 999 },
        {}
      );
      
      expect(result.headerHeight).toBeLessThanOrEqual(300);
      expect(result.sidebarWidth).toBeLessThanOrEqual(400);
    });
  });

  describe('getFallbackSettings', () => {
    it('should return safe defaults', () => {
      const result = HybridMapper.getFallbackSettings(null);
      
      expect(result.navigationMode).toBe('mode-dashboard-view');
      expect(result.headerHeight).toBe(160);
      expect(result.sidebarWidth).toBe(200);
    });
  });
});
