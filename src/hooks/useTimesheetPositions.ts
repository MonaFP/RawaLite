import { useState, useEffect } from 'react';
import type { Timesheet, TimesheetPosition } from '../persistence/adapter';
import { 
  convertActivitiesToPositions, 
  convertPositionsToActivities 
} from '../utils/timesheetPositions';

/**
 * Hook for managing timesheet positions with backwards compatibility
 */
export function useTimesheetPositions(timesheet: Timesheet | null) {
  const [positions, setPositions] = useState<TimesheetPosition[]>([]);

  // Convert legacy activities to positions when timesheet changes
  useEffect(() => {
    if (!timesheet) {
      setPositions([]);
      return;
    }

    // Use new positions structure if available, otherwise convert from legacy activities
    if (timesheet.positions && timesheet.positions.length > 0) {
      setPositions(timesheet.positions);
    } else if (timesheet.activities && timesheet.activities.length > 0) {
      const convertedPositions = convertActivitiesToPositions(timesheet.activities);
      setPositions(convertedPositions);
    } else {
      setPositions([]);
    }
  }, [timesheet]);

  /**
   * Update positions and automatically convert back to legacy format for database
   */
  const updatePositions = (newPositions: TimesheetPosition[]): Partial<Timesheet> => {
    setPositions(newPositions);

    // Convert positions back to legacy activities for database compatibility
    const legacyActivities = convertPositionsToActivities(newPositions, timesheet?.id || 0);
    
    // Calculate totals
    const subtotal = legacyActivities.reduce((sum, activity) => sum + activity.total, 0);
    const vatRate = timesheet?.vatRate || 19;
    const vatAmount = subtotal * (vatRate / 100);
    const total = subtotal + vatAmount;

    return {
      positions: newPositions,
      activities: legacyActivities,
      subtotal,
      vatAmount,
      total
    };
  };

  return {
    positions,
    setPositions,
    updatePositions
  };
}