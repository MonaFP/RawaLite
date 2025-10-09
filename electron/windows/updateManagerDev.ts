/**
 * UpdateManager Development Window
 * Standalone window für isoliertes UpdateManager Testing ohne full RawaLite context
 */

import { BrowserWindow, app } from 'electron';
import * as path from 'node:path';

let devWin: BrowserWindow | null = null;

export function createUpdateManagerDevWindow(): BrowserWindow {
  if (devWin && !devWin.isDestroyed()) { 
    devWin.focus(); 
    return devWin; 
  }

  const isDev = !app.isPackaged;
  const rootPath = isDev ? process.cwd() : app.getAppPath();

  const preloadPath = isDev
    ? path.join(rootPath, 'dist-electron', 'preload.js')
    : path.join(__dirname, 'preload.js');

  let iconPath: string;
  if (isDev) {
    iconPath = path.join(rootPath, 'public', 'rawalite-logo.png');
  } else {
    iconPath = path.join(process.resourcesPath, 'assets', 'icon.png');
  }

  console.log('[UpdateManagerDevWindow] Creating development window with preload:', preloadPath);

  devWin = new BrowserWindow({
    width: 800,
    height: 600,
    show: true,
    resizable: true, // Für Development debugging
    minimizable: true,
    maximizable: true,
    title: 'RawaLite UpdateManager - DEVELOPMENT',
    backgroundColor: 'transparent', // Theme control
    autoHideMenuBar: false, // DevTools access
    icon: iconPath,
    webPreferences: {
      preload: preloadPath,
      contextIsolation: true,
      sandbox: true,
      nodeIntegration: false,
      devTools: true, // Enable DevTools for development
    },
  });

  // Development-specific features
  if (isDev) {
    // Open DevTools by default
    devWin.webContents.openDevTools({ mode: 'detach' });
    
    // Load production HTML with UpdateManager route
    const htmlPath = path.join(rootPath, 'dist-web', 'index.html');
    console.log('[UpdateManagerDevWindow] Loading Production HTML:', htmlPath);
    
    if (require('fs').existsSync(htmlPath)) {
      devWin.loadFile(htmlPath, { hash: 'update-manager' });
    } else {
      console.error('[UpdateManagerDevWindow] No production build found. Run: pnpm run build');
      // Show error page
      devWin.loadURL('data:text/html;charset=utf-8,' + encodeURIComponent(`
        <html>
          <body style="font-family: Arial; padding: 20px; background: #f5f5f5;">
            <h2>🚨 UpdateManager Development Error</h2>
            <p>Production build not found. Please run:</p>
            <code style="background: #e0e0e0; padding: 10px; display: block;">pnpm run build</code>
          </body>
        </html>
      `));
    }
  } else {
    // Production fallback
    const htmlPath = path.join(process.resourcesPath, 'index.html');
    console.log('[UpdateManagerDevWindow] Loading Prod HTML:', htmlPath);
    devWin.loadFile(htmlPath, { hash: 'update-manager' });
  }

  // Development debugging
  devWin.webContents.once('dom-ready', () => {
    devWin?.webContents.executeJavaScript(`
      console.log('🛠️ UpdateManager Development Window Ready');
      console.log('CSS Variables Test:', {
        accent: getComputedStyle(document.documentElement).getPropertyValue('--accent'),
        textPrimary: getComputedStyle(document.documentElement).getPropertyValue('--text-primary'),
        mainBg: getComputedStyle(document.documentElement).getPropertyValue('--main-bg')
      });
      console.log('IPC Bridge Test:', {
        rawaliteAvailable: !!window.rawalite,
        updatesAvailable: !!window.rawalite?.updates,
        getProgressStatusAvailable: !!window.rawalite?.updates?.getProgressStatus
      });
    `);
  });

  devWin.on('closed', () => { 
    console.log('[UpdateManagerDevWindow] Development window closed');
    devWin = null; 
  });

  return devWin;
}

/**
 * Fokussiert das Development Window oder erstellt es
 */
export function focusUpdateManagerDevWindow(): void {
  if (devWin && !devWin.isDestroyed()) {
    devWin.focus();
  } else {
    createUpdateManagerDevWindow();
  }
}

/**
 * Schließt das Development Window
 */
export function closeUpdateManagerDevWindow(): void {
  if (devWin && !devWin.isDestroyed()) {
    devWin.close();
  }
}