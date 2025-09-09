// electron/preload.ts
import { contextBridge, ipcRenderer } from "electron";
contextBridge.exposeInMainWorld("rawalite", {
  db: {
    load: () => ipcRenderer.invoke("db:load"),
    save: (data) => ipcRenderer.invoke("db:save", data)
  }
});
//# sourceMappingURL=preload.js.map