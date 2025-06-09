import { useState } from 'react'

import ReactionSelector from './components/ReactionSelector'
import Preview from './components/Preview'
import TwitchConnection from './components/TwitchConnection'
import { TwitchEvents } from './components/TwitchEvents'
import { useMicDetector } from './hooks/MicrophoneActivity'

import Default_Closed_Mouth from './assets/Default_Closed_Mouth.png'
import Default_Open_Mouth from './assets/Default_Open_Mouth.png'
import Follower_Closed_Mouth from './assets/Follower_Closed_Mouth.png'
import Subscriber_Closed_Mouth from './assets/Subscriber_Closed_Mouth.png'
import Bits_Closed_Mouth from './assets/Bits_Closed_Mouth.png'
import Payaso_Open_Mouth from './assets/Payaso_Open_Mouth.png'

const initialReactions = [
  { name: 'Default', img: Default_Closed_Mouth },
  { name: 'Nuevo seguidor', img: Follower_Closed_Mouth },
  { name: 'Suscripción', img: Subscriber_Closed_Mouth },
  { name: 'Bits', img: Bits_Closed_Mouth },
  { name: 'Payaso', img: Payaso_Open_Mouth }
]
const states = {
  default: {
    normal: { name: 'normal', img: Default_Closed_Mouth },
    talking: { name: 'talking', img: Default_Open_Mouth }
  }
}

function App() {
  const [selectedReaction, setSelectedReaction] = useState(states.default.normal)

  useMicDetector((isSpeaking) => {
    console.log('UseMicDetector ran')
    setSelectedReaction(isSpeaking ? states.default.talking : states.default.normal)
  })

  const handleTwitchEvent = (eventType, data) => {
    console.log('Evento recibido:', eventType, data)

    // Mapear eventos de Twitch a reacciones
    switch (eventType) {
      case 'disconnect':
        console.log('Desconectado de Twitch')
        setSelectedReaction(initialReactions[0])
        break
      case 'follow':
        console.log('Nuevo seguidor detectado')
        setSelectedReaction(initialReactions[1]) // Nuevo seguidor
        break
      case 'subscription':
        console.log('Nueva suscripción detectada')
        setSelectedReaction(initialReactions[2]) // Suscripción
        break
      case 'bits':
        console.log('Bits detectados')
        setSelectedReaction(initialReactions[3]) // Bits
        break
      case 'chatMessage': {
        console.log('Mensaje recibido:', data.message)
        const message = data.message.toLowerCase()

        // Palabras clave para simular eventos
        if (message.includes('!payaso')) {
          console.log('Activando reacción de payaso')
          setSelectedReaction(initialReactions[4])
        }
        if (message.includes('!seguidor')) {
          console.log('Activando reacción de seguidor')
          setSelectedReaction(initialReactions[1])
        }
        if (message.includes('!subscripcion')) {
          console.log('Activando reacción de subscripcion')
          setSelectedReaction(initialReactions[2])
        }
        if (message.includes('!bits')) {
          console.log('Activando reacción de bits')
          setSelectedReaction(initialReactions[3])
        }
        break
      }
      default:
        console.log('Evento no manejado:', eventType)
        break
    }
  }

  console.log('test')
  return (
    <div className="flex h-screen w-screen">
      <TwitchEvents onEvent={handleTwitchEvent} />
      <div className="flex flex-col w-[320px] bg-gray-300 p-2">
        <TwitchConnection onEvent={handleTwitchEvent} />
        <ReactionSelector onSelect={setSelectedReaction} reactions={initialReactions} />
      </div>
      <Preview reaction={selectedReaction} />
    </div>
  )
}

export default App
