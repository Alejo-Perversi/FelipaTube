import PropTypes from 'prop-types'

export default function ReactionSelector({ onSelect, reactions }) {
  return (
    <div className="w-[300px] bg-gray-300 p-2">
      <h4 className="text-2xl font-bold mb-2">Expresiones</h4>
      <div className="grid grid-cols-2 gap-4 mt-4">
        {reactions.map((r) => (
          <div
            key={r.name}
            className="bg-white rounded-xl shadow p-2 flex flex-col items-center cursor-pointer hover:scale-105 transition-transform"
            onClick={() => onSelect(r)}
          >
            <img src={r.img} alt={r.name} width={100} height={100} />
            <span className="mt-2 text-center text-sm font-medium">{r.name}</span>
          </div>
        ))}
        {/* Card para agregar nueva reacción */}
        {/* <div
          className="bg-white rounded-xl shadow p-2 flex flex-col items-center justify-center cursor-pointer hover:scale-105 transition-transform"
          onClick={onAdd}
        >
          <div className="flex items-center justify-center w-16 h-16 border-2 border-gray-400 rounded-full">
            <span className="text-4xl text-gray-400">+</span>
          </div>
          <span className="mt-2 text-center text-sm font-medium text-gray-400">Agregar</span>
        </div> */}
      </div>
    </div>
  )
}

ReactionSelector.propTypes = {
  onSelect: PropTypes.func.isRequired,
  // onAdd: PropTypes.func,
  reactions: PropTypes.arrayOf(
    PropTypes.shape({
      name: PropTypes.string.isRequired,
      img: PropTypes.any.isRequired
    })
  ).isRequired
}
