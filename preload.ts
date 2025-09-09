import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("api", {
  db: {
    load: (): Promise<Uint8Array> => ipcRenderer.invoke("db:load"),
    save: (bytes: Uint8Array): Promise<void> => ipcRenderer.invoke("db:save", bytes)
  },
  backup: {
    create: (): Promise<string> => ipcRenderer.invoke("backup:create"),
    restore: (): Promise<boolean> => ipcRenderer.invoke("backup:restore")
  },
  pdf: {
    generate: (content: string, options: { footer: string }): Promise<Buffer> => ipcRenderer.invoke("pdf:generate", content, options)
  }
});

declare global {
  interface Window {
    api: {
      db: { load(): Promise<Uint8Array>; save(bytes: Uint8Array): Promise<void> };
      backup: { create(): Promise<string>; restore(): Promise<boolean> };
      pdf: { generate(content: string, options: { footer: string }): Promise<Buffer> };
    };
  }
}