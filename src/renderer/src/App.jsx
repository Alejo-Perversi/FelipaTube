// App.jsx
import { useState } from 'react';

import ReactionSelector from './components/ReactionSelector';
import Preview from './components/Preview';
import TwitchConnection from './components/TwitchConnection';
import { TwitchEvents } from './components/TwitchEvents';
import { useVoiceRMS } from './hooks/useVoiceRMS';        // ← nuevo hook

// Sprites
import defaultImg      from './assets/Default_Closed_Mouth.png';
import followerImg     from './assets/Follower_Closed_Mouth.png';
import subImg          from './assets/Subscriber_Open_Mouth.png';
import bitsImg         from './assets/Bits_Closed_Mouth.png';
import clownImg        from './assets/Payaso_Open_Mouth.png';
import talkingImg      from './assets/Default_Open_Mouth.png'; // ← añade tu PNG

// ---------- Datos de referencia ----------
const initialReactions = [
  { id: 'default',        name: 'Default',        img: defaultImg },
  { id: 'follow',         name: 'Nuevo seguidor', img: followerImg },
  { id: 'subscription',   name: 'Suscripción',    img: subImg },
  { id: 'bits',           name: 'Bits',           img: bitsImg },
  { id: 'clown',          name: 'Payaso',         img: clownImg },
  { id: 'talking',        name: 'Habla',          img: talkingImg }, // 👈  nuevo
];

// Para buscar rápido por id
const REACTIONS = Object.fromEntries(
  initialReactions.map(r => [r.id, r])
);

export default function App() {
  const [selectedReaction, setSelectedReaction] = useState(REACTIONS.default);

  /* ------------------------------------------------------------------
   * 1.  EVENTOS DE TWITCH
   * ------------------------------------------------------------------ */
  const handleTwitchEvent = (eventType, data) => {
    console.log('Evento recibido:', eventType, data);

    switch (eventType) {
      case 'disconnect':
        setSelectedReaction(REACTIONS.default);
        break;

      case 'follow':
        setSelectedReaction(REACTIONS.follow);
        break;

      case 'subscription':
        setSelectedReaction(REACTIONS.subscription);
        break;

      case 'bits':
        setSelectedReaction(REACTIONS.bits);
        break;

      case 'chatMessage': {
        const msg = data.message.toLowerCase();
        if (msg.includes('!payaso'))       setSelectedReaction(REACTIONS.clown);
        else if (msg.includes('!seguidor')) setSelectedReaction(REACTIONS.follow);
        else if (msg.includes('!subscripcion')) setSelectedReaction(REACTIONS.subscription);
        else if (msg.includes('!bits'))        setSelectedReaction(REACTIONS.bits);
        break;
      }

      default:
        console.log('Evento no manejado:', eventType);
    }
  };

  /* ------------------------------------------------------------------
   * 2.  DETECCIÓN DE VOZ (RMS)
   *     - cuando hablas  → REACTIONS.talking
   *     - cuando callas  → no hace nada (mantiene el último estado Twitch)
   * ------------------------------------------------------------------ */
  useVoiceRMS({
    threshold: 0.02,       // ajusta sensibilidad
    holdMs: 350,
    onChange: talking => {
      if (talking) {
        setSelectedReaction(REACTIONS.talking);
      } else {
        // Volvemos al default sólo si no hay otra reacción “activa”
        setSelectedReaction(prev =>
          prev.id === 'talking' ? REACTIONS.default : prev
        );
      }
    },
  });

  /* ------------------------------------------------------------------ */
  return (
    <div className="flex h-screen w-screen">
      {/* ─────────── Background listeners ─────────── */}
      <TwitchEvents onEvent={handleTwitchEvent} />

      {/* ─────────── Side panel ─────────── */}
      <div className="flex w-[320px] flex-col bg-gray-300 p-2">
        <TwitchConnection onEvent={handleTwitchEvent} />
        <ReactionSelector
          reactions={initialReactions}
          onSelect={r => setSelectedReaction(r)}
        />
      </div>

      {/* ─────────── Avatar preview ─────────── */}
      <Preview reaction={selectedReaction} />
    </div>
  );
}
