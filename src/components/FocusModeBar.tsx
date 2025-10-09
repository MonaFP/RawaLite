import React from 'react';
import { useFocusMode } from '../contexts/FocusModeContext';

export const FocusModeBar: React.FC = () => {
  const { active, variant } = useFocusMode();

  // Bar zeigt nur Status-Info, Toggle ist separate Komponente
  return (
    <div className="focus-mode-bar">
      <div className="focus-mode-bar-content">
        <div className="focus-mode-bar-left">
          {active ? (
            <div className="focus-mode-indicator">
              🎯 {variant?.toUpperCase()} Mode Active
            </div>
          ) : (
            <div className="focus-mode-indicator-inactive">
              🎯 Focus Mode Available
            </div>
          )}
        </div>
      </div>
    </div>
  );
};