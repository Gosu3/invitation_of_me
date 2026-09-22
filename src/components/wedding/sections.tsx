'use client';

import { useEffect, useState, type CSSProperties, type FormEvent, type ReactNode, type RefObject } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowDown, ArrowLeft, ArrowRight, Check, Copy, Heart, MapPin, Send } from 'lucide-react';
import type { WeddingInvitationConfig } from '@/lib/wedding-config';
import { weddingSubmissions } from '@/lib/wedding-submissions';
import { dateParts, formatDate, formatTime } from '@/lib/utils';
import { FloralDecoration, FloralDivider, SectionTitle } from './shared';
import { ArchitectureSection, CardFlower, weddingArtwork } from './decorations';

export function WeddingHero({ config, headingRef }: { config: WeddingInvitationConfig; headingRef: RefObject<HTMLHeadingElement | null> }) {
  const { theme, couple, content, weddingDate } = config;
  return <section className="letter-story" aria-label={`Thiệp cưới ${couple.names}`}>
    <div className="letter-composition">
      <Image className="letter-flower-crown" src={theme.assets.flower} alt="" aria-hidden="true" width={420} height={420} loading="eager" />
      <Image className="letter-envelope-image" src={theme.assets.envelope} alt="" aria-hidden="true" width={420} height={604} loading="eager" />
      <div className="letter-note" aria-hidden="true"><span>THƯ MỜI</span><i>✦</i><small>Ngày chung đôi</small></div>
      <div className="letter-photo">{content.coverImage ? <Image src={content.coverImage} alt={content.coverAlt || couple.names} fill sizes="(max-width: 650px) 55vw, 320px" preload unoptimized={content.coverImage.startsWith('/api/')} /> : <div className="envelope-initials">{couple.groom[0]} & {couple.bride[0]}</div>}</div>
      <Image className="letter-bouquet" src={theme.assets.flower} alt="" aria-hidden="true" width={500} height={500} loading="eager" />
      <Image className="letter-flower-trail" src={theme.assets.flower} alt="" aria-hidden="true" width={340} height={340} loading="eager" />
      <div className="letter-seal" aria-hidden="true"><Heart size={25} strokeWidth={1.7} /></div>
    </div>
    <div className="letter-caption"><span>TRÂN TRỌNG KÍNH MỜI</span><h1 ref={headingRef} tabIndex={-1}>{couple.groom} <em>&</em> {couple.bride}</h1><p>{weddingDate ? formatDate(weddingDate) : 'Một ngày thật đẹp'}</p></div>
    <a href="#loi-moi" className="letter-scroll">Cuộn để đọc lời mời <ArrowDown size={16} /></a>
  </section>;
}

export function InvitationNav({ copyLink, status }: { copyLink: () => void; status: string }) {
  return <><nav className="invite-nav"><Link href="/" aria-label="Về trang chủ"><ArrowLeft size={18} /></Link><span>Nét Duyên <i>✧</i></span><button onClick={copyLink} aria-label="Sao chép liên kết"><Copy size={17} /></button></nav><span role="status" className="share-status">{status}</span></>;
}

export function CoupleSection({ config }: { config: WeddingInvitationConfig }) {
  return <section id="loi-moi" className="invite-section invitation-message"><FloralDecoration /><SectionTitle eyebrow="LỜI MỜI CHÂN THÀNH">{config.content.headline}</SectionTitle><p className="leading-message">{config.content.message}</p><div className="heart-divider">✦</div><p className="script-names">{config.couple.names}</p></section>;
}

const cardPetals = [
  { left: '9%', delay: '-3s', duration: '11s', size: '11px' },
  { left: '23%', delay: '-8s', duration: '13s', size: '9px' },
  { left: '76%', delay: '-5s', duration: '12s', size: '12px' },
  { left: '91%', delay: '-10s', duration: '14s', size: '10px' },
];

function WeddingInfoCard({ title, flowerSide, className, children }: { title: string; flowerSide: 'left' | 'right'; className: string; children: ReactNode }) {
  return <ArchitectureSection><section className={`invite-section paper-info-card wedding-info-card ${className}`}>
    <div className="wedding-card-petals" aria-hidden="true">{cardPetals.map((petal, index) => <span key={index} className="falling-piece petal" style={{ left: petal.left, animationDelay: petal.delay, animationDuration: petal.duration, width: petal.size, height: `calc(${petal.size} * 1.5)` } as CSSProperties}><svg viewBox="0 0 24 24" fill="currentColor"><path d="M3 21c2-8 7-15 18-18-1 11-8 17-18 18Z" /></svg></span>)}</div>
    <div className="wedding-info-content"><h2 className="wedding-info-title">{title}</h2>{children}</div>
    <CardFlower side={flowerSide} />
  </section></ArchitectureSection>;
}

