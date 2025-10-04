// TimesheetService.ts - Service for timesheet management with SQLiteAdapter integration
import { SQLiteAdapter } from '../adapters/SQLiteAdapter';
import type { Timesheet, Activity, TimesheetActivity } from '../persistence/adapter';

export class TimesheetService {
  private adapter: SQLiteAdapter;

  constructor() {
    this.adapter = new SQLiteAdapter();
  }

  // TIMESHEET CRUD OPERATIONS

  async getAllTimesheets(): Promise<Timesheet[]> {
    return await this.adapter.listTimesheets();
  }

  async getTimesheet(id: number): Promise<Timesheet | null> {
    return await this.adapter.getTimesheet(id);
  }

  async createTimesheet(data: Omit<Timesheet, "id" | "createdAt" | "updatedAt">): Promise<Timesheet> {
    return await this.adapter.createTimesheet(data);
  }

  async updateTimesheet(id: number, patch: Partial<Timesheet>): Promise<Timesheet> {
    return await this.adapter.updateTimesheet(id, patch);
  }

  async deleteTimesheet(id: number): Promise<void> {
    return await this.adapter.deleteTimesheet(id);
  }

  // ACTIVITY CRUD OPERATIONS

  async getAllActivities(): Promise<Activity[]> {
    return await this.adapter.listActivities();
  }

  async getActiveActivities(): Promise<Activity[]> {
    const activities = await this.adapter.listActivities();
    return activities.filter(activity => activity.isActive);
  }

  async getActivity(id: number): Promise<Activity | null> {
    return await this.adapter.getActivity(id);
  }

  async createActivity(data: Omit<Activity, "id" | "createdAt" | "updatedAt">): Promise<Activity> {
    return await this.adapter.createActivity(data);
  }

  async updateActivity(id: number, patch: Partial<Activity>): Promise<Activity> {
    return await this.adapter.updateActivity(id, patch);
  }

  async deleteActivity(id: number): Promise<void> {
    return await this.adapter.deleteActivity(id);
  }

  // BUSINESS LOGIC METHODS

  /**
   * Generate next timesheet number based on current year
   */
  async generateTimesheetNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const timesheets = await this.getAllTimesheets();
    
    // Find highest number for current year
    const currentYearTimesheets = timesheets.filter(t => 
      t.timesheetNumber.startsWith(`LN-${year}`)
    );
    
    let maxNumber = 0;
    currentYearTimesheets.forEach(timesheet => {
      const match = timesheet.timesheetNumber.match(/LN-\d{4}-(\d+)/);
      if (match) {
        const num = parseInt(match[1], 10);
        if (num > maxNumber) {
          maxNumber = num;
        }
      }
    });
    
    const nextNumber = maxNumber + 1;
    return `LN-${year}-${nextNumber.toString().padStart(4, '0')}`;
  }

  /**
   * Calculate timesheet totals based on activities
   */
  calculateTimesheetTotals(activities: TimesheetActivity[], vatRate: number = 19): {
    subtotal: number;
    vatAmount: number;
    total: number;
  } {
    // Only count non-break activities
    const productiveActivities = activities.filter(a => !a.isBreak);
    
    const subtotal = productiveActivities.reduce((sum, activity) => sum + activity.total, 0);
    const vatAmount = Math.round((subtotal * vatRate / 100) * 100) / 100;
    const total = Math.round((subtotal + vatAmount) * 100) / 100;
    
    return {
      subtotal: Math.round(subtotal * 100) / 100,
      vatAmount,
      total
    };
  }

  /**
   * Calculate activity duration and total based on start/end times and hourly rate
   */
  calculateActivityTotal(startTime: string, endTime: string, hourlyRate: number): {
    hours: number;
    total: number;
  } {
    const start = new Date(`1970-01-01T${startTime}:00`);
    const end = new Date(`1970-01-01T${endTime}:00`);
    
    // Handle overnight work (end time next day)
    if (end < start) {
      end.setDate(end.getDate() + 1);
    }
    
    const diffMs = end.getTime() - start.getTime();
    const hours = Math.round((diffMs / (1000 * 60 * 60)) * 100) / 100; // Round to 2 decimals
    const total = Math.round((hours * hourlyRate) * 100) / 100;
    
    return { hours, total };
  }

  /**
   * Get timesheets by customer
   */
  async getTimesheetsByCustomer(customerId: number): Promise<Timesheet[]> {
    const timesheets = await this.getAllTimesheets();
    return timesheets.filter(t => t.customerId === customerId);
  }

  /**
   * Get timesheets by date range
   */
  async getTimesheetsByDateRange(startDate: string, endDate: string): Promise<Timesheet[]> {
    const timesheets = await this.getAllTimesheets();
    return timesheets.filter(t => 
      t.startDate >= startDate && t.endDate <= endDate
    );
  }

  /**
   * Get timesheets by status
   */
  async getTimesheetsByStatus(status: 'draft' | 'sent' | 'accepted' | 'rejected'): Promise<Timesheet[]> {
    const timesheets = await this.getAllTimesheets();
    return timesheets.filter(t => t.status === status);
  }

  /**
   * Create timesheet from template with default activities
   */
  async createTimesheetFromTemplate(
    customerId: number,
    title: string,
    startDate: string,
    endDate: string,
    defaultActivityId?: number
  ): Promise<Timesheet> {
    const timesheetNumber = await this.generateTimesheetNumber();
    
    let activities: TimesheetActivity[] = [];
    
    if (defaultActivityId) {
      const activity = await this.getActivity(defaultActivityId);
      if (activity) {
        activities.push({
          id: 0, // Will be set by database
          timesheetId: 0, // Will be set by database
          activityId: defaultActivityId,
          title: activity.title,
          description: activity.description,
          date: startDate,
          startTime: '09:00',
          endTime: '17:00',
          hours: 8,
          hourlyRate: activity.hourlyRate,
          total: 8 * activity.hourlyRate,
          isBreak: false
        });
      }
    }

    const totals = this.calculateTimesheetTotals(activities);

    return await this.createTimesheet({
      timesheetNumber,
      customerId,
      title,
      status: 'draft',
      startDate,
      endDate,
      activities,
      ...totals,
      vatRate: 19,
      notes: ''
    });
  }

  /**
   * Duplicate an existing timesheet
   */
  async duplicateTimesheet(id: number, newTitle?: string): Promise<Timesheet> {
    const original = await this.getTimesheet(id);
    if (!original) throw new Error('Timesheet not found');

    const timesheetNumber = await this.generateTimesheetNumber();
    
    // Reset activity IDs since they'll be new records
    const activities = original.activities.map(activity => ({
      ...activity,
      id: 0, // Will be set by database
      timesheetId: 0 // Will be set by database
    }));

    return await this.createTimesheet({
      ...original,
      timesheetNumber,
      title: newTitle || `${original.title} (Kopie)`,
      status: 'draft',
      activities,
      sentAt: undefined,
      acceptedAt: undefined,
      rejectedAt: undefined
    });
  }
}

export default TimesheetService;