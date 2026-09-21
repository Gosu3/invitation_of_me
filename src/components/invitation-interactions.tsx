'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import Image from 'next/image';
import { Check, ChevronLeft, ChevronRight, Copy, Gift, Maximize2, Pause, Play, QrCode, X } from 'lucide-react';
import type { GiftAccount, WeddingMedia } from '@/lib/types';

/** Native modal provides focus containment, Escape, and focus restoration. */
function Modal({ children, close, label, className, onArrow }: { children: ReactNode; close: () => void; label: string; className: string; onArrow?: (step: number) => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const element = dialog.current;
    const previousFocus = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    element?.showModal();
    document.body.style.overflow = 'hidden';
    return () => {
      element?.close();
      document.body.style.overflow = overflow;
      previousFocus?.focus({ preventScroll: true });
    };
  }, []);
  return <dialog ref={dialog} className={`wedding-dialog ${className}`} aria-label={label} onKeyDown={(event) => { if (onArrow && (event.key === 'ArrowLeft' || event.key === 'ArrowRight')) { event.preventDefault(); onArrow(event.key === 'ArrowLeft' ? -1 : 1); } }} onCancel={(event) => { event.preventDefault(); close(); }} onClick={(event) => { if (event.target === event.currentTarget) close(); }}>
    <div className="dialog-surface">
      <button className="dialog-close" onClick={close} aria-label="Đóng" autoFocus><X size={21} /></button>
      {children}
    </div>
  </dialog>;
}

export function PhotoLightbox({ media, initial, close }: { media: WeddingMedia[]; initial: number; close: () => void }) {
  const [index, setIndex] = useState(initial);
  const touch = useRef<{ x: number; y: number } | null>(null);
  const move = (step: number) => setIndex((current) => (current + step + media.length) % media.length);
  return <Modal label="Xem ảnh cưới" className="photo-dialog" close={close} onArrow={move}>
    <div className="lightbox-stage" onTouchStart={(event) => { touch.current = { x: event.touches[0].clientX, y: event.touches[0].clientY }; }} onTouchEnd={(event) => { const start = touch.current; touch.current = null; if (!start) return; const dx = event.changedTouches[0].clientX - start.x; const dy = event.changedTouches[0].clientY - start.y; if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy)) move(dx > 0 ? -1 : 1); }}>
      <Image key={media[index].id} className="lightbox-photo" src={media[index].url} alt={media[index].alt} width={1200} height={1600} unoptimized={media[index].url.startsWith('/api/')} />
      <div className="album-controls"><button onClick={() => move(-1)} aria-label="Ảnh trước"><ChevronLeft /></button><span aria-live="polite">{index + 1} / {media.length}</span><button onClick={() => move(1)} aria-label="Ảnh tiếp"><ChevronRight /></button></div>
    </div>
  </Modal>;
}

export function WeddingAlbum({ photos, open, suspended }: { photos: WeddingMedia[]; open: (index: number) => void; suspended: boolean }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [inView, setInView] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(true);
  const region = useRef<HTMLDivElement>(null);
  const touch = useRef<{ x: number; y: number } | null>(null);
  const swiped = useRef(false);
  const move = (step: number) => setIndex((current) => (current + step + photos.length) % photos.length);
  useEffect(() => {
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReducedMotion(motion.matches);
    const observer = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), { threshold: .3 });
    if (region.current) observer.observe(region.current);
    update(); motion.addEventListener('change', update);
    return () => { observer.disconnect(); motion.removeEventListener('change', update); };
  }, []);
  useEffect(() => {
    if (paused || hovered || focused || suspended || reducedMotion || !inView || photos.length < 2) return;
    const timer = window.setInterval(() => { if (!document.hidden) setIndex((current) => (current + 1) % photos.length); }, 4500);
    return () => window.clearInterval(timer);
  }, [paused, hovered, focused, suspended, reducedMotion, inView, photos.length]);
  return <div className="wedding-album" ref={region} role="region" aria-roledescription="carousel" aria-label="Album ảnh cưới" onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)} onFocus={() => setFocused(true)} onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) setFocused(false); }} onKeyDown={(event) => { if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') { event.preventDefault(); move(event.key === 'ArrowLeft' ? -1 : 1); } }}>
    <div className="album-viewport" onTouchStart={(event) => { swiped.current = false; touch.current = { x: event.touches[0].clientX, y: event.touches[0].clientY }; }} onTouchEnd={(event) => { const start = touch.current; touch.current = null; if (!start) return; const dx = event.changedTouches[0].clientX - start.x; const dy = event.changedTouches[0].clientY - start.y; if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy)) { swiped.current = true; move(dx > 0 ? -1 : 1); } }}>
      <div className="album-track" style={{ transform: `translateX(-${index * 100}%)` }}>{photos.map((photo, i) => <button key={photo.id} className="album-slide" tabIndex={i === index ? 0 : -1} aria-hidden={i !== index} aria-label={`Phóng to ảnh ${i + 1}`} onClick={() => { if (!swiped.current) open(i); swiped.current = false; }}><Image src={photo.url} alt={photo.alt} fill sizes="(max-width: 650px) 90vw, 720px" unoptimized={photo.url.startsWith('/api/')} /><span className="album-enlarge"><Maximize2 size={16} /> Xem ảnh</span></button>)}</div>
    </div>
    <div className="album-controls"><button onClick={() => move(-1)} aria-label="Ảnh trước" disabled={photos.length < 2}><ChevronLeft size={20} /></button><span>{String(index + 1).padStart(2, '0')} <i>/ {String(photos.length).padStart(2, '0')}</i></span><button onClick={() => move(1)} aria-label="Ảnh tiếp" disabled={photos.length < 2}><ChevronRight size={20} /></button>{!reducedMotion && photos.length > 1 && <button onClick={() => setPaused(!paused)} aria-label={paused ? 'Tự động trượt ảnh' : 'Dừng trượt ảnh'} aria-pressed={paused}>{paused ? <Play size={15} /> : <Pause size={15} />}</button>}</div>
    <div className="album-thumbnails" aria-label="Chọn ảnh">{photos.map((photo, i) => <button key={photo.id} aria-label={`Chọn ảnh ${i + 1}`} aria-current={i === index ? 'true' : undefined} onClick={() => setIndex(i)}><Image src={photo.url} alt="" fill sizes="76px" unoptimized={photo.url.startsWith('/api/')} /></button>)}</div>
    <p className="album-hint">Vuốt để xem thêm những khoảnh khắc</p>
  </div>;
}

