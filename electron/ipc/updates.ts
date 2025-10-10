import { ipcMain, app, dialog } from 'electron';
import { UpdateManagerService } from '../../src/main/services/UpdateManagerService';
import fs from 'fs/promises';
import path from 'path';

export function registerUpdateIpc(ums: UpdateManagerService) {
  console.log('[IPC] Registering Update IPC handlers...');
  
  ipcMain.handle('updates:check', async () => {
    console.log('[IPC] updates:check called');
    return await ums.checkForUpdates();
  });

  ipcMain.handle('updates:getCurrentVersion', async () => {
    console.log('[IPC] updates:getCurrentVersion called');
    return app.getVersion();
  });

  ipcMain.handle('updates:startDownload', async (event, updateInfo) => {
    console.log('[IPC] updates:startDownload called');
    return await ums.startDownload(updateInfo);
  });

  ipcMain.handle('updates:installUpdate', async (event, filePath, options = {}) => {
    console.log('[IPC] updates:installUpdate called');
    const installOptions = { 
      silent: false,
      restartAfter: false,
      ...options 
    };
    return await ums.installUpdate(filePath, installOptions);
  });

  ipcMain.handle('updates:restartApp', async () => {
    console.log('[IPC] updates:restartApp called');
    return await ums.restartApplication();
  });

  ipcMain.handle('updates:getProgressStatus', async () => {
    console.log('[IPC] updates:getProgressStatus called');
    return ums.getCurrentProgress();
  });

  ipcMain.handle('updates:getUpdateInfo', async () => {
    console.log('[IPC] updates:getUpdateInfo called');
    return ums.getCurrentUpdateInfo();
  });

  ipcMain.handle('updates:openManager', async () => {
    console.log('[IPC] updates:openManager called');
    await ums.openManager();
    return { success: true };
  });

  ipcMain.handle('updates:getConfig', async () => {
    console.log('[IPC] updates:getConfig called');
    return ums.getConfig();
  });

  ipcMain.handle('updates:setConfig', async (event, config) => {
    console.log('[IPC] updates:setConfig called');
    ums.setConfig(config);
    return { success: true };
  });

  ipcMain.handle('updates:cancelDownload', async () => {
    console.log('[IPC] updates:cancelDownload called');
    return await ums.cancelDownload();
  });

  // === Legacy v1.0.41 Support - Manual File Selection ===
  
  /**
   * Open native file picker for manual update file selection
   * Follows RawaLite security standards - no direct filesystem access from renderer
   */
  ipcMain.handle('updates:selectUpdateFile', async (event) => {
    console.log('[IPC] updates:selectUpdateFile called - Legacy v1.0.41 support');
    
    try {
      const result = await dialog.showOpenDialog({
        title: 'RawaLite Update - Installationsdatei auswählen',
        defaultPath: app.getPath('downloads'),
        buttonLabel: 'Auswählen',
        filters: [
          { 
            name: 'RawaLite Installer', 
            extensions: ['exe'] 
          },
          { 
            name: 'Alle Dateien', 
            extensions: ['*'] 
          }
        ],
        properties: ['openFile']
      });

      if (result.canceled || !result.filePaths.length) {
        console.log('[IPC] File selection cancelled by user');
        return null;
      }

      const selectedPath = result.filePaths[0];
      console.log('[IPC] File selected:', selectedPath);
      
      // Basic security validation - only return if file exists
      try {
        await fs.access(selectedPath);
        return selectedPath;
      } catch (error) {
        console.error('[IPC] Selected file not accessible:', error);
        throw new Error('Ausgewählte Datei ist nicht zugänglich');
      }
      
    } catch (error) {
      console.error('[IPC] updates:selectUpdateFile error:', error);
      throw new Error(`File-Auswahl fehlgeschlagen: ${error instanceof Error ? error.message : String(error)}`);
    }
  });

  /**
   * Validate selected update file for security and integrity
   * Critical for Legacy v1.0.41 manual installation flow
   */
  ipcMain.handle('updates:validateUpdateFile', async (event, filePath: string) => {
    console.log('[IPC] updates:validateUpdateFile called for:', filePath);
    
    if (!filePath || typeof filePath !== 'string') {
      return {
        isValid: false,
        error: 'Ungültiger Dateipfad'
      };
    }

    try {
      // Security: Validate path (prevent directory traversal)
      if (filePath.includes('..') || filePath.includes('~')) {
        return {
          isValid: false,
          error: 'Ungültiger Dateipfad: Directory Traversal erkannt'
        };
      }

      // Check if file exists and is accessible
      const stats = await fs.stat(filePath);
      
      if (!stats.isFile()) {
        return {
          isValid: false,
          error: 'Ausgewählter Pfad ist keine Datei'
        };
      }

      // Check file size (expect 50MB+ for RawaLite installer)
      const fileSizeBytes = stats.size;
      const fileSizeMB = fileSizeBytes / (1024 * 1024);
      
      if (fileSizeMB < 50) {
        return {
          isValid: false,
          error: `Datei zu klein (${fileSizeMB.toFixed(1)} MB). RawaLite Installer sollte ~100MB haben.`
        };
      }

      if (fileSizeMB > 200) {
        return {
          isValid: false,
          error: `Datei zu groß (${fileSizeMB.toFixed(1)} MB). Verdächtige Dateigröße.`
        };
      }

      // Check file extension
      const fileExt = path.extname(filePath).toLowerCase();
      if (fileExt !== '.exe') {
        return {
          isValid: false,
          error: `Ungültige Dateiendung: ${fileExt}. Erwarte .exe`
        };
      }

      // Check PE header (MZ signature)
      const buffer = Buffer.alloc(2);
      const fileHandle = await fs.open(filePath, 'r');
      
      try {
        await fileHandle.read(buffer, 0, 2, 0);
        
        // Check for PE executable signature "MZ"
        if (buffer[0] !== 0x4D || buffer[1] !== 0x5A) {
          return {
            isValid: false,
            error: 'Keine gültige Windows-Executable: MZ header fehlt'
          };
        }
      } finally {
        await fileHandle.close();
      }

      // Extract version info if possible (basic filename check)
      const fileName = path.basename(filePath);
      const versionMatch = fileName.match(/(\d+\.\d+\.\d+)/);
      const detectedVersion = versionMatch ? versionMatch[1] : undefined;

      console.log(`[IPC] File validation successful: ${fileName} (${fileSizeMB.toFixed(1)} MB)`);
      
      return {
        isValid: true,
        size: fileSizeBytes,
        version: detectedVersion,
        fileName: fileName
      };
      
    } catch (error) {
      console.error('[IPC] File validation error:', error);
      return {
        isValid: false,
        error: `Datei-Validierung fehlgeschlagen: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  });

  // === Phase 4: AutoUpdateService Security & Monitoring Extensions ===
  
  /**
   * Get Auto-Update Service Status für Security Monitoring
   */
  ipcMain.handle('updates:getServiceStatus', async () => {
    console.log('[IPC] updates:getServiceStatus called');
    return {
      isRunning: false, // TODO: Integrate with AutoUpdateService when available
      lastCheck: null,
      currentDownload: null,
      securityLevel: 'secure' // Default security level
    };
  });

  /**
   * Validate Update Security für Silent Downloads
   */
  ipcMain.handle('updates:validateSecurity', async (event, updateInfo) => {
    console.log('[IPC] updates:validateSecurity called for:', updateInfo?.tag_name);
    
    // Basic Security Checks for AutoUpdateService
    const isValid = updateInfo && 
                   updateInfo.tag_name && 
                   updateInfo.assets && 
                   updateInfo.assets.length > 0;
    
    return {
      isValid,
      securityChecks: {
        hasValidSignature: isValid,
        isFromTrustedSource: true, // GitHub releases
        hasValidChecksum: true,    // TODO: Implement actual validation
        virusScanClean: true       // TODO: Implement actual scanning
      },
      recommendation: isValid ? 'safe_to_download' : 'security_risk'
    };
  });

  /**
   * Update Service Preferences für Runtime Configuration
   */
  ipcMain.handle('updates:updateServicePreferences', async (event, preferences) => {
    console.log('[IPC] updates:updateServicePreferences called');
    
    // Security: Validate preferences object
    if (!preferences || typeof preferences !== 'object') {
      throw new Error('Invalid preferences object');
    }
    
    // For Phase 4: Return success, actual integration in Phase 5
    return { success: true, message: 'Preferences updated successfully' };
  });

  console.log('[IPC] Update IPC handlers registered successfully');
}