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
    // Statisches HTML aus dist-Ordner
    win.loadFile(path.join(rootPath, 'dist', 'index.html'))
  }

  win.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url)
    return { action: 'deny' }
  })
}

app.whenReady().then(createWindow)
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit() })
app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow() })
