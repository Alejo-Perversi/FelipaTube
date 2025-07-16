# Eventos de Twitch - Documentación

## Eventos Actualmente Soportados

La aplicación actualmente soporta los siguientes eventos de Twitch:

### Eventos Automáticos (EventSub)
- **follow**: Se activa cuando alguien sigue el canal
- **subscription**: Se activa cuando alguien se suscribe al canal
- **bits**: Se activa cuando alguien dona bits
- **point redemption**: Se activa cuando alguien canjea puntos del canal

### Eventos de Chat (TMI)
- **chatMessage**: Se activa con cualquier mensaje del chat
- **Comandos personalizados**: Se pueden configurar comandos como `!feliz`, `!triste`, etc.

## Cómo Agregar Nuevos Eventos

### 1. Eventos de EventSub (Recomendado)

Para agregar nuevos eventos de Twitch, necesitas modificar el archivo `src/main/twitchService.js`:

#### Ejemplo: Agregar evento de Raid

```javascript
// En setupFollowWebSocket(), agregar el nuevo evento
if (metadata.message_type === 'notification') {
  const { subscription, event } = payload
  
  if (subscription.type === 'channel.follow') {
    this.emit('follow', {
      channel: this.userInfo.login,
      username: event.user_name
    })
  }
  
  // Agregar nuevo evento
  if (subscription.type === 'channel.raid') {
    this.emit('raid', {
      channel: this.userInfo.login,
      raider: event.from_broadcaster_user_name,
      viewers: event.viewers
    })
  }
}

// En subscribeToFollowEvents(), agregar la suscripción
async subscribeToFollowEvents() {
  // ... código existente ...
  
  // Agregar suscripción para raid
  await axios.post(
    'https://api.twitch.tv/helix/eventsub/subscriptions',
    {
      type: 'channel.raid',
      version: '1',
      condition: {
        to_broadcaster_user_id: this.userInfo.id
      },
      transport: {
        method: 'websocket',
        session_id: this.sessionId
      }
    },
    {
      headers: {
        'Client-ID': TWITCH_CONFIG.clientId,
        Authorization: `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json'
      }
    }
  )
}
```

#### Ejemplo: Agregar evento de Host

```javascript
// En setupEventHandlers(), agregar el handler
this.client.on('hosting', (channel, target, viewers) => {
  this.emit('host', {
    channel,
    target,
    viewers
  })
})
```

### 2. Eventos de TMI (Chat)

Para eventos del chat, puedes agregar handlers en `setupEventHandlers()`:

```javascript
// Ejemplo: Detectar emotes específicos
this.client.on('message', (channel, tags, message, self) => {
  if (self) return
  
  // Detectar emotes específicos
  if (message.includes('Kappa') || message.includes('PogChamp')) {
    this.emit('emote', {
      channel,
      username: tags.username,
      emote: message.includes('Kappa') ? 'Kappa' : 'PogChamp'
    })
  }
  
  // Detectar palabras clave
  if (message.toLowerCase().includes('lol') || message.toLowerCase().includes('haha')) {
    this.emit('laugh', {
      channel,
      username: tags.username,
      message
    })
  }
})
```

### 3. Eventos Personalizados

También puedes crear eventos completamente personalizados:

```javascript
// Ejemplo: Evento de actividad del streamer
this.client.on('message', (channel, tags, message, self) => {
  if (self) return
  
  // Detectar cuando el streamer menciona algo específico
  if (message.toLowerCase().includes('!streamer')) {
    this.emit('streamer_mention', {
      channel,
      username: tags.username,
      message
    })
  }
})
```

## Cómo Usar los Nuevos Eventos

Una vez que hayas agregado el evento en el backend:

1. **En la aplicación**: Ve a "Agregar Nueva Expresión"
2. **Selecciona**: "Evento Personalizado..."
3. **Escribe**: El nombre del evento (ej: "raid", "host", "emote")
4. **Configura**: Las imágenes y duración
5. **Guarda**: La nueva expresión

## Lista de Eventos Disponibles en Twitch

### EventSub Events
- `channel.follow`
- `channel.subscribe`
- `channel.subscription.gift`
- `channel.subscription.message`
- `channel.cheer`
- `channel.raid`
- `channel.host`
- `channel.channel_points_custom_reward_redemption.add`
- `channel.poll.begin`
- `channel.poll.progress`
- `channel.poll.end`
- `channel.prediction.begin`
- `channel.prediction.progress`
- `channel.prediction.lock`
- `channel.prediction.end`

### TMI Events
- `message` (chat)
- `subscription`
- `resubscription`
- `giftpaidupgrade`
- `anongiftpaidupgrade`
- `hosting`
- `hosted`
- `raided`
- `cheer`
- `clearchat`
- `usernotice`

## Notas Importantes

1. **Permisos**: Algunos eventos requieren permisos específicos en la aplicación de Twitch
2. **Rate Limits**: Twitch tiene límites de rate para las suscripciones
3. **Testing**: Siempre prueba los eventos en un entorno de desarrollo
4. **Documentación**: Consulta la [documentación oficial de Twitch](https://dev.twitch.tv/docs/eventsub) para más detalles

## Ejemplo Completo: Agregar Evento de Raid

```javascript
// 1. Agregar en setupFollowWebSocket()
if (subscription.type === 'channel.raid') {
  this.emit('raid', {
    channel: this.userInfo.login,
    raider: event.from_broadcaster_user_name,
    viewers: event.viewers
  })
}

// 2. Agregar suscripción
await axios.post(
  'https://api.twitch.tv/helix/eventsub/subscriptions',
  {
    type: 'channel.raid',
    version: '1',
    condition: {
      to_broadcaster_user_id: this.userInfo.id
    },
    transport: {
      method: 'websocket',
      session_id: this.sessionId
    }
  },
  {
    headers: {
      'Client-ID': TWITCH_CONFIG.clientId,
      Authorization: `Bearer ${this.accessToken}`,
      'Content-Type': 'application/json'
    }
  }
)

// 3. En la app, crear expresión con evento "raid"
```

¡Con estos pasos podrás agregar cualquier evento de Twitch que necesites! 