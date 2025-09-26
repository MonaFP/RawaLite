// update-handler-types.d.ts
// TypeScript-Typdefinitionen für den Update-Handler

declare namespace RawaLiteUpdater {
  /**
   * Optionen für den Custom-Update-Installer
   */
  interface InstallCustomOptions {
    /** Absoluter Pfad zur Installer-Datei */
    filePath?: string;
    installerPath?: string;
    /** Zusätzliche Kommandozeilenargumente für den Installer */
    args?: string[];
    /** Erwarteter SHA256-Hash der Installer-Datei (optional) */
    expectedSha256?: string;
    /** Gibt an, ob der Installer mit erhöhten Rechten (UAC) ausgeführt werden soll */
    elevate?: boolean;
    /** Gibt an, ob der MOTW (Mark of the Web) entfernt werden soll */
    unblock?: boolean;
    /** Verzögerung in Millisekunden vor dem Beenden der App */
    quitDelayMs?: number;
    perMachine?: boolean;
  }

  /**
   * Rückgabewerte des Update-Installers
   */
  interface InstallCustomResult {
    /** Gibt an, ob der Installer erfolgreich gestartet wurde */
    ok: boolean;
    /** Fehlermeldung bei Misserfolg */
    error?: string;
    /** Gibt an, ob der Installer tatsächlich gestartet wurde */
    installerStarted?: boolean;
    /** Prozess-ID des gestarteten Installers (wenn verfügbar) */
    pid?: number | null;
    /** Pfad zur Installer-Datei */
    filePath?: string;
    /** Verwendete Kommandozeilenargumente */
    args?: string[];
    /** Eindeutige ID für diesen Update-Vorgang */
    runId?: string;
    /** Gibt an, ob bereits ein Update-Prozess läuft */
    alreadyInProgress?: boolean;
    /** Gibt an, ob perMachine-Modus aktiv war */
    perMachine?: boolean;
    /** Verwendeter Quit-Delay in Millisekunden */
    quitDelayMs?: number;
    /** Pfad zur geschriebenen Diagnose-Datei */
    diagFilePath?: string;
  }

  /**
   * Status-Updates des Update-Prozesses
   */
  interface UpdaterStatus {
    /** Aktueller Status des Update-Prozesses */
    status: 'checking' | 'downloading' | 'preparing-installer' | 'install-started' | 'error';
    /** Menschenlesbare Statusmeldung */
    message: string;
    /** Fortschritt (0-100) bei Download */
    progress?: number;
    /** Fehlermeldung bei Status 'error' */
    error?: string;
  }
}

/**
 * Globale Erweiterungen für Window-Objekt
 */
interface Window {
  electronAPI: {
    /**
     * Startet einen benutzerdefinierten Update-Installer
     */
    installCustomUpdate: (options: RawaLiteUpdater.InstallCustomOptions) => 
      Promise<RawaLiteUpdater.InstallCustomResult>;
    
    /**
     * Registriert einen Callback für Status-Updates des Update-Prozesses
     * Gibt eine Funktion zurück, die den Listener entfernt
     */
    onUpdaterStatus: (callback: (status: RawaLiteUpdater.UpdaterStatus) => void) => () => void;
  }
}