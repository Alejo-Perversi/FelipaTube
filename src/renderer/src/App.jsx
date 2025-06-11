import { useState, useEffect, useRef } from 'react'

import ReactionSelector from './components/ReactionSelector'
import Preview from './components/Preview'
import MicSelector from './components/MicSelector'
import TwitchConnection from './components/TwitchConnection'
import { TwitchEvents } from './components/TwitchEvents'
import ConfigMenu from './components/ConfigMenu'

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

const initialStates = {
  default: {
    normal: { name: 'normal', img: Default_Closed_Mouth },
    talking: { name: 'talking', img: Default_Open_Mouth },
    config: { label: 'Default', command: '', event: '', timeout: 0 }
  },
  follower: {
    normal: { name: 'normal', img: Follower_Closed_Mouth },
    talking: { name: 'talking', img: Follower_Open_Mouth },
    config: { label: 'Follower', command: '!seguidor', event: 'follow', timeout: 5 }
  },
  subscriber: {
    normal: { name: 'normal', img: Subscriber_Closed_Mouth },
    talking: { name: 'talking', img: Subscriber_Open_Mouth },
    config: { label: 'Subscriber', command: '!subscripcion', event: 'subscription', timeout: 5 }
  },
  bits: {
    normal: { name: 'normal', img: Bits_Closed_Mouth },
    talking: { name: 'talking', img: Bits_Open_Mouth },
    config: { label: 'Bits', command: '!bits', event: 'bits', timeout: 5 }
  },
  payaso: {
    normal: { name: 'normal', img: Payaso_Closed_Mouth },
    talking: { name: 'talking', img: Payaso_Open_Mouth },
    config: { label: 'Payaso', command: '!payaso', event: 'chatMessage', timeout: 10 }
  }
}

function App() {
  const [states, setStates] = useState(initialStates)
  const [currentState, setCurrentState] = useState('default')
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [selectedReaction, setSelectedReaction] = useState(states.default.normal)
  const resetTimeoutRef = useRef(null)
  const [selectedMic, setSelectedMic] = useState('default')
  const [editStateKey, setEditStateKey] = useState(null)
  const [bgColor, setBgColor] = useState('#00ff00')
  const [appFocused, setAppFocused] = useState(true)

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

  // Cambia a estado y vuelve a default pasado el tiempo especificado
  const setTemporaryState = (newKey) => {
    setCurrentState(newKey)
    if (resetTimeoutRef.current) clearTimeout(resetTimeoutRef.current)
    const timeout = states[newKey]?.config?.timeout || 15
    resetTimeoutRef.current = setTimeout(() => setCurrentState('default'), timeout * 1000)
  }

  // Detección del micrófono
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
      stream = await navigator.mediaDevices.getUserMedia({ audio: { deviceId: selectedMic } })
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
  }, [selectedMic])

  // Efecto de micrófono hablando/no hablando.
  useEffect(() => {
    setSelectedReaction(isSpeaking ? states[currentState].talking : states[currentState].normal)
  }, [isSpeaking, currentState, states])

  // Eventos twitch cambian el estado
  const handleTwitchEvent = (eventType, data) => {
    let triggeredKey = null

    triggeredKey = Object.entries(states).find(([_, s]) => s.config?.event === eventType)?.[0]

    if (!triggeredKey && eventType === 'chatMessage' && data?.message) {
      triggeredKey = Object.entries(states).find(
        ([_, s]) =>
          s.config?.command && data.message.toLowerCase().includes(s.config.command.toLowerCase())
      )?.[0]
    }

    if (triggeredKey) {
      setTemporaryState(triggeredKey)
    }
  }

  const updateStateConfig = (key, newConfig) => {
    setStates((prev) => ({
      ...prev,
      [key]: {
        ...prev[key],
        config: { ...prev[key].config, ...newConfig }
      }
    }))
    setEditStateKey(null)
  }

  return (
    <div className="flex h-screen w-screen">
      <TwitchEvents onEvent={handleTwitchEvent} />
      {appFocused && (
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

          <ReactionSelector
            reactions={Object.entries(states).map(([key, val]) => ({
              name: val.config?.label || key,
              img: val.normal.img,
              key: key
            }))}
            onSelect={(reaction) => setEditStateKey(reaction.key)}
          />
        </div>
      )}
      <Preview reaction={selectedReaction} bgColor={bgColor} />
      {appFocused && (
        <div className="flex flex-col w-[320px] bg-gray-300 p-2">
          {editStateKey && (
            <ConfigMenu
              stateKey={editStateKey}
              config={states[editStateKey].config}
              onSave={updateStateConfig}
            />
          )}
        </div>
      )}
    </div>
  )
}

export default App