export function GiftBox({ open }: { open: () => void }) {
  const [opening, setOpening] = useState(false);
  const timer = useRef<number | null>(null);
  useEffect(() => () => { if (timer.current) window.clearTimeout(timer.current); }, []);
  function reveal() {
    if (timer.current) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) { open(); return; }
    setOpening(true);
    timer.current = window.setTimeout(() => { open(); setOpening(false); timer.current = null; }, 480);
  }
  return <button className={`gift-box-button${opening ? ' is-unwrapping' : ''}`} onClick={reveal} aria-busy={opening} aria-label="Mở hộp quà mừng">
    <span className="gift-sparkles" aria-hidden="true"><i>✦</i><i>✧</i><i>✦</i><i>✧</i></span>
    <span className="present" aria-hidden="true"><span className="present-lid"><span className="present-bow" /></span><span className="present-base"><span className="present-heart">♡</span></span></span>
    <span className="gift-box-caption">Mở hộp quà mừng <Gift size={16} /></span><small>Gửi một chút yêu thương</small>
  </button>;
}

export function GiftDialog({ gifts, close }: { gifts: GiftAccount[]; close: () => void }) {
  const [copied, setCopied] = useState<string | null>(null);
  const [error, setError] = useState('');
  const slots: (GiftAccount | null)[] = gifts.length ? gifts : [null, null];
  async function copy(gift: GiftAccount) {
    try { await navigator.clipboard.writeText(gift.accountNumber); setCopied(gift.id); setError(''); }
    catch { setError('Chưa sao chép được. Bạn có thể chọn và sao chép số tài khoản bên dưới.'); }
  }
  return <Modal label="Hộp quà mừng" className="gift-dialog" close={close}>
    <span className="gift-modal-icon"><Gift size={26} /></span><span className="eyebrow">GỬI GẮM YÊU THƯƠNG</span><h2>Hộp quà mừng</h2><p>Cảm ơn bạn đã cùng chúng mình<br />lưu giữ một ngày thật đẹp.</p>
    <div className="gift-accounts">{slots.map((gift, index) => <article className="gift-account" key={gift?.id ?? index}><strong>{gift?.recipient || (index === 0 ? 'Chú rể' : 'Cô dâu')}</strong>{gift?.qrUrl ? <Image className="bank-qr" src={gift.qrUrl} alt={`Mã QR ngân hàng ${gift.recipient}`} width={210} height={210} unoptimized /> : <div className="qr-placeholder" aria-label={`Chưa có mã QR ${index === 0 ? 'chú rể' : 'cô dâu'}`}><QrCode size={32} strokeWidth={1} /><span>Mã QR sẽ được bổ sung</span></div>}{gift && <><span>{gift.bankName}</span><b>{gift.accountHolder}</b><span className="account-number">{gift.accountNumber}</span><button className="copy-account" onClick={() => copy(gift)}>{copied === gift.id ? <Check size={15} /> : <Copy size={15} />}{copied === gift.id ? 'Đã sao chép' : 'Sao chép số tài khoản'}</button></>}</article>)}</div>
    <p className="gift-thanks">Sự hiện diện của bạn là món quà quý giá nhất ♡</p><span className="sr-only" role="status">{copied ? 'Đã sao chép số tài khoản' : ''}</span>{error && <p role="alert" className="form-error">{error}</p>}
  </Modal>;
}
