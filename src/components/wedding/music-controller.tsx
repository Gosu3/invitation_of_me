'use client';

import { Music2 } from 'lucide-react';
import type { ReturnTypeOfUseWeddingMusic } from './types';

export function MusicController({ music }: { music: ReturnTypeOfUseWeddingMusic }) {
  const empty = music.tracks.length === 0;
  return <div className="wedding-music-player" aria-label="Điều khiển nhạc nền">
    <button className={`music-player-trigger${music.playing ? ' is-playing' : ''}`} onClick={() => void music.togglePlaying()} disabled={empty || music.busy} aria-label={music.playing ? 'Tạm dừng nhạc' : 'Phát nhạc'} title={music.currentTrack?.title || 'Nhạc nền'}>{music.playing ? <span className="music-equalizer" aria-hidden="true"><i /><i /><i /><i /></span> : <Music2 size={20} />}</button>
  </div>;
}
