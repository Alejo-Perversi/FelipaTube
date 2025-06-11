import { useState, useEffect } from 'react'
import PropTypes from 'prop-types'

export default function TwitchConnection({ onEvent }) {
  const [isConnected, setIsConnected] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [connectionStatus, setConnectionStatus] = useState('')
  const [userInfo, setUserInfo] = useState(null)

  useEffect(() => {
    // Configurar listeners de eventos de Twitch
    window.api.twitch.onChatMessage((data) => {
      setConnectionStatus('Conectado y recibiendo mensajes')
      onEvent('chatMessage', data)
    })
    window.api.twitch.onSubscription((data) => onEvent('subscription', data))
    window.api.twitch.onBits((data) => onEvent('bits', data))
    window.api.twitch.onFollow((data) => onEvent('follow', data))
  }, [])

  const handleConnect = async () => {
    setConnectionStatus('Iniciando autenticación...')
    setError('')
    setIsConnected(false)

    try {
      setIsLoading(true)
      setConnectionStatus('Abriendo ventana de autenticación...')

      const authResult = await window.api.twitch.initiateAuth()
      console.log(authResult)

      // Si authResult es null o tiene cancelled: true, significa que el usuario cerró la ventana
      if (!authResult || authResult.cancelled) {
        setConnectionStatus('Autenticación cancelada')
        setIsLoading(false)
        return
      }

      setConnectionStatus('Autenticación exitosa, obteniendo información del usuario...')
      setUserInfo(authResult.userInfo)

      setConnectionStatus('Conectando al chat de Twitch...')
      const success = await window.api.twitch.connect()

      if (!success) {
        setError('Error al conectar con el chat de Twitch')
        setConnectionStatus('Error de conexión')
        setIsConnected(false)
        return
      }

      setIsConnected(true)
      setConnectionStatus('Conectado al canal')
      setError('')
    } catch (err) {
      console.error('Error connecting to Twitch:', err)
      setIsConnected(false)
      setConnectionStatus('Error de conexión')

      // Mensajes de error más descriptivos
      if (err.message.includes('cargar la página')) {
        setError('Error al cargar la página de autenticación. Verifica tu conexión a internet.')
      } else {
        setError(err.message || 'Error al conectar con Twitch')
      }

      onEvent('error', { message: err.message })
    } finally {
      setIsLoading(false)
    }
  }

  const handleDisconnect = async () => {
    try {
      setIsLoading(true)
      setConnectionStatus('Desconectando...')
      await window.api.twitch.disconnect()
      setIsConnected(false)
      setError('')
      setConnectionStatus('')
      setUserInfo(null)
      onEvent('disconnect', null)
    } catch (err) {
      setError('Error al desconectar de Twitch: ' + err.message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="p-4 bg-gray-100 rounded-lg">
      <h2 className="text-xl font-bold mb-4">Conexión con Twitch</h2>

      {!isConnected ? (
        <div className="space-y-4">
          {error && (
            <div
              className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded relative"
              role="alert"
            >
              <strong className="font-bold">Error: </strong>
              <span className="block sm:inline">{error}</span>
            </div>
          )}

          {connectionStatus && <p className="text-sm text-gray-600">{connectionStatus}</p>}

          <button
            onClick={handleConnect}
            className="w-full bg-[#9146FF] text-white py-2 px-4 rounded-md hover:bg-[#7B2CBF] focus:outline-none focus:ring-2 focus:ring-[#9146FF] focus:ring-offset-2 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <svg
                  className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                {connectionStatus}
              </>
            ) : (
              <>
                <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714Z" />
                </svg>
                Conectar con Twitch
              </>
            )}
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {userInfo && (
            <div className="flex items-center space-x-3">
              {/* <img
                src={userInfo.profile_image_url}
                alt={userInfo.display_name}
                className="w-10 h-10 rounded-full"
              /> */}
              <div>
                <p className="font-medium">{userInfo.display_name}</p>
                <p className="text-sm text-gray-600">@{userInfo.login}</p>
              </div>
            </div>
          )}
          {connectionStatus && <p className="text-sm text-gray-600">{connectionStatus}</p>}
          <button
            onClick={handleDisconnect}
            className="w-full bg-red-500 text-white py-2 px-4 rounded-md hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isLoading}
          >
            {isLoading ? 'Desconectando...' : 'Desconectar'}
          </button>
        </div>
      )}
    </div>
  )
}

TwitchConnection.propTypes = {
  onEvent: PropTypes.func.isRequired
}
