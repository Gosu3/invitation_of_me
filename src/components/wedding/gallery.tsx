'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { ChevronLeft, ChevronRight, Maximize2 } from 'lucide-react';
import { useSwipe } from '@/hooks/use-swipe';
import type { WeddingMedia } from '@/lib/types';
import { Modal, SectionTitle } from './shared';

export function WeddingGallery({ photos, story, open }: { photos: WeddingMedia[]; story?: string; open: (index: number) => void }) {
  const [current, setCurrent] = useState(0);
  const move = useCallback((step: number) => setCurrent((value) => (value + step + photos.length) % photos.length), [photos.length]);
  const swipe = useSwipe(() => move(1), () => move(-1));
  return <section className="invite-section gallery-section" id="album">
    <SectionTitle eyebrow="KHOẢNH KHẮC CỦA CHÚNG MÌNH">Album yêu thương</SectionTitle>
    <div className="album-carousel" {...swipe}>
      <div className="album-carousel-track" style={{ transform: `translateX(calc(30% - ${current * 40}% - ${current * 10}px))` }}>
        {photos.map((photo, index) => <button key={photo.id} className={`album-carousel-slide${index === current ? ' is-active' : ''}`} onClick={() => index === current ? open(index) : setCurrent(index)} aria-label={index === current ? `Mở ảnh ${index + 1}` : `Chuyển đến ảnh ${index + 1}`} aria-current={index === current ? 'true' : undefined}>
          <Image src={photo.url} alt={photo.alt} fill sizes="(max-width: 650px) 40vw, 240px" style={{ objectPosition: `${(photo.position?.x ?? .5) * 100}% ${(photo.position?.y ?? .5) * 100}%` }} unoptimized={photo.url.startsWith('/api/')} />
          {index === current && <span className="gallery-hover"><Maximize2 size={17} /></span>}
        </button>)}
      </div>
      {photos.length > 1 && <><button className="album-carousel-arrow previous" onClick={() => move(-1)} aria-label="Ảnh trước"><ChevronLeft /></button><button className="album-carousel-arrow next" onClick={() => move(1)} aria-label="Ảnh tiếp"><ChevronRight /></button></>}
    </div>
    {photos.length > 1 && <div className="album-carousel-dots" aria-label="Chọn ảnh">{photos.map((photo, index) => <button key={photo.id} className={index === current ? 'is-active' : ''} onClick={() => setCurrent(index)} aria-label={`Chuyển đến ảnh ${index + 1}`} aria-current={index === current ? 'true' : undefined} />)}</div>}
    <span className="album-carousel-count" aria-live="polite">{String(current + 1).padStart(2, '0')} / {String(photos.length).padStart(2, '0')}</span>
    {story && <p className="gallery-story">“{story}”</p>}
  </section>;
}

export function GalleryLightbox({ photos, initial, close }: { photos: WeddingMedia[]; initial: number; close: () => void }) {
  const [index, setIndex] = useState(initial);
  const [direction, setDirection] = useState<1 | -1>(1);
  const thumbnailRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const move = useCallback((step: number) => {
    setDirection(step < 0 ? -1 : 1);
    setIndex((current) => (current + step + photos.length) % photos.length);
  }, [photos.length]);
  const swipe = useSwipe(() => move(1), () => move(-1));
  useEffect(() => {
    [-1, 0, 1].forEach((offset) => {
      const photo = photos[(index + offset + photos.length) % photos.length];
      if (photo) { const preload = new window.Image(); preload.src = photo.url; }
    });
    thumbnailRefs.current[index]?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
  }, [index, photos]);
  return <Modal label="Album ảnh cưới" className="photo-dialog" close={close} onArrow={move}>
    <div className="lightbox-stage" {...swipe}>
      <div className="lightbox-frame">
        <Image key={`${photos[index].id}-${direction}`} className={`lightbox-photo slide-${direction > 0 ? 'next' : 'previous'}`} src={photos[index].url} alt={photos[index].alt} width={1400} height={1800} style={{ objectPosition: `${(photos[index].position?.x ?? .5) * 100}% ${(photos[index].position?.y ?? .5) * 100}%` }} unoptimized={photos[index].url.startsWith('/api/')} />
      </div>
      <div className="lightbox-controls"><button onClick={() => move(-1)} aria-label="Ảnh trước"><ChevronLeft /></button><span aria-live="polite">{index + 1} / {photos.length}</span><button onClick={() => move(1)} aria-label="Ảnh tiếp"><ChevronRight /></button></div>
      <div className="lightbox-thumbnails" aria-label="Chọn ảnh">{photos.map((photo, photoIndex) => <button ref={(element) => { thumbnailRefs.current[photoIndex] = element; }} key={photo.id} onClick={() => { setDirection(photoIndex >= index ? 1 : -1); setIndex(photoIndex); }} aria-label={`Chọn ảnh ${photoIndex + 1}`} aria-current={photoIndex === index ? 'true' : undefined}><Image src={photo.url} alt="" fill sizes="64px" unoptimized={photo.url.startsWith('/api/')} /></button>)}</div>
      <p className="lightbox-swipe-hint">Vuốt hoặc dùng phím ← → để chuyển ảnh</p>
    </div>
  </Modal>;
}
