import React from 'react';
import { useAutoUpdatePreferences } from '../hooks/useAutoUpdatePreferences';

/**
 * AutoUpdatePreferences Komponente
 * Phase 2: Preferences & Settings Integration
 * 
 * Verwendet RawaLite Standards: field-mapper, useUnifiedSettings
 */
export const AutoUpdatePreferences: React.FC = () => {
  const { preferences, loading, error, updatePreference, resetToDefaults } = useAutoUpdatePreferences();

  if (loading) {
    return (
      <div style={{ 
        padding: "16px", 
        backgroundColor: "rgba(255,255,255,0.05)",
        borderRadius: "8px",
        border: "1px solid rgba(255,255,255,0.1)",
        textAlign: "center"
      }}>
        <div>Lade Update-Einstellungen...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ 
        padding: "16px", 
        backgroundColor: "rgba(239, 68, 68, 0.1)",
        borderRadius: "8px",
        border: "1px solid rgba(239, 68, 68, 0.3)",
        color: "rgb(239, 68, 68)"
      }}>
        <div>Fehler beim Laden der Update-Einstellungen: {error}</div>
      </div>
    );
  }

  return (
    <div style={{ 
      padding: "16px", 
      backgroundColor: "rgba(255,255,255,0.05)",
      borderRadius: "8px",
      border: "1px solid rgba(255,255,255,0.1)"
    }}>
      {/* Auto-Update aktivieren */}
      <label style={{ display: "flex", alignItems: "center", marginBottom: "16px" }}>
        <input 
          type="checkbox" 
          checked={preferences.enabled}
          onChange={(e) => updatePreference('enabled', e.target.checked)}
          style={{ marginRight: "8px" }} 
        />
        <span style={{ fontSize: "14px", fontWeight: "500" }}>
          Automatisch nach Updates suchen
        </span>
      </label>

      {/* Nur zeigen wenn aktiviert */}
      {preferences.enabled && (
        <div style={{ marginLeft: "24px", borderLeft: "2px solid rgba(255,255,255,0.1)", paddingLeft: "16px" }}>
          {/* Check-Häufigkeit */}
          <div style={{ marginBottom: "12px" }}>
            <label style={{ display: "block", marginBottom: "4px", fontSize: "14px", fontWeight: "500" }}>
              Prüfung durchführen:
            </label>
            <select
              value={preferences.checkFrequency}
              onChange={(e) => updatePreference('checkFrequency', e.target.value as any)}
              style={{
                padding: "6px",
                borderRadius: "4px",
                border: "1px solid rgba(255,255,255,.2)",
                backgroundColor: "rgba(255,255,255,.05)",
                color: "var(--foreground)",
                fontSize: "14px"
              }}
            >
              <option value="startup">Bei jedem Start</option>
              <option value="daily">Täglich</option>
              <option value="weekly">Wöchentlich</option>
            </select>
          </div>

          {/* Benachrichtigungsstil */}
          <div style={{ marginBottom: "12px" }}>
            <label style={{ display: "block", marginBottom: "4px", fontSize: "14px", fontWeight: "500" }}>
              Benachrichtigungsstil:
            </label>
            <select
              value={preferences.notificationStyle}
              onChange={(e) => updatePreference('notificationStyle', e.target.value as any)}
              style={{
                padding: "6px",
                borderRadius: "4px",
                border: "1px solid rgba(255,255,255,.2)",
                backgroundColor: "rgba(255,255,255,.05)",
                color: "var(--foreground)",
                fontSize: "14px"
              }}
            >
              <option value="subtle">Dezent</option>
              <option value="prominent">Auffällig</option>
            </select>
          </div>

          {/* Erinnerungsintervall */}
          <div style={{ marginBottom: "12px" }}>
            <label style={{ display: "block", marginBottom: "4px", fontSize: "14px", fontWeight: "500" }}>
              Erinnerung alle {preferences.reminderInterval} Stunden
            </label>
            <input
              type="range"
              min="1"
              max="24"
              value={preferences.reminderInterval}
              onChange={(e) => updatePreference('reminderInterval', parseInt(e.target.value))}
              style={{
                width: "100%",
                marginBottom: "4px"
              }}
            />
            <div style={{ fontSize: "12px", opacity: 0.7 }}>
              1 Stunde ← → 24 Stunden
            </div>
          </div>

          {/* Auto-Download */}
          <label style={{ display: "flex", alignItems: "center", marginBottom: "12px" }}>
            <input 
              type="checkbox" 
              checked={preferences.autoDownload}
              onChange={(e) => updatePreference('autoDownload', e.target.checked)}
              style={{ marginRight: "8px" }} 
            />
            <span style={{ fontSize: "14px" }}>
              Updates automatisch im Hintergrund herunterladen
            </span>
          </label>

          {/* Install-Verhalten */}
          <div style={{ marginBottom: "12px" }}>
            <label style={{ display: "block", marginBottom: "4px", fontSize: "14px", fontWeight: "500" }}>
              Installation:
            </label>
            <select
              value={preferences.installPrompt}
              onChange={(e) => updatePreference('installPrompt', e.target.value as any)}
              style={{
                padding: "6px",
                borderRadius: "4px",
                border: "1px solid rgba(255,255,255,.2)",
                backgroundColor: "rgba(255,255,255,.05)",
                color: "var(--foreground)",
                fontSize: "14px"
              }}
            >
              <option value="manual">Manuell bestätigen</option>
              <option value="scheduled">Geplant installieren</option>
              <option value="immediate">Sofort installieren</option>
            </select>
          </div>
        </div>
      )}

      {/* Reset Button */}
      <div style={{ marginTop: "16px", paddingTop: "16px", borderTop: "1px solid rgba(255,255,255,0.1)" }}>
        <button
          onClick={resetToDefaults}
          style={{
            padding: "6px 12px",
            fontSize: "12px",
            backgroundColor: "transparent",
            color: "rgba(255,255,255,0.6)",
            border: "1px solid rgba(255,255,255,0.2)",
            borderRadius: "4px",
            cursor: "pointer"
          }}
        >
          Standardwerte wiederherstellen
        </button>
      </div>
    </div>
  );
};