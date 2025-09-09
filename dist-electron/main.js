// electron/main.ts
import { app, BrowserWindow } from "electron";
import path from "path";
var isDev = !app.isPackaged;
async function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      contextIsolation: true,
      // sicher
      nodeIntegration: false
      // sicher
      // kein preload!
    }
  });
  if (isDev) {
    await win.loadURL("http://localhost:5173/");
  } else {
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
//# sourceMappingURL=main.js.map