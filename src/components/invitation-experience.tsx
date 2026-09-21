'use client';

import { useEffect, useMemo, useState, type FormEvent } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowDown, ArrowLeft, ArrowRight, CalendarDays, Check, ChevronLeft, ChevronRight, Copy, Gift, Heart, MapPin, Send, X } from 'lucide-react';
import type { Invitation, WeddingMedia } from '@/lib/types';
import { dateParts, formatDate, formatTime } from '@/lib/utils';

function Ornament({ className = '' }: { className?: string }) {
  return <svg className={className} viewBox="0 0 270 150" fill="none" aria-hidden="true"><path d="M8 140c40-19 57-61 85-98M65 94c25-28 58-37 91-30M117 64c-13-25-7-41 4-55M153 63c34-17 72-2 109-37" stroke="currentColor" strokeWidth="1.5"/><path d="M82 53c-16-24-42-22-46-7 11 17 29 18 46 7ZM94 43c-4-22 7-36 22-39 7 16 1 31-22 39ZM144 62c9-31 31-34 42-23-3 16-19 27-42 23ZM199 48c9-23 27-31 39-24-1 16-18 25-39 24Z" stroke="currentColor" strokeWidth="1.5"/><path d="M170 99c11-19 27-27 43-21 5-16 23-18 34-8 8 13 2 26-11 33 5 17-6 30-21 31-10 13-28 10-37-1-17 1-26-16-19-31 3-2 7-3 11-3Z" stroke="currentColor" strokeWidth="1.5"/><path d="M183 100c8-11 20-13 30-9 11-9 27-4 30 8-8 5-13 13-13 22-8 4-16 3-24-3-10 4-19-2-23-18Z" stroke="currentColor" strokeWidth="1.2"/><path d="M210 95c-8 12-8 19-4 23m4-23c10 7 15 14 20 26" stroke="currentColor" strokeWidth="1.2"/></svg>;
}

function FloralCluster() {
  return <svg className="letter-bouquet" viewBox="0 0 300 330" fill="none" aria-hidden="true">
    <defs>
      <radialGradient id="rose-red"><stop stopColor="#aa5360" /><stop offset=".55" stopColor="#79283b" /><stop offset="1" stopColor="#4d1428" /></radialGradient>
      <radialGradient id="rose-ivory"><stop stopColor="#fff9e7" /><stop offset=".65" stopColor="#ead9bb" /><stop offset="1" stopColor="#bda987" /></radialGradient>
      <linearGradient id="leaf-gold" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#e1c893" /><stop offset="1" stopColor="#82744f" /></linearGradient>
    </defs>
    <g stroke="#746b4f" strokeWidth="2" strokeLinecap="round"><path d="M165 300C136 218 117 105 145 8M154 283C189 210 220 145 237 48M155 276C112 234 74 195 24 154M151 275C179 249 218 237 281 226"/><path d="M135 115 99 82M142 156 174 119M207 169 249 148M98 223 54 221" /></g>
    <g fill="url(#leaf-gold)" stroke="#9d8b65" strokeWidth="1.5"><path d="M103 87C74 79 70 48 80 32c24 8 35 29 23 55ZM168 122c-4-29 18-47 39-49 1 24-14 43-39 49ZM231 121c2-29 24-40 41-38-2 23-16 36-41 38ZM59 213c-28-6-43-24-39-44 26 2 42 20 39 44ZM233 239c14-25 38-29 56-22-11 21-29 29-56 22ZM137 53c-19-16-19-35-11-48 18 10 24 28 11 48Z"/></g>
    <g fill="#672033"><circle cx="142" cy="15" r="5"/><circle cx="154" cy="31" r="4"/><circle cx="123" cy="47" r="4"/><circle cx="249" cy="62" r="4"/><circle cx="263" cy="77" r="5"/><circle cx="270" cy="58" r="3"/><circle cx="29" cy="144" r="4"/><circle cx="43" cy="132" r="3"/></g>
    <g transform="translate(124 186) rotate(-12)">{[0,45,90,135,180,225,270,315].map((a) => <ellipse key={a} cx="0" cy="-39" rx="25" ry="47" transform={`rotate(${a})`} fill="url(#rose-red)" stroke="#4d182a" strokeWidth="2" />)}<circle r="32" fill="#832b3f"/><path d="M-25 4c9-20 30-25 46-10C34 8 14 27-2 21c-16-6-13-19-2-25 10-6 22 1 20 10" stroke="#d49a8c" strokeWidth="3" strokeLinecap="round"/></g>
    <g transform="translate(213 216) scale(.77)">{[0,60,120,180,240,300].map((a) => <ellipse key={a} cy="-33" rx="23" ry="40" transform={`rotate(${a})`} fill="url(#rose-ivory)" stroke="#bca782" strokeWidth="2" />)}<circle r="23" fill="#f5e9cf"/><path d="M-17 4c7-16 28-17 35-4 3 13-14 21-22 13-6-6 4-14 12-9" stroke="#b99d73" strokeWidth="3" strokeLinecap="round"/></g>
    <g transform="translate(68 263) scale(.63)">{[0,72,144,216,288].map((a) => <ellipse key={a} cy="-36" rx="22" ry="42" transform={`rotate(${a})`} fill="url(#rose-ivory)" stroke="#bca782" strokeWidth="2" />)}<circle r="19" fill="#e8d3ae"/></g>
    <g transform="translate(194 285) scale(.48)">{[0,60,120,180,240,300].map((a) => <ellipse key={a} cy="-35" rx="24" ry="43" transform={`rotate(${a})`} fill="url(#rose-red)" stroke="#4d182a" strokeWidth="2" />)}<circle r="21" fill="#7d2a40"/></g>
  </svg>;
}

