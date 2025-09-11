import { useState, useEffect } from "react";
import { usePersistence } from "../contexts/PersistenceContext";
import { useUnifiedSettings } from "./useUnifiedSettings";
import { DatabaseError, ValidationError, handleError } from "../lib/errors";
import type { Timesheet } from "../persistence/adapter";

export function useTimesheets() {
  const { adapter } = usePersistence();
  const { getNextNumber } = useUnifiedSettings();
  const [timesheets, setTimesheets] = useState<Timesheet[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function loadTimesheets() {
    if (!adapter) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const data = await adapter.listTimesheets();
      setTimesheets(data);
    } catch (err) {
      const appError = handleError(err);
      setError(appError.message);
      console.error('Error loading timesheets:', appError);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadTimesheets();
  }, [adapter]);

  async function createTimesheet(timesheetData: Omit<Timesheet, "id" | "createdAt" | "updatedAt" | "timesheetNumber" | "subtotal" | "vatAmount" | "total">) {
    console.log('useTimesheets.createTimesheet: Starting with data:', timesheetData);
    
    if (!adapter) {
      throw new DatabaseError("Datenbank-Adapter nicht verfügbar");
    }

    // Validation
    if (!timesheetData.title?.trim()) {
      throw new ValidationError("Leistungsnachweis-Titel ist erforderlich", "title");
    }
    
    if (!timesheetData.customerId) {
      throw new ValidationError("Kunde ist erforderlich", "customerId");
    }

    if (!timesheetData.startDate) {
      throw new ValidationError("Startdatum ist erforderlich", "startDate");
    }

    if (!timesheetData.endDate) {
      throw new ValidationError("Enddatum ist erforderlich", "endDate");
    }

    if (new Date(timesheetData.endDate) < new Date(timesheetData.startDate)) {
      throw new ValidationError("Enddatum muss nach dem Startdatum liegen", "endDate");
    }

    // Validation for activities - only if they exist
    if (timesheetData.activities && timesheetData.activities.length > 0) {
      console.log('useTimesheets.createTimesheet: Validation passed, activities:', timesheetData.activities);

      // Validate activities
      timesheetData.activities.forEach((activity, index) => {
        console.log(`useTimesheets.createTimesheet: Validating activity ${index}:`, activity);
        if (activity.hours < 0) {
          throw new ValidationError(`Stunden für Tätigkeit ${index + 1} dürfen nicht negativ sein`, `activities.${index}.hours`);
        }
        if (activity.hourlyRate < 0) {
          throw new ValidationError(`Stundensatz für Tätigkeit ${index + 1} darf nicht negativ sein`, `activities.${index}.hourlyRate`);
        }
      });
    } else {
      console.log('useTimesheets.createTimesheet: Creating timesheet without activities (will be added later)');
    }

    // Calculate totals
    const subtotal = timesheetData.activities ? timesheetData.activities.reduce((sum, activity) => sum + activity.total, 0) : 0;
    const vatAmount = subtotal * (timesheetData.vatRate / 100);
    const total = subtotal + vatAmount;
    
    console.log('useTimesheets.createTimesheet: Calculated totals - subtotal:', subtotal, 'vatAmount:', vatAmount, 'total:', total);

    setError(null);

    try {
      let timesheetNumber: string;
      
      try {
        console.log('useTimesheets.createTimesheet: Getting next number for timesheets');
        // Generate automatic timesheet number
        timesheetNumber = await getNextNumber('timesheets');
        console.log('useTimesheets.createTimesheet: Generated timesheet number:', timesheetNumber);
      } catch (error) {
        // Fallback to timestamp-based numbering if settings not available
        console.warn('Settings not available, using fallback numbering:', error);
        const year = new Date().getFullYear();
        const timestamp = Date.now().toString().slice(-4);
        timesheetNumber = `LN-${year}-${timestamp}`;
        console.log('useTimesheets.createTimesheet: Using fallback number:', timesheetNumber);
      }
      
      console.log('useTimesheets.createTimesheet: Creating timesheet in database...');
      const newTimesheet = await adapter.createTimesheet({
        ...timesheetData,
        timesheetNumber,
        subtotal,
        vatAmount,
        total
      });
      console.log('useTimesheets.createTimesheet: Successfully created timesheet:', newTimesheet);
      await loadTimesheets();
      return newTimesheet;
    } catch (err) {
      const appError = handleError(err);
      setError(appError.message);
      console.error('Error creating timesheet:', appError);
      throw appError;
    }
  }

  async function updateTimesheet(id: number, patch: Partial<Timesheet>) {
    if (!adapter) {
      throw new DatabaseError("Datenbank-Adapter nicht verfügbar");
    }

    // Validation for required fields if they're being updated
    if (patch.title !== undefined && !patch.title.trim()) {
      throw new ValidationError("Leistungsnachweis-Titel ist erforderlich", "title");
    }

    if (patch.startDate && patch.endDate && new Date(patch.endDate) < new Date(patch.startDate)) {
      throw new ValidationError("Enddatum muss nach dem Startdatum liegen", "endDate");
    }

    // Validate activities if provided (but allow empty activities for basic timesheets)
    if (patch.activities && patch.activities.length > 0) {
      patch.activities.forEach((activity, index) => {
        if (activity.hours < 0) {
          throw new ValidationError(`Stunden für Tätigkeit ${index + 1} dürfen nicht negativ sein`, `activities.${index}.hours`);
        }
        if (activity.hourlyRate < 0) {
          throw new ValidationError(`Stundensatz für Tätigkeit ${index + 1} darf nicht negativ sein`, `activities.${index}.hourlyRate`);
        }
      });

      // Recalculate totals based on activities
      const subtotal = patch.activities.reduce((sum, activity) => sum + activity.total, 0);
      const vatRate = patch.vatRate ?? 19;
      const vatAmount = subtotal * (vatRate / 100);
      const total = subtotal + vatAmount;

      patch.subtotal = subtotal;
      patch.vatAmount = vatAmount;
      patch.total = total;
    }

    setError(null);

    try {
      const updatedTimesheet = await adapter.updateTimesheet(id, patch);
      await loadTimesheets();
      return updatedTimesheet;
    } catch (err) {
      const appError = handleError(err);
      setError(appError.message);
      console.error('Error updating timesheet:', appError);
      throw appError;
    }
  }

  async function deleteTimesheet(id: number) {
    if (!adapter) {
      throw new DatabaseError("Datenbank-Adapter nicht verfügbar");
    }

    setError(null);

    try {
      await adapter.deleteTimesheet(id);
      await loadTimesheets();
      return true;
    } catch (err) {
      const appError = handleError(err);
      setError(appError.message);
      console.error('Error deleting timesheet:', appError);
      throw appError;
    }
  }

  return {
    timesheets,
    loading,
    error,
    createTimesheet,
    updateTimesheet,
    deleteTimesheet,
    refresh: loadTimesheets
  };
}
