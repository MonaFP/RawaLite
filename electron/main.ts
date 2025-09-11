// electron/main.ts
import { app, BrowserWindow, shell, ipcMain } from 'electron'
import path from 'node:path'
import fs from 'node:fs'

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
    // Statisches HTML aus dist-Ordner
    win.loadFile(path.join(rootPath, 'dist', 'index.html'))
  }

  win.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url)
    return { action: 'deny' }
  })
}

// IPC Handler für App-Operationen
ipcMain.handle('app:restart', async () => {
  app.relaunch()
  app.exit()
})

ipcMain.handle('app:getVersion', async () => {
  return app.getVersion()
})

// IPC Handler für Shell-Operationen
ipcMain.handle('shell:openExternal', async (_, url: string) => {
  shell.openExternal(url)
})

// IPC Handler für Datenbank-Operationen
ipcMain.handle('db:load', async (): Promise<Uint8Array | null> => {
  try {
    const dbPath = path.join(app.getPath('userData'), 'database.sqlite')
    if (!fs.existsSync(dbPath)) {
      return null
    }
    return fs.readFileSync(dbPath)
  } catch (error) {
    console.error('Error loading database:', error)
    return null
  }
})

ipcMain.handle('db:save', async (_, data: Uint8Array): Promise<boolean> => {
  try {
    const userDataPath = app.getPath('userData')
    if (!fs.existsSync(userDataPath)) {
      fs.mkdirSync(userDataPath, { recursive: true })
    }
    
    const dbPath = path.join(userDataPath, 'database.sqlite')
    fs.writeFileSync(dbPath, data)
    return true
  } catch (error) {
    console.error('Error saving database:', error)
    return false
  }
})

app.whenReady().then(createWindow)
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit() })
app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow() })
