// Minimal preload (no Node APIs exposed by default)
const { contextBridge } = require('electron');
contextBridge.exposeInMainWorld('rw', {
  version: '1.0.0'
});
