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
  const [micEnabled, setMicEnabled] = useState(true) // Nuevo estado
  const [openMenuReaction, setOpenMenuReaction] = useState(null)
  const [editorReaction, setEditorReaction] = useState(null)
  const [statesData, setStatesData] = useState(() => {
    const saved = localStorage.getItem('felipatube_states')
    return saved ? JSON.parse(saved) : states
  })

  useEffect(() => {
    localStorage.setItem('felipatube_states', JSON.stringify(statesData))
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
  const setTemporaryState = (newState) => {
    setCurrentState(newState)

    if (resetTimeoutRef.current) clearTimeout(resetTimeoutRef.current)

    // Vuelve a default automáticamente
    resetTimeoutRef.current = setTimeout(() => {
      setCurrentState('default')
    }, 5000)
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
  }, [selectedMic, micEnabled]) // <-- agrega micEnabled como dependencia

  // Efecto de micrófono hablando/no hablando.
  useEffect(() => {
    setSelectedReaction(
      isSpeaking
        ? { name: 'talking', img: statesData[currentState].talking.img }
        : statesData[currentState].normal
    )
  }, [isSpeaking, currentState, statesData])

  // Eventos twitch cambian el estado
  const handleTwitchEvent = (eventType, data) => {
    console.log('Evento recibido:', eventType, data)

    // Buscar la reacción cuyo config.event coincida con el eventType
    const matchedKey = Object.entries(statesData).find(
      ([, val]) => val.config.event === eventType
    )?.[0]

    if (matchedKey) {
      setTemporaryState(matchedKey)
      return
    }

    // ChatMessage: comandos por texto
    if (eventType === 'chatMessage') {
      const message = data.message.toLowerCase()
      // Buscar por comando en config.command
      const matchedCommandKey = Object.entries(statesData).find(
        ([, val]) => message.includes(val.config.command?.toLowerCase())
      )?.[0]
      if (matchedCommandKey) {
        setTemporaryState(matchedCommandKey)
        return
      }
    }

    // Si no hay match, vuelve a default o loguea
    if (eventType === 'disconnect') {
      setTemporaryState('default')
      return
    }

    console.log('Evento no manejado:', eventType)
  }

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
      <TwitchEvents onEvent={handleTwitchEvent} />
      <div className="flex flex-col w-[320px] bg-gray-300 p-2">
        <TwitchConnection onEvent={handleTwitchEvent} />
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
            setTemporaryState(matchedState?.[0] || 'default')
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
