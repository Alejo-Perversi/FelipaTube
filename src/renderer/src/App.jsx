// src/renderer/App.jsx

import { useState, useEffect, useRef } from 'react'

// Componentes
import { EventSettings } from './components/EventSettings' // 1. MODIFICADO: Importamos el nuevo componente
import ReactionSelector from './components/ReactionSelector'
import Preview from './components/Preview'
import MicSelector from './components/MicSelector'
import TwitchConnection from './components/TwitchConnection'
import { TwitchEvents } from './components/TwitchEvents'

// Assets de imágenes
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
import SettingsIcon from './assets/config-removebg-preview.png' // 1. MODIFICADO: Ícono para el botón de config

const states = {
  // Las llaves DEBEN estar en minúsculas para coincidir con los nombres de evento de Twitch
  default: {
    normal: { name: 'Default', img: Default_Closed_Mouth },
    talking: { name: 'Default', img: Default_Open_Mouth }
  },
  follower: {
    normal: { name: 'Follower', img: Follower_Closed_Mouth },
    talking: { name: 'Follower', img: Follower_Open_Mouth }
  },
  subscription: { // Cambiado de 'subscriber' a 'subscription' para coincidir con el evento de Twitch
    normal: { name: 'Subscription', img: Subscriber_Closed_Mouth },
    talking: { name: 'Subscription', img: Subscriber_Open_Mouth }
  },
  bits: {
    normal: { name: 'Bits', img: Bits_Closed_Mouth },
    talking: { name: 'Bits', img: Bits_Open_Mouth }
  },
  payaso: {
    normal: { name: 'Payaso', img: Payaso_Closed_Mouth },
    talking: { name: 'Payaso', img: Payaso_Open_Mouth }
  }
}

// Lista de expresiones disponibles para pasar al componente de configuración
const AVAILABLE_EXPRESSIONS = Object.keys(states)

function App() {
  // Estados existentes
  const [currentState, setCurrentState] = useState('default')
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [selectedReaction, setSelectedReaction] = useState(states.default.normal)
  const resetTimeoutRef = useRef(null)
  const [selectedMic, setSelectedMic] = useState('default')
  const [bgColor, setBgColor] = useState('#00ff00')

  // 2. NUEVO: Estados para la configuración
  const [isSettingsVisible, setSettingsVisible] = useState(false)
  const [expressionConfig, setExpressionConfig] = useState({})

  // 3. NUEVO: Cargar la configuración al iniciar la app
  useEffect(() => {
    window.api.loadExpressionConfig().then((config) => {
      console.log('[Config] Configuración cargada:', config)
      setExpressionConfig(config)
    })
  }, [])


  // Cambia a estado y vuelve a default
  const setTemporaryState = (newStateKey) => {
    // Comprueba si el estado solicitado existe. Si no, usa 'default'.
    const stateToSet = states[newStateKey] ? newStateKey : 'default'
    setCurrentState(stateToSet)

    if (resetTimeoutRef.current) clearTimeout(resetTimeoutRef.current)

    // Vuelve a default automáticamente
    resetTimeoutRef.current = setTimeout(() => {
      setCurrentState('default')
    }, 5000)
  }

  // Detección del micrófono (sin cambios)
  useEffect(() => {
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
      }
      animationFrame = requestAnimationFrame(detect)
    }

    const init = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ audio: { deviceId: selectedMic } })
        const source = audioContextRef.createMediaStreamSource(stream)
        source.connect(analyser)
        detect()
      } catch (error) {
        console.error("Error al iniciar el micrófono:", error)
      }
    }
    init()
    return () => {
      if (animationFrame) cancelAnimationFrame(animationFrame)
      if (stream) stream.getTracks().forEach((track) => track.stop())
      audioContextRef.close()
    }
  }, [selectedMic])

  // Efecto de micrófono hablando/no hablando.
  useEffect(() => {
    if (states[currentState]) {
      setSelectedReaction(isSpeaking ? states[currentState].talking : states[currentState].normal)
    } else {
      // Fallback por si el estado no existe
      setSelectedReaction(isSpeaking ? states.default.talking : states.default.normal)
    }
  }, [isSpeaking, currentState])

  // 4. MODIFICADO: Los eventos de Twitch ahora usan la configuración dinámica
  const handleTwitchEvent = (eventType, data) => {
    console.log('[Twitch] Evento recibido:', eventType, data)

    // Primero, maneja los comandos de chat como antes (son manuales)
    if (eventType === 'chatMessage') {
      const message = data.message.toLowerCase()
      if (message.includes('!payaso')) setTemporaryState('payaso')
      if (message.includes('!seguidor')) setTemporaryState('follower')
      // ... otros comandos si los tienes ...
      return // Termina la ejecución para no buscar en la config
    }

    // Luego, maneja los eventos automáticos usando la configuración
    const expressionForEvent = expressionConfig[eventType]
    
    if (expressionForEvent) {
      console.log(`[Config] Evento '${eventType}' dispara la expresión '${expressionForEvent}'`)
      // La clave de la expresión debe estar en minúscula, ej: 'payaso'
      setTemporaryState(expressionForEvent.toLowerCase()) 
    } else {
      console.log(`[Config] No hay expresión configurada para el evento: ${eventType}`)
    }
  }
  
  // NUEVO: Función para actualizar el estado de la config después de guardar
  const handleConfigSaved = (newConfig) => {
      console.log('[Config] Configuración guardada y actualizada en la app.', newConfig)
      setExpressionConfig(newConfig)
  }

  return (
    <div className="flex h-screen w-screen">
      {/* Componentes que no se ven en la UI */}
      <TwitchEvents onEvent={handleTwitchEvent} />

      {/* 5. MODIFICADO: El layout principal */}
      <div className="flex flex-col w-[320px] bg-gray-300 p-2 overflow-y-auto">
        <TwitchConnection onEvent={handleTwitchEvent} />
        <MicSelector selected={selectedMic} onSelect={setSelectedMic} />

        <label className="text-sm font-semibold mt-2">Color de fondo</label>
        <input
          type="color"
          value={bgColor}
          onChange={(e) => setBgColor(e.target.value)}
          className="w-full h-8 rounded"
        />

        <ReactionSelector
          onSelect={(reaction) => {
            const matchedState = Object.entries(states).find(
              ([_, val]) => val.normal.img === reaction.img
            )
            setTemporaryState(matchedState?.[0] || 'default')
          }}
          reactions={Object.values(states).map((s) => s.normal)}
        />
      </div>

      <div className="relative flex-1">
        <Preview reaction={selectedReaction} bgColor={bgColor} />
        
        {/* Botón de configuración flotante */}
        <div className="absolute top-4 right-4">
          <button onClick={() => setSettingsVisible(true)} className="p-2 bg-gray-800 bg-opacity-50 hover:bg-opacity-75 rounded-full transition-all">
            <img src={SettingsIcon} alt="Configuración" className="w-6 h-6 invert" />
          </button>
        </div>
      </div>

      {/* Modal de configuración */}
      <EventSettings
        isVisible={isSettingsVisible}
        onClose={() => setSettingsVisible(false)}
        onSave={handleConfigSaved} // Pasa la nueva función de guardado
        availableExpressions={AVAILABLE_EXPRESSIONS} // Pasa las expresiones disponibles
      />
    </div>
  )
}

export default App