function WeddingDateDisplay({ dateTime, ceremony = false }: { dateTime: string; ceremony?: boolean }) {
  const date = dateParts(dateTime);
  if (ceremony) return <div className="wedding-date-display ceremony-date-display">
    <div className="ceremony-time-row"><span>VÀO LÚC {formatTime(dateTime)}</span><span>{date.weekday}</span></div>
    <div className="ceremony-date-numbers"><strong>{date.day}</strong><span aria-hidden="true" /><div className="ceremony-month-year"><span>THÁNG {date.month}</span><span>{date.year}</span></div></div>
  </div>;
  return <div className="wedding-date-display"><p>VÀO LÚC {formatTime(dateTime)} <span>·</span> {date.weekday}</p><div><strong>{date.day}</strong><span aria-hidden="true" /><span>THÁNG {date.month}<br />{date.year}</span></div></div>;
}

function ParentsColumn({ parents, address, side }: { parents?: string; address?: string; side: string }) {
  const names = parents?.split(/\s*[·•;\n]+\s*/).filter(Boolean) || [];
  return <div className="wedding-parents-column" aria-label={side}>
    <span className="wedding-parents-label">Ông Bà</span>
    <strong className="wedding-parent-name">{names[0] || '\u00a0'}</strong>
    <strong className="wedding-parent-name">{names.slice(1).join(' · ') || '\u00a0'}</strong>
    <small className="wedding-parent-address">{address || '\u00a0'}</small>
  </div>;
}

export function FamilyCeremonySection({ config }: { config: WeddingInvitationConfig }) {
  const event = config.ceremony;
  return <WeddingInfoCard title="THÔNG TIN LỄ CƯỚI" flowerSide="right" className="family-section">
    {config.features.showFamilyInfo && (config.family.groomParents || config.family.brideParents || config.family.groomAddress || config.family.brideAddress) && <div className="wedding-family-grid">
      <ParentsColumn parents={config.family.groomParents} address={config.family.groomAddress} side="Nhà trai" />
      <i aria-hidden="true" />
      <ParentsColumn parents={config.family.brideParents} address={config.family.brideAddress} side="Nhà gái" />
    </div>}
    <p className="wedding-invitation-copy"><span dir="auto">{'TRÂN TRỌNG BÁO TIN\nLỄ THÀNH HÔN CỦA CON CHÚNG TÔI'}</span></p>
    <div className="wedding-couple-names"><h3 className="groom-name">{config.couple.groomFullName}</h3><span>{config.couple.groomRole}</span><em>&</em><h3 className="bride-name">{config.couple.brideFullName}</h3><span>{config.couple.brideRole}</span></div>
    {event && <div className="wedding-event-details ceremony-event-details">
      <div className="ceremony-venue"><span dir="auto">{'LỄ THÀNH HÔN ĐƯỢC CỬ HÀNH TẠI\nTƯ GIA'}</span></div>
      <WeddingDateDisplay dateTime={event.dateTime} ceremony />
      {event.lunarDate && <p className="wedding-lunar-date">({event.lunarDate})</p>}
    </div>}
  </WeddingInfoCard>;
}

