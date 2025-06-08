// renderer/src/hooks/useVoiceRMS.js
import { useEffect, useState } from 'react';

export function useVoiceRMS({
  threshold = 0.015,
  holdMs = 200,
  onChange,
} = {}) {
  const [talking, setTalking] = useState(false);

  useEffect(() => {
    let audioCtx, analyser, mic, data, lastVoice = 0;
    let rafId;

    async function init() {
      audioCtx = new AudioContext();
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mic = audioCtx.createMediaStreamSource(stream);
      analyser = audioCtx.createAnalyser();
      analyser.fftSize = 2048;
      mic.connect(analyser);
      data = new Uint8Array(analyser.fftSize);
      loop();
    }

    function loop() {
      analyser.getByteTimeDomainData(data);
      const rms = Math.sqrt(
        data.reduce((s, v) => s + ((v - 128) / 128) ** 2, 0) / data.length
      );

      const now = performance.now();
      if (rms > threshold) lastVoice = now;

      const shouldTalk = now - lastVoice < holdMs;
      if (shouldTalk !== talking) {
        setTalking(shouldTalk);
        onChange?.(shouldTalk);
        // Opcional: notificar a main
        window.electronAPI?.setAvatar?.(shouldTalk ? 'talking' : 'idle');
      }
      rafId = requestAnimationFrame(loop);
    }

    init();
    return () => {
      cancelAnimationFrame(rafId);
      audioCtx?.close();
    };
  }, [threshold, holdMs, onChange, talking]);

  return talking;
}
