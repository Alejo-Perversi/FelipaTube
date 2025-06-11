import PropTypes from 'prop-types'
import { useState, useEffect } from 'react'

export default function StateConfigPanel({ stateKey, config, onSave }) {
  const [label, setLabel] = useState(config?.label || '')
  const [command, setCommand] = useState(config?.command || '')
  const [event, setEvent] = useState(config?.event || '')
  const [timeout, setTimeoutValue] = useState(config?.timeout || 15)

  useEffect(() => {
    setLabel(config?.label || '')
    setCommand(config?.command || '')
    setEvent(config?.event || '')
    setTimeoutValue(config?.timeout || 15)
  }, [config])

  const handleSave = () => {
    onSave(stateKey, {
      label,
      command,
      event,
      timeout: parseInt(timeout)
    })
  }

  return (
    <div className="flex flex-col gap-2">
      <h2 className="text-lg font-semibold">Configurar estado: {stateKey}</h2>

      <label className="text-sm"> Nombre </label>
      <input
        className="border p-1 rounded"
        value={label}
        onChange={(e) => setLabel(e.target.value)}
      />

      <label className="text-sm">Comando de chat</label>
      <input
        className="border p-1 rounded"
        value={command}
        onChange={(e) => setCommand(e.target.value)}
      />

      <label className="text-sm">Evento de Twitch</label>
      <input
        className="border p-1 rounded"
        value={event}
        onChange={(e) => setEvent(e.target.value)}
      />

      <label className="text-sm">Timeout (segundos)</label>
      <input
        type="number"
        min={1}
        className="border p-1 rounded"
        value={timeout}
        onChange={(e) => setTimeoutValue(e.target.value)}
      />

      <button onClick={handleSave} className="mt-2 bg-blue-500 text-white rounded px-3 py-1">
        Guardar
      </button>
    </div>
  )
}

StateConfigPanel.propTypes = {
  stateKey: PropTypes.string.isRequired,
  config: PropTypes.object,
  onSave: PropTypes.func.isRequired
}
