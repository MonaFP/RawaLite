// UI-only utility functions for grouping timesheet activities by date
// Respects existing schema structure without database changes
import type { TimesheetActivity } from '../persistence/adapter';

/**
 * Group timesheet activities by date for UI display
 */
export interface TimesheetDayGroup {
  date: string; // YYYY-MM-DD
  activities: TimesheetActivity[];
  totalHours: number;
  totalAmount: number;
  activitiesSummary: string;
  isExpanded: boolean; // UI state only
}

/**
 * Group activities by date for display in collapsed/expanded format
 */
export function groupActivitiesByDate(activities: TimesheetActivity[]): TimesheetDayGroup[] {
  // Group by date
  const grouped = activities.reduce((acc, activity) => {
    const date = activity.date;
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(activity);
    return acc;
  }, {} as Record<string, TimesheetActivity[]>);

  // Convert to day groups
  const dayGroups: TimesheetDayGroup[] = Object.entries(grouped).map(([date, dateActivities]) => {
    const totalHours = dateActivities.reduce((sum, a) => sum + a.hours, 0);
    const totalAmount = dateActivities.reduce((sum, a) => sum + a.total, 0);
    
    return {
      date,
      activities: dateActivities.sort((a, b) => a.startTime.localeCompare(b.startTime)),
      totalHours,
      totalAmount,
      activitiesSummary: generateActivitiesSummary(dateActivities),
      isExpanded: false
    };
  });

  // Sort by date
  return dayGroups.sort((a, b) => a.date.localeCompare(b.date));
}

/**
 * Generate summary string for collapsed view
 */
function generateActivitiesSummary(activities: TimesheetActivity[]): string {
  if (activities.length === 0) return "Keine Tätigkeiten";
  if (activities.length === 1) return activities[0].title;
  if (activities.length <= 3) {
    return activities.map(a => a.title).join(", ");
  }
  // Bei >3 Tätigkeiten: "Beratung, Dokumentation + 2 weitere"
  return `${activities.slice(0, 2).map(a => a.title).join(", ")} + ${activities.length - 2} weitere`;
}

/**
 * Flatten day groups back to activities array (for database saving)
 */
export function flattenDayGroups(dayGroups: TimesheetDayGroup[]): TimesheetActivity[] {
  return dayGroups.flatMap(group => group.activities);
}

/**
 * Update expansion state of a day group
 */
export function toggleDayGroupExpansion(dayGroups: TimesheetDayGroup[], date: string): TimesheetDayGroup[] {
  return dayGroups.map(group => 
    group.date === date 
      ? { ...group, isExpanded: !group.isExpanded }
      : group
  );
}

/**
 * Create a new activity for a specific date with defaults
 */
export function createNewActivityForDate(date: string, timesheetId: number): Omit<TimesheetActivity, 'id'> {
  return {
    timesheetId,
    activityId: undefined,
    title: '',
    description: '',
    date,
    startTime: '09:00',
    endTime: '10:00', 
    hours: 1,
    hourlyRate: 50,
    total: 50,
    isBreak: false
  };
}

/**
 * Update activity within day groups and recalculate totals
 */
export function updateActivityInDayGroups(
  dayGroups: TimesheetDayGroup[], 
  activityId: number, 
  updates: Partial<TimesheetActivity>
): TimesheetDayGroup[] {
  return dayGroups.map(group => {
    const activityIndex = group.activities.findIndex(a => a.id === activityId);
    
    if (activityIndex === -1) return group;
    
    // Update the activity
    const updatedActivities = [...group.activities];
    updatedActivities[activityIndex] = { ...updatedActivities[activityIndex], ...updates };
    
    // Recalculate hours and total if changed
    if ('hours' in updates || 'hourlyRate' in updates) {
      const activity = updatedActivities[activityIndex];
      activity.total = activity.hours * activity.hourlyRate;
    }
    
    // Recalculate group totals
    const totalHours = updatedActivities.reduce((sum, a) => sum + a.hours, 0);
    const totalAmount = updatedActivities.reduce((sum, a) => sum + a.total, 0);
    
    return {
      ...group,
      activities: updatedActivities,
      totalHours,
      totalAmount,
      activitiesSummary: generateActivitiesSummary(updatedActivities)
    };
  });
}

/**
 * Remove activity from day groups and clean up empty days
 */
export function removeActivityFromDayGroups(
  dayGroups: TimesheetDayGroup[], 
  activityId: number
): TimesheetDayGroup[] {
  return dayGroups
    .map(group => {
      const filteredActivities = group.activities.filter(a => a.id !== activityId);
      
      // If no activities left in this day, return null to filter out
      if (filteredActivities.length === 0) return null;
      
      // Recalculate totals
      const totalHours = filteredActivities.reduce((sum, a) => sum + a.hours, 0);
      const totalAmount = filteredActivities.reduce((sum, a) => sum + a.total, 0);
      
      return {
        ...group,
        activities: filteredActivities,
        totalHours,
        totalAmount,
        activitiesSummary: generateActivitiesSummary(filteredActivities)
      };
    })
    .filter((group): group is TimesheetDayGroup => group !== null);
}

/**
 * Add new activity to day groups (creates new day if needed)
 */
export function addActivityToDayGroups(
  dayGroups: TimesheetDayGroup[], 
  newActivity: TimesheetActivity
): TimesheetDayGroup[] {
  const existingGroupIndex = dayGroups.findIndex(group => group.date === newActivity.date);
  
  if (existingGroupIndex !== -1) {
    // Add to existing day
    const updatedGroups = [...dayGroups];
    const group = { ...updatedGroups[existingGroupIndex] };
    group.activities = [...group.activities, newActivity].sort((a, b) => a.startTime.localeCompare(b.startTime));
    group.totalHours += newActivity.hours;
    group.totalAmount += newActivity.total;
    group.activitiesSummary = generateActivitiesSummary(group.activities);
    updatedGroups[existingGroupIndex] = group;
    return updatedGroups;
  } else {
    // Create new day group
    const newGroup: TimesheetDayGroup = {
      date: newActivity.date,
      activities: [newActivity],
      totalHours: newActivity.hours,
      totalAmount: newActivity.total,
      activitiesSummary: generateActivitiesSummary([newActivity]),
      isExpanded: true // New groups start expanded
    };
    
    return [...dayGroups, newGroup].sort((a, b) => a.date.localeCompare(b.date));
  }
}