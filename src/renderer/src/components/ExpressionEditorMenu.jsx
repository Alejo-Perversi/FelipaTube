import PropTypes from 'prop-types'
import React, { useState, useEffect } from 'react'

const twitchTriggers = [
  { value: '', label: 'Ninguna' },
  { value: 'follow', label: 'New Follow' },
  { value: 'subscription', label: 'New Subscription' },
  { value: 'bits', label: 'Cheered Bits' },
  { value: 'point redemption', label: 'Channel Points Redeem' }
]

export default function ExpressionEditorMenu({
  reaction,
  onClose,
  onConfigChange
}) {
  const [localConfig, setLocalConfig] = useState({
    command: '',
    event: ''
  })

  useEffect(() => {
    if (reaction) {
      setLocalConfig({
        command: reaction.config?.command || '',
        event: reaction.config?.event || ''
      })
    }
  }, [reaction])

  if (!reaction) return null

  const handleNameChange = (e) => { // New function to handle name input changes
    setLocalConfig((prev) => ({
      ...prev,
      name: e.target.value
    }))
  }

  const handleTriggerChange = (e) => {
    setLocalConfig((prev) => ({
      ...prev,
      event: e.target.value || null
    }))
  }

  const handleCommandChange = (e) => {
    setLocalConfig((prev) => ({
      ...prev,
      command: e.target.value
    }))
  }

  const handleSave = () => {
    onConfigChange(reaction.name, {
      command: localConfig.command,
      event: localConfig.event === '' ? null : localConfig.event
    })
    onClose()
  }

  return (
    <div className="absolute top-12 left-1/2 -translate-x-1/2 bg-gray-100 border rounded shadow-lg z-20 p-4 w-[340px]">
      <div className="flex flex-col gap-2">
        <h3 className="font-bold text-lg mb-2">Editor Expresión</h3>
        <label className="text-sm font-semibold">Nombre:</label>
        <input
          type="text"
          value={localConfig.name} // Use local state for the value
          className="border rounded px-2 py-1 mb-2"
          onChange={handleNameChange} // Allow editing
        />

        <label className="text-sm font-semibold">Comando:</label>
        <input
          type="text"
          value={localConfig.command}
          className="border rounded px-2 py-1 mb-2"
          onChange={handleCommandChange}
        />

        <label className="text-sm font-semibold">Twitch Trigger:</label>
        <select
          className="border rounded px-2 py-1 mb-2"
          value={localConfig.event || ''}
          onChange={handleTriggerChange}
        >
          {twitchTriggers.map((t) => (
            <option key={t.value} value={t.value}>{t.label}</option>
          ))}
        </select>

        <label className="text-sm font-semibold">Imágenes:</label>
        <div className="grid grid-cols-2 gap-2">
          <div className="flex flex-col items-center border p-1">
            <span className="text-xs mb-1">Ojos abiertos - boca cerrada</span>
            <img src={reaction.img} alt="cerrada" width={80} height={80} />
          </div>
          <div className="flex flex-col items-center border p-1">
            <span className="text-xs mb-1">Ojos abiertos - boca abierta</span>
            <img src={reaction.img} alt="abierta" width={80} height={80} />
          </div>
        </div>

        <div className="flex gap-2 mt-4">
          <button
            className="py-2 px-4 rounded bg-green-600 text-white font-bold flex-1"
            onClick={handleSave}
          >
            Guardar
          </button>
          <button
            className="py-2 px-4 rounded bg-red-500 text-white font-bold flex-1"
            onClick={onClose}
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  )
}

ExpressionEditorMenu.propTypes = {
  reaction: PropTypes.object,
  onClose: PropTypes.func.isRequired,
  onConfigChange: PropTypes.func.isRequired
}