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
    backgroundColor: '#111111',
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
    const devUrl = 'http://localhost:5174/#/update-manager';
    console.log('[UpdateManagerWindow] Loading Dev URL:', devUrl);
    win.loadURL(devUrl);
  } else {
    const htmlPath = path.join(process.resourcesPath, 'index.html');
    console.log('[UpdateManagerWindow] Loading Prod HTML:', htmlPath);
    win.loadFile(htmlPath, { hash: 'update-manager' });
  }

  win.on('closed', () => { 
    console.log('[UpdateManagerWindow] Window closed');
    win = null; 
  });

  return win;
}