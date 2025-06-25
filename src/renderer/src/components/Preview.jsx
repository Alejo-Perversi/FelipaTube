import PropTypes from 'prop-types'
import { useEffect, useState } from 'react'

export default function Preview({ reaction, bgColor, isTalking }) {
  const [animationKey, setAnimationKey] = useState(0)

  useEffect(() => {
    if (isTalking) {
      setAnimationKey((prev) => prev + 1)
    }
  }, [isTalking])

  return (
    <div
      className="flex-1 flex items-center justify-center min-h-screen"
      style={{ backgroundColor: bgColor || '#00FF00' }}
    >
      {reaction && (
        <img
          key={animationKey}
          src={reaction.img}
          alt={reaction.name}
          width={500}
          height={500}
          className={`transition-transform duration-300 ${isTalking ? 'animate-bounce-y' : ''}`}
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
  bgColor: PropTypes.string,
  isTalking: PropTypes.bool
}
