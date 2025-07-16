import PropTypes from 'prop-types'
import { useState } from 'react'

const twitchTriggers = [
  { value: '', label: 'Ninguna' },
  { value: 'follow', label: 'New Follow' },
  { value: 'subscription', label: 'New Subscription' },
  { value: 'bits', label: 'Cheered Bits' },
  { value: 'point redemption', label: 'Channel Points Redeem' },
  { value: 'custom', label: 'Próximamente', disabled: true }
]

export default function AddExpressionMenu({ onClose, onAddExpression, allReactions }) {
  const [localConfig, setLocalConfig] = useState({
    name: '',
    command: '',
    event: '',
    customEvent: '',
    img: '',
    talkingImg: '',
    timeout: 5
  })

  // Get all used events
  const usedEvents = (allReactions || [])
    .map((r) => r.config?.event)
    .filter(Boolean)

  const handleNameChange = (e) => {
    setLocalConfig((prev) => ({
      ...prev,
      name: e.target.value
    }))
  }

  const handleTriggerChange = (e) => {
    setLocalConfig((prev) => ({
      ...prev,
      event: e.target.value || '',
      customEvent: e.target.value === 'custom' ? prev.customEvent : ''
    }))
  }



  const handleCommandChange = (e) => {
    setLocalConfig((prev) => ({
      ...prev,
      command: e.target.value
    }))
  }

  const handleTimeoutChange = (e) => {
    setLocalConfig((prev) => ({
      ...prev,
      timeout: parseInt(e.target.value) || 5
    }))
  }

  const handleImgChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (ev) => {
        setLocalConfig((prev) => ({
          ...prev,
          img: ev.target.result // base64 string
        }))
      }
      reader.readAsDataURL(file)
    }
  }

  const handleTalkingImgChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (ev) => {
        setLocalConfig((prev) => ({
          ...prev,
          talkingImg: ev.target.result // base64 string
        }))
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSave = () => {
    // Validar que tenga nombre e imágenes
    if (!localConfig.name.trim()) {
      alert('Por favor ingresa un nombre para la expresión')
      return
    }
    
    if (!localConfig.img) {
      alert('Por favor selecciona una imagen para el estado normal')
      return
    }
    
    if (!localConfig.talkingImg) {
      alert('Por favor selecciona una imagen para el estado hablando')
      return
    }

    // Validar que el nombre no esté duplicado
    const existingNames = allReactions.map(r => r.name)
    if (existingNames.includes(localConfig.name)) {
      alert('Ya existe una expresión con ese nombre')
      return
    }

    // Validar que el comando no esté duplicado
    if (localConfig.command) {
      const existingCommands = allReactions.map(r => r.config?.command).filter(Boolean)
      if (existingCommands.includes(localConfig.command)) {
        alert('Ya existe una expresión con ese comando')
        return
      }
    }

    // Validar que el evento no esté duplicado
    if (localConfig.event && localConfig.event !== 'custom') {
      if (usedEvents.includes(localConfig.event)) {
        alert('Ya existe una expresión con ese evento de Twitch')
        return
      }
    }

    onAddExpression({
      name: localConfig.name.trim(),
      command: localConfig.command.trim(),
      event: localConfig.event === '' ? null : localConfig.event,
      img: localConfig.img,
      talkingImg: localConfig.talkingImg,
      timeout: localConfig.timeout
    })
    onClose()
  }

  return (
    <div className="absolute top-12 left-1/2 -translate-x-1/2 bg-gray-100 border rounded shadow-lg z-20 p-4 w-[340px]">
      <div className="flex flex-col gap-2">
        <h3 className="font-bold text-lg mb-2">Agregar Nueva Expresión</h3>
        
        <label className="text-sm font-semibold">Nombre: *</label>
        <input
          type="text"
          value={localConfig.name}
          className="border rounded px-2 py-1 mb-2"
          onChange={handleNameChange}
          placeholder="Ej: Feliz, Triste, Sorprendido..."
        />

        <label className="text-sm font-semibold">Comando:</label>
        <input
          type="text"
          value={localConfig.command}
          className="border rounded px-2 py-1 mb-2"
          onChange={handleCommandChange}
          placeholder="Ej: !feliz, !triste..."
        />

        <label className="text-sm font-semibold">Twitch Trigger:</label>
        <select
          className="border rounded px-2 py-1 mb-2"
          value={localConfig.event || ''}
          onChange={handleTriggerChange}
        >
          {twitchTriggers.map((t) => (
            <option
              key={t.value}
              value={t.value}
              disabled={t.disabled || (t.value && t.value !== 'custom' && usedEvents.includes(t.value))}
            >
              {t.label}
              {t.value && t.value !== 'custom' && usedEvents.includes(t.value) ? ' (Usado)' : ''}
            </option>
          ))}
        </select>



        <label className="text-sm font-semibold">Duración (segundos):</label>
        <input
          type="number"
          min="1"
          max="60"
          value={localConfig.timeout}
          className="border rounded px-2 py-1 mb-2"
          onChange={handleTimeoutChange}
        />

        <label className="text-sm font-semibold">Imágenes: *</label>
        <div className="grid grid-cols-2 gap-2">
          <div className="flex flex-col items-center border p-1">
            <span className="text-s mb-1">Silencio *</span>
            {localConfig.img ? (
              <img src={localConfig.img} alt="cerrada" width={80} height={80} />
            ) : (
              <div className="w-20 h-20 bg-gray-200 border-2 border-dashed border-gray-400 flex items-center justify-center">
                <span className="text-gray-400 text-xs text-center">Sin imagen</span>
              </div>
            )}
            <label className="mt-2 w-full flex justify-center">
              <span className="bg-blue-500 text-white px-2 py-1 rounded cursor-pointer text-xs hover:bg-blue-600">
                Seleccionar imagen
              </span>
              <input
                type="file"
                accept="image/*"
                onChange={handleImgChange}
                style={{ display: 'none' }}
              />
            </label>
          </div>
          <div className="flex flex-col items-center border p-1">
            <span className="text-s mb-1">Hablando *</span>
            {localConfig.talkingImg ? (
              <img src={localConfig.talkingImg} alt="abierta" width={80} height={80} />
            ) : (
              <div className="w-20 h-20 bg-gray-200 border-2 border-dashed border-gray-400 flex items-center justify-center">
                <span className="text-gray-400 text-xs text-center">Sin imagen</span>
              </div>
            )}
            <label className="mt-2 w-full flex justify-center">
              <span className="bg-blue-500 text-white px-2 py-1 rounded cursor-pointer text-xs hover:bg-blue-600">
                Seleccionar imagen
              </span>
              <input
                type="file"
                accept="image/*"
                onChange={handleTalkingImgChange}
                style={{ display: 'none' }}
              />
            </label>
          </div>
        </div>

        <div className="flex gap-2 mt-4">
          <button
            className="py-2 px-4 rounded bg-green-600 text-white font-bold flex-1 hover:bg-green-700"
            onClick={handleSave}
          >
            Crear Expresión
          </button>
          <button
            className="py-2 px-4 rounded bg-red-500 text-white font-bold flex-1 hover:bg-red-600"
            onClick={onClose}
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  )
}

AddExpressionMenu.propTypes = {
  onClose: PropTypes.func.isRequired,
  onAddExpression: PropTypes.func.isRequired,
  allReactions: PropTypes.array
}
