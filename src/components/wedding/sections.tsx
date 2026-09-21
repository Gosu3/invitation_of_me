'use client';

import { useEffect, useState, type FormEvent, type RefObject } from 'react';
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

export function FamilyCeremonySection({ config }: { config: WeddingInvitationConfig }) {
  const event = config.ceremony;
  return <section className="invite-section family-section"><SectionTitle eyebrow="NGÀY VUI HAI GIA ĐÌNH" light>Trân trọng báo tin</SectionTitle>
    {config.features.showFamilyInfo && <div className="family-grid"><div><span>Gia đình chú rể</span><p>{config.family.groomParents || 'Gia đình Văn Thọ'}</p><small>{config.family.groomAddress}</small></div><div className="family-divider">&</div><div><span>Gia đình cô dâu</span><p>{config.family.brideParents || 'Gia đình Hồng Thắm'}</p><small>{config.family.brideAddress}</small></div></div>}
    <p className="family-announcement">Lễ thành hôn của</p><h3>{config.couple.groomFullName}<em>&</em>{config.couple.brideFullName}</h3>
    {event && <div className="ceremony-summary"><span>{formatTime(event.dateTime)}</span><strong>{formatDate(event.dateTime)}</strong><p>{event.venue}<br />{event.address}</p>{event.lunarDate && <small>{event.lunarDate}</small>}</div>}
  </section>;
}

export function ReceptionSection({ config }: { config: WeddingInvitationConfig }) {
  const event = config.reception;
  if (!event) return null;
  const date = dateParts(event.dateTime);
  return <><FloralDivider /><section className="invite-section events-section"><SectionTitle eyebrow="THÔNG TIN TIỆC CƯỚI">Cùng chung vui</SectionTitle><article className="event-card featured-event"><span className="event-card-label">{event.title}</span><div className="event-date"><div><span>{date.weekday}</span><strong>{date.day}</strong><span>THÁNG {date.month} · {date.year}</span></div></div><p className="event-time">{formatTime(event.dateTime)}{event.arrivalTime && ` · Đón khách ${event.arrivalTime}`}</p>{event.lunarDate && <p className="lunar-date">{event.lunarDate}</p>}<div className="event-location"><strong>{event.venue}</strong><span>{event.address}</span></div></article></section></>;
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

export function WeddingCountdown({ config }: { config: WeddingInvitationConfig }) {
  if (!config.weddingDate || !config.reception) return null;
  const start = new Date(config.weddingDate);
  const end = new Date(start.getTime() + 3 * 3600000);
  const googleDate = (date: Date) => date.toISOString().replace(/[-:]|\.\d{3}/g, '');
  const calendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(`Đám cưới ${config.couple.names}`)}&dates=${googleDate(start)}/${googleDate(end)}&ctz=${encodeURIComponent(config.timezone)}&details=${encodeURIComponent(`${config.reception.venue}, ${config.reception.address}`)}`;
  return <section className="invite-section countdown-section"><SectionTitle eyebrow="SAVE THE DATE" light>Hẹn bạn ngày ấy</SectionTitle><div className="date-and-countdown"><MiniCalendar date={config.weddingDate} timezone={config.timezone} /><div className="countdown-side"><p>Ngày vui sẽ trọn vẹn hơn<br />khi có bạn ở bên.</p><Countdown target={config.weddingDate} /><a className="calendar-link" href={calendarUrl} target="_blank" rel="noopener noreferrer"><CalendarDays size={17} /> Thêm vào lịch</a></div></div></section>;
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
  return <section className="invite-section timeline-section"><SectionTitle eyebrow="CHƯƠNG TRÌNH">Lịch trình ngày cưới</SectionTitle><ol className="wedding-timeline">{config.timeline.map((item) => <li key={item.id}><time>{item.time}</time><span aria-hidden="true" /><div><strong>{item.title}</strong>{item.description && <p>{item.description}</p>}</div></li>)}</ol></section>;
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
