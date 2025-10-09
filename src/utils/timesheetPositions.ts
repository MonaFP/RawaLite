// Utility functions for converting between legacy TimesheetActivity[] and new TimesheetPosition[] structure
import type { TimesheetActivity, TimesheetPosition, PositionActivity } from '../persistence/adapter';

/**
 * Convert legacy TimesheetActivity[] to new TimesheetPosition[] structure
 */
export function convertActivitiesToPositions(activities: TimesheetActivity[]): TimesheetPosition[] {
  // Group activities by date
  const activitiesByDate = activities.reduce((acc, activity) => {
    const date = activity.date;
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(activity);
    return acc;
  }, {} as Record<string, TimesheetActivity[]>);

  // Convert to positions
  const positions: TimesheetPosition[] = Object.entries(activitiesByDate).map(([date, dateActivities]) => {
    const positionActivities: PositionActivity[] = dateActivities.map(activity => ({
      id: `temp-${activity.id}`,
      title: activity.title,
      description: activity.description,
      hours: activity.hours,
      hourlyRate: activity.hourlyRate,
      amount: activity.total
    }));

    const totalHours = positionActivities.reduce((sum, a) => sum + a.hours, 0);
    const totalAmount = positionActivities.reduce((sum, a) => sum + a.amount, 0);
    
    return {
      id: `pos-${date}`,
      date,
      activities: positionActivities,
      totalHours,
      totalAmount,
      activitiesSummary: generateActivitiesSummary(positionActivities),
      isExpanded: false
    };
  });

  // Sort by date
  return positions.sort((a, b) => a.date.localeCompare(b.date));
}

/**
 * Convert new TimesheetPosition[] back to legacy TimesheetActivity[] structure
 */
export function convertPositionsToActivities(positions: TimesheetPosition[], timesheetId: number): TimesheetActivity[] {
  const activities: TimesheetActivity[] = [];

  positions.forEach(position => {
    position.activities.forEach((activity, index) => {
      activities.push({
        id: parseInt(activity.id.replace('temp-', '')) || Date.now() + index,
        timesheetId,
        activityId: undefined, // Could be mapped if needed
        title: activity.title,
        description: activity.description,
        date: position.date,
        startTime: '09:00', // Default values for backwards compatibility
        endTime: `${9 + Math.floor(activity.hours)}:${(activity.hours % 1) * 60}`, // Approximate end time
        hours: activity.hours,
        hourlyRate: activity.hourlyRate,
        total: activity.amount,
        isBreak: false
      });
    });
  });

  return activities;
}

/**
 * Generate activities summary for collapsed view
 */
export function generateActivitiesSummary(activities: PositionActivity[]): string {
  if (activities.length === 0) return "Keine Tätigkeiten";
  if (activities.length === 1) return activities[0].title;
  if (activities.length <= 3) {
    return activities.map(a => a.title).join(", ");
  }
  // Bei >3 Tätigkeiten: "Beratung, Dokumentation + 2 weitere"
  return `${activities.slice(0, 2).map(a => a.title).join(", ")} + ${activities.length - 2} weitere`;
}

/**
 * Create a new empty position for a given date
 */
export function createEmptyPosition(date: string): TimesheetPosition {
  return {
    id: `pos-${date}-${Date.now()}`,
    date,
    activities: [],
    totalHours: 0,
    totalAmount: 0,
    activitiesSummary: "Keine Tätigkeiten",
    isExpanded: true // Start expanded for new positions
  };
}

/**
 * Create a new empty activity
 */
export function createEmptyActivity(title: string = "", hours: number = 1, hourlyRate: number = 50): PositionActivity {
  return {
    id: `act-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    title,
    description: "",
    hours,
    hourlyRate,
    amount: hours * hourlyRate
  };
}

/**
 * Calculate totals for a position
 */
export function calculatePositionTotals(activities: PositionActivity[]): { hours: number; amount: number } {
  const hours = activities.reduce((sum, a) => sum + a.hours, 0);
  const amount = activities.reduce((sum, a) => sum + a.amount, 0);
  return { hours, amount };
}

/**
 * Update position totals and summary
 */
export function updatePositionCalculations(position: TimesheetPosition): TimesheetPosition {
  const { hours, amount } = calculatePositionTotals(position.activities);
  return {
    ...position,
    totalHours: hours,
    totalAmount: amount,
    activitiesSummary: generateActivitiesSummary(position.activities)
  };
}