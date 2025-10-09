import React from 'react';
import type { TimesheetActivity } from '../persistence/adapter';
import type { TimesheetDayGroup } from '../utils/timesheetGrouping';

interface TimesheetDayGroupComponentProps {
  dayGroup: TimesheetDayGroup;
  onToggleExpansion: (date: string) => void;
  onActivityUpdate: (activityId: number, updates: Partial<TimesheetActivity>) => void;
  onActivityRemove: (activityId: number) => void;
  onActivityAdd: (date: string) => void;
  availableActivities: Array<{ id: number; title: string; hourlyRate: number }>;
}

export function TimesheetDayGroupComponent({
  dayGroup,
  onToggleExpansion,
  onActivityUpdate,
  onActivityRemove,
  onActivityAdd,
  availableActivities
}: TimesheetDayGroupComponentProps) {

  const handleTimeChange = (activity: TimesheetActivity, field: 'startTime' | 'endTime', value: string) => {
    const updates: Partial<TimesheetActivity> = { [field]: value };
    
    // Auto-calculate hours when time changes
    if (field === 'startTime' || field === 'endTime') {
      const startTime = field === 'startTime' ? value : activity.startTime;
      const endTime = field === 'endTime' ? value : activity.endTime;
      
      const hours = calculateHours(startTime, endTime);
      updates.hours = hours;
      updates.total = hours * activity.hourlyRate;
    }
    
    onActivityUpdate(activity.id, updates);
  };

  const calculateHours = (startTime: string, endTime: string): number => {
    if (!startTime || !endTime) return 0;
    
    const [startHour, startMin] = startTime.split(':').map(Number);
    const [endHour, endMin] = endTime.split(':').map(Number);
    
    const startMinutes = startHour * 60 + startMin;
    const endMinutes = endHour * 60 + endMin;
    
    let diffMinutes = endMinutes - startMinutes;
    if (diffMinutes < 0) diffMinutes += 24 * 60; // Handle overnight
    
    return Math.round((diffMinutes / 60) * 10) / 10; // Round to 1 decimal
  };

  return (
    <div className="timesheet-day-group" style={{
      border: "1px solid var(--color-border)",
      borderRadius: "8px",
      marginBottom: "8px",
      overflow: "hidden"
    }}>
      
      {/* Day Header - Collapsed View */}
      <div 
        className="day-group-header"
        onClick={() => onToggleExpansion(dayGroup.date)}
        style={{
          display: "grid",
          gridTemplateColumns: "auto 1fr auto auto auto auto",
          alignItems: "center",
          padding: "12px 16px",
          backgroundColor: dayGroup.isExpanded ? "var(--color-bg-secondary)" : "var(--color-bg-light)",
          cursor: "pointer",
          gap: "12px",
          borderBottom: dayGroup.isExpanded ? "1px solid var(--color-border)" : "none"
        }}
      >
        <div style={{ fontSize: "14px", color: "var(--color-text-secondary)" }}>
          {dayGroup.isExpanded ? "▼" : "▶"}
        </div>
        
        <div style={{ fontSize: "14px", fontWeight: "500" }}>
          {new Date(dayGroup.date).toLocaleDateString('de-DE', { 
            weekday: 'short', 
            day: '2-digit', 
            month: '2-digit', 
            year: 'numeric' 
          })}
        </div>
        
        <div style={{ 
          fontSize: "13px", 
          color: "var(--color-text-secondary)",
          textOverflow: "ellipsis",
          overflow: "hidden",
          whiteSpace: "nowrap",
          maxWidth: "300px"
        }}>
          {dayGroup.activitiesSummary}
        </div>
        
        <div style={{ fontSize: "14px", fontWeight: "500" }}>
          {dayGroup.totalHours}h
        </div>
        
        <div style={{ fontSize: "14px", fontWeight: "600" }}>
          €{dayGroup.totalAmount.toFixed(2)}
        </div>
        
        <div style={{ display: "flex", gap: "8px" }}>
          <button
            className="btn btn-primary"
            style={{ padding: "4px 8px", fontSize: "12px" }}
            onClick={(e) => {
              e.stopPropagation();
              onActivityAdd(dayGroup.date);
            }}
          >
            +
          </button>
        </div>
      </div>

      {/* Expanded View - Activities Details */}
      {dayGroup.isExpanded && (
        <div className="day-group-details" style={{ padding: "0" }}>
          
          {/* Activities Header (Desktop) */}
          <div className="timesheet-positionen-header" style={{
            display: "grid",
            gridTemplateColumns: "1fr 80px 80px 70px 80px 100px 60px",
            gap: "8px",
            padding: "12px 16px",
            borderBottom: "1px solid var(--color-border)",
            fontSize: "12px",
            fontWeight: "600",
            color: "var(--color-text-secondary)",
            backgroundColor: "var(--color-bg-light)"
          }}>
            <div>Tätigkeit</div>
            <div>Von</div>
            <div>Bis</div>
            <div>Stunden</div>
            <div>€/h</div>
            <div>Summe</div>
            <div></div>
          </div>

          {/* Activities List */}
          {dayGroup.activities.map((activity, index) => (
            <div key={activity.id} style={{
              display: "grid",
              gridTemplateColumns: "1fr 80px 80px 70px 80px 100px 60px",
              gap: "8px",
              padding: "8px 16px",
              borderBottom: index < dayGroup.activities.length - 1 ? "1px solid var(--color-border-light)" : "none",
              alignItems: "center",
              fontSize: "14px"
            }}>
              
              {/* Activity Title */}
              <select
                value={activity.activityId || ''}
                onChange={(e) => {
                  const selectedActivity = availableActivities.find(a => a.id === parseInt(e.target.value));
                  if (selectedActivity) {
                    onActivityUpdate(activity.id, {
                      activityId: selectedActivity.id,
                      title: selectedActivity.title,
                      hourlyRate: selectedActivity.hourlyRate,
                      total: activity.hours * selectedActivity.hourlyRate
                    });
                  }
                }}
                style={{
                  border: "1px solid var(--color-border)",
                  borderRadius: "4px",
                  padding: "4px 6px",
                  fontSize: "13px",
                  width: "100%"
                }}
              >
                <option value="">Tätigkeit wählen...</option>
                {availableActivities.map(template => (
                  <option key={template.id} value={template.id}>
                    {template.title}
                  </option>
                ))}
              </select>
              
              {/* Start Time */}
              <input
                type="time"
                value={activity.startTime}
                onChange={(e) => handleTimeChange(activity, 'startTime', e.target.value)}
                style={{
                  border: "1px solid var(--color-border)",
                  borderRadius: "4px",
                  padding: "4px 6px",
                  fontSize: "13px",
                  width: "100%"
                }}
              />
              
              {/* End Time */}
              <input
                type="time"
                value={activity.endTime}
                onChange={(e) => handleTimeChange(activity, 'endTime', e.target.value)}
                style={{
                  border: "1px solid var(--color-border)",
                  borderRadius: "4px",
                  padding: "4px 6px",
                  fontSize: "13px",
                  width: "100%"
                }}
              />
              
              {/* Hours (read-only, calculated) */}
              <div style={{
                padding: "4px 6px",
                fontSize: "13px",
                fontWeight: "500",
                textAlign: "center"
              }}>
                {activity.hours}h
              </div>
              
              {/* Hourly Rate */}
              <input
                type="number"
                value={activity.hourlyRate}
                onChange={(e) => onActivityUpdate(activity.id, {
                  hourlyRate: parseFloat(e.target.value) || 0,
                  total: activity.hours * (parseFloat(e.target.value) || 0)
                })}
                step="0.01"
                min="0"
                style={{
                  border: "1px solid var(--color-border)",
                  borderRadius: "4px",
                  padding: "4px 6px",
                  fontSize: "13px",
                  width: "100%"
                }}
              />
              
              {/* Total Amount */}
              <div style={{
                fontSize: "13px",
                fontWeight: "600",
                color: "var(--color-text-primary)",
                textAlign: "right"
              }}>
                €{activity.total.toFixed(2)}
              </div>
              
              {/* Remove Button */}
              <button
                className="btn btn-danger"
                style={{ padding: "4px 8px", fontSize: "11px" }}
                onClick={() => onActivityRemove(activity.id)}
              >
                ×
              </button>
            </div>
          ))}

          {/* Add Activity Button */}
          <div style={{
            padding: "12px 16px",
            borderTop: "1px solid var(--color-border-light)",
            backgroundColor: "var(--color-bg-light)"
          }}>
            <button
              className="btn btn-primary"
              style={{ padding: "6px 12px", fontSize: "13px" }}
              onClick={() => onActivityAdd(dayGroup.date)}
            >
              + Weitere Tätigkeit hinzufügen
            </button>
          </div>
        </div>
      )}
    </div>
  );
}