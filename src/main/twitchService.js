import tmi from 'tmi.js'
import { ipcMain, BrowserWindow } from 'electron'
import { TWITCH_CONFIG } from './config'
import axios from 'axios'
// import { TWITCH_CONFIG } from './config'

class TwitchService {
  constructor() {
    this.client = null
    this.isConnected = false
    this.channel = ''
    this.accessToken = null
    this.refreshToken = null
    this.userInfo = null
  }

  async initiateAuth() {
    console.log('Iniciando proceso de autenticacion...')
    const authWindow = new BrowserWindow({
      width: 800,
      height: 600,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true
      },
      show: false
    })

    // Limpiar todas las cookies y datos de sesión antes de iniciar la autenticación
    //await authWindow.webContents.session.clearStorageData({
    //  storages: ['cookies', 'localStorage', 'sessionStorage']
    //})

    const scopes = TWITCH_CONFIG.scopes.join(' ')
    const authUrl = `https://id.twitch.tv/oauth2/authorize?client_id=${TWITCH_CONFIG.clientId}&redirect_uri=${encodeURIComponent(TWITCH_CONFIG.redirectUri)}&response_type=code&scope=${encodeURIComponent(scopes)}`

    // console.log('URL de autenticacióo:', authUrl)

    return new Promise((resolve, reject) => {
      let isResolved = false

      // Mostrar la ventana cuando esté lista
      authWindow.once('ready-to-show', () => {
        authWindow.show()
      })

      // Manejar la navegación
      authWindow.webContents.on('will-navigate', async (event, url) => {
        console.log('Navegando a:', url)
        if (url.startsWith(TWITCH_CONFIG.redirectUri)) {
          const code = new URL(url).searchParams.get('code')
          if (code) {
            console.log('Código de autorización recibido')
            try {
              const tokenResponse = await this.exchangeCodeForToken(code)
              this.accessToken = tokenResponse.access_token
              this.refreshToken = tokenResponse.refresh_token

              console.log('Tokens obtenidos exitosamente')

              // Obtener información del usuario
              await this.fetchUserInfo()
              console.log('Información del usuario obtenida:', this.userInfo.login)

              isResolved = true
              authWindow.close()
              resolve({
                accessToken: this.accessToken,
                refreshToken: this.refreshToken,
                userInfo: this.userInfo
              })
            } catch (error) {
              console.error('Error al intercambiar el código por tokens:', error)
              isResolved = true
              authWindow.close()
              reject(error)
            }
          }
        }
      })

      // Manejar errores de carga
      authWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
        console.log('did-fail-load disparado:', { errorCode, errorDescription, event })
        if (errorCode === -3) {
          // ERR_ABORTED
          if (!isResolved) {
            isResolved = true
            resolve({ cancelled: true })
          }
          return
        }

        console.error('Error al cargar la pagina:', errorCode, errorDescription)
        if (!isResolved) {
          isResolved = true
          authWindow.close()
          reject(new Error(`Error al cargar la pagina: ${errorDescription}`))
        }
      })

      // Agregar listener para did-start-loading
      authWindow.webContents.on('did-start-loading', () => {
        console.log('Comenzando a cargar la pagina...')
      })

      // Agregar listener para did-finish-load
      authWindow.webContents.on('did-finish-load', () => {
        console.log('Pagina cargada exitosamente')
      })

      // Manejar el cierre de la ventana
      authWindow.on('closed', () => {
        console.log('Ventana de autenticacion cerrada')
        if (!isResolved) {
          isResolved = true
          resolve({ cancelled: true })
        }
      })

