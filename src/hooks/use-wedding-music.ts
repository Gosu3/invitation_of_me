'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { WeddingMusic } from '@/lib/types';
import { weddingPlaylist, type WeddingTrack } from '@/lib/wedding-playlist';

const SHUFFLE_STORAGE_KEY = 'wedding-music-shuffle-v2';

type ShuffleState = {
  signature: string;
  remainingIds: string[];
  lastId?: string;
};

function randomInt(max: number) {
  if (max <= 1) return 0;
  const values = new Uint32Array(1);
  const limit = Math.floor(0x1_0000_0000 / max) * max;
  do window.crypto.getRandomValues(values); while (values[0] >= limit);
  return values[0] % max;
}

function shuffleTrackIds(ids: string[], lastId?: string) {
  const shuffled = [...ids];
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = randomInt(index + 1);
    [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]];
  }
  if (shuffled.length > 1 && shuffled[0] === lastId) {
    const swapIndex = 1 + randomInt(shuffled.length - 1);
    [shuffled[0], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[0]];
  }
  return shuffled;
}

export function useWeddingMusic(config: WeddingMusic) {
  const tracks = useMemo<WeddingTrack[]>(() => {
    const configured = config.src ? [{ id: 'invitation-track', title: config.title, src: config.src }] : [];
    const unique = new Map<string, WeddingTrack>();
    [...configured, ...weddingPlaylist].forEach((track) => unique.set(track.src, track));
    return [...unique.values()];
  }, [config.src, config.title]);
  const audio = useRef<HTMLAudioElement | null>(null);
  const request = useRef(0);
  const currentIndex = useRef(0);
  const failedTrackIds = useRef(new Set<string>());
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
    player.onerror = null;
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
    currentIndex.current = next;
    if (player.src !== src) { player.pause(); player.src = tracks[next].src; }
    setIndex(next); setError(''); setBlocked(false);
    if (!autoplay) { setBusy(false); return; }
    setBusy(true);
    try { await player.play(); failedTrackIds.current.delete(tracks[next].id); }
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
    const signature = tracks.map((track) => `${track.id}:${track.src}`).join('|');
    let state: ShuffleState | undefined;
    try {
      const stored = window.localStorage.getItem(SHUFFLE_STORAGE_KEY);
      if (stored) state = JSON.parse(stored) as ShuffleState;
    } catch { /* A fresh queue is safe when storage is unavailable or invalid. */ }

    const validIds = new Set(tracks.map((track) => track.id));
    const remainingIds = state?.signature === signature
      ? state.remainingIds.filter((id, position, ids) => validIds.has(id) && ids.indexOf(id) === position)
      : [];
    const queue = remainingIds.length ? remainingIds : shuffleTrackIds([...validIds], state?.lastId);
    const nextId = queue.shift() ?? tracks[0].id;
    const nextIndex = tracks.findIndex((track) => track.id === nextId);
    try {
      window.localStorage.setItem(SHUFFLE_STORAGE_KEY, JSON.stringify({ signature, remainingIds: queue, lastId: nextId } satisfies ShuffleState));
    } catch { /* Playback still works when storage is unavailable. */ }
    return selectTrack(nextIndex);
  }, [selectTrack, tracks]);

  useEffect(() => {
    const player = audio.current;
    if (!player) return;
    player.onerror = () => {
      const failedIndex = currentIndex.current;
      const failedId = tracks[failedIndex]?.id;
      if (failedId) failedTrackIds.current.add(failedId);
      const fallbackIndex = tracks.findIndex((track, trackIndex) => trackIndex !== failedIndex && !failedTrackIds.current.has(track.id));
      if (fallbackIndex >= 0) {
        setError('');
        void selectTrack(fallbackIndex);
      } else {
        setError('Không thể phát danh sách nhạc.');
        setPlaying(false);
        setBusy(false);
      }
    };
    return () => { player.onerror = null; };
  }, [selectTrack, tracks]);
  const pause = useCallback(async () => { request.current += 1; audio.current?.pause(); setBusy(false); }, []);
  const togglePlaying = useCallback(async () => { if (playing) await pause(); else await play(); }, [pause, play, playing]);
  const setVolume = (value: number) => setVolumeState(Math.min(1, Math.max(0, value)));
  return { playing, muted, blocked, busy, play, playRandom, pause, togglePlaying, toggleMuted: () => setMuted((value) => !value),
    tracks, index, currentTrack: tracks[index], selectTrack, previous: () => selectTrack(index - 1), next: () => selectTrack(index + 1),
    volume, setVolume, loop, toggleLoop: () => setLoop((value) => !value), error };
}
