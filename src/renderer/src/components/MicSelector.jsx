import { useEffect, useState } from 'react'
import PropTypes from 'prop-types'

export default function MicSelector({ selected, onSelect }) {
  const [devices, setDevices] = useState([])

  useEffect(() => {
    const getMics = async () => {
      const all = await navigator.mediaDevices.enumerateDevices()
      const mics = all.filter((d) => d.kind === 'audioinput')
      setDevices(mics)
    }

    getMics()
  }, [])

  return (
    <div className="flex flex-col mb-4">
      <label className="text-sm font-semibold mb-1">🎤 Micrófono:</label>
      <select
        value={selected}
        onChange={(e) => onSelect(e.target.value)}
        className="p-1 border rounded"
      >
        {devices.map((device) => (
          <option key={device.deviceId} value={device.deviceId}>
            {device.label || `Microphone ${device.deviceId.slice(-4)}`}
          </option>
        ))}
      </select>
    </div>
  )
}

MicSelector.propTypes = {
  selected: PropTypes.string,
  onSelect: PropTypes.func.isRequired
}
