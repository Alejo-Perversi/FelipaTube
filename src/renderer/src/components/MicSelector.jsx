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
      <select
        value={selected}
        onChange={(e) => onSelect(e.target.value)}
        className="p-1 border rounded w-100 truncate overflow-hidden text-ellipsis whitespace-nowrap"
        style={{ maxWidth: '10rem' }} // fallback for non-Tailwind
      >
        {devices.map((device) => (
          <option key={device.deviceId} value={device.deviceId} className="truncate">
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
