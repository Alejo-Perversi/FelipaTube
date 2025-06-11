import { useState, useEffect, useRef } from 'react'

import ReactionSelector from './components/ReactionSelector'
import Preview from './components/Preview'
import MicSelector from './components/MicSelector'
import TwitchConnection from './components/TwitchConnection'
import { TwitchEvents } from './components/TwitchEvents'

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
    normal: { name: 'normal', img: Default_Closed_Mouth },
    talking: { name: 'talking', img: Default_Open_Mouth }
  },
  follower: {
    normal: { name: 'normal', img: Follower_Closed_Mouth },
    talking: { name: 'talking', img: Follower_Open_Mouth }
  },
  subscriber: {
    normal: { name: 'normal', img: Subscriber_Closed_Mouth },
    talking: { name: 'talking', img: Subscriber_Open_Mouth }
  },
  bits: {
    normal: { name: 'normal', img: Bits_Closed_Mouth },
    talking: { name: 'talking', img: Bits_Open_Mouth }
  },
  payaso: {
    normal: { name: 'normal', img: Payaso_Closed_Mouth },
    talking: { name: 'talking', img: Payaso_Open_Mouth }
  }
}

function App() {
  const [currentState, setCurrentState] = useState('default')
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [selectedReaction, setSelectedReaction] = useState(states.default.normal)
  const resetTimeoutRef = useRef(null)
  const [selectedMic, setSelectedMic] = useState('default')

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

      //micGaby = '704c61f76325013004cc96c8b4ca902f5e3fd0e33056042b1dfc285398572f53'

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
  }, [isSpeaking, currentState])

  // Eventos twitch cambian el estado
  const handleTwitchEvent = (eventType, data) => {
    console.log('Evento recibido:', eventType, data)

    switch (eventType) {
      case 'disconnect':
        setTemporaryState('default')
        break
      case 'follow':
        setTemporaryState('follower')
        break
      case 'subscription':
        setTemporaryState('subscriber')
        break
      case 'bits':
        setTemporaryState('bits')
        break
      case 'chatMessage': {
        const message = data.message.toLowerCase()
        if (message.includes('!payaso')) setTemporaryState('payaso')
        if (message.includes('!seguidor')) setTemporaryState('follower')
        if (message.includes('!subscripcion')) setTemporaryState('subscriber')
        if (message.includes('!bits')) setTemporaryState('bits')
        break
      }
      default:
        console.log('Evento no manejado:', eventType)
        break
    }
  }

  return (
    <div className="flex h-screen w-screen">
      <TwitchEvents onEvent={handleTwitchEvent} />
      <div className="flex flex-col w-[320px] bg-gray-300 p-2">
        <TwitchConnection onEvent={handleTwitchEvent} />
        <MicSelector selected={selectedMic} onSelect={setSelectedMic} />
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
      <Preview reaction={selectedReaction} />
    </div>
  )
}

export default App
