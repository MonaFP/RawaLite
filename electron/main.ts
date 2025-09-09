// electron/main.ts
import { app, BrowserWindow } from "electron";
import path from "node:path";

const isDev = !app.isPackaged;

async function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      contextIsolation: true,   // sicher
      nodeIntegration: false,   // sicher
      // kein preload!
    },
  });

  if (isDev) {
    await win.loadURL("http://localhost:5173/");
    // optional: DevTools
    // win.webContents.openDevTools({ mode: "detach" });
  } else {
    // beim Build: auf dein index.html zeigen
    await win.loadFile(path.join(__dirname, "..", "index.html"));
  }
}

app.whenReady().then(createWindow);

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
