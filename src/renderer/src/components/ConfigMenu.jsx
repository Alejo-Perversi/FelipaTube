// ✅ ConfigMenu.jsx
import PropTypes from 'prop-types'
import { useState, useEffect } from 'react'

const twitchEvents = [
  'follow',
  'subscription',
  'bits',
  'raid',
  'cheer',
  'gift'
  // No 'chatMessage' on purpose
]

export default function ConfigMenu({ stateKey, config = {}, onSave, states = {} }) {
  const [label, setLabel] = useState(config.label || '')
  const [command, setCommand] = useState(config.command || '')
  const [event, setEvent] = useState(config.event || '')
  const [timeout, setTimeoutValue] = useState(config.timeout || 15)
  const [error, setError] = useState('')
  const [conflictKey, setConflictKey] = useState(null)
  const [attemptedSave, setAttemptedSave] = useState(false)

  useEffect(() => {
    setLabel(config.label || '')
    setCommand(config.command || '')
    setEvent(config.event || '')
    setTimeoutValue(config.timeout || 15)
    setError('')
    setConflictKey(null)
    setAttemptedSave(false)
  }, [config])

  const handleSave = () => {
    setAttemptedSave(true)

    // Prevent duplicate Twitch event assignments (except "")
    if (event) {
      const duplicate = Object.entries(states).find(
        ([key, val]) => key !== stateKey && val.config?.event === event
      )
      if (duplicate) {
        setConflictKey(duplicate[0])
        setError(`⚠ Ya hay un estado asignado al evento "${event}" (${duplicate[0]})`)
        return
      }
    } else if (config.event && event === '') {
      // User cleared the event — unsubscribe on save
      window.api?.twitch?.removeEventSub?.(config.event)
    }

    setError('') // Clear any prior error on success
    setConflictKey(null)

    // ⚠ Delay hiding the menu if error was previously set
    if (!error) {
      onSave(stateKey, {
        label,
        command,
        event,
        timeout: parseInt(timeout)
      })
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <h2 className="text-lg font-semibold">🛠 Configurar estado: {stateKey}</h2>

      <label className="text-sm">🏷 Nombre para mostrar</label>
      <input
        className="border p-1 rounded"
        value={label}
        onChange={(e) => setLabel(e.target.value)}
      />

      <label className="text-sm">💬 Comando de chat</label>
      <input
        className="border p-1 rounded"
        value={command}
        onChange={(e) => setCommand(e.target.value)}
      />

      <label className="text-sm">⚡ Evento de Twitch</label>
      <select
        className="border p-1 rounded"
        value={event}
        onChange={(e) => setEvent(e.target.value)}
      >
        <option value="">(ninguno)</option>
        {twitchEvents.map((evt) => (
          <option key={evt} value={evt}>
            {evt}
          </option>
        ))}
      </select>

      {conflictKey && attemptedSave && (
        <div className="text-xs text-red-500 italic font-medium">
          ⚠ Evento ya está asignado a: <strong>{conflictKey}</strong>. Libéralo desde su panel antes de reasignarlo.
        </div>
      )}

      <label className="text-sm">⏱ Tiempo antes de volver al estado default (segundos)</label>
      <input
        type="number"
        min={1}
        className="border p-1 rounded"
        value={timeout}
        onChange={(e) => setTimeoutValue(e.target.value)}
      />

      {error && (
        <div className="text-red-500 text-sm font-semibold">{error}</div>
      )}

      <button onClick={handleSave} className="mt-2 bg-blue-500 text-white rounded px-3 py-1">
        Guardar
      </button>
    </div>
  )
}

ConfigMenu.propTypes = {
  stateKey: PropTypes.string.isRequired,
  config: PropTypes.object,
  onSave: PropTypes.func.isRequired,
  states: PropTypes.object
}
