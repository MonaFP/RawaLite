import React from 'react';
// import { useAutoUpdatePreferences } from '../hooks/useAutoUpdatePreferences'; // DISABLED for emergency fix

/**
 * AutoUpdatePreferences Komponente
 * v1.0.42 EMERGENCY HOTFIX: Disabled due to SQL crashes
 * 
 * PROBLEM: useAutoUpdatePreferences hook creates SQLiteAdapter causing
 * "no such column: next_customer_number" errors that crash Settings page
 * 
 * SOLUTION: Temporary disable component until proper DatabaseService integration
 * SEE: docs/12-lessons/LESSONS-LEARNED-v1041-AutoUpdatePreferences-crash.md
 */
export const AutoUpdatePreferences: React.FC = () => {
  // EMERGENCY HOTFIX v1.0.42: Disable problematic component
  return (
    <div style={{ 
      padding: "16px", 
      backgroundColor: "rgba(255, 165, 0, 0.1)",
      borderRadius: "8px",
      border: "1px solid rgba(255, 165, 0, 0.3)",
      color: "rgb(255, 165, 0)"
    }}>
      <h4 style={{ margin: "0 0 8px 0", color: "rgb(255, 165, 0)" }}>
        🔧 Auto-Update Einstellungen vorübergehend nicht verfügbar
      </h4>
      <p style={{ margin: "0 0 12px 0", fontSize: "14px", lineHeight: "1.4" }}>
        Die automatischen Update-Einstellungen sind in dieser Version temporär deaktiviert 
        aufgrund von Datenbankzugriffsproblemen.
      </p>
      <p style={{ margin: "0 0 12px 0", fontSize: "14px", lineHeight: "1.4" }}>
        <strong>Manuelle Updates sind weiterhin verfügbar:</strong>
      </p>
      <ul style={{ margin: "0 0 12px 16px", fontSize: "14px", lineHeight: "1.4" }}>
        <li>Verwenden Sie den "Update verfügbar" Button oben rechts</li>
        <li>Oder laden Sie Updates manuell von GitHub herunter</li>
        <li>Update-System funktioniert normal, nur die Einstellungen sind deaktiviert</li>
      </ul>
      <p style={{ margin: "0", fontSize: "12px", opacity: "0.8" }}>
        Automatische Update-Funktionen werden in v1.0.43 wiederhergestellt.
      </p>
    </div>
  );

  // ORIGINAL IMPLEMENTATION BACKUP:
  // The problematic code has been moved to AutoUpdatePreferences.tsx.backup
  // Problem: useAutoUpdatePreferences hook creates new SQLiteAdapter instance
  // This causes "no such column: next_customer_number" SQL errors
  // Which crash the entire Settings page, blocking access to Update-System
};