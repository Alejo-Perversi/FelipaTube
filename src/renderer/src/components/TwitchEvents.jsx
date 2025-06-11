import { useEffect } from 'react'
import PropTypes from 'prop-types'

export function TwitchEvents({ onEvent }) {
  useEffect(() => {
    // Configurar listeners para eventos de Twitch
    window.api.twitch.onChatMessage((data) => {
      onEvent('chatMessage', data)
    })

    window.api.twitch.onSubscription((data) => {
      onEvent('subscription', data)
    })

    window.api.twitch.onBits((data) => {
      onEvent('bits', data)
    })

    window.api.twitch.onFollow((data) => {
      onEvent('follow', data)
    })
  }, [])

  return null // Este componente no renderiza nada visualmente
}

TwitchEvents.propTypes = {
  onEvent: PropTypes.func.isRequired
}
