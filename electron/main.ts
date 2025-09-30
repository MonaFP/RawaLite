// electron/main.ts
import { app, BrowserWindow, shell } from 'electron'
import path from 'node:path'
import { existsSync } from 'node:fs'

const isDev = !app.isPackaged            // zuverlässig für Dev/Prod

function createWindow() {
  // Projekt-Root ermitteln:
  const rootPath = isDev ? process.cwd() : app.getAppPath()

  // Preload: im Dev aus <root>/dist-electron, im Prod neben main.cjs
  const preloadPath = isDev
    ? path.join(rootPath, 'dist-electron', 'preload.js')
    : path.join(__dirname, 'preload.js')

  const win = new BrowserWindow({
    width: 1280,
    height: 900,
    webPreferences: {
      preload: preloadPath,
      contextIsolation: true,
      sandbox: true,
    },
  })

  if (isDev) {
    // Vite-Dev-Server
    win.loadURL('http://localhost:5173')
    // win.webContents.openDevTools({ mode: 'detach' })
  } else {
    // Produktive Version: HTML liegt als extraResource direkt im resources Ordner
    const htmlPath = path.join(process.resourcesPath, 'index.html')
    console.log('🔍 [DEBUG] HTML Path:', htmlPath)
    console.log('🔍 [DEBUG] Resources Path:', process.resourcesPath)
    console.log('🔍 [DEBUG] File exists:', existsSync(htmlPath))
    
    // Fallback check: manchmal ist es app.asar.unpacked/resources/
    if (!existsSync(htmlPath)) {
      const fallbackPath = path.join(process.resourcesPath, '..', 'resources', 'index.html')
      console.log('🔍 [DEBUG] Fallback Path:', fallbackPath)
      console.log('🔍 [DEBUG] Fallback exists:', existsSync(fallbackPath))
      if (existsSync(fallbackPath)) {
        win.loadFile(fallbackPath)
        return
      }
    }
    
    win.loadFile(htmlPath)
  }

  win.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url)
    return { action: 'deny' }
  })
}

// 🗂️ IPC Handler für Pfad-Management (Phase 2)
import { ipcMain } from 'electron'
import * as fs from 'node:fs/promises'

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

// 🗄️ Database IPC Handlers (Phase 4 - SQLite + better-sqlite3)
import * as Database from '../src/main/db/Database.js'
import * as MigrationService from '../src/main/db/MigrationService.js'
import * as BackupService from '../src/main/db/BackupService.js'

// Secure database query handler (read-only operations)
ipcMain.handle('db:query', async (event, sql: string, params?: any[]) => {
  try {
    const stmt = Database.prepare(sql)
    return stmt.all(params)
  } catch (error) {
    console.error(`Database query failed:`, error)
    throw error
  }
})

// Secure database exec handler (write operations)
ipcMain.handle('db:exec', async (event, sql: string, params?: any[]) => {
  try {
    return Database.exec(sql, params)
  } catch (error) {
    console.error(`Database exec failed:`, error)
    throw error
  }
})

// Transaction wrapper for multiple operations
ipcMain.handle('db:transaction', async (event, queries: Array<{ sql: string; params?: any[] }>) => {
  try {
    return Database.tx(() => {
      const results = []
      for (const query of queries) {
        const result = Database.exec(query.sql, query.params)
        results.push(result)
      }
      return results
    })
  } catch (error) {
    console.error(`Database transaction failed:`, error)
    throw error
  }
})

// 💾 Backup IPC Handlers
ipcMain.handle('backup:hot', async (event, backupPath?: string) => {
  try {
    return await BackupService.createHotBackup(backupPath)
  } catch (error) {
    console.error(`Hot backup failed:`, error)
    throw error
  }
})

ipcMain.handle('backup:vacuumInto', async (event, backupPath: string) => {
  try {
    return await BackupService.createVacuumBackup(backupPath)
  } catch (error) {
    console.error(`Vacuum backup failed:`, error)
    throw error
  }
})

ipcMain.handle('backup:integrityCheck', async (event, dbPath?: string) => {
  try {
    return BackupService.checkIntegrity()
  } catch (error) {
    console.error(`Integrity check failed:`, error)
    throw error
  }
})

ipcMain.handle('backup:restore', async (event, backupPath: string, targetPath?: string) => {
  try {
    return BackupService.restoreFromBackup(backupPath)
  } catch (error) {
    console.error(`Backup restore failed:`, error)
    throw error
  }
})

ipcMain.handle('backup:cleanup', async (event, backupDir: string, keepCount: number) => {
  try {
    return BackupService.cleanOldBackups(keepCount)
  } catch (error) {
    console.error(`Backup cleanup failed:`, error)
    throw error
  }
})

// Initialize database and run migrations when app is ready
app.whenReady().then(async () => {
  try {
    // Initialize database connection
    console.log('🗄️ Initializing database...')
    Database.getDb()
    
    // Run pending migrations
    console.log('🔄 Running database migrations...')
    await MigrationService.runAllMigrations()
    
    // Create main window
    createWindow()
    
    console.log('✅ Application ready with database initialized')
  } catch (error) {
    console.error('❌ Failed to initialize application:', error)
    app.quit()
  }
})
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit() })
app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow() })
