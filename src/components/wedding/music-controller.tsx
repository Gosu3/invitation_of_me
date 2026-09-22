'use client';

import { useState } from 'react';
import { Music2, Pause, Play, Repeat, SkipBack, SkipForward, Volume2, VolumeX, X } from 'lucide-react';
import type { ReturnTypeOfUseWeddingMusic } from './types';

export function MusicController({ music, title }: { music: ReturnTypeOfUseWeddingMusic; title: string }) {
  const [expanded, setExpanded] = useState(false);
  const empty = music.tracks.length === 0;
  return <div className="wedding-music-player" aria-label="Điều khiển nhạc nền">
    {expanded && <section id="wedding-music-panel" className="wedding-music-panel" aria-label="Danh sách nhạc">
      <header><strong>{music.currentTrack?.title || title}</strong><button onClick={() => setExpanded(false)} aria-label="Đóng trình phát nhạc"><X size={16} /></button></header>
      {music.currentTrack?.artist && <small>{music.currentTrack.artist}</small>}
      {empty ? <p>Chưa có bài nhạc nào.</p> : <ol>{music.tracks.map((track, index) => <li key={track.id}><button onClick={() => void music.selectTrack(index)} aria-current={music.index === index ? 'true' : undefined}>{track.title}</button></li>)}</ol>}
      <div className="music-transport">
        <button onClick={() => void music.previous()} disabled={empty} aria-label="Bài trước"><SkipBack size={18} /></button>
        <button onClick={() => void music.togglePlaying()} disabled={empty || music.busy} aria-label={music.playing ? 'Tạm dừng nhạc' : 'Phát nhạc'}>{music.playing ? <Pause size={20} /> : <Play size={20} />}</button>
        <button onClick={() => void music.next()} disabled={empty} aria-label="Bài tiếp"><SkipForward size={18} /></button>
        <button onClick={music.toggleLoop} aria-label="Lặp lại danh sách" aria-pressed={music.loop}><Repeat size={17} /></button>
      </div>
      <div className="music-volume"><button onClick={music.toggleMuted} aria-label={music.muted ? 'Bật tiếng' : 'Tắt tiếng'}>{music.muted ? <VolumeX size={17} /> : <Volume2 size={17} />}</button><input type="range" min="0" max="1" step="0.01" value={music.volume} onChange={(event) => music.setVolume(Number(event.target.value))} aria-label="Âm lượng" /></div>
      {(music.error || music.blocked) && <p role="status">{music.error || 'Chạm Phát nhạc để bắt đầu.'}</p>}
    </section>}
    <button className="music-player-trigger" onClick={() => setExpanded((value) => !value)} aria-label="Mở trình phát nhạc" aria-expanded={expanded} aria-controls="wedding-music-panel"><Music2 size={19} /></button>
  </div>;
}
