// ✅ Preview.jsx
import PropTypes from 'prop-types'
import { useEffect, useState } from 'react'

export default function Preview({ reaction, bgColor }) {
  const [animationKey, setAnimationKey] = useState(0)

  useEffect(() => {
    if (reaction?.name === 'talking') {
      setAnimationKey((prev) => prev + 1)
    }
  }, [reaction])

  return (
    <div
      className="flex-1 flex items-center justify-center min-h-screen"
      style={{ backgroundColor: bgColor }}
    >
      {reaction && (
        <img
          key={animationKey}
          src={reaction.img}
          alt={reaction.name}
          width={256}
          height={256}
          className={`transition-transform duration-300 ${
            reaction.name === 'talking' ? 'animate-bounce-slight' : ''
          }`}
        />
      )}
    </div>
  )
}

Preview.propTypes = {
  reaction: PropTypes.shape({
    img: PropTypes.any,
    name: PropTypes.string
  }),
  bgColor: PropTypes.string
}
