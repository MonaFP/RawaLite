import { contextBridge, ipcRenderer } from 'electron';
/**
 * Einheitliche Bridge:
 * Ab jetzt nur noch window.rawalitelite.* im Renderer verwenden.
 * Die Methoden sind Platzhalter, damit der Renderer nicht crasht –
 * du kannst sie später mit echter Funktionalität (DB/Backup/PDF) füllen.
 */
contextBridge.exposeInMainWorld('rawalite', {
    log: (msg) => ipcRenderer.invoke('log', msg),
    db: {
        load: async () => ({}),
        save: async (_data) => true
    },
    backup: {
        create: async () => false,
        restore: async (_file) => false
    },
    pdf: {
        generate: async (_data) => false
    }
});
//# sourceMappingURL=preload.js.map