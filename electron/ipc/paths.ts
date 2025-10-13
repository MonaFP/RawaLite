// electron/ipc/paths.ts
import { ipcMain, app } from 'electron'
import path from 'node:path'

/**
 * Path IPC Handlers - Extracted from main.ts Step 3
 * 
 * Provides secure path resolution for the renderer process:
 * - Basic system paths (userData, documents, downloads)
 * - App-specific paths for PATHS system integration
 * - Package.json path resolution for dev/prod environments
 * 
 * Critical Fixes: None directly affected by this module
 */

/**
 * Basic Path Handler - Get standard system paths
 */
export function registerPathHandlers(): void {
  // 📁 Basic Path Handler (existing)
  ipcMain.handle('paths:get', async (event, pathType: 'userData' | 'documents' | 'downloads') => {
    try {
      switch (pathType) {
        case 'userData':
          return app.getPath('userData')
        case 'documents':
          return app.getPath('documents')
        case 'downloads':
          return app.getPath('downloads')
        default:
          throw new Error(`Unknown path type: ${pathType}`)
      }
    } catch (error) {
      console.error(`Failed to get path ${pathType}:`, error)
      throw error
    }
  })

  // 📁 App-specific Path Handlers for PATHS System Integration
  ipcMain.handle('paths:getAppPath', async () => {
    try {
      return app.getAppPath()
    } catch (error) {
      console.error('Failed to get app path:', error)
      throw error
    }
  })

  ipcMain.handle('paths:getCwd', async () => {
    try {
      return process.cwd()
    } catch (error) {
      console.error('Failed to get current working directory:', error)
      throw error
    }
  })

  ipcMain.handle('paths:getPackageJsonPath', async () => {
    try {
      const packageJsonPath = app.isPackaged
        ? path.join(app.getAppPath(), 'package.json')
        : path.join(process.cwd(), 'package.json')
      return packageJsonPath
    } catch (error) {
      console.error('Failed to get package.json path:', error)
      throw error
    }
  })
}