import { useEffect, useRef } from 'react'

export function useMicDetector(onSpeakingChange, threshold = 0.02) {
  const audioContextRef = useRef(null)
  const analyserRef = useRef(null)
  const dataArrayRef = useRef(null)
  const animationFrameRef = useRef(null)
  const previousSpeakingRef = useRef(false)
  console.log('mic UseMicDetector called')

  navigator.mediaDevices.enumerateDevices().then((devices) => {
    const audioInputs = devices.filter((device) => device.kind === 'audioinput')
    console.log('[Mic] Available input devices:', audioInputs)
  })

  useEffect(() => {
    let stream

    const startMic = async () => {
      try {
        console.log('[Mic] Requesting mic...')

        console.log('[Mic] Enumerating devices...')
        const devices = await navigator.mediaDevices.enumerateDevices()
        const audioInputs = devices.filter((d) => d.kind === 'audioinput')
        console.log('[Mic] Available input devices:', audioInputs)

        stream = await navigator.mediaDevices.getUserMedia({
          audio: { deviceId: '704c61f76325013004cc96c8b4ca902f5e3fd0e33056042b1dfc285398572f53' }
        })
        console.log('[Mic] Got stream:', stream)

        const audioContext = new (window.AudioContext || window.webkitAudioContext)()
        audioContextRef.current = audioContext

        const source = audioContext.createMediaStreamSource(stream)
        const analyser = audioContext.createAnalyser()
        analyser.fftSize = 2048

        const bufferLength = analyser.fftSize
        const dataArray = new Uint8Array(bufferLength)

        analyserRef.current = analyser
        dataArrayRef.current = dataArray

        source.connect(analyser)

        const detect = () => {
          analyser.getByteTimeDomainData(dataArray)

          // Calculate "volume" as deviation from center (128)
          const avg = dataArray.reduce((acc, val) => acc + Math.abs(val - 128), 0) / bufferLength
          const normalized = avg / 128

          const isSpeaking = normalized > threshold
          if (isSpeaking !== previousSpeakingRef.current) {
            previousSpeakingRef.current = isSpeaking
            console.log('[Mic] Speaking:', isSpeaking, 'Level:', normalized.toFixed(4))
            onSpeakingChange(isSpeaking)
          }

          animationFrameRef.current = requestAnimationFrame(detect)
        }

        detect()
      } catch (err) {
        console.error('[Mic] Error accessing mic:', err)
      }
    }

    startMic()

    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current)
      if (audioContextRef.current) audioContextRef.current.close()
      if (stream) {
        stream.getTracks().forEach((track) => track.stop())
      }
    }
  }, [onSpeakingChange, threshold])
}
