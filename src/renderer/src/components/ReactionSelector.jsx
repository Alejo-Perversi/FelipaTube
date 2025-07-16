import PropTypes from 'prop-types'
import addIcon from '../assets/add.png'

function forceWindowRefocus() {
  const { remote } = window.require('electron')
  remote.getCurrentWindow().blur()
  setTimeout(() => {
    remote.getCurrentWindow().focus()
  }, 100)
}

export default function ReactionSelector({
  onSelect,
  reactions,
  openMenuReaction,
  setOpenMenuReaction,
  onAdd,
  statesData
}) {
  return (
    <div className="w-[300px] bg-gray-300 p-2">
      <h4 className="text-xl font-bold mb-2">Expresiones</h4>
      <div
        className="overflow-y-auto overflow-x-hidden"
        style={{ maxHeight: '480px', width: '100%' }}
      >
        <div className="grid grid-cols-2 gap-4 mt-4">
          {reactions.map((r) => (
            <div
              key={r.name}
              className="relative bg-white rounded-xl shadow p-2 flex flex-col items-center cursor-pointer hover:bg-gray-200 transition-colors"
              onClick={() => onSelect(r)}
              onContextMenu={(e) => {
                e.preventDefault()
                const matched = Object.entries(statesData).find(([, s]) => s.normal.img === r.img)
                if (matched) setOpenMenuReaction(matched[0])
                forceWindowRefocus()
              }}
            >
              <img src={r.img} alt={r.name} width={100} height={100} />
              <span className="mt-2 text-center text-sm font-medium">{r.name}</span>
            </div>
          ))}
          {/* Card para agregar nueva reacción */}
          <div
            className="relative bg-white rounded-xl shadow p-2 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-200 transition-colors"
            onClick={() => {
              onAdd()
              forceWindowRefocus()
            }}
            onContextMenu={(e) => {
              e.preventDefault()
              onAdd()
              forceWindowRefocus()
            }}
          >
            <img src={addIcon} alt="Nueva Expresión" width={60} height={60} />
            <span className="mt-2 text-center text-sm font-medium text-gray-500">
              Nueva Expresión
            </span>
          </div>
        </div>
      </div>
      <h1 className="mt-4 text-lg font-semibold text-center text-purple-500 hover:text-purple-700 transition-colors">
        Click derecho en la imagen que quieras para ver configuraciones
      </h1>
    </div>
  )
}

ReactionSelector.propTypes = {
  onSelect: PropTypes.func.isRequired,
  reactions: PropTypes.arrayOf(
    PropTypes.shape({
      name: PropTypes.string.isRequired,
      img: PropTypes.any.isRequired
    })
  ).isRequired,
  openMenuReaction: PropTypes.string,
  setOpenMenuReaction: PropTypes.func,
  onAdd: PropTypes.func,
  statesData: PropTypes.object
}
