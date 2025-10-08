import { ipcMain, app } from 'electron';
import { UpdateManagerService } from '../../src/main/services/UpdateManagerService';

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

  console.log('[IPC] Update IPC handlers registered successfully');
}