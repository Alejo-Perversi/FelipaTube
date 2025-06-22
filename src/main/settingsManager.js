// src/main/settingsManager.js

import { app, ipcMain } from 'electron'
import path from 'path'
import fs from 'fs'

const userDataPath = app.getPath('userData')
const configPath = path.join(userDataPath, 'config_expresiones.json')

const DEFAULTS = {
  follow: 'Follower',
  subscription: 'Subscription',
  bits: 'Bits',
  raid: 'Default',
  chatMessage: 'Payaso'
}

function getConfig() {
  try {
    if (fs.existsSync(configPath)) {
      return JSON.parse(fs.readFileSync(configPath, 'utf-8'))
    } else {
      fs.writeFileSync(configPath, JSON.stringify(DEFAULTS, null, 2))
      return DEFAULTS
    }
  } catch (error) {
    console.error('Error al leer la configuración de expresiones:', error)
    return DEFAULTS
  }
}

function saveConfig(config) {
  try {
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2))
  } catch (error) {
    console.error('Error al guardar la configuración de expresiones:', error)
  }
}

// Esta función registra los "listeners" para que el frontend pueda llamar
export function registerSettingsHandlers() {
  ipcMain.handle('load-expression-config', () => {
    return getConfig()
  })

  ipcMain.handle('save-expression-config', (event, config) => {
    saveConfig(config)
  })
}