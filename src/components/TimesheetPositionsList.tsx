import React, { useState } from 'react';
import type { TimesheetPosition } from '../persistence/adapter';
import { TimesheetPositionComponent } from './TimesheetPositionComponent';
import { 
  createEmptyPosition,
  updatePositionCalculations,
  convertActivitiesToPositions,
  convertPositionsToActivities
} from '../utils/timesheetPositions';

interface TimesheetPositionsListProps {
  positions: TimesheetPosition[];
  onPositionsChange: (positions: TimesheetPosition[]) => void;
  availableActivities?: Array<{ id: number; title: string; hourlyRate: number }>;
  maxPositions?: number;
}

export function TimesheetPositionsList({ 
  positions, 
  onPositionsChange,
  availableActivities = [],
  maxPositions = 31
}: TimesheetPositionsListProps) {
  
  const [showAddPositionModal, setShowAddPositionModal] = useState(false);
  const [newPositionDate, setNewPositionDate] = useState(
    new Date().toISOString().split('T')[0]
  );

  const updatePosition = (updatedPosition: TimesheetPosition) => {
    const updatedPositions = positions.map(pos => 
      pos.id === updatedPosition.id ? updatedPosition : pos
    );
    onPositionsChange(updatedPositions);
  };

  const removePosition = (positionId: string) => {
    if (confirm('Diese Position wirklich löschen?')) {
      const updatedPositions = positions.filter(pos => pos.id !== positionId);
      onPositionsChange(updatedPositions);
    }
  };

  const addPosition = () => {
    if (positions.length >= maxPositions) {
      alert(`Maximal ${maxPositions} Positionen erlaubt.`);
      return;
    }

    // Check if position for this date already exists
    const existingPosition = positions.find(pos => pos.date === newPositionDate);
    if (existingPosition) {
      // Expand existing position and focus it
      const updatedPosition = { ...existingPosition, isExpanded: true };
      updatePosition(updatedPosition);
      setShowAddPositionModal(false);
      return;
    }

    const newPosition = createEmptyPosition(newPositionDate);
    const updatedPositions = [...positions, newPosition].sort((a, b) => 
      a.date.localeCompare(b.date)
    );
    onPositionsChange(updatedPositions);
    setShowAddPositionModal(false);
  };

  const duplicatePosition = (sourcePosition: TimesheetPosition) => {
    if (positions.length >= maxPositions) {
      alert(`Maximal ${maxPositions} Positionen erlaubt.`);
      return;
    }

    // Create next day as default
    const nextDay = new Date(sourcePosition.date);
    nextDay.setDate(nextDay.getDate() + 1);
    const nextDayStr = nextDay.toISOString().split('T')[0];

    const duplicatedPosition = {
      ...sourcePosition,
      id: `pos-${nextDayStr}-${Date.now()}`,
      date: nextDayStr,
      isExpanded: true,
      activities: sourcePosition.activities.map(activity => ({
        ...activity,
        id: `act-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      }))
    };

    const updatedPositions = [...positions, duplicatedPosition].sort((a, b) => 
      a.date.localeCompare(b.date)
    );
    onPositionsChange(updatedPositions);
  };

  const totalHours = positions.reduce((sum, pos) => sum + pos.totalHours, 0);
  const totalAmount = positions.reduce((sum, pos) => sum + pos.totalAmount, 0);

  return (
    <div className="timesheet-positions-list">
      
      {/* Header */}
      <div style={{ 
        display: "flex", 
        justifyContent: "space-between", 
        alignItems: "center", 
        marginBottom: "16px" 
      }}>
        <div>
          <h4 style={{ margin: "0 0 4px 0", fontSize: "16px" }}>
            Positionen ({positions.length}/{maxPositions})
          </h4>
          <div style={{ opacity: 0.7, fontSize: "14px" }}>
            Gesamt: {totalHours}h • €{totalAmount.toFixed(2)}
          </div>
        </div>
        
        <button
          className="btn btn-primary"
          onClick={() => setShowAddPositionModal(true)}
          disabled={positions.length >= maxPositions}
          style={{ padding: "8px 16px" }}
        >
          + Neue Position
        </button>
      </div>

      {/* Positions List */}
      <div className="positions-container">
        {positions.length === 0 ? (
          <div style={{
            padding: "32px",
            textAlign: "center",
            color: "var(--color-text-secondary)",
            border: "2px dashed var(--color-border)",
            borderRadius: "8px"
          }}>
            <div style={{ fontSize: "16px", marginBottom: "8px" }}>📋</div>
            <div>Noch keine Positionen erstellt</div>
            <div style={{ fontSize: "13px", marginTop: "4px" }}>
              Klicken Sie auf "+ Neue Position" um zu beginnen
            </div>
          </div>
        ) : (
          positions.map((position) => (
            <TimesheetPositionComponent
              key={position.id}
              position={position}
              onUpdate={updatePosition}
              onRemove={removePosition}
              availableActivities={availableActivities}
            />
          ))
        )}
      </div>

      {/* Add Position Modal */}
      {showAddPositionModal && (
        <div className="modal-overlay" style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: "rgba(0,0,0,0.5)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 1000
        }}>
          <div className="modal" style={{
            backgroundColor: "var(--color-bg-primary)",
            padding: "24px",
            borderRadius: "8px",
            border: "1px solid var(--color-border)",
            minWidth: "300px"
          }}>
            <h3 style={{ margin: "0 0 16px 0" }}>Neue Position erstellen</h3>
            
            <div className="form-group" style={{ marginBottom: "16px" }}>
              <label style={{ display: "block", marginBottom: "8px" }}>Datum:</label>
              <input
                type="date"
                value={newPositionDate}
                onChange={(e) => setNewPositionDate(e.target.value)}
                style={{
                  width: "100%",
                  padding: "8px",
                  border: "1px solid var(--color-border)",
                  borderRadius: "4px"
                }}
              />
            </div>

            {/* Check if date already exists */}
            {positions.find(pos => pos.date === newPositionDate) && (
              <div style={{
                padding: "8px 12px",
                backgroundColor: "var(--color-warning-bg)",
                border: "1px solid var(--color-warning)",
                borderRadius: "4px",
                marginBottom: "16px",
                fontSize: "13px"
              }}>
                ⚠️ Position für dieses Datum existiert bereits. 
                Es wird zur vorhandenen Position gewechselt.
              </div>
            )}

            <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
              <button
                className="btn btn-secondary"
                onClick={() => setShowAddPositionModal(false)}
              >
                Abbrechen
              </button>
              <button
                className="btn btn-primary"
                onClick={addPosition}
              >
                Erstellen
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      {positions.length > 0 && (
        <div style={{
          marginTop: "16px",
          padding: "12px",
          backgroundColor: "var(--color-bg-light)",
          borderRadius: "6px",
          fontSize: "13px"
        }}>
          <div style={{ marginBottom: "8px", fontWeight: "500" }}>Schnellaktionen:</div>
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            <button 
              className="btn btn-secondary"
              style={{ padding: "4px 8px", fontSize: "12px" }}
              onClick={() => {
                // Expand all positions
                const expandedPositions = positions.map(pos => ({ ...pos, isExpanded: true }));
                onPositionsChange(expandedPositions);
              }}
            >
              Alle aufklappen
            </button>
            <button 
              className="btn btn-secondary"
              style={{ padding: "4px 8px", fontSize: "12px" }}
              onClick={() => {
                // Collapse all positions
                const collapsedPositions = positions.map(pos => ({ ...pos, isExpanded: false }));
                onPositionsChange(collapsedPositions);
              }}
            >
              Alle zuklappen
            </button>
          </div>
        </div>
      )}
    </div>
  );
}