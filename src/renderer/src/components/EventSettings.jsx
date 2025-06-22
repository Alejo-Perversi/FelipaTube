// src/renderer/components/EventSettings.jsx (versión actualizada)
import React, { useState, useEffect } from 'react'

const TWITCH_EVENTS = [
    'follow', 
    'subscription', 
    'bits', 
    'raid', 
    'chatMessage' // Solo una versión, en minúsculas
];

export function EventSettings({ isVisible, onClose, onSave, availableExpressions }) {
  const [config, setConfig] = useState({})

  useEffect(() => {
    if (isVisible) {
      window.api.loadExpressionConfig().then((loadedConfig) => {
        setConfig(loadedConfig || {})
      })
    }
  }, [isVisible])

  const handleSave = () => {
    window.api.saveExpressionConfig(config).then(() => {
      onSave(config) // Llama a la función del padre para actualizar el estado
      onClose()
    })
  }

  const handleSelectChange = (twitchEvent, expression) => {
    setConfig((prevConfig) => ({
      ...prevConfig,
      [twitchEvent]: expression
    }))
  }

  if (!isVisible) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-gray-200 text-black p-6 rounded-lg shadow-xl w-full max-w-md">
        <h2 className="font-bold text-2xl mb-4">Configuración de Eventos</h2>
        <div className="space-y-4">
          {TWITCH_EVENTS.map((event) => (
            <div key={event} className="flex items-center justify-between">
              <label className="text-lg capitalize">{event}:</label>
              <select
                value={config[event] || ''}
                onChange={(e) => handleSelectChange(event, e.target.value)}
                className="bg-white border border-gray-400 p-2 rounded w-1/2"
              >
                <option value="" disabled>-- Selecciona --</option>
                {availableExpressions.map((expr) => (
                  <option key={expr} value={expr} className="capitalize">{expr}</option>
                ))}
              </select>
            </div>
          ))}
        </div>
        <div className="mt-6 flex justify-end space-x-4">
          <button onClick={onClose} className="bg-gray-500 text-white px-4 py-2 rounded">Cancelar</button>
          <button onClick={handleSave} className="bg-purple-600 text-white px-4 py-2 rounded">Guardar Cambios</button>
        </div>
      </div>
    </div>
  )
}