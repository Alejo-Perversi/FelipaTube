import { useState, useEffect, useRef, useMemo } from 'react'

import ReactionSelector from './components/ReactionSelector'
import Preview from './components/Preview'
import MicSelector from './components/MicSelector'
import TwitchConnection from './components/TwitchConnection'
import { TwitchEvents } from './components/TwitchEvents'
import ExpressionEditorMenu from './components/ExpressionEditorMenu'

import micIcon from './assets/microphone.png'
import micMuteIcon from './assets/mute-microphone.png'

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
  const [micEnabled, setMicEnabled] = useState(true)
  const [openMenuReaction, setOpenMenuReaction] = useState(null)
  const [addingNew, setAddingNew] = useState(false)
  const [editorLoading, setEditorLoading] = useState(false)
  const [forceRerender, setForceRerender] = useState(0)

  // Usamos useRef para mantener una referencia mutable a la última versión de statesData
  const statesDataRef = useRef(null)
  const [manualDefaultState, setManualDefaultState] = useState(
    () => localStorage.getItem('felipatube_manualDefaultState') || 'default'
  )
  const manualDefaultStateRef = useRef(manualDefaultState)
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

  useEffect(() => {
    manualDefaultStateRef.current = manualDefaultState
  }, [manualDefaultState])

  // Cambia a estado y vuelve a default
  const setTemporaryState = (newState, customTimeout = null) => {
    setCurrentState(newState)

    if (resetTimeoutRef.current) clearTimeout(resetTimeoutRef.current)

    const currentStates = statesDataRef.current
    const timeout =
      customTimeout !== null ? customTimeout : currentStates[newState]?.config?.timeout

    if (timeout > 0) {
      resetTimeoutRef.current = setTimeout(() => {
        const fallback = statesDataRef.current[manualDefaultStateRef.current]
          ? manualDefaultStateRef.current
          : 'default'
        setCurrentState(fallback)
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

    // Buscar la reacción cuyo config.event coincida con el eventType
    matchedStateKey = Object.entries(currentStates).find(
      ([, val]) => val.config.event === eventType
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
      // Buscar por comando en config.command
      matchedStateKey = Object.entries(currentStates).find(([, val]) =>
        message.includes(val.config.command?.toLowerCase())
      )?.[0]
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
      if (!key) return prev

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

      return {
        ...prev,
        [key]: {
          ...prev[key],
          normal: updatedNormal,
          talking: updatedTalking,
          config: { ...prev[key].config, ...newConfig }
        }
      }
    })
  }

  const editorReaction = useMemo(() => {
    if (addingNew) {
      return {
        name: '',
        img: '',
        talkingImg: '',
        config: { command: '', event: '', timeout: 5 },
        reactionKey: null
      }
    }
    if (!openMenuReaction) return null
    const s = statesData[openMenuReaction]
    if (!s) return null
    return {
      ...s.normal,
      config: s.config,
      talkingImg: s.talking.img,
      reactionKey: openMenuReaction
    }
  }, [addingNew, openMenuReaction, statesData])

  return (
    <div className="flex h-screen w-screen">
      {/* Pasamos handleTwitchEvent.current a onEvent */}
      <TwitchEvents onEvent={handleTwitchEvent.current} />
      <div className="flex flex-col w-[320px] bg-gray-300 p-2">
        {/* Pasamos handleTwitchEvent.current a onEvent */}
        <TwitchConnection onEvent={handleTwitchEvent.current} />

        {/* Config Micrófono */}
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
            // Find the key for the selected reaction
            const matchedState = Object.entries(statesData).find(
              ([key, s]) => s.normal.img === reaction.img
            )
            const newDefaultKey = matchedState?.[0] || 'default'
            setManualDefaultState(newDefaultKey)
            localStorage.setItem('felipatube_manualDefaultState', newDefaultKey)
            setCurrentState(newDefaultKey)
          }}
          reactions={Object.values(statesData).map((s) => s.normal)}
          openMenuReaction={openMenuReaction}
          statesData={statesData}
          setOpenMenuReaction={setOpenMenuReaction}
          onAdd={() => setAddingNew(true)}
        />
      </div>
      <Preview reaction={selectedReaction} bgColor={bgColor} isTalking={isSpeaking} />
      {/* Menú editor a la derecha */}
      {(openMenuReaction || addingNew) && !editorLoading && (
        <div
          key={forceRerender}
          className="fixed right-0 top-0 h-full w-[350px] bg-gray-300 border-l shadow-lg z-30 flex flex-col p-4"
        >
          <ExpressionEditorMenu
            key={addingNew ? 'new' : editorReaction?.reactionKey}
            reaction={editorReaction}
            onClose={() => {
              setOpenMenuReaction(null)
              setAddingNew(false)
            }}
            onConfigChange={(name, config) => {
              if (addingNew) {
                // Generate a unique key for the new state
                const key = name.toLowerCase().replace(/\s+/g, '_') + '_' + Date.now()
                setStatesData((prev) => ({
                  ...prev,
                  [key]: {
                    normal: { name: config.name, img: config.img },
                    talking: { name: config.name, img: config.talkingImg },
                    config: {
                      label: config.name,
                      command: config.command,
                      event: config.event,
                      timeout: config.timeout
                    }
                  }
                }))
              } else {
                updateReactionConfig(name, config)
              }
              setAddingNew(false)
              setOpenMenuReaction(null)
            }}
            allReactions={Object.values(statesData).map((s) => ({
              ...s.normal,
              config: s.config,
              talkingImg: s.talking.img
            }))}
            onDelete={(reactionKey) => {
              setEditorLoading(true)
              setOpenMenuReaction(null)
              setAddingNew(false)
              setTimeout(() => {
                setStatesData((prev) => {
                  if (!reactionKey) return prev
                  const newData = { ...prev }
                  delete newData[reactionKey]

                  // If the deleted state is the current or manual default, pick a new one
                  if (currentState === reactionKey || manualDefaultState === reactionKey) {
                    const fallbackKey = newData['default']
                      ? 'default'
                      : Object.keys(newData)[0] || null

                    setCurrentState(fallbackKey)
                    setManualDefaultState(fallbackKey)
                    localStorage.setItem('felipatube_manualDefaultState', fallbackKey)
                  }
                  return newData
                })
                setEditorLoading(false)
                setForceRerender((x) => x + 1)
                window.dispatchEvent(new Event('blur'))
                setTimeout(() => {
                  window.dispatchEvent(new Event('focus'))
                }, 50)
              }, 1000)
            }}
            addingNew={addingNew}
          />
        </div>
      )}
      {editorLoading && (
        <div className="fixed right-0 top-0 h-full w-[350px] bg-gray-300 border-l shadow-lg z-30 flex flex-col items-center justify-center p-4">
          <div className="flex flex-col items-center justify-center h-full w-full">
            <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-purple-500 border-solid mb-4"></div>
            <span className="text-lg font-semibold text-purple-700">Eliminando...</span>
          </div>
        </div>
      )}
    </div>
  )
}

export default App
