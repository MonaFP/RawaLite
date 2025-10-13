// electron/windows/update-window.ts
import { app, BrowserWindow } from 'electron'
import path from 'node:path'

/**
 * Creates the Update Manager window with proper dev/prod environment handling
 * 
 * Features:
 * - Modal window with parent relationship
 * - Always on top for visibility during updates
 * - Non-resizable for consistent UI
 * - Same path resolution as main window for consistency
 */
export function createUpdateManagerWindow(): BrowserWindow {
  const isDev = !app.isPackaged // Reliable dev/prod detection

  // Determine project root
  const rootPath = isDev ? process.cwd() : app.getAppPath()

  // Preload: dev from <root>/dist-electron, prod next to main.cjs
  const preloadPath = isDev
    ? path.join(rootPath, 'dist-electron', 'preload.js')
    : path.join(__dirname, 'preload.js')

  // Icon path definition - consistent with main window
  let iconPath: string;
  if (isDev) {
    iconPath = path.join(rootPath, 'public', 'rawalite-logo.png');
  } else {
    iconPath = path.join(process.resourcesPath, 'assets', 'icon.png');
  }

  const updateWin = new BrowserWindow({
    width: 600,
    height: 700,
    icon: iconPath,
    webPreferences: {
      preload: preloadPath,
      contextIsolation: true,
      sandbox: true,
    },
    title: 'RawaLite Update Manager',
    resizable: false,
    alwaysOnTop: true,
    parent: BrowserWindow.getFocusedWindow() || undefined,
    modal: true
  })

  if (isDev) {
    // Vite dev server with Update Manager route
    updateWin.loadURL('http://localhost:5174/update-manager')
  } else {
    // Production: Load Update Manager Page
    const htmlPath = path.join(process.resourcesPath, 'index.html')
    updateWin.loadFile(htmlPath, { hash: 'update-manager' })
  }

  return updateWin
}