'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useSwipe } from '@/hooks/use-swipe';
import type { WeddingMedia } from '@/lib/types';
import { Modal, SectionTitle } from './shared';
import { ArchitectureSection } from './decorations';

function circularOffset(index: number, activeIndex: number, length: number) {
  let offset = index - activeIndex;
  if (offset > length / 2) offset -= length;
  if (offset < -length / 2) offset += length;
  return offset;
}

export function WeddingGallery({ photos, story, open }: { photos: WeddingMedia[]; story?: string; open: (index: number) => void }) {
  const [current, setCurrent] = useState(0);
  const [outgoing, setOutgoing] = useState<number | null>(null);
  const [isInView, setIsInView] = useState(false);
  const [autoplayPaused, setAutoplayPaused] = useState(false);
  const sectionRef = useRef<HTMLElement | null>(null);
  const currentRef = useRef(0);
  const settleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const resumeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const select = useCallback((next: number) => {
    const previous = currentRef.current;
    if (next === previous) return;
    if (settleTimer.current) clearTimeout(settleTimer.current);
    currentRef.current = next;
    setOutgoing(previous);
    setCurrent(next);
    settleTimer.current = setTimeout(() => setOutgoing(null), 900);
  }, []);
  const move = useCallback((step: number) => select((currentRef.current + step + photos.length) % photos.length), [photos.length, select]);
  const pauseAutoplay = useCallback(() => {
    setAutoplayPaused(true);
    if (resumeTimer.current) clearTimeout(resumeTimer.current);
    resumeTimer.current = setTimeout(() => setAutoplayPaused(false), 2000);
  }, []);
  const holdAutoplay = useCallback(() => {
    setAutoplayPaused(true);
    if (resumeTimer.current) clearTimeout(resumeTimer.current);
  }, []);
  const userMove = useCallback((step: number) => {
    pauseAutoplay();
    move(step);
  }, [move, pauseAutoplay]);
  const userSelect = useCallback((index: number) => {
    pauseAutoplay();
    select(index);
  }, [pauseAutoplay, select]);
  const swipe = useSwipe(() => userMove(1), () => userMove(-1));
  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;
    const observer = new IntersectionObserver(([entry]) => {
      setIsInView(entry.isIntersecting && entry.intersectionRatio >= .45);
    }, { threshold: [0, .45, .7] });
    observer.observe(section);
    return () => observer.disconnect();
  }, []);
  useEffect(() => {
    if (!isInView || autoplayPaused || photos.length < 2) return;
    const timer = window.setInterval(() => move(1), 2800);
    return () => window.clearInterval(timer);
  }, [autoplayPaused, isInView, move, photos.length]);
  useEffect(() => () => {
    if (settleTimer.current) clearTimeout(settleTimer.current);
    if (resumeTimer.current) clearTimeout(resumeTimer.current);
  }, []);
  return <ArchitectureSection><section ref={sectionRef} className="invite-section gallery-section" id="album">
    <SectionTitle eyebrow="KHOẢNH KHẮC CỦA CHÚNG MÌNH"><span dir="auto">Album yêu thương</span></SectionTitle>
    <div className="album-carousel" aria-label="Album ảnh cưới dạng vòng xoay 3D" {...swipe}>
      <div className="album-carousel-track">
        {photos.map((photo, index) => {
          const offset = circularOffset(index, current, photos.length);
          const distance = Math.abs(offset);
          const position = distance > 3 ? (offset < 0 ? 'far-left' : 'far-right') : String(offset);
          return <button key={photo.id} type="button" data-coverflow-position={position} tabIndex={distance > 3 ? -1 : 0} aria-hidden={distance > 3} className={`album-carousel-slide${index === current ? ' is-active' : ''}${index === outgoing ? ' is-outgoing' : ''}`} onPointerDown={holdAutoplay} onPointerUp={pauseAutoplay} onPointerCancel={pauseAutoplay} onClick={() => { pauseAutoplay(); if (index === current) open(index); else select(index); }} aria-label={index === current ? `Mở ảnh ${index + 1}` : `Chuyển đến ảnh ${index + 1}`} aria-current={index === current ? 'true' : undefined}>
          <Image src={photo.url} alt={photo.alt} fill sizes="(max-width: 650px) 78vw, 342px" style={{ objectPosition: `${(photo.position?.x ?? .5) * 100}% ${(photo.position?.y ?? .5) * 100}%` }} unoptimized={photo.url.startsWith('/api/')} />
        </button>; })}
      </div>
      {photos.length > 1 && <><button className="album-carousel-arrow previous" onPointerDown={holdAutoplay} onPointerUp={pauseAutoplay} onPointerCancel={pauseAutoplay} onClick={() => userMove(-1)} aria-label="Ảnh trước"><ChevronLeft /></button><button className="album-carousel-arrow next" onPointerDown={holdAutoplay} onPointerUp={pauseAutoplay} onPointerCancel={pauseAutoplay} onClick={() => userMove(1)} aria-label="Ảnh tiếp"><ChevronRight /></button></>}
    </div>
    {photos.length > 1 && <div className="album-carousel-dots" aria-label="Chọn ảnh">{photos.map((photo, index) => <button key={photo.id} className={index === current ? 'is-active' : ''} onPointerDown={holdAutoplay} onPointerUp={pauseAutoplay} onPointerCancel={pauseAutoplay} onClick={() => userSelect(index)} aria-label={`Chuyển đến ảnh ${index + 1}`} aria-current={index === current ? 'true' : undefined} />)}</div>}
    {story && <p className="gallery-story">“{story}”</p>}
  </section></ArchitectureSection>;
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
      <span className="lightbox-count" aria-live="polite">{index + 1} / {photos.length}</span>
      <div className="lightbox-frame">
        <Image key={`${photos[index].id}-${direction}`} className={`lightbox-photo slide-${direction > 0 ? 'next' : 'previous'}`} src={photos[index].url} alt={photos[index].alt} fill sizes="(max-width: 650px) calc(100vw - 28px), min(1000px, 100vw)" style={{ objectFit: 'contain', objectPosition: `${(photos[index].position?.x ?? .5) * 100}% ${(photos[index].position?.y ?? .5) * 100}%` }} unoptimized={photos[index].url.startsWith('/api/')} />
      </div>
      {photos.length > 1 && <div className="lightbox-controls"><button className="previous" onClick={() => move(-1)} aria-label="Ảnh trước"><ChevronLeft /></button><button className="next" onClick={() => move(1)} aria-label="Ảnh tiếp"><ChevronRight /></button></div>}
      <div className="lightbox-thumbnails" aria-label="Chọn ảnh">{photos.map((photo, photoIndex) => <button ref={(element) => { thumbnailRefs.current[photoIndex] = element; }} key={photo.id} onClick={() => { setDirection(photoIndex >= index ? 1 : -1); setIndex(photoIndex); }} aria-label={`Chọn ảnh ${photoIndex + 1}`} aria-current={photoIndex === index ? 'true' : undefined}><Image src={photo.url} alt="" fill sizes="64px" unoptimized={photo.url.startsWith('/api/')} /></button>)}</div>
    </div>
  </Modal>;
}
