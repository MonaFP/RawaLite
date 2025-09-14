import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useTimesheets } from '@/hooks/useTimesheets';
import type { Timesheet, TimesheetActivity, Activity } from '@/persistence/adapter';

// Mock der Dependencies
const mockAdapter = {
  listTimesheets: vi.fn(),
  createTimesheet: vi.fn(),
  updateTimesheet: vi.fn(),
  deleteTimesheet: vi.fn(),
  listActivities: vi.fn(),
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

describe('useTimesheets Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUnifiedSettings.getNextNumber.mockResolvedValue('LN-2025-0001');
  });

  describe('Timesheet Creation', () => {
    it('should create timesheet with activities and calculate totals', async () => {
      const activities: TimesheetActivity[] = [
        {
          id: 1,
          timesheetId: 1,
          activityId: 1,
          hours: 8,
          hourlyRate: 80,
          total: 640,
          description: 'Frontend Development',
          position: 'React Components erstellt'
        },
        {
          id: 2,
          timesheetId: 1,
          activityId: 2,
          hours: 4,
          hourlyRate: 90,
          total: 360,
          description: 'Backend API',
          position: 'REST API implementiert'
        }
      ];

      const mockTimesheet: Timesheet = {
        id: 1,
        timesheetNumber: 'LN-2025-0001',
        customerId: 1,
        title: 'Website Development Sprint 1',
        status: 'draft',
        startDate: '2025-09-01',
        endDate: '2025-09-07',
        activities,
        subtotal: 1000,
        vatRate: 19,
        vatAmount: 190,
        total: 1190,
        notes: undefined,
        createdAt: '2025-09-12T10:00:00.000Z',
        updatedAt: '2025-09-12T10:00:00.000Z'
      };

      mockAdapter.createTimesheet.mockResolvedValue(mockTimesheet);
      mockAdapter.listTimesheets.mockResolvedValue([mockTimesheet]);

      const { result } = renderHook(() => useTimesheets());

      await act(async () => {
        await result.current.createTimesheet({
          customerId: 1,
          title: 'Website Development Sprint 1',
          status: 'draft',
          startDate: '2025-09-01',
          endDate: '2025-09-07',
          activities: [
            {
              timesheetId: 1,
              activityId: 1,
              hours: 8,
              hourlyRate: 80,
              total: 0, // Will be calculated
              description: 'Frontend Development',
              position: 'React Components erstellt'
            },
            {
              timesheetId: 1,
              activityId: 2,
              hours: 4,
              hourlyRate: 90,
              total: 0, // Will be calculated
              description: 'Backend API',
              position: 'REST API implementiert'
            }
          ],
          vatRate: 19
        });
      });

      expect(mockAdapter.createTimesheet).toHaveBeenCalledWith(
        expect.objectContaining({
          timesheetNumber: 'LN-2025-0001',
          customerId: 1,
          title: 'Website Development Sprint 1',
          subtotal: 1000,
          vatAmount: 190,
          total: 1190,
          activities: expect.arrayContaining([
            expect.objectContaining({
              activityId: 1,
              hours: 8,
              hourlyRate: 80,
              total: 640,
              description: 'Frontend Development'
            }),
            expect.objectContaining({
              activityId: 2,
              hours: 4,
              hourlyRate: 90,
              total: 360,
              description: 'Backend API'
            })
          ])
        })
      );
    });

    it('should validate required fields', async () => {
      const { result } = renderHook(() => useTimesheets());

      // Test missing title
      await expect(
        result.current.createTimesheet({
          customerId: 1,
          title: '',
          status: 'draft',
          startDate: '2025-09-01',
          endDate: '2025-09-07',
          activities: [],
          vatRate: 19
        })
      ).rejects.toThrow('Titel ist erforderlich');

      // Test missing customer
      await expect(
        result.current.createTimesheet({
          customerId: 0,
          title: 'Test Timesheet',
          status: 'draft',
          startDate: '2025-09-01',
          endDate: '2025-09-07',
          activities: [],
          vatRate: 19
        })
      ).rejects.toThrow('Kunde ist erforderlich');

      // Test invalid date range
      await expect(
        result.current.createTimesheet({
          customerId: 1,
          title: 'Test Timesheet',
          status: 'draft',
          startDate: '2025-09-07',
          endDate: '2025-09-01', // End before start
          activities: [{
            timesheetId: 1,
            activityId: 1,
            hours: 8,
            hourlyRate: 80,
            total: 0
          }],
          vatRate: 19
        })
      ).rejects.toThrow('Enddatum muss nach dem Startdatum liegen');

      // Test empty activities
      await expect(
        result.current.createTimesheet({
          customerId: 1,
          title: 'Test Timesheet',
          status: 'draft',
          startDate: '2025-09-01',
          endDate: '2025-09-07',
          activities: [],
          vatRate: 19
        })
      ).rejects.toThrow('Mindestens eine Aktivität ist erforderlich');
    });

    it('should validate activity fields', async () => {
      const { result } = renderHook(() => useTimesheets());

      // Test activity without activityId
      await expect(
        result.current.createTimesheet({
          customerId: 1,
          title: 'Test Timesheet',
          status: 'draft',
          startDate: '2025-09-01',
          endDate: '2025-09-07',
          activities: [{
            timesheetId: 1,
            activityId: 0,
            hours: 8,
            hourlyRate: 80,
            total: 0
          }],
          vatRate: 19
        })
      ).rejects.toThrow('Aktivität für Position 1 ist erforderlich');

      // Test negative hours
      await expect(
        result.current.createTimesheet({
          customerId: 1,
          title: 'Test Timesheet',
          status: 'draft',
          startDate: '2025-09-01',
          endDate: '2025-09-07',
          activities: [{
            timesheetId: 1,
            activityId: 1,
            hours: -2,
            hourlyRate: 80,
            total: 0
          }],
          vatRate: 19
        })
      ).rejects.toThrow('Stunden für Position 1 müssen positiv sein');

      // Test negative hourly rate
      await expect(
        result.current.createTimesheet({
          customerId: 1,
          title: 'Test Timesheet',
          status: 'draft',
          startDate: '2025-09-01',
          endDate: '2025-09-07',
          activities: [{
            timesheetId: 1,
            activityId: 1,
            hours: 8,
            hourlyRate: -50,
            total: 0
          }],
          vatRate: 19
        })
      ).rejects.toThrow('Stundensatz für Position 1 darf nicht negativ sein');
    });
  });

  describe('Timesheet Status Management', () => {
    it('should update timesheet status to sent', async () => {
      const updatedTimesheet: Timesheet = {
        id: 1,
        timesheetNumber: 'LN-2025-0001',
        customerId: 1,
        title: 'Test Timesheet',
        status: 'sent',
        startDate: '2025-09-01',
        endDate: '2025-09-07',
        activities: [{
          id: 1,
          timesheetId: 1,
          activityId: 1,
          hours: 8,
          hourlyRate: 80,
          total: 640,
          description: 'Development Work'
        }],
        subtotal: 640,
        vatRate: 19,
        vatAmount: 121.6,
        total: 761.6,
        notes: undefined,
        sentAt: '2025-09-12T10:15:00.000Z',
        createdAt: '2025-09-12T10:00:00.000Z',
        updatedAt: '2025-09-12T10:15:00.000Z'
      };

      mockAdapter.updateTimesheet.mockResolvedValue(updatedTimesheet);
      mockAdapter.listTimesheets.mockResolvedValue([updatedTimesheet]);

      const { result } = renderHook(() => useTimesheets());

      await act(async () => {
        await result.current.updateTimesheet(1, {
          status: 'sent',
          sentAt: '2025-09-12T10:15:00.000Z'
        });
      });

      expect(mockAdapter.updateTimesheet).toHaveBeenCalledWith(1, {
        status: 'sent',
        sentAt: '2025-09-12T10:15:00.000Z'
      });
    });

    it('should update timesheet status to approved', async () => {
      const approvedTimesheet: Timesheet = {
        id: 1,
        timesheetNumber: 'LN-2025-0001',
        customerId: 1,
        title: 'Test Timesheet',
        status: 'approved',
        startDate: '2025-09-01',
        endDate: '2025-09-07',
        activities: [{
          id: 1,
          timesheetId: 1,
          activityId: 1,
          hours: 8,
          hourlyRate: 80,
          total: 640,
          description: 'Development Work'
        }],
        subtotal: 640,
        vatRate: 19,
        vatAmount: 121.6,
        total: 761.6,
        notes: undefined,
        sentAt: '2025-09-12T10:15:00.000Z',
        approvedAt: '2025-09-15T14:30:00.000Z',
        createdAt: '2025-09-12T10:00:00.000Z',
        updatedAt: '2025-09-15T14:30:00.000Z'
      };

      mockAdapter.updateTimesheet.mockResolvedValue(approvedTimesheet);
      mockAdapter.listTimesheets.mockResolvedValue([approvedTimesheet]);

      const { result } = renderHook(() => useTimesheets());

      await act(async () => {
        await result.current.updateTimesheet(1, {
          status: 'approved',
          approvedAt: '2025-09-15T14:30:00.000Z'
        });
      });

      expect(mockAdapter.updateTimesheet).toHaveBeenCalledWith(1, {
        status: 'approved',
        approvedAt: '2025-09-15T14:30:00.000Z'
      });
    });
  });

  describe('Activities Calculation', () => {
    it('should calculate totals correctly for multiple activities', async () => {
      const activities: TimesheetActivity[] = [
        {
          timesheetId: 1,
          activityId: 1,
          hours: 10.5, // Decimal hours
          hourlyRate: 85,
          total: 0 // Will be calculated to 892.5
        },
        {
          timesheetId: 1,
          activityId: 2,
          hours: 6.25,
          hourlyRate: 75,
          total: 0 // Will be calculated to 468.75
        },
        {
          timesheetId: 1,
          activityId: 3,
          hours: 2,
          hourlyRate: 120,
          total: 0 // Will be calculated to 240
        }
      ];

      const mockTimesheet: Timesheet = {
        id: 1,
        timesheetNumber: 'LN-2025-0001',
        customerId: 1,
        title: 'Multi-Activity Timesheet',
        status: 'draft',
        startDate: '2025-09-01',
        endDate: '2025-09-07',
        activities: activities.map(a => ({ ...a, total: a.hours * a.hourlyRate })),
        subtotal: 1601.25, // 892.5 + 468.75 + 240
        vatRate: 19,
        vatAmount: 304.2375, // 1601.25 * 0.19
        total: 1905.4875, // 1601.25 + 304.2375
        notes: undefined,
        createdAt: '2025-09-12T10:00:00.000Z',
        updatedAt: '2025-09-12T10:00:00.000Z'
      };

      mockAdapter.createTimesheet.mockResolvedValue(mockTimesheet);
      mockAdapter.listTimesheets.mockResolvedValue([mockTimesheet]);

      const { result } = renderHook(() => useTimesheets());

      await act(async () => {
        await result.current.createTimesheet({
          customerId: 1,
          title: 'Multi-Activity Timesheet',
          status: 'draft',
          startDate: '2025-09-01',
          endDate: '2025-09-07',
          activities,
          vatRate: 19
        });
      });

      expect(mockAdapter.createTimesheet).toHaveBeenCalledWith(
        expect.objectContaining({
          subtotal: 1601.25,
          vatAmount: 304.2375,
          total: 1905.4875,
          activities: expect.arrayContaining([
            expect.objectContaining({
              hours: 10.5,
              hourlyRate: 85,
              total: 892.5
            }),
            expect.objectContaining({
              hours: 6.25,
              hourlyRate: 75,
              total: 468.75
            }),
            expect.objectContaining({
              hours: 2,
              hourlyRate: 120,
              total: 240
            })
          ])
        })
      );
    });

    it('should handle zero VAT rate (Kleinunternehmer)', async () => {
      const activities: TimesheetActivity[] = [
        {
          timesheetId: 1,
          activityId: 1,
          hours: 8,
          hourlyRate: 100,
          total: 0
        }
      ];

      const mockTimesheet: Timesheet = {
        id: 1,
        timesheetNumber: 'LN-2025-0001',
        customerId: 1,
        title: 'Kleinunternehmer Timesheet',
        status: 'draft',
        startDate: '2025-09-01',
        endDate: '2025-09-07',
        activities: [{ ...activities[0], total: 800 }],
        subtotal: 800,
        vatRate: 0,
        vatAmount: 0,
        total: 800,
        notes: 'Umsatzsteuerbefreit nach §19 UStG',
        createdAt: '2025-09-12T10:00:00.000Z',
        updatedAt: '2025-09-12T10:00:00.000Z'
      };

      mockAdapter.createTimesheet.mockResolvedValue(mockTimesheet);
      mockAdapter.listTimesheets.mockResolvedValue([mockTimesheet]);

      const { result } = renderHook(() => useTimesheets());

      await act(async () => {
        await result.current.createTimesheet({
          customerId: 1,
          title: 'Kleinunternehmer Timesheet',
          status: 'draft',
          startDate: '2025-09-01',
          endDate: '2025-09-07',
          activities,
          vatRate: 0,
          notes: 'Umsatzsteuerbefreit nach §19 UStG'
        });
      });

      expect(mockAdapter.createTimesheet).toHaveBeenCalledWith(
        expect.objectContaining({
          subtotal: 800,
          vatRate: 0,
          vatAmount: 0,
          total: 800
        })
      );
    });
  });

  describe('Timesheet Updates', () => {
    it('should update timesheet and recalculate activities', async () => {
      const updatedActivities: TimesheetActivity[] = [
        {
          id: 1,
          timesheetId: 1,
          activityId: 1,
          hours: 12, // Increased hours
          hourlyRate: 90, // Increased rate
          total: 1080,
          description: 'Extended Development Work',
          position: 'Complex features implemented'
        }
      ];

      const updatedTimesheet: Timesheet = {
        id: 1,
        timesheetNumber: 'LN-2025-0001',
        customerId: 1,
        title: 'Updated Timesheet',
        status: 'draft',
        startDate: '2025-09-01',
        endDate: '2025-09-10', // Extended period
        activities: updatedActivities,
        subtotal: 1080,
        vatRate: 19,
        vatAmount: 205.2,
        total: 1285.2,
        notes: 'Updated work scope',
        createdAt: '2025-09-12T10:00:00.000Z',
        updatedAt: '2025-09-12T10:30:00.000Z'
      };

      mockAdapter.updateTimesheet.mockResolvedValue(updatedTimesheet);
      mockAdapter.listTimesheets.mockResolvedValue([updatedTimesheet]);

      const { result } = renderHook(() => useTimesheets());

      await act(async () => {
        await result.current.updateTimesheet(1, {
          title: 'Updated Timesheet',
          endDate: '2025-09-10',
          activities: [{
            id: 1,
            timesheetId: 1,
            activityId: 1,
            hours: 12,
            hourlyRate: 90,
            total: 0, // Will be recalculated
            description: 'Extended Development Work',
            position: 'Complex features implemented'
          }],
          notes: 'Updated work scope'
        });
      });

      expect(mockAdapter.updateTimesheet).toHaveBeenCalledWith(1, 
        expect.objectContaining({
          title: 'Updated Timesheet',
          endDate: '2025-09-10',
          subtotal: 1080,
          vatAmount: 205.2,
          total: 1285.2,
          notes: 'Updated work scope'
        })
      );
    });
  });

  describe('Timesheet Deletion', () => {
    it('should delete timesheet successfully', async () => {
      mockAdapter.deleteTimesheet.mockResolvedValue(undefined);
      mockAdapter.listTimesheets.mockResolvedValue([]);

      const { result } = renderHook(() => useTimesheets());

      await act(async () => {
        const result_value = await result.current.deleteTimesheet(1);
        expect(result_value).toBe(true);
      });

      expect(mockAdapter.deleteTimesheet).toHaveBeenCalledWith(1);
    });
  });

  describe('Error Handling', () => {
    it('should handle database errors gracefully', async () => {
      mockAdapter.listTimesheets.mockRejectedValue(new Error('Database connection failed'));

      const { result } = renderHook(() => useTimesheets());

      // Wait for initial load to complete
      await new Promise(resolve => setTimeout(resolve, 100));

      expect(result.current.error).toBe('Database connection failed');
    });

    it('should handle auto-numbering fallback', async () => {
      // Mock settings failure
      mockUnifiedSettings.getNextNumber.mockRejectedValue(new Error('Settings not available'));

      const mockTimesheet: Timesheet = {
        id: 1,
        timesheetNumber: 'LN-2025-1234', // Fallback numbering
        customerId: 1,
        title: 'Fallback Test',
        status: 'draft',
        startDate: '2025-09-01',
        endDate: '2025-09-07',
        activities: [{
          id: 1,
          timesheetId: 1,
          activityId: 1,
          hours: 8,
          hourlyRate: 80,
          total: 640
        }],
        subtotal: 640,
        vatRate: 19,
        vatAmount: 121.6,
        total: 761.6,
        notes: undefined,
        createdAt: '2025-09-12T10:00:00.000Z',
        updatedAt: '2025-09-12T10:00:00.000Z'
      };

      mockAdapter.createTimesheet.mockResolvedValue(mockTimesheet);
      mockAdapter.listTimesheets.mockResolvedValue([mockTimesheet]);

      const { result } = renderHook(() => useTimesheets());

      await act(async () => {
        await result.current.createTimesheet({
          customerId: 1,
          title: 'Fallback Test',
          status: 'draft',
          startDate: '2025-09-01',
          endDate: '2025-09-07',
          activities: [{
            timesheetId: 1,
            activityId: 1,
            hours: 8,
            hourlyRate: 80,
            total: 0
          }],
          vatRate: 19
        });
      });

      // Should succeed with fallback numbering
      expect(mockAdapter.createTimesheet).toHaveBeenCalled();
      expect(result.current.error).toBeNull();
    });
  });
});