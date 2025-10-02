// electron/main.ts
import { app, BrowserWindow, shell, ipcMain } from 'electron'
import path from 'node:path'
import { existsSync } from 'node:fs'
import { UpdateManagerService } from '../src/main/services/UpdateManagerService'
// 🗄️ Database imports with correct named exports syntax
import { getDb, prepare, exec, tx } from '../src/main/db/Database'
import { runAllMigrations } from '../src/main/db/MigrationService'
import { createHotBackup, createVacuumBackup, checkIntegrity, restoreFromBackup, cleanOldBackups } from '../src/main/db/BackupService'

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
    win.webContents.openDevTools({ mode: 'detach' })
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
// Database imports moved to top of file for proper ES Module handling

// Secure database query handler (read-only operations)
ipcMain.handle('db:query', async (event, sql: string, params?: any[]) => {
  try {
    const stmt = prepare(sql)
    return params ? stmt.all(...params) : stmt.all()
  } catch (error) {
    console.error(`Database query failed:`, error)
    throw error
  }
})

// Secure database exec handler (write operations)
ipcMain.handle('db:exec', async (event, sql: string, params?: any[]) => {
  try {
    return exec(sql, params)
  } catch (error) {
    console.error(`Database exec failed:`, error)
    throw error
  }
})

// Transaction wrapper for multiple operations
ipcMain.handle('db:transaction', async (event, queries: Array<{ sql: string; params?: any[] }>) => {
  try {
    return tx(() => {
      const results: any[] = []
      for (const query of queries) {
        const result = exec(query.sql, query.params)
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
    return await createHotBackup(backupPath)
  } catch (error) {
    console.error(`Hot backup failed:`, error)
    throw error
  }
})

ipcMain.handle('backup:vacuumInto', async (event, backupPath: string) => {
  try {
    return await createVacuumBackup(backupPath)
  } catch (error) {
    console.error(`Vacuum backup failed:`, error)
    throw error
  }
})

ipcMain.handle('backup:integrityCheck', async (event, dbPath?: string) => {
  try {
    return checkIntegrity()
  } catch (error) {
    console.error(`Integrity check failed:`, error)
    throw error
  }
})

ipcMain.handle('backup:restore', async (event, backupPath: string, targetPath?: string) => {
  try {
    return restoreFromBackup(backupPath)
  } catch (error) {
    console.error(`Backup restore failed:`, error)
    throw error
  }
})

ipcMain.handle('backup:cleanup', async (event, backupDir: string, keepCount: number) => {
  try {
    return cleanOldBackups(keepCount)
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
    getDb()
    
    // Run pending migrations
    console.log('🔄 Running database migrations...')
    await runAllMigrations()
    
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

// === UPDATE SYSTEM INTEGRATION ===
const updateManager = new UpdateManagerService()

// Update IPC Handlers
ipcMain.handle('updates:check', async () => {
  return await updateManager.checkForUpdates()
})

ipcMain.handle('updates:getCurrentVersion', async () => {
  // Use app.getVersion() instead of private method
  return app.getVersion()
})

ipcMain.handle('updates:startDownload', async (event, updateInfo) => {
  return await updateManager.startDownload(updateInfo)
})

ipcMain.handle('updates:cancelDownload', async () => {
  return await updateManager.cancelDownload()
})

ipcMain.handle('updates:installUpdate', async (event, filePath) => {
  return await updateManager.installUpdate(filePath)
})

ipcMain.handle('updates:restartApp', async () => {
  return await updateManager.restartApplication()
})

ipcMain.handle('updates:getConfig', async () => {
  return updateManager.getConfig()
})

ipcMain.handle('updates:setConfig', async (event, config) => {
  return updateManager.setConfig(config)
})

ipcMain.handle('updates:openDownloadFolder', async () => {
  // Simple implementation - open downloads folder
  shell.showItemInFolder(app.getPath('downloads'))
})

ipcMain.handle('updates:verifyFile', async (event, filePath) => {
  // Basic file existence check
  try {
    await require('fs').promises.access(filePath)
    return true
  } catch {
    return false
  }
})

// 🔢 Numbering Circles IPC Handlers
ipcMain.handle('nummernkreis:getAll', async () => {
  try {
    // Direct database access instead of DbClient service
    const db = getDb()
    const query = `
      SELECT id, name, prefix, digits, current, resetMode, lastResetYear 
      FROM numbering_circles 
      ORDER BY name
    `
    const circles = db.prepare(query).all()
    console.log('🔍 [DEBUG] Main Process - Found circles:', circles.length);
    console.log('🔍 [DEBUG] Main Process - Circle data:', circles);
    return { success: true, data: circles }
  } catch (error) {
    console.error('Error getting numbering circles:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
})

ipcMain.handle('nummernkreis:update', async (event, id: string, circle: any) => {
  try {
    // Direct database access instead of DbClient service
    const db = getDb()
    const updateQuery = `
      UPDATE numbering_circles 
      SET name = ?, prefix = ?, digits = ?, current = ?, resetMode = ?, updated_at = datetime('now')
      WHERE id = ?
    `
    db.prepare(updateQuery).run(circle.name, circle.prefix, circle.digits, circle.current, circle.resetMode, id)
    return { success: true }
  } catch (error) {
    console.error('Error updating numbering circle:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
})

ipcMain.handle('nummernkreis:getNext', async (event, circleId: string) => {
  try {
    // Direct database access instead of DbClient service
    const db = getDb()
    
    // Get current circle
    const selectQuery = `
      SELECT id, prefix, digits, current, resetMode, lastResetYear 
      FROM numbering_circles 
      WHERE id = ?
    `
    const circle = db.prepare(selectQuery).get(circleId) as any
    
    if (!circle) {
      throw new Error(`Nummernkreis '${circleId}' nicht gefunden`)
    }

    const currentYear = new Date().getFullYear()
    let nextNumber = circle.current + 1

    if (circle.resetMode === 'yearly') {
      if (!circle.lastResetYear || circle.lastResetYear !== currentYear) {
        nextNumber = 1
      }
    }

    // Update circle
    const updateQuery = `
      UPDATE numbering_circles 
      SET current = ?, last_reset_year = ?, updated_at = datetime('now')
      WHERE id = ?
    `
    db.prepare(updateQuery).run(
      nextNumber,
      circle.resetMode === 'yearly' ? currentYear : circle.lastResetYear,
      circleId
    )

    const paddedNumber = nextNumber.toString().padStart(circle.digits, '0')
    const fullNumber = `${circle.prefix}${paddedNumber}`
    
    return { success: true, data: fullNumber }
  } catch (error) {
    console.error('Error getting next number:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
})
