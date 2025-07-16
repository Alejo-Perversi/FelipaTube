import { useState, useEffect, useRef } from 'react'

import ReactionSelector from './components/ReactionSelector'
import Preview from './components/Preview'
import MicSelector from './components/MicSelector'
import TwitchConnection from './components/TwitchConnection'
import { TwitchEvents } from './components/TwitchEvents'
import ExpressionEditorMenu from './components/ExpressionEditorMenu'
import AddExpressionMenu from './components/AddExpressionMenu'

import micIcon from './assets/microphone.png'
import micMuteIcon from './assets/mute-microphone.png'
import gearIcon from './assets/gear.png'
import twitchIcon from './assets/twitch.png'

import Default_Closed_Mouth from './assets/Default_Closed_Mouth.png'
import Default_Open_Mouth from './assets/Default_Open_Mouth.png'
import Follower_Closed_Mouth from './assets/Follower_Closed_Mouth.png'
import Follower_Open_Mouth from './assets/Follower_Open_Mouth.png'
import Subscriber_Closed_Mouth from './assets/Subscriber_Closed_Mouth.png'
import Subscriber_Open_Mouth from './assets/Subscriber_Open_Mouth.png'
import Bits_Closed_Mouth from './assets/Bits_Closed_Mouth.png'
import Bits_Open_Mouth from './assets/Bits_Open_Mouth.png'
import Payaso_Open_Mouth from './assets/Payaso_Open_Mouth.png'
import Payaso_Closed_Mouth from './assets/Payaso_Closed_Mouth.png'

const states = {
  default: {
    normal: { name: 'Default', img: Default_Closed_Mouth },
    talking: { name: 'Default', img: Default_Open_Mouth },
    config: {
      label: 'Default',
      command: '!default',
      event: '',
      timeout: -1
    }
  },
  follower: {
    normal: { name: 'Follower', img: Follower_Closed_Mouth },
    talking: { name: 'Follower', img: Follower_Open_Mouth },
    config: {
      label: 'Follower',
      command: '!follow',
      event: 'follow',
      timeout: 5
    }
  },
  subscriber: {
    normal: { name: 'Subscription', img: Subscriber_Closed_Mouth },
    talking: { name: 'Subscription', img: Subscriber_Open_Mouth },
    config: {
      label: 'Subscription',
      command: '!subscription',
      event: 'subscription',
      timeout: 5
    }
  },
  bits: {
    normal: { name: 'Bits', img: Bits_Closed_Mouth },
    talking: { name: 'Bits', img: Bits_Open_Mouth },
    config: {
      label: 'Bits',
      command: '!bits',
      event: 'bits',
      timeout: 5
    }
  },
  payaso: {
    normal: { name: 'Payaso', img: Payaso_Closed_Mouth },
    talking: { name: 'Payaso', img: Payaso_Open_Mouth },
    config: {
      label: 'Payaso',
      command: '!payaso',
      event: 'point redemption',
      timeout: 10
    }
  }
}

