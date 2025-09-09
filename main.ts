// main.ts
import { app, BrowserWindow, Menu, MenuItemConstructorOptions, dialog, ipcMain, session } from 'electron'
import path from 'node:path'
import fs from 'fs-extra'
import os from 'node:os'
import { fileURLToPath } from 'node:url'

// __dirname in ESM nachrüsten
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

let mainWindow: BrowserWindow | null = null
let splashWindow: BrowserWindow | null = null

const APP_DATA_PATH = path.join(os.homedir(), 'AppData', 'Roaming', 'RaWaLite')
const LOG_PATH = path.join(APP_DATA_PATH, 'rawalite.log')

function log(message: string, level: 'INFO' | 'ERROR' = 'INFO') {
  const ts = new Date().toISOString()
  const line = `[${ts}] [${level}] ${message}\n`
  try {
    fs.ensureDirSync(APP_DATA_PATH)
    fs.appendFileSync(LOG_PATH, line)
  } catch {}
  console.log(line.trim())
}

// einfacher, dateiloser Splash (keine Pfad-Probleme)
function createSplash() {
  splashWindow = new BrowserWindow({
    width: 420,
    height: 300,
    frame: false,
    show: true,
    alwaysOnTop: true,
    transparent: true
  })

  const html = `
    <!doctype html><html><head><meta charset="utf-8">
    <style>
      html,body{height:100%;margin:0}
      body{display:flex;align-items:center;justify-content:center;
           background:linear-gradient(135deg,#2c3e50 0%,#3498db 100%);
           font-family:Segoe UI,Arial,sans-serif;color:#fff}
      .box{text-align:center;animation:fade 0.9s ease}
      .logo{width:80px;height:80px;border-radius:15px;background:#fff;
            color:#2c3e50;display:flex;align-items:center;justify-content:center;
            margin:0 auto 14px;font-weight:700;font-size:32px;
            box-shadow:0 10px 30px rgba(0,0,0,.3)}
      h1{margin:8px 0 2px;font-weight:300}
      .sub{opacity:.85}
      @keyframes fade{from{opacity:0}to{opacity:1}}
    </style></head>
    <body><div class="box"><div class="logo">RW</div>
      <h1>RaWaLite</h1><div class="sub">Rechnungs- & Angebotsverwaltung</div>
    </div></body></html>`

  splashWindow.loadURL('data:text/html;charset=utf-8,' + encodeURIComponent(html))
  splashWindow.on('closed', () => (splashWindow = null))
}

async function createMain() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  })

  // --- Lade-Quelle bestimmen: bevorzugt dist/, sonst Dev-Server ---
  const devUrl = process.env.VITE_DEV_SERVER_URL || 'http://localhost:5173'
  const distIndex = path.join(__dirname, '../dist/index.html')
  const hasDist = fs.existsSync(distIndex)
  const forceDev = process.env.FORCE_DEV === 'true'

  // vor dem Laden: Event-Handler setzen
  mainWindow.webContents.once('did-finish-load', () => {
    // sicherer Übergang: Splash zu, Main zeigen
    splashWindow?.close()
    splashWindow = null
    if (!mainWindow?.isVisible()) mainWindow?.show()
    log('did-finish-load -> main shown')
  })

  mainWindow.webContents.on('did-fail-load', (_e, code, desc, url) => {
    log(`did-fail-load (${code}) ${desc} @ ${url}`, 'ERROR')
    // Splash nicht festhängen lassen:
    splashWindow?.close()
    if (!mainWindow?.isVisible()) mainWindow?.show()
  })

  // Fallback, falls nichts feuert (z. B. durch blockierendes Script):
  setTimeout(() => {
    if (!mainWindow?.isVisible()) {
      splashWindow?.close()
      mainWindow?.show()
      log('fallback show after 2s')
    }
  }, 2000)

  if (hasDist && !forceDev) {
    await mainWindow.loadFile(distIndex)
    log(`Loaded PROD file: ${distIndex}`)
  } else {
    await mainWindow.loadURL(devUrl)
    log(`Loaded DEV URL: ${devUrl}`)
    mainWindow.webContents.openDevTools({ mode: 'detach' })
  }


  const template: MenuItemConstructorOptions[] = [
    { label: 'Datei', submenu: [{ role: 'quit', label: 'Beenden' }] },
    {
      label: 'Hilfe',
      submenu: [
        {
          label: 'Über RaWaLite',
          click: () => {
            if (!mainWindow) return
            dialog.showMessageBox(mainWindow, {
              type: 'info',
              title: 'Über RaWaLite',
              message: 'RaWaLite',
              detail: 'Rechnungs- und Angebotsverwaltung'
            })
          }
        }
      ]
    },
    {
  label: 'Ansicht',
  submenu: [
    { role: 'reload', label: 'Neu laden' },
    { role: 'forceReload', label: 'Neu laden (erzwingen)' },
    { role: 'toggleDevTools', label: 'Entwicklertools umschalten' }
  ]
}
  ]
  Menu.setApplicationMenu(Menu.buildFromTemplate(template))
}

/** IPC minimal */
ipcMain.handle('log', (_e, msg: string) => log(msg))

// unhandled rejections sauber loggen (unterdrückt Warnung)
process.on('unhandledRejection', (reason) => log(`unhandledRejection: ${String(reason)}`, 'ERROR'))

app.commandLine.appendSwitch('--disable-http-cache')
app.commandLine.appendSwitch('--disable-gpu-cache')

app.whenReady().then(async () => {
  await fs.ensureDir(APP_DATA_PATH)
  await session.defaultSession.clearCache().catch(() => {})
  log('App started')
  createSplash()
  setTimeout(() => void createMain(), 900)
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
app.on('activate', () => {
  if (!mainWindow) void createMain()
})
