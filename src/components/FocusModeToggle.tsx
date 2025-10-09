import React from 'react';
import { useFocusMode } from '../contexts/FocusModeContext';

interface FocusModeToggleProps {
  compact?: boolean;
}

export const FocusModeToggle: React.FC<FocusModeToggleProps> = ({ compact = false }) => {
  const { active, variant, toggle, disable } = useFocusMode();

  const handleModeClick = (mode: 'zen' | 'mini' | 'free') => {
    toggle(mode); // Context handles the logic now
  };

  const handleExit = () => {
    disable();
  };

  const getBadge = (mode: 'zen' | 'mini' | 'free') => {
    return active && variant === mode ? '[●]' : '[ ]';
  };

  return (
    <div className="focus-mode-buttons-vertical">
      <div className="focus-mode-header">Focus Mode</div>
      
      <button
        className={`focus-mode-btn ${active && variant === 'zen' ? 'active' : ''}`}
        onClick={() => handleModeClick('zen')}
        title="Zen Mode - Sidebar hidden, header visible"
      >
        <span className="mode-label">Zen</span>
        <span className="mode-badge">{getBadge('zen')}</span>
      </button>

      <button
        className={`focus-mode-btn ${active && variant === 'mini' ? 'active' : ''}`}
        onClick={() => handleModeClick('mini')}
        title="Mini Mode - Compact header, sidebar hidden"
      >
        <span className="mode-label">Mini</span>
        <span className="mode-badge">{getBadge('mini')}</span>
      </button>

      <button
        className={`focus-mode-btn ${active && variant === 'free' ? 'active' : ''}`}
        onClick={() => handleModeClick('free')}
        title="Free Mode - All UI hidden except content"
      >
        <span className="mode-label">Free</span>
        <span className="mode-badge">{getBadge('free')}</span>
      </button>

      <button
        className="focus-mode-btn exit-btn"
        onClick={handleExit}
        disabled={!active}
        title="Exit Focus Mode"
      >
        <span className="mode-label">Exit</span>
      </button>
    </div>
  );
};