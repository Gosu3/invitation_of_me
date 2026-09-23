'use client';

import { useEffect, useState, type CSSProperties, type FormEvent, type ReactNode, type RefObject } from 'react';
import Image from 'next/image';
import { Check, Heart, Navigation, X } from 'lucide-react';
import type { WeddingInvitationConfig } from '@/lib/wedding-config';
import { weddingSubmissions, type PublicWish } from '@/lib/wedding-submissions';
import { dateParts, formatTime } from '@/lib/utils';
import { ArchitectureSection, CardFlower, weddingArtwork } from './decorations';
import { Modal } from './shared';

export function WeddingHero({ config, headingRef }: { config: WeddingInvitationConfig; headingRef: RefObject<HTMLDivElement | null> }) {
  const { theme, couple, content } = config;
  return <section className="letter-story" aria-label={`Thiệp cưới ${couple.names}`}>
    <p className="letter-save-date">Save The Date</p>
    <div className="letter-composition">
      <Image className="letter-flower-crown" src={theme.assets.flower} alt="" aria-hidden="true" width={420} height={420} loading="eager" />
      <Image className="letter-envelope-image" src={theme.assets.envelope} alt="" aria-hidden="true" width={420} height={604} loading="eager" />
      <div className="letter-note" aria-hidden="true"><span>THƯ MỜI</span><i>✦</i><small>Ngày chung đôi</small></div>
      <div className="letter-photo">{content.coverImage ? <Image src={content.coverImage} alt={content.coverAlt || couple.names} fill sizes="(max-width: 650px) 55vw, 320px" preload unoptimized={content.coverImage.startsWith('/api/')} /> : <div className="envelope-initials">{couple.groom[0]} & {couple.bride[0]}</div>}</div>
      <Image className="letter-bouquet" src={theme.assets.flower} alt="" aria-hidden="true" width={500} height={500} loading="eager" />
      <Image className="letter-flower-trail" src={theme.assets.flower} alt="" aria-hidden="true" width={340} height={340} loading="eager" />
      <div className="letter-seal" aria-hidden="true"><Heart size={25} strokeWidth={1.7} /></div>
    </div>
    <div className="letter-names" ref={headingRef} tabIndex={-1} role="heading" aria-level={1} aria-label={`${couple.groom} và ${couple.bride}`}>
      <p>{couple.groom}</p>
      <span aria-hidden="true">&</span>
      <p>{couple.bride}</p>
    </div>
  </section>;
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
  const [rsvpOpen, setRsvpOpen] = useState(false);
  const event = config.reception;
  if (!event) return null;
  const date = dateParts(event.dateTime);
  return <><WeddingInfoCard title="THÔNG TIN TIỆC CƯỚI" flowerSide="left" className="events-section">
    <div className="reception-content">
      <h3 className="reception-intro">Tiệc cưới sẽ diễn ra vào lúc:</h3>
      <div className="reception-day-time"><span>{date.weekday}</span><span>{formatTime(event.dateTime)}</span></div>
      <div className="reception-date-numbers"><strong>{date.day}</strong><span aria-hidden="true" /><div><span>THÁNG {date.month}</span><span>{date.year}</span></div></div>
      {event.lunarDate && <p className="wedding-lunar-date">({event.lunarDate})</p>}
      <div className="reception-times"><span>ĐÓN KHÁCH<strong>{event.arrivalTime || formatTime(event.dateTime)}</strong></span><span>KHAI TIỆC<strong>{formatTime(event.dateTime)}</strong></span></div>
      <div className="reception-calendar"><MiniCalendar date={event.dateTime} timezone={config.timezone} /></div>
      <a className="calendar-link" href={calendarUrlFor(config)} target="_blank" rel="noopener noreferrer">Thêm vào lịch</a>
      <Countdown target={event.dateTime} />
      {config.features.showRsvp && <button type="button" className="reception-rsvp-button" onClick={() => setRsvpOpen(true)}><span>XÁC NHẬN THAM DỰ</span></button>}
    </div>
  </WeddingInfoCard>{rsvpOpen && <RsvpModal config={config} close={() => setRsvpOpen(false)} />}</>;
}

