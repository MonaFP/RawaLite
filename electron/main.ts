// electron/main.ts
import { app, BrowserWindow, shell } from 'electron'
import path from 'node:path'

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
    // Produktive Version: HTML liegt als extraResource neben dem resources Ordner
    const htmlPath = path.join(process.resourcesPath, 'index.html')
    win.loadFile(htmlPath)
  }

  win.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url)
    return { action: 'deny' }
  })
}

// 🗂️ IPC Handler für Pfad-Management (Phase 2)
import { ipcMain } from 'electron'

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

app.whenReady().then(createWindow)
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit() })
app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow() })
