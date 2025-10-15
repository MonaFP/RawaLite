// electron/ipc/filesystem.ts
import { ipcMain } from 'electron'
import * as fs from 'node:fs/promises'

/**
 * Filesystem IPC Handlers - Extracted from main.ts Step 4
 * 
 * Provides secure filesystem operations for the renderer process:
 * - Directory operations (ensureDir, readDir)
 * - File operations (stat, unlink, exists, copy)
 * - File I/O (readFile, writeFile)
 * - Current working directory access
 * 
 * Used by:
 * - PATHS system for file management
 * - SQLite/Dexie database support
 * - General file operations in renderer
 * 
 * Critical Fixes: None directly affected by this module
 */

/**
 * Register all filesystem-related IPC handlers
 */
export function registerFilesystemHandlers(): void {
  // 🔧 Filesystem Operations für PATHS + SQLite/Dexie Support
  ipcMain.handle('fs:ensureDir', async (event, dirPath: string) => {
    try {
      await fs.mkdir(dirPath, { recursive: true })
      return true
    } catch (error: any) {
      if (error.code === 'EEXIST') return true
      console.error(`Failed to ensure directory ${dirPath}:`, error)
      throw error
    }
  })

  ipcMain.handle('fs:getCwd', async () => {
    try {
      return process.cwd()
    } catch (error) {
      console.error('Failed to get current working directory:', error)
      throw error
    }
  })

  ipcMain.handle('fs:readDir', async (event, dirPath: string) => {
    try {
      return await fs.readdir(dirPath)
    } catch (error) {
      console.error(`Failed to read directory ${dirPath}:`, error)
      throw error
    }
  })

  ipcMain.handle('fs:stat', async (event, filePath: string) => {
    try {
      const stats = await fs.stat(filePath)
      return {
        isFile: stats.isFile(),
        isDirectory: stats.isDirectory(),
        size: stats.size,
        mtime: stats.mtime.getTime(),
        atime: stats.atime.getTime(),
        ctime: stats.ctime.getTime()
      }
    } catch (error) {
      console.error(`Failed to stat ${filePath}:`, error)
      throw error
    }
  })

  ipcMain.handle('fs:unlink', async (event, filePath: string) => {
    try {
      await fs.unlink(filePath)
      return true
    } catch (error) {
      console.error(`Failed to unlink ${filePath}:`, error)
      throw error
    }
  })

  // 🔮 Zukünftige SQLite/Dexie Support APIs
  ipcMain.handle('fs:exists', async (event, filePath: string) => {
    try {
      await fs.access(filePath)
      return true
    } catch {
      return false
    }
  })

  ipcMain.handle('fs:copy', async (event, src: string, dest: string) => {
    try {
      await fs.copyFile(src, dest)
      return true
    } catch (error) {
      console.error(`Failed to copy ${src} to ${dest}:`, error)
      throw error
    }
  })

  ipcMain.handle('fs:readFile', async (event, filePath: string, encoding?: string) => {
    try {
      return await fs.readFile(filePath, encoding as any)
    } catch (error) {
      console.error(`Failed to read file ${filePath}:`, error)
      throw error
    }
  })

  ipcMain.handle('fs:writeFile', async (event, filePath: string, data: string | Uint8Array, encoding?: string) => {
    try {
      await fs.writeFile(filePath, data, encoding as any)
      return true
    } catch (error) {
      console.error(`Failed to write file ${filePath}:`, error)
      throw error
    }
  })

  ipcMain.handle('fs:appendFile', async (event, filePath: string, data: string | Uint8Array, options?: { encoding?: string }) => {
    try {
      await fs.appendFile(filePath, data, options as any)
      return true
    } catch (error) {
      console.error(`Failed to append file ${filePath}:`, error)
      throw error
    }
  })
}
