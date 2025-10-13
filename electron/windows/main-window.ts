// electron/windows/main-window.ts
import { app, BrowserWindow, shell } from 'electron'
import path from 'node:path'
import { existsSync } from 'node:fs'

/**
 * Creates the main application window with proper dev/prod environment handling
 * 
 * Critical Fixes preserved:
 * - FIX-005: Port 5174 for vite dev server
 * - Icon path resolution for dev/prod environments
 * - Proper preload and HTML path resolution
 */
export function createWindow(): BrowserWindow {
  const isDev = !app.isPackaged // Reliable dev/prod detection

  // Determine project root
  const rootPath = isDev ? process.cwd() : app.getAppPath()

  // Preload: dev from <root>/dist-electron, prod next to main.cjs
  const preloadPath = isDev
    ? path.join(rootPath, 'dist-electron', 'preload.js')
    : path.join(__dirname, 'preload.js')

  // Icon path definition - consistent with PATHS system but main process compatible
  let iconPath: string;
  if (isDev) {
    // Development: Use public/ folder from project root
    iconPath = path.join(rootPath, 'public', 'rawalite-logo.png');
  } else {
    // Production: Use assets/ from extraResources (defined in electron-builder.yml)
    iconPath = path.join(process.resourcesPath, 'assets', 'icon.png');
  }

  console.log('🎯 [DEBUG] App Icon Path:', iconPath);
  console.log('🎯 [DEBUG] Icon exists:', existsSync(iconPath));

  const win = new BrowserWindow({
    width: 1280,
    height: 900,
    icon: iconPath, // Set app icon
    webPreferences: {
      preload: preloadPath,
      contextIsolation: true,
      sandbox: true,
    },
  })

  if (isDev) {
    // Vite dev server - FIX-005: Port 5174
    win.loadURL('http://localhost:5174')
    win.webContents.openDevTools({ mode: 'detach' })
  } else {
    // Production version: HTML lies as extraResource directly in resources folder
    const htmlPath = path.join(process.resourcesPath, 'index.html')
    console.log('🔍 [DEBUG] HTML Path:', htmlPath)
    console.log('🔍 [DEBUG] Resources Path:', process.resourcesPath)
    console.log('🔍 [DEBUG] File exists:', existsSync(htmlPath))
    
    // Fallback check: sometimes it's app.asar.unpacked/resources/
    if (!existsSync(htmlPath)) {
      const fallbackPath = path.join(process.resourcesPath, '..', 'resources', 'index.html')
      console.log('🔍 [DEBUG] Fallback Path:', fallbackPath)
      console.log('🔍 [DEBUG] Fallback exists:', existsSync(fallbackPath))
      if (existsSync(fallbackPath)) {
        win.loadFile(fallbackPath)
        return win
      }
    }
    
    win.loadFile(htmlPath)
  }

  win.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url)
    return { action: 'deny' }
  })

  return win
}