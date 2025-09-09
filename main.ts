import { app, BrowserWindow, ipcMain, session, dialog } from "electron";
import path from "path";
import fs from "fs/promises";
import { fileURLToPath } from "url";
import archiver from "archiver"; // Für ZIP-Backups
import crypto from "crypto"; // Für optional AES-GCM in Backups

const __dirname = path.dirname(fileURLToPath(import.meta.url));

let mainWindow: BrowserWindow | null = null;

function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    show: false,
    icon: path.join(__dirname, "icons", "icon.ico"),
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      sandbox: true,
      nodeIntegration: false
    }
  });
  const url = process.env.VITE_DEV_SERVER_URL || `file://${path.join(__dirname, "../apps/web/dist/index.html")}`;
  mainWindow.loadURL(url);
  mainWindow.once("ready-to-show", () => mainWindow?.show());
  // CSP enforcen
  mainWindow.webContents.session.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        "Content-Security-Policy": ["default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline';"] // Kein inline-script, aber 'unsafe-inline' für styles falls nötig (besser hash)
      }
    });
  });
}

app.whenReady().then(async () => {
  await session.defaultSession.clearCache();
  createMainWindow();
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

// IPC für DB (SQLite Bytes)
const appDataPath = path.join(app.getPath("userData"), "RaWaLite");
const dbPath = path.join(appDataPath, "rawalite.db");

ipcMain.handle("db:load", async () => {
  try {
    await fs.mkdir(appDataPath, { recursive: true });
    return await fs.readFile(dbPath);
  } catch {
    return new Uint8Array();
  }
});

ipcMain.handle("db:save", async (_e, bytes: Uint8Array) => {
  await fs.mkdir(appDataPath, { recursive: true });
  await fs.writeFile(dbPath, bytes);
});

// IPC für Backups (ZIP, optional verschlüsselt)
ipcMain.handle("backup:create", async () => {
  const backupPath = path.join(appDataPath, `backup_${Date.now()}.zip`);
  const output = fs.createWriteStream(backupPath);
  const archive = archiver("zip", { zlib: { level: 9 } });
  archive.pipe(output);
  archive.file(dbPath, { name: "rawalite.db" });
  // Füge PDFs/JSON hinzu, wenn vorhanden (Stub)
  await archive.finalize();
  return backupPath;
});

ipcMain.handle("backup:restore", async () => {
  const { filePaths } = await dialog.showOpenDialog({ properties: ['openFile'], filters: [{ name: 'ZIP', extensions: ['zip'] }] });
  if (filePaths[0]) {
    // Extract Logic (using adm-zip or similar, hier Stub)
    // fs.copyFile(extractedDB, dbPath);
    return true;
  }
  return false;
});

// PDF Generation via printToPDF
ipcMain.handle("pdf:generate", async (_e, content: string, options: { footer: string }) => {
  const tempWindow = new BrowserWindow({ show: false });
  await tempWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(content)}`);
  const data = await tempWindow.webContents.printToPDF({
    pageSize: "A4",
    printBackground: true,
    generateDocumentOutline: true,
    footerTemplate: options.footer // Mit Seitenzahlen, Pflichtangaben
  });
  tempWindow.close();
  return data;
});