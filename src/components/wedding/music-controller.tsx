'use client';

import { Music2, Pause, Play, Volume2, VolumeX } from 'lucide-react';
import type { ReturnTypeOfUseWeddingMusic } from './types';

export function MusicController({ music, title }: { music: ReturnTypeOfUseWeddingMusic; title: string }) {
  return <div className="music-controller" aria-label="Điều khiển nhạc nền">
    <button type="button" onClick={() => void music.togglePlaying()} aria-label={music.playing ? 'Tạm dừng nhạc' : 'Phát nhạc'} aria-pressed={music.playing} disabled={music.busy}>{music.playing ? <Pause size={17} /> : <Play size={17} />}</button>
    <span><Music2 size={14} /><span>{music.blocked ? 'Chạm để phát nhạc' : title}</span></span>
    <button type="button" onClick={music.toggleMuted} aria-label={music.muted ? 'Bật tiếng' : 'Tắt tiếng'}>{music.muted ? <VolumeX size={17} /> : <Volume2 size={17} />}</button>
  </div>;
}