      // Cargar la URL de autenticación
      console.log('Intentando cargar URL:', authUrl)
      authWindow.loadURL(authUrl).catch((error) => {
        // Error loadURL
        console.error('Error en loadURL:', { error })
        if (error.code === 'ERR_FAILED' || error.errno === -2) {
          if (!isResolved) {
            isResolved = true
            resolve({ cancelled: true })
            // reject(new Error('La autenticacion fue cancelada'))
          }
          return
        }

        if (!isResolved) {
          isResolved = true
          authWindow.close()
          reject(error)
        }
      })
    })
  }

  async exchangeCodeForToken(code) {
    const response = await axios.post('https://id.twitch.tv/oauth2/token', null, {
      params: {
        client_id: TWITCH_CONFIG.clientId,
        client_secret: TWITCH_CONFIG.clientSecret,
        code,
        grant_type: 'authorization_code',
        redirect_uri: TWITCH_CONFIG.redirectUri
      }
    })
    return response.data
  }

  async refreshAccessToken() {
    if (!this.refreshToken) {
      throw new Error('No refresh token available')
    }

    const response = await axios.post('https://id.twitch.tv/oauth2/token', null, {
      params: {
        client_id: TWITCH_CONFIG.clientId,
        client_secret: TWITCH_CONFIG.clientSecret,
        grant_type: 'refresh_token',
        refresh_token: this.refreshToken
      }
    })

    this.accessToken = response.data.access_token
    this.refreshToken = response.data.refresh_token
    return this.accessToken
  }

  async fetchUserInfo() {
    const response = await axios.get('https://api.twitch.tv/helix/users', {
      headers: {
        'Client-ID': TWITCH_CONFIG.clientId,
        Authorization: `Bearer ${this.accessToken}`
      }
    })

    this.userInfo = response.data.data[0]
    return this.userInfo
  }

  async connect() {
    if (this.isConnected) {
      await this.disconnect()
    }

    if (!this.accessToken || !this.userInfo) {
      throw new Error('Not authenticated')
    }

    this.channel = this.userInfo.login

    this.client = new tmi.Client({
      options: { debug: true },
      connection: {
        secure: true,
        reconnect: true
      },
      identity: {
        username: this.channel,
        password: `oauth:${this.accessToken}`
      },
      channels: [this.channel]
    })

    try {
      await this.client.connect()
      this.isConnected = true
      await this.setupFollowWebSocket()
      this.setupEventHandlers()
      return true
    } catch (error) {
      console.error('Error connecting to Twitch:', error)
      return false
    }
  }

  async disconnect() {
    if (this.client && this.isConnected) {
      await this.client.disconnect()
      this.isConnected = false
      this.client = null
    }
  }

  async setupFollowWebSocket() {
    const WebSocket = require('ws')
    this.ws = new WebSocket('wss://eventsub.wss.twitch.tv/ws')

    this.ws.on('open', () => {
      console.log('[WebSocket] Connected to Twitch EventSub')
    })

    this.ws.on('message', async (data) => {
      const message = JSON.parse(data)
      const { metadata, payload } = message

      if (metadata.message_type === 'session_welcome') {
        this.sessionId = payload.session.id
        console.log('[WebSocket] Session ID:', this.sessionId)
        await this.subscribeToFollowEvents()
      }

      if (metadata.message_type === 'notification') {
        const { subscription, event } = payload
        if (subscription.type === 'channel.follow') {
          this.emit('follow', {
            channel: this.userInfo.login,
            username: event.user_name
          })
        }
      }
    })

    this.ws.on('close', () => {
      console.log('[WebSocket] Twitch EventSub WebSocket closed')
    })

    this.ws.on('error', (err) => {
      console.error('[WebSocket] Error:', err)
    })
  }

  async subscribeToFollowEvents() {
    try {
      const response = await axios.post(
        'https://api.twitch.tv/helix/eventsub/subscriptions',
        {
          type: 'channel.follow',
          version: '2',
          condition: {
            broadcaster_user_id: this.userInfo.id,
            moderator_user_id: this.userInfo.id
          },
          transport: {
            method: 'websocket',
            session_id: this.sessionId
          }
        },
        {
          headers: {
            'Client-ID': TWITCH_CONFIG.clientId,
            Authorization: `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      )

      console.log('[Twitch] Follow EventSub subscription created')
    } catch (error) {
      console.error(
        '[Twitch] Failed to create EventSub subscription:',
        error.response?.data || error.message
      )
    }
  }

  setupEventHandlers() {
    if (!this.client) return

    // Mensajes del chat
    this.client.on('message', (channel, tags, message, self) => {
      if (self) return // Ignorar mensajes propios

      // Emitir evento de mensaje
      this.emit('chatMessage', {
        channel,
        username: tags.username,
        message,
        isSubscriber: tags.subscriber,
        isMod: tags.mod
      })
    })

    // Suscripciones
    this.client.on('subscription', (channel, username, method, message, userstate) => {
      this.emit('subscription', {
        channel,
        username,
        method,
        message,
        months: userstate['msg-param-cumulative-months']
      })
    })

    // Bits
    this.client.on('cheer', (channel, userstate, message) => {
      this.emit('bits', {
        channel,
        username: userstate.username,
        bits: userstate.bits,
        message
      })
    })
  }

  emit(event, data) {
    // Enviamos el evento al proceso de renderizado usando el canal específico
    ipcMain.emit(`twitch:${event}`, data)
  }
}

export const twitchService = new TwitchService()
