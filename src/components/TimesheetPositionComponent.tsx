import React, { useState } from 'react';
import type { TimesheetPosition, PositionActivity } from '../persistence/adapter';
import { 
  updatePositionCalculations,
  createEmptyActivity,
  calculatePositionTotals 
} from '../utils/timesheetPositions';

interface TimesheetPositionComponentProps {
  position: TimesheetPosition;
  onUpdate: (position: TimesheetPosition) => void;
  onRemove: (positionId: string) => void;
  availableActivities?: Array<{ id: number; title: string; hourlyRate: number }>;
}

export function TimesheetPositionComponent({ 
  position, 
  onUpdate, 
  onRemove,
  availableActivities = []
}: TimesheetPositionComponentProps) {
  
  const toggleExpanded = () => {
    onUpdate({
      ...position,
      isExpanded: !position.isExpanded
    });
  };

  const addActivity = (title: string = "", hours: number = 1, hourlyRate: number = 50) => {
    const newActivity = createEmptyActivity(title, hours, hourlyRate);
    const updatedPosition = updatePositionCalculations({
      ...position,
      activities: [...position.activities, newActivity]
    });
    onUpdate(updatedPosition);
  };

  const updateActivity = (activityId: string, updates: Partial<PositionActivity>) => {
    const updatedActivities = position.activities.map(activity => {
      if (activity.id === activityId) {
        const updated = { ...activity, ...updates };
        // Recalculate amount when hours or hourlyRate changes
        if ('hours' in updates || 'hourlyRate' in updates) {
          updated.amount = updated.hours * updated.hourlyRate;
        }
        return updated;
      }
      return activity;
    });

    const updatedPosition = updatePositionCalculations({
      ...position,
      activities: updatedActivities
    });
    onUpdate(updatedPosition);
  };

  const removeActivity = (activityId: string) => {
    const updatedActivities = position.activities.filter(activity => activity.id !== activityId);
    const updatedPosition = updatePositionCalculations({
      ...position,
      activities: updatedActivities
    });
    onUpdate(updatedPosition);
  };

  const addActivityFromTemplate = (templateActivity: { id: number; title: string; hourlyRate: number }) => {
    addActivity(templateActivity.title, 1, templateActivity.hourlyRate);
  };

  return (
    <div className="timesheet-position" style={{
      border: "1px solid var(--color-border)",
      borderRadius: "8px",
      marginBottom: "8px",
      overflow: "hidden"
    }}>
      {/* Position Header - Collapsed View */}
      <div 
        className="position-header"
        onClick={toggleExpanded}
        style={{
          display: "grid",
          gridTemplateColumns: "auto 1fr auto auto auto auto",
          alignItems: "center",
          padding: "12px 16px",
          backgroundColor: position.isExpanded ? "var(--color-bg-secondary)" : "var(--color-bg-light)",
          cursor: "pointer",
          gap: "12px",
          borderBottom: position.isExpanded ? "1px solid var(--color-border)" : "none"
        }}
      >
        <div style={{ fontSize: "14px", color: "var(--color-text-secondary)" }}>
          {position.isExpanded ? "▼" : "▶"}
        </div>
        
        <div style={{ fontSize: "14px", fontWeight: "500" }}>
          {new Date(position.date).toLocaleDateString('de-DE')}
        </div>
        
        <div style={{ 
          fontSize: "13px", 
          color: "var(--color-text-secondary)",
          textOverflow: "ellipsis",
          overflow: "hidden",
          whiteSpace: "nowrap",
          maxWidth: "300px"
        }}>
          {position.activitiesSummary}
        </div>
        
        <div style={{ fontSize: "14px", fontWeight: "500" }}>
          {position.totalHours}h
        </div>
        
        <div style={{ fontSize: "14px", fontWeight: "600" }}>
          €{position.totalAmount.toFixed(2)}
        </div>
        
        <div style={{ display: "flex", gap: "8px" }}>
          <button
            className="btn btn-secondary"
            style={{ padding: "4px 8px", fontSize: "12px" }}
            onClick={(e) => {
              e.stopPropagation();
              // Position actions menu
            }}
          >
            ⚙️
          </button>
          <button
            className="btn btn-danger"
            style={{ padding: "4px 8px", fontSize: "12px" }}
            onClick={(e) => {
              e.stopPropagation();
              onRemove(position.id);
            }}
          >
            ❌
          </button>
        </div>
      </div>

      {/* Expanded View - Activities Details */}
      {position.isExpanded && (
        <div className="position-details" style={{ padding: "16px" }}>
          
          {/* Activities Header */}
          {position.activities.length > 0 && (
            <div style={{
              display: "grid",
              gridTemplateColumns: "1fr 100px 100px 100px 60px",
              gap: "8px",
              padding: "8px 0",
              borderBottom: "1px solid var(--color-border)",
              fontSize: "12px",
              fontWeight: "600",
              color: "var(--color-text-secondary)"
            }}>
              <div>Tätigkeit</div>
              <div>Stunden</div>
              <div>Stundensatz</div>
              <div>Summe</div>
              <div></div>
            </div>
          )}

          {/* Activities List */}
          {position.activities.map((activity) => (
            <div key={activity.id} style={{
              display: "grid",
              gridTemplateColumns: "1fr 100px 100px 100px 60px",
              gap: "8px",
              padding: "8px 0",
              borderBottom: "1px solid var(--color-border-light)",
              alignItems: "center"
            }}>
              <input
                type="text"
                value={activity.title}
                onChange={(e) => updateActivity(activity.id, { title: e.target.value })}
                placeholder="Tätigkeit..."
                style={{
                  border: "1px solid var(--color-border)",
                  borderRadius: "4px",
                  padding: "6px 8px",
                  fontSize: "14px"
                }}
              />
              
              <input
                type="number"
                value={activity.hours}
                onChange={(e) => updateActivity(activity.id, { hours: parseFloat(e.target.value) || 0 })}
                step="0.1"
                min="0"
                style={{
                  border: "1px solid var(--color-border)",
                  borderRadius: "4px",
                  padding: "6px 8px",
                  fontSize: "14px"
                }}
              />
              
              <input
                type="number"
                value={activity.hourlyRate}
                onChange={(e) => updateActivity(activity.id, { hourlyRate: parseFloat(e.target.value) || 0 })}
                step="0.01"
                min="0"
                style={{
                  border: "1px solid var(--color-border)",
                  borderRadius: "4px",
                  padding: "6px 8px",
                  fontSize: "14px"
                }}
              />
              
              <div style={{
                fontSize: "14px",
                fontWeight: "600",
                color: "var(--color-text-primary)"
              }}>
                €{activity.amount.toFixed(2)}
              </div>
              
              <button
                className="btn btn-danger"
                style={{ padding: "4px 8px", fontSize: "12px" }}
                onClick={() => removeActivity(activity.id)}
              >
                ×
              </button>
            </div>
          ))}

          {/* Add Activity Buttons */}
          <div style={{ marginTop: "16px", display: "flex", gap: "8px", flexWrap: "wrap" }}>
            <button
              className="btn btn-primary"
              style={{ padding: "6px 12px", fontSize: "13px" }}
              onClick={() => addActivity()}
            >
              + Tätigkeit hinzufügen
            </button>

            {/* Quick Add from Templates */}
            {availableActivities.slice(0, 3).map(template => (
              <button
                key={template.id}
                className="btn btn-secondary"
                style={{ padding: "6px 12px", fontSize: "13px" }}
                onClick={() => addActivityFromTemplate(template)}
              >
                + {template.title}
              </button>
            ))}
          </div>

          {/* Activity Description (if any activity has description) */}
          {position.activities.some(a => a.description) && (
            <div style={{ marginTop: "16px" }}>
              {position.activities.map((activity) => (
                activity.description && (
                  <div key={`desc-${activity.id}`} style={{ marginBottom: "8px" }}>
                    <strong>{activity.title}:</strong>
                    <textarea
                      value={activity.description || ''}
                      onChange={(e) => updateActivity(activity.id, { description: e.target.value })}
                      placeholder="Beschreibung..."
                      rows={2}
                      style={{
                        width: "100%",
                        border: "1px solid var(--color-border)",
                        borderRadius: "4px",
                        padding: "6px 8px",
                        fontSize: "13px",
                        marginTop: "4px"
                      }}
                    />
                  </div>
                )
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}