function RsvpModal({ config, close }: { config: WeddingInvitationConfig; close: () => void }) {
  const [guestName, setGuestName] = useState('');
  const [attendance, setAttendance] = useState<'yes' | 'no' | ''>('');
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const canSubmit = guestName.trim().length >= 2 && attendance !== '' && status !== 'submitting';

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canSubmit || !attendance) return;
    setStatus('submitting');
    setMessage('');
    try {
      await weddingSubmissions.rsvp({
        invitationId: config.id,
        guestName: guestName.trim(),
        attendance,
        guestCount: 1,
        message: '',
        website: '',
      });
      setStatus('success');
    } catch (error) {
      setStatus('error');
      setMessage(error instanceof Error ? error.message : 'Chưa thể gửi xác nhận. Vui lòng thử lại.');
    }
  }

  return <Modal label="Xác nhận tham dự" className="rsvp-dialog" close={close}>
    {status === 'success' ? <div className="rsvp-success" role="status">
      <span aria-hidden="true"><Check size={25} /></span>
      <h2>Đã gửi xác nhận</h2>
      <p>Cảm ơn {guestName.trim()} đã phản hồi. Chúng mình đã nhận được thông tin của bạn ♡</p>
      <button type="button" onClick={close}>HOÀN TẤT</button>
    </div> : <>
      <header className="rsvp-dialog-heading">
        <h2>Xác nhận tham dự</h2>
        <p>Sự hiện diện của bạn là niềm vinh hạnh cho gia đình chúng tôi. Xin xác nhận để chúng tôi chuẩn bị chu đáo nhất.</p>
      </header>
      <form className="rsvp-dialog-form" onSubmit={submit}>
        <label className="rsvp-name-field"><span>Tên của bạn</span><input value={guestName} onChange={(event) => setGuestName(event.target.value)} minLength={2} maxLength={100} required autoComplete="name" placeholder="Nhập tên của bạn" /></label>
        <fieldset><legend>Bạn sẽ đến chứ?</legend>
          <label className={`rsvp-choice${attendance === 'yes' ? ' is-selected' : ''}`}><input type="radio" name="attendance" value="yes" checked={attendance === 'yes'} onChange={() => setAttendance('yes')} /><span aria-hidden="true"><Check size={16} /></span><strong>Tôi sẽ đến</strong></label>
          <label className={`rsvp-choice${attendance === 'no' ? ' is-selected' : ''}`}><input type="radio" name="attendance" value="no" checked={attendance === 'no'} onChange={() => setAttendance('no')} /><span aria-hidden="true"><X size={16} /></span><strong>Rất tiếc, tôi không thể đến</strong></label>
        </fieldset>
        {message && <p className="rsvp-error" role="alert">{message}</p>}
        <button className="rsvp-submit" type="submit" disabled={!canSubmit}>{status === 'submitting' ? 'ĐANG GỬI...' : 'Gửi xác nhận'}</button>
      </form>
    </>}
  </Modal>;
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

export function VenueSection({ config }: { config: WeddingInvitationConfig }) {
  if (!config.venue) return null;
  const destination = `${config.venue.title}, ${config.venue.address}`;
  const embed = `https://www.google.com/maps?q=${encodeURIComponent(destination)}&output=embed`;
  const directions = config.venue.mapUrl || `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destination)}`;
  return <section className="venue-invitation-section" data-landing-screenshot-id="invite-map">
    <div className="venue-invitation-copy">
      <h3><span dir="auto">Tiệc cưới sẽ tổ chức tại</span></h3>
      <p className="venue-address"><span dir="auto">{destination}</span></p>
    </div>
    <div className="venue-map-actions">
      {config.features.showMap && <iframe className="venue-map" title={`Bản đồ ${config.venue.title}`} src={embed} loading="lazy" allowFullScreen referrerPolicy="no-referrer-when-downgrade" />}
      <a className="venue-directions" href={directions} target="_blank" rel="noopener noreferrer"><Navigation size={16} aria-hidden="true" /><span>Chỉ đường</span></a>
    </div>
    <div className="venue-dress-code">
      <div className="venue-dress-code-copy">
        <h2>DRESS CODE</h2>
        <p>Trang phục lịch sự - Bạn hãy cứ diện bộ đồ cảm thấy đẹp và tự tin nhất <span className="dress-code-heart" aria-label="trái tim">♥</span></p>
      </div>
      <div className="venue-dress-code-swatches" aria-label="Bảng màu trang phục gồm đỏ, trắng, hồng, kem, đen, nâu, vàng, tím, cam và phối nhiều màu">
        <span className="dress-swatch dress-swatch-red" title="Đỏ" aria-hidden="true" />
        <span className="dress-swatch dress-swatch-white" title="Trắng" aria-hidden="true" />
        <span className="dress-swatch dress-swatch-pink" title="Hồng" aria-hidden="true" />
        <span className="dress-swatch dress-swatch-cream" title="Kem" aria-hidden="true" />
        <span className="dress-swatch dress-swatch-black" title="Đen" aria-hidden="true" />
        <span className="dress-swatch dress-swatch-brown" title="Nâu" aria-hidden="true" />
        <span className="dress-swatch dress-swatch-yellow" title="Vàng" aria-hidden="true" />
        <span className="dress-swatch dress-swatch-purple" title="Tím" aria-hidden="true" />
        <span className="dress-swatch dress-swatch-orange" title="Cam" aria-hidden="true" />
        <span className="dress-swatch dress-swatch-multicolor" title="Phối màu" aria-hidden="true" />
      </div>
    </div>
  </section>;
}

export function TimelineSection({ config }: { config: WeddingInvitationConfig }) {
  return <ArchitectureSection><section className="invite-section paper-info-card wedding-info-card timeline-section">
    <div className="wedding-info-content"><h2 className="wedding-info-title timeline-title"><span dir="auto">LỊCH TRÌNH NGÀY CƯỚI</span></h2>
      <ol className="wedding-timeline">{config.timeline.map((item) => <li key={item.id}><time>{item.time}</time><span aria-hidden="true" /><div><strong><span dir="auto">{item.title}</span></strong>{item.description && <p>{item.description}</p>}</div></li>)}</ol>
    </div><CardFlower timeline />
  </section></ArchitectureSection>;
}

