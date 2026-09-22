'use client';

import { useEffect, useState, type CSSProperties, type FormEvent, type ReactNode, type RefObject } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowDown, ArrowLeft, ArrowRight, CalendarDays, Check, Copy, Heart, MapPin, Send, Sparkles } from 'lucide-react';
import type { WeddingInvitationConfig } from '@/lib/wedding-config';
import { weddingSubmissions } from '@/lib/wedding-submissions';
import { dateParts, formatDate, formatTime } from '@/lib/utils';
import { FloralDecoration, FloralDivider, SectionTitle } from './shared';

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

function WeddingInfoCard({ title, flowerSide, flower, className, children }: { title: string; flowerSide: 'left' | 'right'; flower: string; className: string; children: ReactNode }) {
  return <section className={`invite-section paper-info-card wedding-info-card ${className}`}>
    <div className="wedding-card-petals" aria-hidden="true">{cardPetals.map((petal, index) => <span key={index} className="falling-piece petal" style={{ left: petal.left, animationDelay: petal.delay, animationDuration: petal.duration, width: petal.size, height: `calc(${petal.size} * 1.5)` } as CSSProperties}><svg viewBox="0 0 24 24" fill="currentColor"><path d="M3 21c2-8 7-15 18-18-1 11-8 17-18 18Z" /></svg></span>)}</div>
    <div className="wedding-info-content"><h2 className="wedding-info-title">{title}</h2>{children}</div>
    <Image className={`wedding-info-flower wedding-info-flower-${flowerSide}`} src={flower} alt="" aria-hidden="true" width={360} height={360} />
  </section>;
}

function WeddingDateDisplay({ dateTime }: { dateTime: string }) {
  const date = dateParts(dateTime);
  return <div className="wedding-date-display"><p>VÀO LÚC {formatTime(dateTime)} <span>·</span> {date.weekday}</p><div><strong>{date.day}</strong><span aria-hidden="true" /><span>THÁNG {date.month}<br />{date.year}</span></div></div>;
}

export function FamilyCeremonySection({ config }: { config: WeddingInvitationConfig }) {
  const event = config.ceremony;
  return <WeddingInfoCard title="THÔNG TIN LỄ CƯỚI" flowerSide="right" flower={config.theme.assets.flower} className="family-section">
    {config.features.showFamilyInfo && (config.family.groomParents || config.family.brideParents || config.family.groomAddress || config.family.brideAddress) && <div className="wedding-family-grid"><div><span>NHÀ TRAI</span>{config.family.groomParents && <p>{config.family.groomParents}</p>}{config.family.groomAddress && <small>{config.family.groomAddress}</small>}</div><i aria-hidden="true" /><div><span>NHÀ GÁI</span>{config.family.brideParents && <p>{config.family.brideParents}</p>}{config.family.brideAddress && <small>{config.family.brideAddress}</small>}</div></div>}
    <p className="wedding-invitation-copy">TRÂN TRỌNG BÁO TIN<br />LỄ THÀNH HÔN CỦA CON CHÚNG TÔI</p>
    <div className="wedding-couple-names"><h3>{config.couple.groomFullName}</h3><span>{config.couple.groomRole}</span><em>&</em><h3>{config.couple.brideFullName}</h3><span>{config.couple.brideRole}</span></div>
    {event && <div className="wedding-event-details"><p>LỄ THÀNH HÔN ĐƯỢC CỬ HÀNH TẠI</p><strong>{event.venue}</strong><small>{event.address}</small><WeddingDateDisplay dateTime={event.dateTime} />{event.lunarDate && <p className="wedding-lunar-date">({event.lunarDate})</p>}</div>}
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
  return <><FloralDivider /><WeddingInfoCard title="THÔNG TIN TIỆC CƯỚI" flowerSide="left" flower={config.theme.assets.flower} className="events-section">
    <p className="wedding-invitation-copy">TRÂN TRỌNG KÍNH MỜI<br />ĐẾN DỰ BỮA TIỆC CHUNG VUI<br />CÙNG GIA ĐÌNH CHÚNG TÔI</p>
    <WeddingDateDisplay dateTime={event.dateTime} />
    {event.lunarDate && <p className="wedding-lunar-date">({event.lunarDate})</p>}
    <div className="reception-times"><span>ĐÓN KHÁCH<strong>{event.arrivalTime || formatTime(event.dateTime)}</strong></span><span>KHAI TIỆC<strong>{formatTime(event.dateTime)}</strong></span></div>
    <div className="wedding-event-details wedding-reception-venue"><p>TẠI</p><strong>{event.venue}</strong><small>{event.address}</small>{event.mapUrl && <a href={event.mapUrl} target="_blank" rel="noopener noreferrer">XEM CHỈ ĐƯỜNG <ArrowRight size={13} /></a>}</div>
    <p className="wedding-card-closing">RẤT HÂN HẠNH ĐƯỢC ĐÓN TIẾP</p>
    <div className="reception-calendar"><MiniCalendar date={event.dateTime} timezone={config.timezone} /><Countdown target={event.dateTime} /><a className="calendar-link" href={calendarUrlFor(config)} target="_blank" rel="noopener noreferrer"><CalendarDays size={15} /> Thêm vào lịch</a></div>
  </WeddingInfoCard></>;
}

