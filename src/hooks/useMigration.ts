import { useState, useCallback, useEffect } from 'react';
import { MigrationService, BackupMetadata } from '../services/MigrationService';
import { UpdateService, UpdateProgress } from '../services/UpdateService';

interface MigrationState {
  isChecking: boolean;
  needsMigration: boolean;
  isUpdating: boolean;
  progress: UpdateProgress | null;
  error: string | null;
  backups: Array<{
    id: string;
    timestamp: string;
    version: number;
    description: string;
  }>;
}

export const useMigration = () => {
  const [state, setState] = useState<MigrationState>({
    isChecking: false,
    needsMigration: false,
    isUpdating: false,
    progress: null,
    error: null,
    backups: []
  });

  const migrationService = new MigrationService();
  const updateService = new UpdateService();

  // Check if migration is needed
  const checkMigrationNeeded = useCallback(async () => {
    setState(prev => ({ ...prev, isChecking: true, error: null }));
    
    try {
      // Initialize migration service first to ensure tables exist
      await migrationService.initialize();
      
      const migrationStatus = await migrationService.getMigrationStatus();
      const backups = await migrationService.listBackups();
      
      setState(prev => ({
        ...prev,
        isChecking: false,
        needsMigration: migrationStatus.needsMigration,
        backups: backups.map(backup => ({
          id: backup.id,
          timestamp: new Date(backup.createdAt).toLocaleString(),
          version: backup.version,
          description: backup.description || `Database backup v${backup.version}`
        }))
      }));
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Fehler beim Prüfen des Migrationsstatus';
      console.error('Migration check failed:', error);
      setState(prev => ({ ...prev, isChecking: false, error: errorMsg }));
    }
  }, []);

  // Run migration (through initialization)
  const runMigration = useCallback(async () => {
    setState(prev => ({ ...prev, isUpdating: true, error: null, progress: null }));

    try {
      await migrationService.initialize();

      setState(prev => ({ 
        ...prev, 
        isUpdating: false, 
        needsMigration: false,
        progress: null 
      }));
      
      // Refresh backup list
      await checkMigrationNeeded();
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Migration fehlgeschlagen';
      console.error('Migration failed:', error);
      setState(prev => ({ ...prev, isUpdating: false, error: errorMsg, progress: null }));
    }
  }, [checkMigrationNeeded]);

  // Run app update (coordinates migration)
  const runUpdate = useCallback(async () => {
    setState(prev => ({ ...prev, isUpdating: true, error: null, progress: null }));

    try {
      await updateService.performUpdate();

      setState(prev => ({ 
        ...prev, 
        isUpdating: false, 
        needsMigration: false,
        progress: null 
      }));
      
      // Refresh backup list
      await checkMigrationNeeded();
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Update fehlgeschlagen';
      console.error('Update failed:', error);
      setState(prev => ({ ...prev, isUpdating: false, error: errorMsg, progress: null }));
    }
  }, [checkMigrationNeeded]);

  // Create manual backup
  const createBackup = useCallback(async (description?: string) => {
    setState(prev => ({ ...prev, isUpdating: true, error: null }));

    try {
      await migrationService.createManualBackup(description);
      setState(prev => ({ ...prev, isUpdating: false }));
      await checkMigrationNeeded(); // Refresh backup list
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Backup-Erstellung fehlgeschlagen';
      console.error('Backup creation failed:', error);
      setState(prev => ({ ...prev, isUpdating: false, error: errorMsg }));
    }
  }, [checkMigrationNeeded]);

  // Clean up old backups
  const cleanupBackups = useCallback(async (keepCount: number = 5) => {
    try {
      await migrationService.cleanupOldBackups(keepCount);
      await checkMigrationNeeded(); // Refresh backup list
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Backup-Bereinigung fehlgeschlagen';
      console.error('Backup cleanup failed:', error);
      setState(prev => ({ ...prev, error: errorMsg }));
    }
  }, [checkMigrationNeeded]);

  // Initialize on mount
  useEffect(() => {
    checkMigrationNeeded();
  }, [checkMigrationNeeded]);

  return {
    ...state,
    checkMigrationNeeded,
    runMigration,
    runUpdate,
    createBackup,
    cleanupBackups
  };
};
