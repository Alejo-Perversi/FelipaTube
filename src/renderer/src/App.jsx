import { useState, useEffect, useRef } from 'react'

import ReactionSelector from './components/ReactionSelector'
import Preview from './components/Preview'
import MicSelector from './components/MicSelector'
import TwitchConnection from './components/TwitchConnection'
import { TwitchEvents } from './components/TwitchEvents'
import ExpressionEditorMenu from './components/ExpressionEditorMenu'

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
  
  // Usamos useRef para mantener una referencia mutable a la última versión de statesData
  const statesDataRef = useRef(null); 
  const [statesData, setStatesData] = useState(() => {
    const saved = localStorage.getItem('felipatube_states')
    const initialData = saved ? JSON.parse(saved) : states;
    statesDataRef.current = initialData; // Inicializa el ref con los datos cargados o por defecto
    return initialData;
  });

  // Actualiza el ref cada vez que statesData cambia
  useEffect(() => {
    localStorage.setItem('felipatube_states', JSON.stringify(statesData))
    statesDataRef.current = statesData; 
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
    setCurrentState(newState)

    if (resetTimeoutRef.current) clearTimeout(resetTimeoutRef.current)

    // Accede a statesData a través del ref para obtener la última versión
    const currentStates = statesDataRef.current;
    const timeout = customTimeout !== null
      ? customTimeout
      : currentStates[newState]?.config?.timeout;

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
    const currentStates = statesDataRef.current;
    let matchedStateKey = null;

    // Buscar la reacción cuyo config.event coincida con el eventType
    matchedStateKey = Object.entries(currentStates).find(
      ([, val]) => val.config.event === eventType
    )?.[0]

    if (matchedStateKey) {
      const timeout = currentStates[matchedStateKey].config.timeout;
      // Llama a setTemporaryState, que también usa el ref
      setTemporaryState(matchedStateKey, timeout);
      return
    }

    // ChatMessage: comandos por texto
    if (eventType === 'chatMessage') {
      const message = data.message.toLowerCase()
      // Buscar por comando en config.command
      matchedStateKey = Object.entries(currentStates).find(
        ([, val]) => message.includes(val.config.command?.toLowerCase())
      )?.[0]
      if (matchedStateKey) {
        const timeout = currentStates[matchedStateKey].config.timeout;
        // Llama a setTemporaryState, que también usa el ref
        setTemporaryState(matchedStateKey, timeout);
        return
      }
    }

    // Si no hay match, vuelve a default o loguea
    if (eventType === 'disconnect') {
      setTemporaryState('default')
      return
    }

    console.log('Evento no manejado:', eventType)
  });

  // Función para actualizar la config de una reacción
  const updateReactionConfig = (reactionName, newConfig) => {
    setStatesData((prev) => {
      const key = Object.keys(prev).find(
        (k) => prev[k].normal.name === reactionName
      )
      if (!key) return prev
      return {
        ...prev,
        [key]: {
          ...prev[key],
          config: { ...prev[key].config, ...newConfig }
        }
      }
    })
  }

  return (
    <div className="flex h-screen w-screen">
      {/* Pasamos handleTwitchEvent.current a onEvent */}
      <TwitchEvents onEvent={handleTwitchEvent.current} /> 
      <div className="flex flex-col w-[320px] bg-gray-300 p-2">
        {/* Pasamos handleTwitchEvent.current a onEvent */}
        <TwitchConnection onEvent={handleTwitchEvent.current} /> 
        <MicSelector selected={selectedMic} onSelect={setSelectedMic} />

        <label className="text-sm font-semibold mt-2">Color de fondo</label>
        <input
          type="color"
          value={bgColor}
          onChange={(e) => setBgColor(e.target.value)}
          className="w-full h-8 rounded"
        />

        {/* Botón para activar/desactivar micrófono */}
        <button
          className={`mb-2 py-2 px-4 rounded font-bold ${
            micEnabled ? 'bg-green-500 text-white' : 'bg-gray-400 text-gray-700'
          }`}
          onClick={() => setMicEnabled((v) => !v)}
        >
          {micEnabled ? 'Desactivar micrófono' : 'Activar micrófono'}
        </button>

        <ReactionSelector
          onSelect={(reaction) => {
            const matchedState = Object.entries(statesData).find(
              ([_, val]) => val.normal.img === reaction.img
            )
            // Cuando se selecciona manualmente, usamos el timeout de la configuración actual
            // statesData aquí está bien porque esta función se recrea en cada render
            setTemporaryState(matchedState?.[0] || 'default', statesData[matchedState?.[0] || 'default']?.config?.timeout)
          }}
          reactions={Object.values(statesData).map((s) => s.normal)}
          openMenuReaction={openMenuReaction}
          setOpenMenuReaction={setOpenMenuReaction}
        />
      </div>
      <Preview reaction={selectedReaction} bgColor={bgColor} />
      {/* Menú editor a la derecha */}
      {openMenuReaction && (
        <div className="fixed right-0 top-0 h-full w-[350px] bg-gray-100 border-l shadow-lg z-30 flex flex-col p-4">
          <ExpressionEditorMenu
            reaction={Object.values(statesData)
              .map((s) => ({ ...s.normal, config: s.config }))
              .find((r) => r.name === openMenuReaction)}
            onClose={() => setOpenMenuReaction(null)}
            onConfigChange={updateReactionConfig}
          />
        </div>
      )}
    </div>
  )
}

export default App