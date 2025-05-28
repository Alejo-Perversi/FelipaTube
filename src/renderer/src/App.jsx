import { useState } from 'react'

import ReactionSelector from './components/ReactionSelector'
import Preview from './components/Preview'
import TwitchConnection from './components/TwitchConnection'
import { TwitchEvents } from './components/TwitchEvents'
import defaultimg from './assets/Default_Closed_Mouth.png'
import emojiHappy from './assets/Follower_Closed_Mouth.png'
import emojiSad from './assets/Subscriber_Open_Mouth.png'
import emojiSurprised from './assets/Bits_Closed_Mouth.png'
import emojiAngry from './assets/Payaso_Open_Mouth.png'

const initialReactions = [
  { name: 'Default', img: defaultimg },
  { name: 'Nuevo seguidor', img: emojiHappy },
  { name: 'Suscripción', img: emojiSad },
  { name: 'Bits', img: emojiSurprised },
  { name: 'Payaso', img: emojiAngry }
]

function App() {
  const [selectedReaction, setSelectedReaction] = useState(null)

  const handleTwitchEvent = (eventType, data) => {
    console.log('Evento recibido:', eventType, data)

    // Mapear eventos de Twitch a reacciones
    switch (eventType) {
      case 'disconnect':
        console.log('Desconectado de Twitch')
        setSelectedReaction(null)
        break
      case 'follow':
        console.log('Nuevo seguidor detectado')
        setSelectedReaction(initialReactions[0]) // Nuevo seguidor
        break
      case 'subscription':
        console.log('Nueva suscripción detectada')
        setSelectedReaction(initialReactions[1]) // Suscripción
        break
      case 'bits':
        console.log('Bits detectados')
        setSelectedReaction(initialReactions[2]) // Bits
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
