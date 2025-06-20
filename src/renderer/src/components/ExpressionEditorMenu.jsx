import PropTypes from 'prop-types'
import React from 'react'

export default function ExpressionEditorMenu({
  reaction,
  onClose
}) {
  return (
    <div className="absolute top-12 left-1/2 -translate-x-1/2 bg-gray-100 border rounded shadow-lg z-20 p-4 w-[340px]">
      <div className="flex flex-col gap-2">
        <h3 className="font-bold text-lg mb-2">Editor Expresión</h3>
        <label className="text-sm font-semibold">Nombre:</label>
        <input
          type="text"
          value={reaction.name}
          className="border rounded px-2 py-1 mb-2"
          readOnly
        />

        <label className="text-sm font-semibold">Twitch Trigger:</label>
        <select className="border rounded px-2 py-1 mb-2">
          <option>Ninguna</option>
          <option>New Follow</option>
          <option>New Subscription</option>
          <option>Cheered Bits</option>
          <option>Channel Points Redeem</option>
        </select>

        <label className="text-sm font-semibold">Hot Key:</label>
        <input
          type="text"
          value="Ctrl + 1"
          className="border rounded px-2 py-1 mb-2"
          readOnly
        />

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
          {/* Puedes agregar más imágenes según tu estructura */}
        </div>

        <button
          className="mt-4 py-2 px-4 rounded bg-red-500 text-white font-bold"
          onClick={onClose}
        >
          Cerrar
        </button>
      </div>
    </div>
  )
}