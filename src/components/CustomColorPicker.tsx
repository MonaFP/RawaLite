import React, { useState, useEffect } from 'react';
import type { CustomColorSettings } from '../lib/settings';
import { defaultCustomColors } from '../lib/themes';

interface CustomColorPickerProps {
  colors: CustomColorSettings;
  onChange: (colors: CustomColorSettings) => void;
  onApply: () => void;
  isApplying?: boolean;
}

export function CustomColorPicker({ colors, onChange, onApply, isApplying }: CustomColorPickerProps) {
  const [localColors, setLocalColors] = useState<CustomColorSettings>(colors);

  // Update local colors when prop changes
  useEffect(() => {
    setLocalColors(colors);
  }, [colors]);

  const handleColorChange = (field: keyof CustomColorSettings, value: string) => {
    const updatedColors = { ...localColors, [field]: value };
    setLocalColors(updatedColors);
    onChange(updatedColors);
  };

  const handleReset = () => {
    setLocalColors(defaultCustomColors);
    onChange(defaultCustomColors);
  };

  return (
    <div style={{ 
      padding: '16px', 
      backgroundColor: 'rgba(255,255,255,0.05)', 
      borderRadius: '8px', 
      border: '1px solid rgba(255,255,255,0.1)',
      marginTop: '12px'
    }}>
      <h4 style={{ margin: '0 0 16px 0', color: 'white', fontSize: '14px', fontWeight: '600' }}>
        🎨 Custom Colors
      </h4>
      
      <div style={{ display: 'grid', gap: '12px' }}>
        {/* Primary Color */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <label style={{ 
            color: 'rgba(255,255,255,0.9)', 
            fontSize: '13px', 
            minWidth: '80px',
            fontWeight: '500'
          }}>
            Primary:
          </label>
          <input
            type="color"
            value={localColors.primary}
            onChange={(e) => handleColorChange('primary', e.target.value)}
            style={{
              width: '40px',
              height: '32px',
              border: '1px solid rgba(255,255,255,0.2)',
              borderRadius: '6px',
              backgroundColor: 'transparent',
              cursor: 'pointer'
            }}
          />
          <input
            type="text"
            value={localColors.primary}
            onChange={(e) => handleColorChange('primary', e.target.value)}
            placeholder="#4a5d5a"
            style={{
              flex: 1,
              padding: '6px 10px',
              backgroundColor: 'rgba(255,255,255,0.1)',
              border: '1px solid rgba(255,255,255,0.2)',
              borderRadius: '6px',
              color: 'white',
              fontSize: '13px',
              fontFamily: 'Monaco, Consolas, monospace'
            }}
          />
        </div>

        {/* Secondary Color */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <label style={{ 
            color: 'rgba(255,255,255,0.9)', 
            fontSize: '13px', 
            minWidth: '80px',
            fontWeight: '500'
          }}>
            Secondary:
          </label>
          <input
            type="color"
            value={localColors.secondary}
            onChange={(e) => handleColorChange('secondary', e.target.value)}
            style={{
              width: '40px',
              height: '32px',
              border: '1px solid rgba(255,255,255,0.2)',
              borderRadius: '6px',
              backgroundColor: 'transparent',
              cursor: 'pointer'
            }}
          />
          <input
            type="text"
            value={localColors.secondary}
            onChange={(e) => handleColorChange('secondary', e.target.value)}
            placeholder="#3a4d4a"
            style={{
              flex: 1,
              padding: '6px 10px',
              backgroundColor: 'rgba(255,255,255,0.1)',
              border: '1px solid rgba(255,255,255,0.2)',
              borderRadius: '6px',
              color: 'white',
              fontSize: '13px',
              fontFamily: 'Monaco, Consolas, monospace'
            }}
          />
        </div>

        {/* Accent Color */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <label style={{ 
            color: 'rgba(255,255,255,0.9)', 
            fontSize: '13px', 
            minWidth: '80px',
            fontWeight: '500'
          }}>
            Accent:
          </label>
          <input
            type="color"
            value={localColors.accent}
            onChange={(e) => handleColorChange('accent', e.target.value)}
            style={{
              width: '40px',
              height: '32px',
              border: '1px solid rgba(255,255,255,0.2)',
              borderRadius: '6px',
              backgroundColor: 'transparent',
              cursor: 'pointer'
            }}
          />
          <input
            type="text"
            value={localColors.accent}
            onChange={(e) => handleColorChange('accent', e.target.value)}
            placeholder="#7dd3a0"
            style={{
              flex: 1,
              padding: '6px 10px',
              backgroundColor: 'rgba(255,255,255,0.1)',
              border: '1px solid rgba(255,255,255,0.2)',
              borderRadius: '6px',
              color: 'white',
              fontSize: '13px',
              fontFamily: 'Monaco, Consolas, monospace'
            }}
          />
        </div>
      </div>

      {/* Action Buttons */}
      <div style={{ 
        display: 'flex', 
        gap: '8px', 
        marginTop: '16px',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <button
          onClick={handleReset}
          disabled={isApplying}
          style={{
            padding: '6px 12px',
            backgroundColor: 'rgba(255,255,255,0.1)',
            border: '1px solid rgba(255,255,255,0.2)',
            borderRadius: '6px',
            color: 'rgba(255,255,255,0.8)',
            fontSize: '12px',
            cursor: isApplying ? 'not-allowed' : 'pointer',
            opacity: isApplying ? 0.6 : 1,
            transition: 'all 0.2s ease'
          }}
        >
          🔄 Reset
        </button>
        
        <button
          onClick={onApply}
          disabled={isApplying}
          style={{
            padding: '8px 16px',
            backgroundColor: localColors.accent,
            border: 'none',
            borderRadius: '6px',
            color: 'white',
            fontSize: '13px',
            fontWeight: '600',
            cursor: isApplying ? 'not-allowed' : 'pointer',
            opacity: isApplying ? 0.6 : 1,
            transition: 'all 0.2s ease',
            textShadow: '0 1px 2px rgba(0,0,0,0.3)'
          }}
        >
          {isApplying ? '🔄 Anwenden...' : '✅ Übernehmen'}
        </button>
      </div>

      {/* Preview Box */}
      <div style={{ 
        marginTop: '16px',
        padding: '12px',
        background: `linear-gradient(160deg, ${localColors.primary} 0%, ${localColors.secondary} 40%, ${localColors.secondary} 100%)`,
        borderRadius: '6px',
        border: '1px solid rgba(255,255,255,0.1)'
      }}>
        <div style={{ 
          color: 'white', 
          fontSize: '12px', 
          fontWeight: '600',
          textShadow: '0 1px 2px rgba(0,0,0,0.3)'
        }}>
          👁️ Vorschau
        </div>
        <div style={{ 
          marginTop: '6px',
          padding: '6px 8px',
          backgroundColor: localColors.accent,
          borderRadius: '4px',
          color: 'white',
          fontSize: '11px',
          display: 'inline-block',
          fontWeight: '500'
        }}>
          Accent Farbe
        </div>
      </div>
    </div>
  );
}