const fallingPieces = [
  { left: 4, delay: -2, duration: 15, kind: 'petal' }, { left: 13, delay: -9, duration: 19, kind: 'heart' },
  { left: 24, delay: -5, duration: 17, kind: 'petal' }, { left: 36, delay: -13, duration: 21, kind: 'petal' },
  { left: 48, delay: -7, duration: 16, kind: 'heart' }, { left: 59, delay: -15, duration: 20, kind: 'petal' },
  { left: 70, delay: -3, duration: 18, kind: 'petal' }, { left: 80, delay: -11, duration: 22, kind: 'heart' },
  { left: 91, delay: -6, duration: 17, kind: 'petal' }, { left: 97, delay: -17, duration: 23, kind: 'petal' },
] as const;

function FallingPieces() {
  return <div className="falling-pieces" aria-hidden="true">{fallingPieces.map((piece, index) => <span key={index} className={`falling-piece ${piece.kind}`} style={{ left: `${piece.left}%`, animationDelay: `${piece.delay}s`, animationDuration: `${piece.duration}s` }}>{piece.kind === 'heart' ? <Heart fill="currentColor" /> : <svg viewBox="0 0 20 28" fill="currentColor"><path d="M10 0C23 8 23 21 10 28-3 21-3 8 10 0Z" /></svg>}</span>)}</div>;
}

function Countdown({ target }: { target: string }) {
  const [now, setNow] = useState(0);
  useEffect(() => { const first = setTimeout(() => setNow(Date.now()), 0); const id = setInterval(() => setNow(Date.now()), 1000); return () => { clearTimeout(first); clearInterval(id); }; }, []);
  if (!now) return <div className="countdown-placeholder">Ngày vui đang đến gần</div>;
  const diff = new Date(target).getTime() - now;
  if (diff <= 0) return <div className="countdown-past">Một ngày đáng nhớ đã bắt đầu ♡</div>;
  const days = Math.floor(diff / 86400000);
  const hours = Math.floor((diff % 86400000) / 3600000);
  const minutes = Math.floor((diff % 3600000) / 60000);
  const seconds = Math.floor((diff % 60000) / 1000);
  return <div className="countdown" aria-label={`Còn ${days} ngày ${hours} giờ ${minutes} phút ${seconds} giây`}><div><strong>{days}</strong><span>Ngày</span></div><i /> <div><strong>{String(hours).padStart(2, '0')}</strong><span>Giờ</span></div><i /> <div><strong>{String(minutes).padStart(2, '0')}</strong><span>Phút</span></div><i /> <div><strong>{String(seconds).padStart(2, '0')}</strong><span>Giây</span></div></div>;
}

