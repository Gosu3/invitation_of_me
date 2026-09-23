'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { WeddingMusic } from '@/lib/types';
import { weddingPlaylist, type WeddingTrack } from '@/lib/wedding-playlist';

export function useWeddingMusic(config: WeddingMusic) {
  const tracks = useMemo<WeddingTrack[]>(() => config.src ? [{ id: 'invitation-track', title: config.title, src: config.src }, ...weddingPlaylist.filter((track) => track.src !== config.src)] : weddingPlaylist, [config.src, config.title]);
  const audio = useRef<HTMLAudioElement | null>(null);
  const request = useRef(0);
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [blocked, setBlocked] = useState(false);
  const [busy, setBusy] = useState(false);
  const [volume, setVolumeState] = useState(config.volume);
  const [loop, setLoop] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const player = new Audio();
    player.preload = 'none';
    player.onplay = () => setPlaying(true);
    player.onpause = () => setPlaying(false);
    player.onerror = () => { setError('Không thể phát bài nhạc này.'); setPlaying(false); setBusy(false); };
    audio.current = player;
    return () => {
      request.current += 1;
      player.onplay = player.onpause = player.onerror = player.onended = null;
      player.pause(); player.removeAttribute('src'); player.load(); audio.current = null;
    };
  }, []);
  useEffect(() => { if (audio.current) { audio.current.volume = volume; audio.current.muted = muted; } }, [volume, muted]);

  const selectTrack = useCallback(async (nextIndex: number, autoplay = true) => {
    const player = audio.current;
    if (!config.enabled || !player || !tracks.length) return;
    const next = (nextIndex + tracks.length) % tracks.length;
    const token = ++request.current;
    const src = new URL(tracks[next].src, window.location.href).href;
    if (player.src !== src) { player.pause(); player.src = tracks[next].src; }
    setIndex(next); setError(''); setBlocked(false);
    if (!autoplay) { setBusy(false); return; }
    setBusy(true);
    try { await player.play(); }
    catch (reason) {
      if (token !== request.current) return;
      if (reason instanceof DOMException && reason.name === 'NotAllowedError') setBlocked(true);
      else setError('Không thể phát bài nhạc này.');
      setPlaying(false);
    } finally { if (token === request.current) setBusy(false); }
  }, [config.enabled, tracks]);
  useEffect(() => {
    if (!audio.current) return;
    audio.current.onended = () => {
      if (index + 1 < tracks.length) void selectTrack(index + 1);
      else if (loop) void selectTrack(0);
      else setPlaying(false);
    };
  }, [index, loop, tracks.length, selectTrack]);

  const play = useCallback(() => selectTrack(index), [index, selectTrack]);
  const playRandom = useCallback(() => {
    if (!tracks.length) return Promise.resolve();
    const storageKey = 'wedding-last-opening-track';
    const previous = Number(window.sessionStorage.getItem(storageKey));
    const candidates = tracks.map((_, trackIndex) => trackIndex).filter((trackIndex) => tracks.length === 1 || trackIndex !== previous);
    const randomValue = new Uint32Array(1);
    window.crypto.getRandomValues(randomValue);
    const nextIndex = candidates[randomValue[0] % candidates.length];
    window.sessionStorage.setItem(storageKey, String(nextIndex));
    return selectTrack(nextIndex);
  }, [selectTrack, tracks]);
  const pause = useCallback(async () => { request.current += 1; audio.current?.pause(); setBusy(false); }, []);
  const togglePlaying = useCallback(async () => { if (playing) await pause(); else await play(); }, [pause, play, playing]);
  const setVolume = (value: number) => setVolumeState(Math.min(1, Math.max(0, value)));
  return { playing, muted, blocked, busy, play, playRandom, pause, togglePlaying, toggleMuted: () => setMuted((value) => !value),
    tracks, index, currentTrack: tracks[index], selectTrack, previous: () => selectTrack(index - 1), next: () => selectTrack(index + 1),
    volume, setVolume, loop, toggleLoop: () => setLoop((value) => !value), error };
}