export function GuestbookSection({ config, connected }: { config: WeddingInvitationConfig; connected: boolean }) {
  const [name, setName] = useState('');
  const [message, setMessage] = useState('');
  const [wishes, setWishes] = useState<PublicWish[]>(config.content.wishes);
  const [status, setStatus] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const suggestedWishes = [
    'Chúc hai bạn trăm năm hạnh phúc, luôn yêu thương và đồng hành cùng nhau trên mọi chặng đường.',
    'Chúc mừng ngày vui của hai bạn! Mong tổ ấm nhỏ luôn ngập tràn tiếng cười và những điều dịu dàng.',
    'Chúc cô dâu chú rể một đời viên mãn, bình an và mãi giữ được ánh mắt yêu thương dành cho nhau.',
  ];
  function suggestWish() {
    const currentIndex = suggestedWishes.indexOf(message);
    setMessage(suggestedWishes[(currentIndex + 1) % suggestedWishes.length]);
    setStatus('');
  }
  useEffect(() => {
    if (!connected) return;
    let active = true;
    async function refresh() {
      try {
        const approved = await weddingSubmissions.listWishes(config.id);
        if (active) setWishes((current) => {
          const approvedIds = new Set(approved.map((wish) => wish.id));
          const localPending = current.filter((wish) => wish.id.startsWith('pending-') && !approvedIds.has(wish.id.slice(8)));
          return [...localPending, ...approved];
        });
      } catch { /* Initial server data remains visible if a refresh fails. */ }
    }
    void refresh();
    const timer = window.setInterval(refresh, 30000);
    return () => { active = false; window.clearInterval(timer); };
  }, [config.id, connected]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (name.trim().length < 2 || message.trim().length < 3) {
      setStatus('Vui lòng nhập tên và lời chúc của bạn.');
      return;
    }
    if (!connected) {
      setStatus('Trang đang ở chế độ xem thử và chưa kết nối Supabase.');
      return;
    }
    setSubmitting(true);
    setStatus('');
    try {
      const result = await weddingSubmissions.wish({ invitationId: config.id, guestName: name.trim(), message: message.trim(), website: '' });
      setWishes((current) => [{ ...result.wish, id: `pending-${result.wish.id}` }, ...current]);
      setName('');
      setMessage('');
      setStatus('Đã gửi lời chúc, đang chờ cô dâu chú rể duyệt ♡');
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Chưa thể gửi lời chúc. Vui lòng thử lại.');
    } finally {
      setSubmitting(false);
    }
  }
  const wishDate = (value: string) => new Intl.DateTimeFormat('vi-VN', {
    timeZone: 'Asia/Ho_Chi_Minh', hour: '2-digit', minute: '2-digit', second: '2-digit',
    day: 'numeric', month: 'numeric', year: 'numeric', hour12: false,
  }).format(new Date(value));
  return <section className="invite-section guestbook-section" id="so-luu-but">
    <div className="guestbook-wrapper">
      <Image className="guestbook-background" src={weddingArtwork.guestbook} alt="" aria-hidden="true" width={1314} height={1197} unoptimized />
      <div className="guestbook-content">
        <h2 className="guestbook-title"><span dir="auto">Sổ lưu bút</span></h2>
        <form className="guestbook-form" onSubmit={submit}>
          <div className="guestbook-form-panel">
            <input value={name} onChange={(event) => setName(event.target.value)} minLength={2} maxLength={100} required disabled={submitting} placeholder="Nhập tên*" aria-label="Tên của bạn" />
            <textarea value={message} onChange={(event) => setMessage(event.target.value)} minLength={3} maxLength={1000} required disabled={submitting} rows={4} placeholder="Nhập lời chúc*" aria-label="Lời chúc" />
            <div className="guestbook-form-actions">
              <button type="button" className="guestbook-ai-button" title="Tạo lời chúc bằng AI" aria-label="Tạo lời chúc bằng AI" onClick={suggestWish}>🪄</button>
              <button type="submit" className="guestbook-submit" disabled={submitting}><span dir="auto">{submitting ? 'ĐANG GỬI...' : 'GỬI LỜI CHÚC'}</span></button>
            </div>
          </div>
        </form>
        <span className="guestbook-status" role="status">{status}</span>
      </div>
    </div>
    {wishes.length > 0 && <div className="guestbook-wishes" tabIndex={0} aria-label="Danh sách lời chúc">
      {wishes.map((wish) => <blockquote key={wish.id}>
        <header><strong>{wish.guestName}</strong><time dateTime={wish.createdAt}>{wishDate(wish.createdAt)}</time></header>
        <p>{wish.message}</p>
      </blockquote>)}
    </div>}
  </section>;
}

export function ThankYouSection() {
  return <footer className="invite-footer"><Heart size={22} strokeWidth={1.3} /><p>Sự hiện diện của bạn là món quà quý giá nhất đối với chúng mình</p></footer>;
}