function MiniCalendar({ date, timezone }: { date: string; timezone: string }) {
  const instant = new Date(date);
  const month = Number(new Intl.DateTimeFormat('en-US', { timeZone: timezone, month: 'numeric' }).format(instant));
  const year = Number(new Intl.DateTimeFormat('en-US', { timeZone: timezone, year: 'numeric' }).format(instant));
  const selected = Number(new Intl.DateTimeFormat('en-US', { timeZone: timezone, day: 'numeric' }).format(instant));
  const offset = (new Date(year, month - 1, 1).getDay() + 6) % 7;
  const count = new Date(year, month, 0).getDate();
  return <div className="mini-calendar"><div className="mini-calendar-title">Tháng {month} · {year}</div><div className="mini-calendar-grid">{['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'].map((value) => <b key={value}>{value}</b>)}{Array.from({ length: offset }, (_, index) => <span key={`blank-${index}`} />)}{Array.from({ length: count }, (_, index) => <span className={index + 1 === selected ? 'selected' : ''} key={index}>{index + 1 === selected ? <><Heart className="calendar-heart" size={15} fill="currentColor" aria-hidden="true" /><span className="calendar-day-number">{index + 1}</span></> : index + 1}</span>)}</div></div>;
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
  return <section className="invite-section timeline-section paper-note-card"><Image className="frame-flower timeline-frame-flower" src={config.theme.assets.flower} alt="" aria-hidden="true" width={270} height={270} /><SectionTitle eyebrow="CHƯƠNG TRÌNH">Lịch trình ngày cưới</SectionTitle><ol className="wedding-timeline">{config.timeline.map((item) => <li key={item.id}><time>{item.time}</time><span aria-hidden="true" /><div><strong>{item.title}</strong>{item.description && <p>{item.description}</p>}</div></li>)}</ol></section>;
}

export function GuestbookSection({ config, connected }: { config: WeddingInvitationConfig; connected: boolean }) {
  const [state, setState] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');
  const [error, setError] = useState('');
  const [wish, setWish] = useState('');
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (!connected) return; setState('sending'); setError(''); const form = new FormData(event.currentTarget);
    try { await weddingSubmissions.wish({ invitationId: config.id, guestName: String(form.get('guestName') || ''), message: wish, website: String(form.get('website') || '') }); setState('success'); }
    catch (reason) { setError(reason instanceof Error ? reason.message : 'Đã có lỗi xảy ra.'); setState('error'); }
  }
  return <section className="invite-section wishes-section"><SectionTitle eyebrow="SỔ LƯU BÚT" light>Gửi lời chúc</SectionTitle><p>Một lời nhắn nhỏ sẽ ở lại cùng chúng mình thật lâu.</p>{connected && state !== 'success' && <form className="wish-form" onSubmit={submit}><input name="guestName" minLength={2} maxLength={100} required placeholder="Tên của bạn" aria-label="Tên của bạn" /><div className="wish-compose"><textarea name="message" value={wish} onChange={(event) => setWish(event.target.value)} minLength={3} maxLength={1000} required rows={3} placeholder="Lời chúc của bạn…" aria-label="Lời chúc" /><button type="button" className="ai-wish" onClick={() => setWish(`Chúc ${config.couple.groom} và ${config.couple.bride} trăm năm hạnh phúc, luôn yêu thương và đồng hành cùng nhau trên mọi chặng đường!`)} aria-label="Gợi ý lời chúc"><Sparkles size={17} /> Gợi ý</button></div><input className="honeypot" name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" />{state === 'error' && <p className="form-error" role="alert">{error}</p>}<button type="submit" disabled={state === 'sending'}>{state === 'sending' ? 'Đang gửi…' : 'Gửi lời chúc'} <ArrowRight size={16} /></button></form>}{state === 'success' && <div className="form-success light-success"><Check size={22} /> Cảm ơn bạn! Lời chúc sẽ hiện sau khi được duyệt.</div>}{!connected && <div className="form-notice dark-notice">Kết nối Supabase để nhận lời chúc.</div>}{config.content.wishes.length ? <div className="wish-list">{config.content.wishes.map((item) => <blockquote key={item.id}><p>“{item.message}”</p><cite>— {item.guestName}</cite></blockquote>)}</div> : <p className="guestbook-empty">Chưa có lời chúc nào. Hãy là người đầu tiên gửi yêu thương ♡</p>}</section>;
}

export function ThankYouSection({ config }: { config: WeddingInvitationConfig }) {
  return <footer className="invite-footer"><FloralDecoration position="right" className="footer-flower" /><Heart size={19} fill="currentColor" /><h2>{config.couple.groom} <em>&</em> {config.couple.bride}</h2><p>{config.content.closingMessage}</p><span>Nét Duyên · Một ngày để nhớ mãi</span></footer>;
}
