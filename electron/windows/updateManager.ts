import { BrowserWindow, app } from 'electron';
import * as path from 'node:path';
import { existsSync } from 'node:fs';

let win: BrowserWindow | null = null;

export function getOrCreateUpdateManagerWindow(): BrowserWindow {
  if (win && !win.isDestroyed()) { 
    win.focus(); 
    return win; 
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

  console.log('[UpdateManagerWindow] Creating window with preload:', preloadPath);

  win = new BrowserWindow({
    width: 720,
    height: 520,
    show: true,
    resizable: false,
    minimizable: false,
    maximizable: false,
    title: 'RawaLite Update Manager',
    backgroundColor: 'transparent', // ✅ VISUAL FIX: Allow CSS theme control instead of hardcoded #111111
    autoHideMenuBar: true,
    icon: iconPath,
    webPreferences: {
      preload: preloadPath,
      contextIsolation: true,
      sandbox: true,
      nodeIntegration: false,
    },
  });

  if (isDev) {
    // In Development: Load production HTML instead of localhost (Vite may not be running)
    const htmlPath = path.join(rootPath, 'dist-web', 'index.html');
    console.log('[UpdateManagerWindow] Loading Production HTML in Dev:', htmlPath);
    
    if (existsSync(htmlPath)) {
      win.loadFile(htmlPath, { hash: 'update-manager' });
      // Enable DevTools for debugging in development
      win.webContents.openDevTools({ mode: 'detach' });
    } else {
      console.error('[UpdateManagerWindow] No production build found. Fallback to localhost');
      const devUrl = 'http://localhost:5174/#/update-manager';
      win.loadURL(devUrl);
    }
  } else {
    const htmlPath = path.join(process.resourcesPath, 'index.html');
    console.log('[UpdateManagerWindow] Loading Prod HTML:', htmlPath);
    win.loadFile(htmlPath, { hash: 'update-manager' });
  }

  win.on('closed', () => { 
    console.log('[UpdateManagerWindow] Window closed');
    win = null; 
  });

  // Development debugging
  if (isDev) {
    win.webContents.once('dom-ready', () => {
      win?.webContents.executeJavaScript(`
        console.log('🛠️ UpdateManager Window Ready (Development Mode)');
        console.log('IPC Bridge Test:', {
          rawaliteAvailable: !!window.rawalite,
          updatesAvailable: !!window.rawalite?.updates,
          getProgressStatusAvailable: !!window.rawalite?.updates?.getProgressStatus
        });
        console.log('CSS Variables Test:', {
          accent: getComputedStyle(document.documentElement).getPropertyValue('--accent'),
          textPrimary: getComputedStyle(document.documentElement).getPropertyValue('--text-primary'),
          mainBg: getComputedStyle(document.documentElement).getPropertyValue('--main-bg')
        });
        
        // Test basic IPC call
        if (window.rawalite?.updates?.getCurrentVersion) {
          window.rawalite.updates.getCurrentVersion().then(version => {
            console.log('✅ IPC Test Success - Current Version:', version);
          }).catch(err => {
            console.error('❌ IPC Test Failed:', err);
          });
        }
      `);
    });
  }

  return win;
}