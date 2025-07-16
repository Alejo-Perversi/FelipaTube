import PropTypes from 'prop-types'
import React, { useState, useEffect, useRef } from 'react'

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
  onConfigChange,
  allReactions,
  onDelete,
  addingNew
}) {
  const [localConfig, setLocalConfig] = useState({
    name: '',
    command: '',
    event: '',
    img: '',
    talkingImg: '',
    timeout: reaction.config?.timeout ?? -1
  })
  const firstInputRef = useRef(null)

  const lastReactionName = useRef(null)

  const canDelete = reaction && reaction.name && !['Default'].includes(reaction.name)
  
  useEffect(() => {
    if (firstInputRef.current) {
      firstInputRef.current.focus()
    }
  }, [reaction, addingNew])

  useEffect(() => {
    if (reaction && !addingNew) {
      setLocalConfig({
        name: reaction.name || '',
        command: reaction.config?.command || '',
        event: reaction.config?.event || '',
        img: reaction.img || '',
        talkingImg: reaction.talkingImg || '',
        timeout: reaction.config?.timeout ?? -1
      })
    }
    if (addingNew) {
      setLocalConfig({
        name: '',
        command: '',
        event: '',
        img: '',
        talkingImg: '',
        timeout: 5
      })
    }
  }, [reaction, addingNew])

  if (!reaction) return null

  // Get all used events except for this reaction
  const usedEvents = (allReactions || [])
    .filter((r) => r.name !== reaction.name)
    .map((r) => r.config?.event)
    .filter(Boolean)

  const handleNameChange = (e) => {
    // New function to handle name input changes
    setLocalConfig((prev) => ({
      ...prev,
      name: e.target.value
    }))
  }

  const handleTriggerChange = (e) => {
    setLocalConfig((prev) => ({
      ...prev,
      event: e.target.value || ''
    }))
  }

  const handleCommandChange = (e) => {
    setLocalConfig((prev) => ({
      ...prev,
      command: e.target.value
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
    onConfigChange(reaction.name, {
      name: localConfig.name,
      command: localConfig.command,
      event: localConfig.event === '' ? null : localConfig.event,
      img: localConfig.img,
      talkingImg: localConfig.talkingImg,
      timeout: localConfig.timeout === '' ? -1 : Number(localConfig.timeout)
    })
    onClose()
  }

  return (
    <div className="absolute top-12 left-1/2 -translate-x-1/2 bg-gray-100 border rounded shadow-lg z-20 p-4 w-[340px]">
      <div className="flex flex-col gap-2">
        <h3 className="font-bold text-lg mb-2">Editor Expresión</h3>
        <label className="text-sm font-semibold">Nombre:</label>
        <input
          ref={firstInputRef}
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
            <option
              key={t.value}
              value={t.value}
              disabled={t.value && usedEvents.includes(t.value)}
            >
              {t.label}
              {t.value && usedEvents.includes(t.value) ? ' (Usado)' : ''}
            </option>
          ))}
        </select>

        <label className="text-sm font-semibold">Timeout Twitch Trigger (seg.):</label>
        <input
          type="number"
          min={-1}
          value={localConfig.timeout ?? ''}
          className="border rounded px-2 py-1 mb-2"
          onChange={(e) =>
            setLocalConfig((prev) => ({
              ...prev,
              timeout: e.target.value === '' ? '' : Number(e.target.value)
            }))
          }
        />

        <label className="text-sm font-semibold">Imágenes:</label>
        <div className="grid grid-cols-2 gap-2">
          <div className="flex flex-col items-center border p-1">
            <span className="text-s mb-1">Silencio</span>
            <img src={localConfig.img} alt="cerrada" width={80} height={80} />
            <label className="mt-2 w-full flex justify-center">
              <span className="bg-gray-500 text-white px-2 py-1 rounded cursor-pointer text-xs">
                Cambiar imagen
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
            <span className="text-s mb-1">Hablando</span>
            <img src={localConfig.talkingImg} alt="abierta" width={80} height={80} />
            <label className="mt-2 w-full flex justify-center">
              <span className="bg-gray-500 text-white px-2 py-1 rounded cursor-pointer text-xs">
                Cambiar Imagen
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
        {canDelete && (
          <button
            className="mt-2 py-2 px-4 rounded bg-red-700 text-white font-bold"
            onClick={() => {
              if (window.confirm('¿Seguro que quieres eliminar esta expresión?')) {
                onDelete(reaction.reactionKey)
              }
            }}
          >
            Eliminar
          </button>
        )}
      </div>
    </div>
  )
}

ExpressionEditorMenu.propTypes = {
  reaction: PropTypes.object,
  onClose: PropTypes.func.isRequired,
  onConfigChange: PropTypes.func.isRequired,
  allReactions: PropTypes.array,
  onDelete: PropTypes.func
}
