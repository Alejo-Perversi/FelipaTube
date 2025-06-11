import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

// Aumentar el límite de listeners para evitar el warning
ipcRenderer.setMaxListeners(20)

// Custom APIs for renderer
const api = {
  twitch: {
    initiateAuth: () => ipcRenderer.invoke('twitch:initiateAuth'),
    connect: () => ipcRenderer.invoke('twitch:connect'),
    disconnect: () => ipcRenderer.invoke('twitch:disconnect'),
    onChatMessage: (callback) => ipcRenderer.on('twitch:chatMessage', (_, data) => callback(data)),
    onSubscription: (callback) =>
      ipcRenderer.on('twitch:subscription', (_, data) => callback(data)),
    onBits: (callback) => ipcRenderer.on('twitch:bits', (_, data) => callback(data)),
    onFollow: (callback) => ipcRenderer.on('twitch:follow', (_, data) => callback(data)),
    removeEventSub: (type) => ipcRenderer.invoke('twitch:removeEventSub', type),
  }
}

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  window.electron = electronAPI
  window.api = api
}
