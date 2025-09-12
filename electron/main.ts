// electron/main.ts
import { app, BrowserWindow, shell, ipcMain, Menu } from 'electron'
import path from 'node:path'
import fs from 'node:fs'

const isDev = !app.isPackaged            // zuverlässig für Dev/Prod

function createMenu() {
  const template = [
    {
      label: 'Datei',
      submenu: [
        {
          label: 'Beenden',
          accelerator: process.platform === 'darwin' ? 'Cmd+Q' : 'Ctrl+Q',
          click: () => {
            app.quit()
          }
        }
      ]
    },
    {
      label: 'Bearbeiten',
      submenu: [
        { label: 'Rückgängig', accelerator: 'CmdOrCtrl+Z', role: 'undo' },
        { label: 'Wiederholen', accelerator: 'Shift+CmdOrCtrl+Z', role: 'redo' },
        { type: 'separator' },
        { label: 'Ausschneiden', accelerator: 'CmdOrCtrl+X', role: 'cut' },
        { label: 'Kopieren', accelerator: 'CmdOrCtrl+C', role: 'copy' },
        { label: 'Einfügen', accelerator: 'CmdOrCtrl+V', role: 'paste' },
        { label: 'Alles auswählen', accelerator: 'CmdOrCtrl+A', role: 'selectall' }
      ]
    },
    {
      label: 'Ansicht',
      submenu: [
        { label: 'Vollbild', accelerator: 'F11', role: 'togglefullscreen' },
        ...(isDev ? [
          { type: 'separator' },
          { label: 'Entwicklertools', accelerator: 'F12', role: 'toggledevtools' },
          { label: 'Neu laden', accelerator: 'CmdOrCtrl+R', role: 'reload' },
          { label: 'Erzwungenes Neu laden', accelerator: 'CmdOrCtrl+Shift+R', role: 'forceReload' }
        ] : [])
      ]
    },
    {
      label: 'Hilfe',
      submenu: [
        {
          label: 'Über RawaLite',
          click: () => {
            shell.openExternal('https://github.com/MonaFP/RawaLite')
          }
        },
        {
          label: 'Dokumentation',
          click: () => {
            shell.openExternal('https://github.com/MonaFP/RawaLite#readme')
          }
        },
        {
          label: 'Support & Feedback',
          click: () => {
            shell.openExternal('https://github.com/MonaFP/RawaLite/issues')
          }
        }
      ]
    }
  ]

  const menu = Menu.buildFromTemplate(template as any)
  Menu.setApplicationMenu(menu)
}

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

app.whenReady().then(() => {
  createMenu()
  createWindow()
})
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit() })
app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow() })
