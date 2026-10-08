'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { WeddingMusic } from '@/lib/types';
import { weddingPlaylist, type WeddingTrack } from '@/lib/wedding-playlist';

const SHUFFLE_STORAGE_KEY = 'wedding-music-shuffle-v2';
/** Fade-out/fade-in when the guest skips or a song hands over to the next. */
const SWITCH_FADE_MS = 700;
/** The last seconds of a song overlap the start of the next one. */
const CROSSFADE_S = 1.5;
/** Starts loading the next song this long before the current one ends. */
const PRELOAD_LEAD_S = 40;

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
  // Two players take turns: the next song loads into the idle one while the current song nears its end, so the
  // switch starts at once, and the outgoing song fades out while the incoming one fades in instead of cutting.
  const players = useRef<HTMLAudioElement[]>([]);
  const active = useRef(0);
  const fades = useRef(new Map<HTMLAudioElement, number>());
  const canFade = useRef(false);
  const level = useRef(config.volume);
  const loopRef = useRef(true);
  // The player whose song already handed over to the next one, so a song hands over once.
  const handedOver = useRef<HTMLAudioElement | null>(null);
  const advance = useRef<() => void>(() => {});
  const preloadNext = useRef<() => void>(() => {});
  const onFailed = useRef<() => void>(() => {});
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

  const stopFade = useCallback((player: HTMLAudioElement) => {
    const timer = fades.current.get(player);
    if (timer !== undefined) { window.clearInterval(timer); fades.current.delete(player); }
  }, []);
  // A timer rather than animation frames: music keeps playing in a background tab, where frames stop.
  const fade = useCallback((player: HTMLAudioElement, to: number, ms: number, done?: () => void) => {
    stopFade(player);
    if (!canFade.current || ms <= 0) { if (canFade.current) player.volume = to; done?.(); return; }
    const from = player.volume;
    const start = performance.now();
    const timer = window.setInterval(() => {
      const t = Math.min(1, (performance.now() - start) / ms);
      player.volume = from + (to - from) * t;
      if (t < 1) return;
      stopFade(player);
      done?.();
    }, 30);
    fades.current.set(player, timer);
  }, [stopFade]);

  useEffect(() => {
    const created = [new Audio(), new Audio()];
    // iOS keeps media volume read-only (always 1): there songs switch directly instead of overlapping.
    created[0].volume = 0.5;
    canFade.current = created[0].volume === 0.5;
    const fadeTimers = fades.current;
    const isActive = (player: HTMLAudioElement) => player === players.current[active.current];
    created.forEach((player) => {
      player.preload = 'none';
      player.volume = level.current;
      player.onplay = () => { if (isActive(player)) setPlaying(true); };
      player.onpause = () => { if (isActive(player)) setPlaying(false); };
      player.ontimeupdate = () => {
        if (!isActive(player) || !Number.isFinite(player.duration)) return;
        const left = player.duration - player.currentTime;
        if (left < PRELOAD_LEAD_S) preloadNext.current();
        // Crossfade into the next song; without volume control the switch waits for the real end instead.
        if (left < CROSSFADE_S && canFade.current && handedOver.current !== player) { handedOver.current = player; advance.current(); }
      };
      player.onended = () => {
        if (!isActive(player) || handedOver.current === player) return;
        handedOver.current = player;
        advance.current();
      };
      player.onerror = () => { if (isActive(player)) onFailed.current(); };
    });
    players.current = created;
    return () => {
      request.current += 1;
      fadeTimers.forEach((timer) => window.clearInterval(timer));
      fadeTimers.clear();
      created.forEach((player) => {
        player.onplay = player.onpause = player.ontimeupdate = player.onended = player.onerror = null;
        player.pause(); player.removeAttribute('src'); player.load();
      });
      players.current = [];
    };
  }, []);
  useEffect(() => {
    level.current = volume;
    players.current.forEach((player, slot) => {
      player.muted = muted;
      if (slot === active.current && !fades.current.has(player)) player.volume = volume;
    });
  }, [volume, muted]);
  useEffect(() => { loopRef.current = loop; }, [loop]);

  const selectTrack = useCallback(async (nextIndex: number, autoplay = true) => {
    const outgoing = players.current[active.current];
    if (!config.enabled || !outgoing || !tracks.length) return;
    const next = (nextIndex + tracks.length) % tracks.length;
    const token = ++request.current;
    const src = new URL(tracks[next].src, window.location.href).href;
    currentIndex.current = next;
    let player = outgoing;
    // The same song (resume after a pause) stays on its player; another song goes to the idle player, which may
    // already hold it from preloading. The outgoing song fades out underneath.
    if (outgoing.src !== src) {
      const idle = players.current[1 - active.current];
      stopFade(idle);
      idle.pause();
      if (idle.src === src) idle.currentTime = 0;
      else idle.src = tracks[next].src;
      const audible = outgoing.paused === false;
      active.current = 1 - active.current;
      handedOver.current = null;
      player = idle;
      fade(idle, audible ? 0 : level.current, 0);
      if (audible) fade(outgoing, 0, SWITCH_FADE_MS, () => outgoing.pause());
      else outgoing.pause();
    }
    setIndex(next); setError(''); setBlocked(false);
    if (!autoplay) { setPlaying(false); setBusy(false); return; }
    setBusy(true);
    try {
      await player.play();
      if (token === request.current) fade(player, level.current, SWITCH_FADE_MS);
      failedTrackIds.current.delete(tracks[next].id);
    }
    catch (reason) {
      if (token !== request.current) return;
      if (reason instanceof DOMException && reason.name === 'NotAllowedError') setBlocked(true);
      else setError('Không thể phát bài nhạc này.');
      setPlaying(false);
    } finally { if (token === request.current) setBusy(false); }
  }, [config.enabled, tracks, fade, stopFade]);

  useEffect(() => {
    const following = () => {
      const nextIndex = currentIndex.current + 1;
      return nextIndex < tracks.length ? nextIndex : loopRef.current ? 0 : -1;
    };
    advance.current = () => {
      const nextIndex = following();
      if (nextIndex >= 0) void selectTrack(nextIndex);
    };
    preloadNext.current = () => {
      const nextIndex = following();
      const idle = players.current[1 - active.current];
      // Not while the idle player is still fading out the previous song.
      if (nextIndex < 0 || !idle || fades.current.has(idle)) return;
      if (idle.src === new URL(tracks[nextIndex].src, window.location.href).href) return;
      idle.preload = 'auto';
      idle.src = tracks[nextIndex].src;
    };
  }, [selectTrack, tracks]);

  const play = useCallback(() => selectTrack(index), [index, selectTrack]);
  const playRandom = useCallback(() => {
    if (!tracks.length) return Promise.resolve();
    const signature = tracks.map((track) => `${track.id}:${track.src}`).join('|');
    let state: ShuffleState | undefined;
    try {
      const stored = window.localStorage.getItem(SHUFFLE_STORAGE_KEY);
      if (stored) {
        const parsed: unknown = JSON.parse(stored);
        if (parsed && typeof parsed === 'object'
          && 'signature' in parsed && typeof parsed.signature === 'string'
          && 'remainingIds' in parsed && Array.isArray(parsed.remainingIds)
          && parsed.remainingIds.every((id): id is string => typeof id === 'string')) {
          state = {
            signature: parsed.signature,
            remainingIds: parsed.remainingIds,
            lastId: 'lastId' in parsed && typeof parsed.lastId === 'string' ? parsed.lastId : undefined,
          };
        }
      }
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
    onFailed.current = () => {
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
  }, [selectTrack, tracks]);
  // Also silences a song still fading out from a skip.
  const pause = useCallback(async () => {
    request.current += 1;
    players.current.forEach((player) => { stopFade(player); player.pause(); });
    setBusy(false);
  }, [stopFade]);
  const togglePlaying = useCallback(async () => { if (playing) await pause(); else await play(); }, [pause, play, playing]);
  const setVolume = (value: number) => setVolumeState(Math.min(1, Math.max(0, value)));
  return { playing, muted, blocked, busy, play, playRandom, pause, togglePlaying, toggleMuted: () => setMuted((value) => !value),
    tracks, index, currentTrack: tracks[index], selectTrack, previous: () => selectTrack(index - 1), next: () => selectTrack(index + 1),
    volume, setVolume, loop, toggleLoop: () => setLoop((value) => !value), error };
}