function calendarUrlFor(config: WeddingInvitationConfig) {
  if (!config.weddingDate || !config.reception) return '#';
  const start = new Date(config.weddingDate);
  const end = new Date(start.getTime() + 3 * 3600000);
  const googleDate = (date: Date) => date.toISOString().replace(/[-:]|\.\d{3}/g, '');
  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(`Đám cưới ${config.couple.names}`)}&dates=${googleDate(start)}/${googleDate(end)}&ctz=${encodeURIComponent(config.timezone)}&details=${encodeURIComponent(`${config.reception.venue}, ${config.reception.address}`)}`;
}

export function ReceptionSection({ config }: { config: WeddingInvitationConfig }) {
  const event = config.reception;
  if (!event) return null;
  const date = dateParts(event.dateTime);
  return <><FloralDivider /><WeddingInfoCard title="THÔNG TIN TIỆC CƯỚI" flowerSide="left" className="events-section">
    <div className="reception-content">
      <h3 className="reception-intro">Tiệc cưới sẽ diễn ra vào lúc:</h3>
      <div className="reception-day-time"><span>{date.weekday}</span><span>{formatTime(event.dateTime)}</span></div>
      <div className="reception-date-numbers"><strong>{date.day}</strong><span aria-hidden="true" /><div><span>THÁNG {date.month}</span><span>{date.year}</span></div></div>
      {event.lunarDate && <p className="wedding-lunar-date">({event.lunarDate})</p>}
      <div className="reception-times"><span>ĐÓN KHÁCH<strong>{event.arrivalTime || formatTime(event.dateTime)}</strong></span><span>KHAI TIỆC<strong>{formatTime(event.dateTime)}</strong></span></div>
      <div className="reception-calendar"><MiniCalendar date={event.dateTime} timezone={config.timezone} /></div>
      <a className="calendar-link" href={calendarUrlFor(config)} target="_blank" rel="noopener noreferrer">Thêm vào lịch</a>
      <Countdown target={event.dateTime} />
      <a className="reception-rsvp-link" href="#rsvp">XÁC NHẬN THAM DỰ</a>
    </div>
  </WeddingInfoCard></>;
}

function MiniCalendar({ date, timezone }: { date: string; timezone: string }) {
  const instant = new Date(date);
  const month = Number(new Intl.DateTimeFormat('en-US', { timeZone: timezone, month: 'numeric' }).format(instant));
  const year = Number(new Intl.DateTimeFormat('en-US', { timeZone: timezone, year: 'numeric' }).format(instant));
  const selected = Number(new Intl.DateTimeFormat('en-US', { timeZone: timezone, day: 'numeric' }).format(instant));
  const offset = (new Date(year, month - 1, 1).getDay() + 6) % 7;
  const count = new Date(year, month, 0).getDate();
  return <div className="mini-calendar"><div className="mini-calendar-title">Tháng {month} / {year}</div><div className="mini-calendar-weekdays">{['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'].map((value) => <b key={value}>{value}</b>)}</div><div className="mini-calendar-grid">{Array.from({ length: offset }, (_, index) => <span key={`blank-${index}`} />)}{Array.from({ length: count }, (_, index) => <span className={index + 1 === selected ? 'selected' : ''} key={index}>{index + 1 === selected ? <><Heart className="calendar-heart" size={26} fill="currentColor" aria-hidden="true" /><span className="calendar-day-number">{index + 1}</span></> : index + 1}</span>)}</div></div>;
}

function Countdown({ target }: { target: string }) {
  const [now, setNow] = useState(0);
  useEffect(() => { const first = window.setTimeout(() => setNow(Date.now()), 0); const timer = window.setInterval(() => setNow(Date.now()), 1000); return () => { window.clearTimeout(first); window.clearInterval(timer); }; }, []);
  if (!now) return <div className="countdown-placeholder">Ngày vui đang đến gần</div>;
  const difference = new Date(target).getTime() - now;
  if (difference <= 0) return <div className="countdown-past">Ngày chung đôi đã đến ♡</div>;
  const values = [Math.floor(difference / 86400000), Math.floor((difference % 86400000) / 3600000), Math.floor((difference % 3600000) / 60000), Math.floor((difference % 60000) / 1000)];
  return <div className="countdown" aria-label={`Còn ${values[0]} ngày ${values[1]} giờ ${values[2]} phút ${values[3]} giây`}>{values.map((value, index) => <div key={index}><strong>{index ? String(value).padStart(2, '0') : value}</strong><span>{['Ngày', 'Giờ', 'Phút', 'Giây'][index]}</span></div>)}</div>;
}

export function RsvpSection({ config, connected }: { config: WeddingInvitationConfig; connected: boolean }) {
  const [state, setState] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');
  const [error, setError] = useState('');
  const [closed, setClosed] = useState(false);
  useEffect(() => {
    const deadline = config.content.rsvpDeadline;
    if (!deadline) return;
    const timer = window.setTimeout(() => setClosed(new Date(deadline).getTime() < Date.now()), 0);
    return () => window.clearTimeout(timer);
  }, [config.content.rsvpDeadline]);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (!connected) return;
    setState('sending'); setError(''); const form = new FormData(event.currentTarget);
    try { await weddingSubmissions.rsvp({ invitationId: config.id, guestName: String(form.get('guestName') || ''), attendance: String(form.get('attendance') || ''), guestCount: Number(form.get('guestCount') || 1), message: String(form.get('message') || ''), website: String(form.get('website') || '') }); setState('success'); }
    catch (reason) { setError(reason instanceof Error ? reason.message : 'Đã có lỗi xảy ra.'); setState('error'); }
  }
  return <section className="invite-section rsvp-section" id="rsvp"><SectionTitle eyebrow="LỜI HẸN">Xác nhận tham dự</SectionTitle><p>Cho chúng mình biết bạn có thể đến chung vui nhé.</p>{closed ? <div className="form-notice">Thời hạn xác nhận đã kết thúc. Cảm ơn bạn đã quan tâm!</div> : !connected ? <div className="form-notice">Thiệp mẫu đang ở chế độ xem trước. Kết nối Supabase để nhận phản hồi.</div> : state === 'success' ? <div className="form-success"><Check size={22} /> Cảm ơn bạn! Chúng mình đã nhận được phản hồi.</div> : <form className="invite-form" onSubmit={submit}><label>Họ và tên<input name="guestName" minLength={2} maxLength={100} required placeholder="Tên của bạn" /></label><fieldset><legend>Bạn sẽ tham dự chứ?</legend><label className="radio-label"><input type="radio" name="attendance" value="yes" required /> Rất vui được tham dự</label><label className="radio-label"><input type="radio" name="attendance" value="no" required /> Tiếc là mình không thể đến</label></fieldset><label>Số người tham dự<select name="guestCount" defaultValue="1">{[1,2,3,4,5].map((number) => <option key={number} value={number}>{number} người</option>)}</select></label><label>Lời nhắn (tùy chọn)<textarea name="message" maxLength={500} rows={3} placeholder="Gửi đôi lời đến chúng mình" /></label><input className="honeypot" name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" />{state === 'error' && <p className="form-error" role="alert">{error}</p>}<button className="submit-button" type="submit" disabled={state === 'sending'}>{state === 'sending' ? 'Đang gửi…' : 'Gửi xác nhận'} <Send size={16} /></button></form>}</section>;
}

export function VenueSection({ config }: { config: WeddingInvitationConfig }) {
  if (!config.venue) return null;
  const embed = `https://www.google.com/maps?q=${encodeURIComponent(`${config.venue.title}, ${config.venue.address}`)}&output=embed`;
  return <section className="invite-section location-section"><SectionTitle eyebrow="ĐỊA ĐIỂM" light>Hẹn gặp tại</SectionTitle><MapPin size={30} strokeWidth={1.2} /><h3>{config.venue.title}</h3><p>{config.venue.address}</p>{config.features.showMap && <div className="map-frame"><iframe title={`Bản đồ ${config.venue.title}`} src={embed} loading="lazy" referrerPolicy="no-referrer-when-downgrade" /></div>}{config.venue.mapUrl && <a className="outline-light" href={config.venue.mapUrl} target="_blank" rel="noopener noreferrer">Mở chỉ đường <ArrowRight size={16} /></a>}</section>;
}