function Calendar({ date }: { date: string }) {
  const d = new Date(date);
  const month = Number(new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Ho_Chi_Minh', month: 'numeric' }).format(d));
  const year = Number(new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Ho_Chi_Minh', year: 'numeric' }).format(d));
  const selected = Number(dateParts(date).day);
  const offset = (new Date(year, month - 1, 1).getDay() + 6) % 7;
  const count = new Date(year, month, 0).getDate();
  return <div className="mini-calendar"><div className="mini-calendar-title">Tháng {month} · {year}</div><div className="mini-calendar-grid">{['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'].map((x) => <b key={x}>{x}</b>)}{Array.from({ length: offset }, (_, i) => <span key={`p${i}`} />)}{Array.from({ length: count }, (_, i) => <span className={i + 1 === selected ? 'selected' : ''} key={i}>{i + 1 === selected ? <><Heart className="calendar-heart" size={15} fill="currentColor" aria-hidden="true" /><span className="calendar-day-number">{i + 1}</span></> : i + 1}</span>)}</div></div>;
}

function Lightbox({ media, initial, close }: { media: WeddingMedia[]; initial: number; close: () => void }) {
  const [index, setIndex] = useState(initial);
  useEffect(() => { const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') close(); if (e.key === 'ArrowLeft') setIndex((n) => (n - 1 + media.length) % media.length); if (e.key === 'ArrowRight') setIndex((n) => (n + 1) % media.length); }; document.addEventListener('keydown', onKey); return () => document.removeEventListener('keydown', onKey); }, [close, media.length]);
  return <div className="lightbox" role="dialog" aria-modal="true" aria-label="Xem ảnh cưới" onClick={close}><button className="lightbox-close" onClick={close} aria-label="Đóng"><X /></button><div className="lightbox-inner" onClick={(e) => e.stopPropagation()}><Image src={media[index].url} alt={media[index].alt} width={900} height={1200} unoptimized={media[index].url.startsWith('/api/')} /><div className="lightbox-controls"><button onClick={() => setIndex((n) => (n - 1 + media.length) % media.length)} aria-label="Ảnh trước"><ChevronLeft /></button><span>{index + 1} / {media.length}</span><button onClick={() => setIndex((n) => (n + 1) % media.length)} aria-label="Ảnh tiếp"><ChevronRight /></button></div></div></div>;
}

export function InvitationExperience({ invitation, connected }: { invitation: Invitation; connected: boolean }) {
  const [opened, setOpened] = useState(false);
  const [opening, setOpening] = useState(false);
  const [photoIndex, setPhotoIndex] = useState<number | null>(null);
  const [giftOpen, setGiftOpen] = useState(false);
  const [copiedGift, setCopiedGift] = useState<string | null>(null);
  const [rsvpState, setRsvpState] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');
  const [rsvpError, setRsvpError] = useState('');
  const [wishState, setWishState] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');
  const [wishError, setWishError] = useState('');
  const primaryEvent = invitation.events.find((e) => e.title.toLowerCase().includes('tiệc')) || invitation.events[0];
  const names = `${invitation.partnerOne} & ${invitation.partnerTwo}`;
  const shareUrl = typeof window !== 'undefined' ? window.location.href : '';
  const [rsvpClosed, setRsvpClosed] = useState(false);
  useEffect(() => { if (!invitation.rsvpDeadline) return; const id = setTimeout(() => setRsvpClosed(new Date(invitation.rsvpDeadline!).getTime() < Date.now()), 0); return () => clearTimeout(id); }, [invitation.rsvpDeadline]);
  const photos = useMemo(() => invitation.media.length ? invitation.media : invitation.coverImage ? [{ id: 'cover', url: invitation.coverImage, alt: invitation.coverAlt || names, sortOrder: 0 }] : [], [invitation.media, invitation.coverImage, invitation.coverAlt, names]);

  useEffect(() => {
    if (!opened || !('IntersectionObserver' in window)) return;
    const content = document.querySelector('.invitation-content');
    const sections = content?.querySelectorAll('.invite-section, .event-card, .gallery-item');
    if (!content || !sections) return;
    content.classList.add('motion-ready');
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.08, rootMargin: '0px 0px 40px 0px' });
    sections.forEach((section) => {
      section.classList.add('reveal-on-scroll');
      observer.observe(section);
    });
    return () => observer.disconnect();
  }, [opened]);

  function openInvitation() {
    if (opening) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setOpened(true);
      return;
    }
    setOpening(true);
    window.setTimeout(() => {
      setOpened(true);
      window.requestAnimationFrame(() => window.scrollTo(0, 0));
    }, 780);
  }

  async function submitRsvp(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (!connected) return;
    setRsvpState('sending'); setRsvpError('');
    const form = new FormData(event.currentTarget);
    const body = { invitationId: invitation.id, guestName: String(form.get('guestName') || ''), attendance: String(form.get('attendance') || ''), guestCount: Number(form.get('guestCount') || 1), message: String(form.get('message') || ''), website: String(form.get('website') || '') };
    try { const res = await fetch('/api/rsvp', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }); const data = await res.json(); if (!res.ok) throw new Error(data.error || 'Không thể gửi phản hồi.'); setRsvpState('success'); }
    catch (error) { setRsvpError(error instanceof Error ? error.message : 'Đã có lỗi xảy ra.'); setRsvpState('error'); }
  }

  async function submitWish(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (!connected) return;
    setWishState('sending'); setWishError('');
    const form = new FormData(event.currentTarget);
    const body = { invitationId: invitation.id, guestName: String(form.get('guestName') || ''), message: String(form.get('message') || ''), website: String(form.get('website') || '') };
    try { const res = await fetch('/api/wishes', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }); const data = await res.json(); if (!res.ok) throw new Error(data.error || 'Không thể gửi lời chúc.'); setWishState('success'); }
    catch (error) { setWishError(error instanceof Error ? error.message : 'Đã có lỗi xảy ra.'); setWishState('error'); }
  }

  return <main className="invitation-page">
    <FallingPieces />
    {!opened && <section className={`envelope-screen letter-opening${opening ? ' is-opening' : ''}`} aria-label="Mở thiệp cưới">
      <div className="letter-composition">
        <div className="letter-envelope-back" aria-hidden="true" />
        <div className="letter-note" aria-hidden="true"><span>THƯ MỜI</span><i>✦</i><small>Ngày chung đôi</small></div>
        <div className="letter-photo">{invitation.coverImage ? <Image src={invitation.coverImage} alt={invitation.coverAlt || names} fill sizes="(max-width: 650px) 55vw, 320px" priority unoptimized={invitation.coverImage.startsWith('/api/')} /> : <div className="envelope-initials">{invitation.partnerOne[0]} & {invitation.partnerTwo[0]}</div>}</div>
        <FloralCluster />
        <div className="letter-pocket" aria-hidden="true"><div className="letter-pocket-front" /></div>
        <div className="letter-seal" aria-hidden="true"><Heart size={25} strokeWidth={1.7} /></div>
      </div>
      <div className="letter-caption"><span>TRÂN TRỌNG KÍNH MỜI</span><h1>{invitation.partnerOne} <em>&</em> {invitation.partnerTwo}</h1><p>{primaryEvent ? formatDate(primaryEvent.dateTime) : 'Một ngày thật đẹp'}</p></div>
      <button className="letter-open-button" onClick={openInvitation} disabled={opening}>{opening ? 'Đang mở thiệp…' : 'Mở thiệp của chúng mình'} <ArrowRight size={18} /></button>
      <span className="envelope-hint">Chạm để mở lời mời dành riêng cho bạn</span>
    </section>}
    <div className={`invitation-content ${opened ? 'is-opened' : ''}`}>
      <nav className="invite-nav"><Link href="/" aria-label="Về trang chủ"><ArrowLeft size={18} /></Link><span>Nét Duyên <i>✧</i></span><button onClick={() => navigator.clipboard?.writeText(shareUrl)} aria-label="Sao chép liên kết"><Copy size={17} /></button></nav>
      <section className="invite-hero"><div className="invite-hero-photo">{invitation.coverImage ? <Image src={invitation.coverImage} alt={invitation.coverAlt || names} fill sizes="(max-width: 800px) 100vw, 580px" priority unoptimized={invitation.coverImage.startsWith('/api/')} /> : <div className="hero-monogram">{invitation.partnerOne[0]} & {invitation.partnerTwo[0]}</div>}</div><div className="invite-hero-copy"><span className="eyebrow light">SAVE OUR DATE</span><h1>{invitation.partnerOne}<span>&</span>{invitation.partnerTwo}</h1><div className="hero-rule" /><p>{primaryEvent ? formatDate(primaryEvent.dateTime, { weekday: 'long' }) : 'Ngày chung đôi'}</p><a href="#loi-moi" className="hero-scroll">Cuộn để khám phá <ArrowDown size={16} /></a></div></section>
      <section id="loi-moi" className="invite-section invitation-message"><Ornament className="section-ornament" /><span className="eyebrow">LỜI MỜI CHÂN THÀNH</span><h2>{invitation.headline}</h2><p className="leading-message">{invitation.message}</p><div className="heart-divider">✦</div><p className="script-names">{names}</p></section>
      {(invitation.partnerOneParents || invitation.partnerTwoParents || invitation.partnerOneFullName || invitation.partnerTwoFullName) && <section className="invite-section family-section"><span className="eyebrow light">NGÀY VUI HAI GIA ĐÌNH</span><h2>Trân trọng báo tin</h2><div className="family-grid"><div><span>Gia đình chú rể</span><p>{invitation.partnerOneParents}</p><small>{invitation.partnerOneAddress}</small></div><div className="family-divider">&</div><div><span>Gia đình cô dâu</span><p>{invitation.partnerTwoParents}</p><small>{invitation.partnerTwoAddress}</small></div></div><p className="family-announcement">Lễ thành hôn của</p><h3>{invitation.partnerOneFullName || invitation.partnerOne}<em>&</em>{invitation.partnerTwoFullName || invitation.partnerTwo}</h3></section>}
      {invitation.events.length > 0 && <section className="invite-section events-section"><span className="eyebrow">CÙNG CHUNG VUI</span><h2>Ngày hạnh phúc</h2><div className="event-grid">{invitation.events.map((event) => { const d = dateParts(event.dateTime); return <article className="event-card" key={event.id}><span className="event-card-label">{event.title}</span><div className="event-date"><div><span>{d.weekday}</span><strong>{d.day}</strong><span>THÁNG {d.month} · {d.year}</span></div></div><p className="event-time">{formatTime(event.dateTime)}{event.arrivalTime && ` · Đón khách ${event.arrivalTime}`}</p>{event.lunarDate && <p className="lunar-date">{event.lunarDate}</p>}<div className="event-location"><strong>{event.venue}</strong><span>{event.address}</span></div>{event.mapUrl && <a className="text-link" href={event.mapUrl} target="_blank" rel="noopener noreferrer">Chỉ đường <ArrowRight size={15} /></a>}</article>; })}</div></section>}
      {primaryEvent && <section className="invite-section countdown-section"><span className="eyebrow light">SAVE THE DATE</span><h2>Hẹn bạn ngày ấy</h2><div className="date-and-countdown"><Calendar date={primaryEvent.dateTime} /><div className="countdown-side"><p>Ngày vui sẽ trọn vẹn hơn<br />khi có bạn ở bên.</p><Countdown target={primaryEvent.dateTime} /><a className="calendar-link" href={`https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(`Đám cưới ${names}`)}&dates=${new Date(primaryEvent.dateTime).toISOString().replace(/[-:]|\.\d{3}/g, '')}/${new Date(new Date(primaryEvent.dateTime).getTime() + 3 * 3600000).toISOString().replace(/[-:]|\.\d{3}/g, '')}&details=${encodeURIComponent(primaryEvent.venue + ', ' + primaryEvent.address)}`} target="_blank" rel="noopener noreferrer"><CalendarDays size={17} /> Thêm vào lịch</a></div></div></section>}
      {photos.length > 0 && <section className="invite-section gallery-section"><span className="eyebrow">KHOẢNH KHẮC CỦA CHÚNG MÌNH</span><h2>Album yêu thương</h2><div className={`gallery-grid gallery-count-${Math.min(photos.length, 4)}`}>{photos.map((photo, index) => <button key={photo.id} className="gallery-item" onClick={() => setPhotoIndex(index)} aria-label={`Xem ảnh ${index + 1}`}><Image src={photo.url} alt={photo.alt} fill sizes="(max-width: 650px) 46vw, 300px" unoptimized={photo.url.startsWith('/api/')} /></button>)}</div>{invitation.story && <p className="gallery-story">“{invitation.story}”</p>}</section>}
      {primaryEvent && <section className="invite-section location-section"><span className="eyebrow light">ĐỊA ĐIỂM</span><h2>Hẹn gặp tại</h2><MapPin size={30} strokeWidth={1.2} /><h3>{primaryEvent.venue}</h3><p>{primaryEvent.address}</p>{primaryEvent.mapUrl && <a className="outline-light" href={primaryEvent.mapUrl} target="_blank" rel="noopener noreferrer">Mở chỉ đường <ArrowRight size={16} /></a>}</section>}
      {(invitation.dressCode || invitation.timeline.length > 0) && <section className="invite-section details-section">{invitation.dressCode && <div className="dress-code"><span className="eyebrow">TRANG PHỤC</span><h2>Dress code</h2><p>{invitation.dressCode}</p><div className="color-swatches" aria-hidden="true"><i /><i /><i /><i /></div></div>}{invitation.timeline.length > 0 && <div className="timeline-block"><span className="eyebrow">CHƯƠNG TRÌNH</span><h2>Lịch trình ngày cưới</h2><ol className="timeline-list">{invitation.timeline.map((item) => <li key={item.id}><time>{item.time}</time><div><strong>{item.title}</strong>{item.description && <p>{item.description}</p>}</div></li>)}</ol></div>}</section>}
      {invitation.rsvpEnabled && <section className="invite-section rsvp-section" id="rsvp"><span className="eyebrow">LỜI HẸN</span><h2>Xác nhận tham dự</h2><p>Cho chúng mình biết bạn có thể đến chung vui nhé.</p>{rsvpClosed ? <div className="form-notice">Thời hạn xác nhận đã kết thúc. Cảm ơn bạn đã quan tâm!</div> : !connected ? <div className="form-notice">Thiệp mẫu đang ở chế độ xem trước. Kết nối Supabase để nhận phản hồi.</div> : rsvpState === 'success' ? <div className="form-success"><Check size={22} /> Cảm ơn bạn! Chúng mình đã nhận được phản hồi.</div> : <form className="invite-form" onSubmit={submitRsvp}><label>Họ và tên<input name="guestName" minLength={2} maxLength={100} required placeholder="Tên của bạn" /></label><fieldset><legend>Bạn sẽ tham dự chứ?</legend><label className="radio-label"><input type="radio" name="attendance" value="yes" required /> Rất vui được tham dự</label><label className="radio-label"><input type="radio" name="attendance" value="no" required /> Tiếc là mình không thể đến</label></fieldset><label>Số người tham dự<select name="guestCount" defaultValue="1">{[1,2,3,4,5].map((n) => <option key={n} value={n}>{n} người</option>)}</select></label><label>Lời nhắn (tùy chọn)<textarea name="message" maxLength={500} rows={3} placeholder="Gửi đôi lời đến chúng mình" /></label><input className="honeypot" name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" />{rsvpError && <p className="form-error" role="alert">{rsvpError}</p>}<button className="submit-button" type="submit" disabled={rsvpState === 'sending'}>{rsvpState === 'sending' ? 'Đang gửi…' : 'Gửi xác nhận'} <Send size={16} /></button></form>}</section>}
      {invitation.wishesEnabled && <section className="invite-section wishes-section"><span className="eyebrow light">SỔ LƯU BÚT</span><h2>Gửi lời chúc</h2><p>Một lời nhắn nhỏ sẽ ở lại cùng chúng mình thật lâu.</p>{connected && (wishState === 'success' ? <div className="form-success light-success"><Check size={22} /> Cảm ơn bạn! Lời chúc sẽ hiện sau khi được duyệt.</div> : <form className="wish-form" onSubmit={submitWish}><input name="guestName" minLength={2} maxLength={100} required placeholder="Tên của bạn" aria-label="Tên của bạn" /><textarea name="message" minLength={3} maxLength={1000} required rows={3} placeholder="Lời chúc của bạn…" aria-label="Lời chúc" /><input className="honeypot" name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" />{wishError && <p className="form-error" role="alert">{wishError}</p>}<button type="submit" disabled={wishState === 'sending'}>{wishState === 'sending' ? 'Đang gửi…' : 'Gửi lời chúc'} <ArrowRight size={16} /></button></form>)}{!connected && <div className="form-notice dark-notice">Kết nối Supabase để nhận lời chúc.</div>}{invitation.wishes.length > 0 && <div className="wish-list">{invitation.wishes.map((wish) => <blockquote key={wish.id}><p>“{wish.message}”</p><cite>— {wish.guestName}</cite></blockquote>)}</div>}</section>}
      {invitation.giftsEnabled && invitation.gifts.length > 0 && <section className="invite-section gift-section"><span className="eyebrow">TẤM LÒNG CỦA BẠN</span><h2>Hộp quà mừng</h2><p>Sự hiện diện của bạn đã là món quà rất quý.</p><button className="gift-button" onClick={() => setGiftOpen(true)}><Gift size={20} /> Mở hộp quà</button></section>}
      <footer className="invite-footer"><Ornament className="footer-flower" /><Heart size={19} fill="currentColor" /><h2>{invitation.partnerOne} <em>&</em> {invitation.partnerTwo}</h2><p>{invitation.closingMessage}</p><span>Nét Duyên · Một ngày để nhớ mãi</span></footer>
    </div>
    {photoIndex !== null && <Lightbox media={photos} initial={photoIndex} close={() => setPhotoIndex(null)} />}
    {giftOpen && <div className="gift-modal" role="dialog" aria-modal="true" aria-label="Hộp quà mừng" onClick={() => setGiftOpen(false)}><div className="gift-modal-card" onClick={(e) => e.stopPropagation()}><button className="modal-close" onClick={() => setGiftOpen(false)} aria-label="Đóng"><X /></button><Gift size={26} /><h2>Hộp quà mừng</h2><p>Cảm ơn tấm lòng của bạn.</p><div className="gift-accounts">{invitation.gifts.map((gift) => <div key={gift.id} className="gift-account"><strong>{gift.recipient}</strong>{gift.qrUrl && <Image src={gift.qrUrl} alt={`Mã QR tài khoản ${gift.recipient}`} width={170} height={170} unoptimized={gift.qrUrl.startsWith('/api/')} />}<span>{gift.bankName}</span><span>{gift.accountHolder}</span><button onClick={async () => { await navigator.clipboard.writeText(gift.accountNumber); setCopiedGift(gift.id); }}>{gift.accountNumber} {copiedGift === gift.id ? <Check size={15} /> : <Copy size={15} />}</button></div>)}</div></div></div>}
  </main>;
}
