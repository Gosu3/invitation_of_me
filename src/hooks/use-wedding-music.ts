'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { WeddingMusic } from '@/lib/types';

type Engine = { context?: AudioContext; gain?: GainNode; audio?: HTMLAudioElement; timer?: number };
const chords = [[261.63, 329.63, 392], [220, 261.63, 329.63], [174.61, 220, 261.63], [196, 246.94, 293.66]];

export function useWeddingMusic(config: WeddingMusic) {
  const engine = useRef<Engine>({});
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [blocked, setBlocked] = useState(false);
  const [busy, setBusy] = useState(false);

  const createSynth = useCallback(() => {
    const context = new AudioContext();
    const gain = context.createGain();
    gain.gain.value = config.volume;
    gain.connect(context.destination);
    const oscillators = chords[0].map((frequency, index) => {
      const oscillator = context.createOscillator();
      const voice = context.createGain();
      oscillator.type = index === 0 ? 'sine' : 'triangle';
      oscillator.frequency.value = frequency;
      voice.gain.value = index === 0 ? .16 : .06;
      oscillator.connect(voice).connect(gain);
      oscillator.start();
      return oscillator;
    });
    let chord = 0;
    const timer = window.setInterval(() => {
      chord = (chord + 1) % chords.length;
      const now = context.currentTime;
      oscillators.forEach((oscillator, index) => oscillator.frequency.exponentialRampToValueAtTime(chords[chord][index], now + 2.4));
    }, 4200);
    engine.current = { context, gain, timer };
  }, [config.volume]);

  const play = useCallback(async () => {
    if (!config.enabled) return;
    setBusy(true);
    try {
      if (engine.current.context?.state === 'closed') engine.current = {};
      if (!engine.current.audio && !engine.current.context) {
        if (config.src) {
          const audio = new Audio(config.src);
          audio.loop = true; audio.volume = config.volume;
          audio.muted = muted;
          engine.current.audio = audio;
        } else createSynth();
      }
      if (engine.current.audio) await engine.current.audio.play();
      if (engine.current.context?.state === 'suspended') await engine.current.context.resume();
      setPlaying(engine.current.audio ? !engine.current.audio.paused : engine.current.context?.state === 'running');
      setBlocked(false);
    } catch {
      setBlocked(true);
      setPlaying(false);
    } finally {
      setBusy(false);
    }
  }, [config.enabled, config.src, config.volume, createSynth, muted]);

  const pause = useCallback(async () => {
    setBusy(true);
    try {
      engine.current.audio?.pause();
      if (engine.current.context && engine.current.context.state !== 'closed') {
        await engine.current.context.suspend();
      }
    } finally {
      setPlaying(false);
      setBusy(false);
    }
  }, []);

  const togglePlaying = useCallback(async () => {
    if (busy) return;
    if (playing) await pause();
    else await play();
  }, [busy, pause, play, playing]);

  const toggleMuted = useCallback(() => {
    setMuted((current) => {
      const next = !current;
      if (engine.current.audio) engine.current.audio.muted = next;
      if (engine.current.gain) engine.current.gain.gain.value = next ? 0 : config.volume;
      return next;
    });
  }, [config.volume]);

  useEffect(() => () => {
    if (engine.current.timer) window.clearInterval(engine.current.timer);
    engine.current.audio?.pause();
    void engine.current.context?.close();
  }, []);

  return { playing, muted, blocked, busy, play, pause, togglePlaying, toggleMuted };
}