export function TimelineSection({ config }: { config: WeddingInvitationConfig }) {
  return <ArchitectureSection><section className="invite-section paper-info-card wedding-info-card timeline-section">
    <div className="wedding-info-content"><h2 className="wedding-info-title">LỊCH TRÌNH NGÀY CƯỚI</h2>
      <ol className="wedding-timeline">{config.timeline.map((item) => <li key={item.id}><time>{item.time}</time><span aria-hidden="true" /><div><strong>{item.title}</strong>{item.description && <p>{item.description}</p>}</div></li>)}</ol>
    </div><CardFlower timeline />
  </section></ArchitectureSection>;
}

export function GuestbookSection() {
  const [name, setName] = useState('');
  const [message, setMessage] = useState('');
  const [wishes, setWishes] = useState<{ id: string; guestName: string; message: string }[]>([]);
  const [status, setStatus] = useState('');
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (name.trim().length < 2 || message.trim().length < 3) {
      setStatus('Vui lòng nhập tên và lời chúc của bạn.');
      return;
    }
    setWishes((current) => [{ id: crypto.randomUUID(), guestName: name.trim(), message: message.trim() }, ...current]);
    setName(''); setMessage(''); setStatus('Đã thêm lời chúc của bạn ♡');
  }
  return <section className="invite-section guestbook-wrapper" id="so-luu-but">
    <Image className="guestbook-background" src={weddingArtwork.guestbook} alt="" aria-hidden="true" width={1314} height={1197} unoptimized />
    <div className="guestbook-content">
      <h2>SỔ LƯU BÚT</h2>
      <form className="guestbook-form" onSubmit={submit}>
        <input value={name} onChange={(event) => setName(event.target.value)} minLength={2} maxLength={100} required placeholder="Tên của bạn" aria-label="Tên của bạn" />
        <textarea value={message} onChange={(event) => setMessage(event.target.value)} minLength={3} maxLength={1000} required rows={2} placeholder="Lời chúc của bạn…" aria-label="Lời chúc" />
        <button type="submit">GỬI LỜI CHÚC <Send size={13} /></button>
      </form>
      <span className="guestbook-status" role="status">{status}</span>
      <div className="guestbook-wishes" tabIndex={0} aria-label="Danh sách lời chúc">
        {wishes.length ? wishes.map((wish) => <blockquote key={wish.id}><strong>{wish.guestName}</strong><p>{wish.message}</p></blockquote>) : <p>Hãy là người đầu tiên gửi yêu thương ♡</p>}
      </div>
    </div>
  </section>;
}

export function ThankYouSection() {
  return <footer className="invite-footer"><Heart size={22} strokeWidth={1.3} /><p>Sự hiện diện của bạn là món quà quý giá nhất đối với chúng mình</p></footer>;
}
