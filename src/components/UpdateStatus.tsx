/**
 * UpdateStatus Component für RawaLite
 * 
 * Inline Update-Status Anzeige für den Updates-Tab in den Einstellungen.
 * Zeigt Check-Status, aktuelle Version und "Version ist aktuell" INLINE an.
 * Kein Modal-Overlay - nur direkte Integration in die Seite.
 */

import React, { useState } from 'react';

interface UpdateStatusProps {
  onUpdateAvailable?: () => void; // Callback wenn Update verfügbar -> öffnet Modal
}

export function UpdateStatus({ onUpdateAvailable }: UpdateStatusProps) {
  const [isChecking, setIsChecking] = useState(false);
  const [hasTriggeredCheck, setHasTriggeredCheck] = useState(false);
  const [checkResult, setCheckResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleCheckForUpdates = async () => {
    console.log('� [UpdateStatus] Button clicked - checking for updates...');
    
    // Check if API is available
    if (!window.rawalite?.updates) {
      console.error('🚨 [UpdateStatus] window.rawalite.updates not available');
      setError('Update API nicht verfügbar');
      return;
    }

    setHasTriggeredCheck(true);
    setIsChecking(true);
    setError(null);
    setCheckResult(null);
    
    try {
      console.log('🔄 [UpdateStatus] Calling window.rawalite.updates.checkForUpdates...');
      
      const result = await window.rawalite.updates.checkForUpdates();
      console.log('✅ [UpdateStatus] Update check result:', result);
      
      setCheckResult(result);
      
      // Check if update is available - open manager window instead of callback
      if (result.hasUpdate) {
        console.log('🎉 [UpdateStatus] Update available! Opening Update Manager...');
        
        try {
          const managerResult = await window.rawalite.updates.openManager();
          console.log('✅ [UpdateStatus] Update Manager opened:', managerResult);
        } catch (managerError) {
          console.error('🚨 [UpdateStatus] Failed to open Update Manager:', managerError);
          // Fallback to callback if available
          if (onUpdateAvailable) {
            onUpdateAvailable();
          }
        }
      }
      
    } catch (err) {
      console.error('🚨 [UpdateStatus] Update check failed:', err);
      const errorMessage = err instanceof Error ? err.message : 'Update-Prüfung fehlgeschlagen';
      setError(errorMessage);
    } finally {
      setIsChecking(false);
    }
  };

  const handleRetry = () => {
    setError(null);
    handleCheckForUpdates();
  };

  // Status-Anzeige unter dem Button
  const renderStatusDisplay = () => {
    // Zeige nichts an, wenn noch nie geprüft wurde
    if (!hasTriggeredCheck && !error) {
      return null;
    }

    // Error State
    if (error) {
      return (
        <div style={{
          marginTop: "16px",
          padding: "12px",
          backgroundColor: "#fef2f2",
          border: "1px solid #fecaca",
          borderRadius: "8px",
          color: "#dc2626"
        }}>
          <div style={{ display: "flex", alignItems: "center", marginBottom: "8px" }}>
            <span style={{ marginRight: "8px", fontSize: "16px" }}>⚠</span>
            <strong>Update-Fehler</strong>
          </div>
          <p style={{ margin: "0 0 8px 0", fontSize: "14px" }}>
            {error}
          </p>
          <button
            onClick={handleRetry}
            style={{
              backgroundColor: "#dc2626",
              color: "white",
              border: "none",
              padding: "6px 12px",
              borderRadius: "4px",
              fontSize: "12px",
              cursor: "pointer"
            }}
          >
            Erneut versuchen
          </button>
        </div>
      );
    }

    // Checking State
    if (isChecking) {
      return (
        <div style={{
          marginTop: "16px",
          padding: "12px",
          backgroundColor: "#eff6ff",
          border: "1px solid #bfdbfe",
          borderRadius: "8px",
          color: "#1e40af"
        }}>
          <div style={{ display: "flex", alignItems: "center" }}>
            <div style={{ 
              marginRight: "8px", 
              animation: "spin 1s linear infinite",
              fontSize: "16px"
            }}>
              ⟳
            </div>
            <span>Suche nach Updates...</span>
          </div>
        </div>
      );
    }

    // Check result available
    if (checkResult) {
      // Update Available State
      if (checkResult.hasUpdate) {
        return (
          <div style={{
            marginTop: "16px",
            padding: "12px",
            backgroundColor: "#f0fdf4",
            border: "1px solid #bbf7d0",
            borderRadius: "8px",
            color: "#166534"
          }}>
            <div style={{ display: "flex", alignItems: "center", marginBottom: "8px" }}>
              <span style={{ marginRight: "8px", fontSize: "16px" }}>🎉</span>
              <strong>Update verfügbar!</strong>
            </div>
            <p style={{ margin: "0 0 8px 0", fontSize: "14px" }}>
              Version {checkResult.latestVersion} ist verfügbar.
            </p>
            <p style={{ margin: "0", fontSize: "12px", opacity: 0.8 }}>
              Das Update-Fenster öffnet sich automatisch für weitere Details.
            </p>
          </div>
        );
      } else {
        // No Update Available (Version ist aktuell)
        return (
          <div style={{
            marginTop: "16px",
            padding: "12px",
            backgroundColor: "#f0fdf4",
            border: "1px solid #bbf7d0",
            borderRadius: "8px",
            color: "#166534"
          }}>
            <div style={{ display: "flex", alignItems: "center", marginBottom: "8px" }}>
              <span style={{ marginRight: "8px", fontSize: "16px" }}>✓</span>
              <strong>Version ist aktuell</strong>
            </div>
            <p style={{ margin: "0", fontSize: "14px" }}>
              Sie verwenden bereits die neueste Version ({checkResult.currentVersion}).
            </p>
            <p style={{ margin: "8px 0 0 0", fontSize: "12px", opacity: 0.8 }}>
              Letzte Überprüfung: {new Date().toLocaleString('de-DE')}
            </p>
          </div>
        );
      }
    }

    return null;
  };

  return (
    <div>
      {/* Update Check Button */}
      <button
        type="button"
        onClick={handleCheckForUpdates}
        disabled={isChecking}
        className="btn"
        style={{
          backgroundColor: isChecking ? "#9ca3af" : "#3b82f6",
          color: "white",
          border: "none",
          padding: "12px 24px",
          borderRadius: "8px",
          cursor: isChecking ? "not-allowed" : "pointer",
          fontWeight: "500"
        }}
      >
        {isChecking ? "🔄 Prüfe..." : "🔄 Nach Updates suchen"}
      </button>

      {/* Status Display - INLINE statt Modal! */}
      {renderStatusDisplay()}

      {/* CSS Animation für Spinner */}
      <style>
        {`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}
      </style>
    </div>
  );
}