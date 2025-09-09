// Electron main for Variant B: React + Vite (Renderer) + sql.js in renderer
// Secure defaults: no nodeIntegration, contextIsolation true, sandbox true.
const { app, BrowserWindow, session, Menu } = require('electron');
const path = require('path');
const fs = require('fs');

const isDev = process.env.VITE_DEV_SERVER_URL || process.env.ELECTRON_START_URL || process.env.NODE_ENV === 'development';

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 900,
    show: false,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
      preload: path.join(__dirname, 'preload.js')
    }
  });

  win.once('ready-to-show', () => win.show());

  if (process.env.VITE_DEV_SERVER_URL) {
    win.loadURL(process.env.VITE_DEV_SERVER_URL);
  } else if (process.env.ELECTRON_START_URL) {
    win.loadURL(process.env.ELECTRON_START_URL);
  } else {
    // Production: serve Vite build from dist/index.html
    const indexPath = path.join(process.cwd(), 'dist', 'index.html');
    win.loadFile(indexPath);
  }
}

app.whenReady().then(async () => {
  // helpful for dev; harmless in prod
  try { await session.defaultSession.clearCache(); } catch {}
  Menu.setApplicationMenu(Menu.buildFromTemplate([
    { label: 'Datei', submenu: [{ role: 'quit', label: 'Beenden' }] },
    { label: 'Ansicht', submenu: [{ role: 'reload' }, { role: 'toggleDevTools' }]}
  ]));
  createWindow();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