function App() {
  const [currentState, setCurrentState] = useState('default')
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [selectedReaction, setSelectedReaction] = useState(states.default.normal)
  const resetTimeoutRef = useRef(null)
  const [selectedMic, setSelectedMic] = useState('default')
  const [bgColor, setBgColor] = useState('#00ff00')
  const [appFocused, setAppFocused] = useState(true)
  const [showAddExpression, setShowAddExpression] = useState(false)
  const [micEnabled, setMicEnabled] = useState(true)
  const [openMenuReaction, setOpenMenuReaction] = useState(null)
  const [showMenu, setShowMenu] = useState(false)
  const [showTwitch, setShowTwitch] = useState(false)

  // Usamos useRef para mantener una referencia mutable a la última versión de statesData
  const statesDataRef = useRef(null)
  const [statesData, setStatesData] = useState(() => {
    const saved = localStorage.getItem('felipatube_states')
    const initialData = saved ? JSON.parse(saved) : states
    statesDataRef.current = initialData // Inicializa el ref con los datos cargados o por defecto
    return initialData
  })

  // Actualiza el ref cada vez que statesData cambia
  useEffect(() => {
    localStorage.setItem('felipatube_states', JSON.stringify(statesData))
    statesDataRef.current = statesData
  }, [statesData])

  useEffect(() => {
    const handleFocus = () => setAppFocused(true)
    const handleBlur = () => setAppFocused(false)
    window.addEventListener('focus', handleFocus)
    window.addEventListener('blur', handleBlur)
    return () => {
      window.removeEventListener('focus', handleFocus)
      window.removeEventListener('blur', handleBlur)
    }
  }, [])

  // Cambia a estado y vuelve a default
  const setTemporaryState = (newState, customTimeout = null) => {
    // Verificar que el estado existe antes de cambiarlo
    const currentStates = statesDataRef.current
    if (!currentStates[newState]) {
      console.warn(`Estado '${newState}' no existe, volviendo a default`)
      setCurrentState('default')
      return
    }

    setCurrentState(newState)

    if (resetTimeoutRef.current) clearTimeout(resetTimeoutRef.current)

    const timeout =
      customTimeout !== null ? customTimeout : currentStates[newState]?.config?.timeout

    if (timeout > 0) {
      resetTimeoutRef.current = setTimeout(() => {
        setCurrentState('default')
      }, timeout * 1000)
    }
  }

  // Detección del micrófono
  useEffect(() => {
    if (!micEnabled) {
      setIsSpeaking(false)
      return
    }

    let stream
    const audioContextRef = new (window.AudioContext || window.webkitAudioContext)()
    const analyser = audioContextRef.createAnalyser()
    analyser.fftSize = 2048
    const bufferLength = analyser.fftSize
    const dataArray = new Uint8Array(bufferLength)

    let prevSpeaking = false
    let animationFrame

    const detect = () => {
      analyser.getByteTimeDomainData(dataArray)
      const avg = dataArray.reduce((sum, val) => sum + Math.abs(val - 128), 0) / bufferLength
      const volume = avg / 128
      const speaking = volume > 0.02

      if (speaking !== prevSpeaking) {
        prevSpeaking = speaking
        setIsSpeaking(speaking)
        console.log('[Mic] Speaking:', speaking, 'Volume:', volume.toFixed(4))
      }

      animationFrame = requestAnimationFrame(detect)
    }

    const init = async () => {
      const devices = await navigator.mediaDevices.enumerateDevices()
      console.log('[Mic] Devices:', devices)

      stream = await navigator.mediaDevices.getUserMedia({
        audio: { deviceId: selectedMic }
      })

      const source = audioContextRef.createMediaStreamSource(stream)
      source.connect(analyser)
      detect()
    }

    init()

    return () => {
      if (animationFrame) cancelAnimationFrame(animationFrame)
      if (stream) stream.getTracks().forEach((track) => track.stop())
      audioContextRef.close()
    }
  }, [selectedMic, micEnabled])

  // Efecto de micrófono hablando/no hablando.
  useEffect(() => {
    // Verificar que el currentState existe en statesData
    if (!statesData[currentState]) {
      console.warn(`Estado actual '${currentState}' no existe, volviendo a default`)
      setCurrentState('default')
      return
    }

    setSelectedReaction(
      isSpeaking
        ? { name: 'talking', img: statesData[currentState].talking.img }
        : statesData[currentState].normal
    )
  }, [isSpeaking, currentState, statesData]) // statesData aquí está bien porque setSelectedReaction siempre se reevalúa

  // Eventos twitch cambian el estado
  // Esta función no debe ser recreada en cada render si la pasamos como prop.
  // Usaremos el ref para acceder a statesData.
  const handleTwitchEvent = useRef((eventType, data) => {
    console.log('Evento recibido:', eventType, data)

    // Accede a statesData a través del ref para obtener la última versión
    const currentStates = statesDataRef.current
    let matchedStateKey = null

    // Buscar la reacción cuyo config.event coincida con el eventType (solo si el evento no está vacío)
    matchedStateKey = Object.entries(currentStates).find(
      ([, val]) => val.config.event && val.config.event !== '' && val.config.event === eventType
    )?.[0]

    if (matchedStateKey) {
      const timeout = currentStates[matchedStateKey].config.timeout
      // Llama a setTemporaryState, que también usa el ref
      setTemporaryState(matchedStateKey, timeout)
      return
    }

    // ChatMessage: comandos por texto
    if (eventType === 'chatMessage') {
      const message = data.message.toLowerCase()
      // Buscar por comando en config.command (solo si el comando no está vacío)
      matchedStateKey = Object.entries(currentStates).find(([, val]) => {
        const command = val.config.command?.toLowerCase().trim()
        return command && command !== '' && message.includes(command)
      })?.[0]
      if (matchedStateKey) {
        const timeout = currentStates[matchedStateKey].config.timeout
        // Llama a setTemporaryState, que también usa el ref
        setTemporaryState(matchedStateKey, timeout)
        return
      }
    }

    // Si no hay match, vuelve a default o loguea
    if (eventType === 'disconnect') {
      setTemporaryState('default')
      return
    }

    console.log('Evento no manejado:', eventType)
  })

  // Función para actualizar la config de una reacción
  const updateReactionConfig = (reactionName, newConfig) => {
    setStatesData((prev) => {
      const key = Object.keys(prev).find((k) => prev[k].normal.name === reactionName)
      if (!key) {
        console.warn(`No se encontró la expresión: ${reactionName}`)
        return prev
      }

      const updatedNormal = {
        ...prev[key].normal,
        name: newConfig.name !== undefined ? newConfig.name : prev[key].normal.name,
        img: newConfig.img !== undefined ? newConfig.img : prev[key].normal.img
      }

      const updatedTalking = {
        ...prev[key].talking,
        name: newConfig.name !== undefined ? newConfig.name : prev[key].talking.name,
        img: newConfig.talkingImg !== undefined ? newConfig.talkingImg : prev[key].talking.img
      }

      const updatedStates = {
        ...prev,
        [key]: {
          ...prev[key],
          normal: updatedNormal,
          talking: updatedTalking,
          config: { ...prev[key].config, ...newConfig }
        }
      }

      console.log(`Expresión actualizada: ${reactionName} -> ${newConfig.name || reactionName}`)
      return updatedStates
    })

    // Actualizar el estado del menú abierto si se cambió el nombre
    if (newConfig.name && newConfig.name !== reactionName && openMenuReaction === reactionName) {
      setOpenMenuReaction(newConfig.name)
    }
  }

  // Función para agregar una nueva expresión
  const addNewExpression = (expressionConfig) => {
    const newKey = `custom_${Date.now()}` // Generar clave única

    setStatesData((prev) => ({
      ...prev,
      [newKey]: {
        normal: {
          name: expressionConfig.name,
          img: expressionConfig.img
        },
        talking: {
          name: expressionConfig.name,
          img: expressionConfig.talkingImg
        },
        config: {
          label: expressionConfig.name,
          command: expressionConfig.command || '',
          event: expressionConfig.event || '',
          timeout: expressionConfig.timeout || 5
        }
      }
    }))
  }

  // Al abrir un menú, cerrar el otro
  const handleShowMenu = () => {
    setShowMenu((prev) => {
      if (!prev) setShowTwitch(false)
      return !prev
    })
  }
  const handleShowTwitch = () => {
    setShowTwitch((prev) => {
      if (!prev) setShowMenu(false)
      return !prev
    })
  }

  // Función para cerrar el menú de edición de manera segura
  const handleCloseExpressionMenu = () => {
    setOpenMenuReaction(null)
  }

  return (
    <div className="flex h-screen w-screen relative">
      {/* Iconos flotantes */}
      <div className="absolute top-4 right-4 z-40 flex flex-col gap-2">
        <button
          className="bg-white rounded-full p-2 shadow hover:bg-gray-200 border border-gray-300 transition flex items-center justify-center"
          style={{ width: 48, height: 48 }}
          onClick={handleShowMenu}
          title="Abrir configuración"
        >
          <img
            src={gearIcon}
            alt="Configuración"
            width={28}
            height={28}
            style={{ display: 'block' }}
          />
        </button>
        <button
          className="bg-white rounded-full p-2 shadow hover:bg-gray-200 border border-gray-300 transition flex items-center justify-center"
          style={{ width: 48, height: 48 }}
          onClick={handleShowTwitch}
          title="Conectar Twitch"
        >
          <img src={twitchIcon} alt="Twitch" width={28} height={28} style={{ display: 'block' }} />
        </button>
      </div>
      <TwitchEvents onEvent={handleTwitchEvent.current} />
      {/* TwitchConnection siempre montado, solo visible si showTwitch */}
      <div
        style={{ display: showTwitch ? 'block' : 'none' }}
        className="fixed left-0 top-0 h-full w-[320px] bg-gray-300 p-2 z-40"
      >
        <TwitchConnection onEvent={handleTwitchEvent.current} />
      </div>
      {/* Menú lateral de configuración */}
      {showMenu && (
        <div className="flex flex-col w-[320px] bg-gray-300 p-2 h-full z-30">
          <label className="text-sm font-semibold mt-2">Micrófono:</label>
          <div className="flex items-center gap-2 mb-2">
            <button
              className={`p-2 rounded-full border-2 ${micEnabled ? 'border-green-500' : 'border-gray-400'} bg-white hover:bg-gray-200 transition flex items-center justify-center`}
              onClick={() => setMicEnabled((v) => !v)}
              title={micEnabled ? 'Desactivar micrófono' : 'Activar micrófono'}
              style={{ width: 40, height: 40, minWidth: 40, minHeight: 40 }}
            >
              <img
                src={micEnabled ? micIcon : micMuteIcon}
                alt={micEnabled ? 'Micrófono activado' : 'Micrófono desactivado'}
                width={24}
                height={24}
                style={{ objectFit: 'contain', display: 'block' }}
              />
            </button>
            <div className="flex-1">
              <MicSelector selected={selectedMic} onSelect={setSelectedMic} />
            </div>
          </div>
          <label className="text-sm font-semibold mt-2">Color de fondo:</label>
          <input
            type="color"
            value={bgColor}
            onChange={(e) => setBgColor(e.target.value)}
            className="w-full rounded"
            style={{ height: '2rem', minHeight: '2rem', maxHeight: '2rem' }}
          />
          <ReactionSelector
            onSelect={(reaction) => {
              const matchedState = Object.entries(statesData).find(
                ([, val]) => val.normal.img === reaction.img
              )
              setTemporaryState(
                matchedState?.[0] || 'default',
                statesData[matchedState?.[0] || 'default']?.config?.timeout
              )
            }}
            reactions={Object.entries(statesData).map(([key, s]) => ({ ...s.normal, key }))}
            setOpenMenuReaction={setOpenMenuReaction}
            onAdd={() => setShowAddExpression(true)}
          />
        </div>
      )}
      {/* Avatar siempre visible */}
      <div className="flex-1 flex items-center justify-center min-h-screen">
        <Preview reaction={selectedReaction} bgColor={bgColor} isTalking={isSpeaking} />
        {/* Indicador de foco de la aplicación */}
        {!appFocused && (
          <div className="absolute top-4 left-4 bg-yellow-500 text-white px-2 py-1 rounded text-xs">
            App sin foco
          </div>
        )}
      </div>
      {/* Menú editor a la derecha */}
      {openMenuReaction &&
        (() => {
          const reaction = Object.entries(statesData)
            .map(([key, s]) => ({ ...s.normal, config: s.config, talkingImg: s.talking.img, key }))
            .find((r) => r.name === openMenuReaction)

          // Si no se encuentra la reacción, cerrar el menú
          if (!reaction) {
            console.warn(`No se encontró la reacción: ${openMenuReaction}`)
            setOpenMenuReaction(null)
            return null
          }

          return (
            <div className="fixed right-0 top-0 h-full w-[350px] bg-gray-300 border-l shadow-lg z-50 flex flex-col p-4">
              <ExpressionEditorMenu
                reaction={reaction}
                onClose={handleCloseExpressionMenu}
                onConfigChange={updateReactionConfig}
                allReactions={Object.values(statesData).map((s) => ({
                  ...s.normal,
                  config: s.config,
                  talkingImg: s.talking.img
                }))}
              />
            </div>
          )
        })()}

      {/* Menú para agregar nueva expresión */}
      {showAddExpression && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
          <AddExpressionMenu
            onClose={() => setShowAddExpression(false)}
            onAddExpression={addNewExpression}
            allReactions={Object.values(statesData).map((s) => ({
              ...s.normal,
              config: s.config,
              talkingImg: s.talking.img
            }))}
          />
        </div>
      )}
    </div>
  )
}

export default App
