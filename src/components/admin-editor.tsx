'use client';

import { useEffect, useState, type ChangeEvent } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import QRCode from 'qrcode';
import { ArrowLeft, ArrowRight, Check, ChevronDown, ChevronUp, Copy, Download, ExternalLink, ImagePlus, Plus, Save, Trash2 } from 'lucide-react';
import type { Invitation, WeddingMedia } from '@/lib/types';

type Status = 'draft' | 'published' | 'archived';
type EditableEvent = { title: string; dateTime: string; arrivalTime: string; lunarDate: string; venue: string; address: string; mapUrl: string; sortOrder: number };
type EditableTimeline = { time: string; title: string; description: string; sortOrder: number };
type EditableGift = { recipient: string; bankName: string; accountNumber: string; accountHolder: string; qrMediaId: string; sortOrder: number };
type Draft = {
  id?: string; slug: string; status: Status; adminTitle: string; partnerOne: string; partnerTwo: string;
  partnerOneFullName: string; partnerTwoFullName: string; partnerOneParents: string; partnerTwoParents: string;
  partnerOneAddress: string; partnerTwoAddress: string; headline: string; message: string; story: string;
  coverMediaId: string; coverAlt: string; dressCode: string; closingMessage: string;
  rsvpEnabled: boolean; rsvpDeadline: string; wishesEnabled: boolean; giftsEnabled: boolean;
  events: EditableEvent[]; timeline: EditableTimeline[]; gifts: EditableGift[];
};
type RsvpRow = { id: string; guest_name: string; attendance: 'yes' | 'no'; guest_count: number; message: string | null; created_at: string };
type WishRow = { id: string; guest_name: string; message: string; status: 'pending' | 'approved' | 'hidden'; created_at: string };

const emptyDraft: Draft = {
  slug: '', status: 'draft', adminTitle: '', partnerOne: '', partnerTwo: '', partnerOneFullName: '', partnerTwoFullName: '',
  partnerOneParents: '', partnerTwoParents: '', partnerOneAddress: '', partnerTwoAddress: '',
  headline: 'Trân trọng kính mời', message: '', story: '', coverMediaId: '', coverAlt: '', dressCode: '',
  closingMessage: 'Sự hiện diện của quý khách là niềm vinh hạnh của gia đình chúng tôi.',
  rsvpEnabled: true, rsvpDeadline: '', wishesEnabled: true, giftsEnabled: false,
  events: [], timeline: [], gifts: [],
};

function localDateTime(iso?: string) {
  if (!iso) return '';
  const formatted = new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Ho_Chi_Minh', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false }).format(new Date(iso));
  return formatted.replace(' ', 'T');
}
function utcOffsetDateTime(local: string) { return local ? `${local}:00+07:00` : ''; }
function slugify(value: string) { return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''); }

function toDraft(invite: Invitation, coverMediaId: string): Draft {
  return {
    id: invite.id, slug: invite.slug, status: invite.status, adminTitle: invite.adminTitle || '',
    partnerOne: invite.partnerOne, partnerTwo: invite.partnerTwo,
    partnerOneFullName: invite.partnerOneFullName || '', partnerTwoFullName: invite.partnerTwoFullName || '',
    partnerOneParents: invite.partnerOneParents || '', partnerTwoParents: invite.partnerTwoParents || '',
    partnerOneAddress: invite.partnerOneAddress || '', partnerTwoAddress: invite.partnerTwoAddress || '',
    headline: invite.headline, message: invite.message, story: invite.story || '',
    coverMediaId: coverMediaId || '', coverAlt: invite.coverAlt || '', dressCode: invite.dressCode || '',
    closingMessage: invite.closingMessage, rsvpEnabled: invite.rsvpEnabled,
    rsvpDeadline: invite.rsvpDeadline || '', wishesEnabled: invite.wishesEnabled, giftsEnabled: invite.giftsEnabled,
    events: invite.events.map((e, index) => ({ title: e.title, dateTime: e.dateTime, arrivalTime: e.arrivalTime || '', lunarDate: e.lunarDate || '', venue: e.venue, address: e.address, mapUrl: e.mapUrl || '', sortOrder: index })),
    timeline: invite.timeline.map((t, index) => ({ time: t.time, title: t.title, description: t.description || '', sortOrder: index })),
    gifts: invite.gifts.map((g, index) => ({ recipient: g.recipient, bankName: g.bankName, accountNumber: g.accountNumber, accountHolder: g.accountHolder, qrMediaId: g.qrUrl?.split('/').pop() || '', sortOrder: index })),
  };
}

export function AdminEditor({ id }: { id: string }) {
  const router = useRouter();
  const isNew = id === 'moi';
  const [form, setForm] = useState<Draft>(emptyDraft);
  const [media, setMedia] = useState<WeddingMedia[]>([]);
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [tab, setTab] = useState<'content' | 'responses'>('content');
  const [rsvps, setRsvps] = useState<RsvpRow[]>([]);
  const [wishes, setWishes] = useState<WishRow[]>([]);

  useEffect(() => { if (isNew) return; fetch(`/api/admin/invitations/${id}`).then(async (r) => { if (!r.ok) throw new Error('Không thể tải thiệp.'); return r.json(); }).then((data) => { setForm(toDraft(data.invitation, data.coverMediaId)); setMedia(data.invitation.media); }).catch((e) => setError(e.message)).finally(() => setLoading(false)); }, [id, isNew]);
  useEffect(() => { if (!dirty) return; const warn = (e: BeforeUnloadEvent) => { e.preventDefault(); e.returnValue = ''; }; window.addEventListener('beforeunload', warn); return () => window.removeEventListener('beforeunload', warn); }, [dirty]);
  const update = <K extends keyof Draft>(key: K, value: Draft[K]) => { setForm((previous) => ({ ...previous, [key]: value })); setDirty(true); setMessage(''); };
  const updateEvent = (index: number, key: keyof EditableEvent, value: string | number) => { update('events', form.events.map((item, i) => i === index ? { ...item, [key]: value } : item)); };
  const updateTimeline = (index: number, key: keyof EditableTimeline, value: string | number) => { update('timeline', form.timeline.map((item, i) => i === index ? { ...item, [key]: value } : item)); };
  const updateGift = (index: number, key: keyof EditableGift, value: string | number) => { update('gifts', form.gifts.map((item, i) => i === index ? { ...item, [key]: value } : item)); };
  const publicUrl = typeof window !== 'undefined' ? `${window.location.origin}/thiep/${form.slug}` : `/thiep/${form.slug}`;

  async function save(status: Status = form.status) {
    if (status !== form.status && !window.confirm(status === 'published' ? 'Xuất bản thiệp để người có liên kết xem được?' : status === 'archived' ? 'Lưu trữ thiệp? Liên kết công khai sẽ ngừng hoạt động.' : 'Thu hồi xuất bản? Khách sẽ không xem được thiệp.')) return;
    setSaving(true); setError(''); setMessage('');
    const payload = { ...form, status };
    try {
      const response = await fetch('/api/admin/invitations', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Không thể lưu thiệp.');
      setForm((previous) => ({ ...previous, id: result.id, status }));
      setDirty(false); setMessage('Đã lưu thiệp thành công.');
      if (isNew) router.replace(`/quan-tri/thiep/${result.id}`);
      router.refresh();
    } catch (e) { setError(e instanceof Error ? e.message : 'Đã có lỗi xảy ra.'); }
    finally { setSaving(false); }
  }

  async function upload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file || !form.id) return;
    setUploading(true); setError('');
    const body = new FormData(); body.set('file', file); body.set('invitationId', form.id); body.set('alt', `${form.partnerOne} và ${form.partnerTwo}`);
    try { const response = await fetch('/api/admin/media', { method: 'POST', body }); const result = await response.json(); if (!response.ok) throw new Error(result.error || 'Không thể tải ảnh.'); setMedia((previous) => [...previous, { id: result.id, url: result.url, alt: result.alt, sortOrder: previous.length }]); setMessage('Đã tải ảnh lên. Bạn có thể chọn làm ảnh bìa.'); }
    catch (e) { setError(e instanceof Error ? e.message : 'Không thể tải ảnh.'); }
    finally { setUploading(false); event.target.value = ''; }
  }

  async function changeMediaOrder(index: number, delta: number) {
    const next = [...media]; const target = index + delta;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    setMedia(next);
    const results = await Promise.all(next.map((item, i) => fetch(`/api/admin/media/${item.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ sortOrder: i }) })));
    if (results.some((r) => !r.ok)) setError('Không thể lưu thứ tự ảnh. Hãy tải lại trang và thử lại.');
  }

  async function removeMedia(item: WeddingMedia) {
    if (!window.confirm('Xóa ảnh này khỏi thiệp và Storage?')) return;
    const response = await fetch(`/api/admin/media/${item.id}`, { method: 'DELETE' }); const result = await response.json();
    if (!response.ok) { setError(result.error || 'Không thể xóa ảnh.'); return; }
    setMedia((previous) => previous.filter((p) => p.id !== item.id));
  }

  async function loadResponses() {
    if (!form.id) return;
    const response = await fetch(`/api/admin/invitations/${form.id}/responses`);
    if (!response.ok) { setError('Không thể tải phản hồi.'); return; }
    const data = await response.json(); setRsvps(data.rsvps); setWishes(data.wishes); setTab('responses');
  }

  async function setWishStatus(wishId: string, status: WishRow['status']) {
    const response = await fetch(`/api/admin/wishes/${wishId}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status }) });
    if (!response.ok) { setError('Không thể cập nhật lời chúc.'); return; }
    setWishes((previous) => previous.map((w) => w.id === wishId ? { ...w, status } : w));
  }

  async function downloadQr() {
    const data = await QRCode.toDataURL(publicUrl, { width: 900, margin: 3, color: { dark: '#4B1D2B', light: '#F8F2E9' } });
    const link = document.createElement('a'); link.href = data; link.download = `ma-qr-${form.slug}.png`; link.click();
  }

  async function duplicate() {
    if (!form.id || !window.confirm('Tạo một bản sao ở trạng thái bản nháp? Ảnh cũng sẽ được sao chép.')) return;
    const response = await fetch(`/api/admin/invitations/${form.id}/duplicate`, { method: 'POST' });
    const result = await response.json(); if (!response.ok) { setError(result.error || 'Không thể nhân bản thiệp.'); return; }
    router.push(`/quan-tri/thiep/${result.id}`);
  }

  const textField = (label: string, field: keyof Draft, placeholder = '') => <label className="admin-field"><span>{label}</span><input value={String(form[field] ?? '')} onChange={(e) => update(field, e.target.value as never)} placeholder={placeholder} /></label>;

  if (loading) return <div className="admin-loading">Đang tải nội dung thiệp…</div>;
  return <main className="admin-page"><header className="admin-header"><Link href="/" className="admin-brand">Nét Duyên <span>✧</span></Link><nav><Link href="/quan-tri"><ArrowLeft size={14} /> Kho thiệp</Link>{form.id && <Link href={`/quan-tri/thiep/${form.id}/xem-truoc`} target="_blank">Xem trước <ExternalLink size={14} /></Link>}</nav></header><div className="editor-shell"><div className="editor-top"><div><span className="eyebrow">{isNew ? 'TẠO THIỆP MỚI' : 'CHỈNH SỬA THIỆP'}</span><h1>{form.partnerOne && form.partnerTwo ? `${form.partnerOne} & ${form.partnerTwo}` : 'Một câu chuyện mới'}</h1><p>{dirty ? 'Có thay đổi chưa lưu' : form.id ? 'Mọi thay đổi đã được lưu' : 'Nhập thông tin để bắt đầu'}</p></div><div className="editor-actions"><button className="admin-secondary" onClick={() => save()} disabled={saving}><Save size={16} /> {saving ? 'Đang lưu…' : 'Lưu thay đổi'}</button>{form.status !== 'published' ? <button className="admin-primary" onClick={() => save('published')} disabled={saving}>Xuất bản <ArrowRight size={16} /></button> : <button className="admin-secondary" onClick={() => save('draft')} disabled={saving}>Thu hồi xuất bản</button>}</div></div>{error && <div className="admin-alert error" role="alert">{error}</div>}{message && <div className="admin-alert success"><Check size={17} /> {message}</div>}<div className="editor-tabs"><button className={tab === 'content' ? 'active' : ''} onClick={() => setTab('content')}>Nội dung thiệp</button>{form.id && <button className={tab === 'responses' ? 'active' : ''} onClick={loadResponses}>Phản hồi & lời chúc</button>}</div>{tab === 'content' ? <div className="editor-layout"><div className="editor-main">
    <section className="editor-section"><div className="editor-section-heading"><span>01</span><div><h2>Cặp đôi & đường dẫn</h2><p>Thông tin sẽ xuất hiện ở đầu thiệp.</p></div></div><div className="admin-fields two">{textField("Tên chú rể *", "partnerOne", "Văn Thọ")}{textField("Tên cô dâu *", "partnerTwo", "Hồng Thắm")}{textField("Họ tên chú rể", "partnerOneFullName")}{textField("Họ tên cô dâu", "partnerTwoFullName")}</div><label className="admin-field"><span>Đường dẫn thiệp *</span><div className="slug-control"><span>/thiep/</span><input value={form.slug} onChange={(e) => update('slug', slugify(e.target.value))} placeholder="tho-va-tham" /><button type="button" onClick={() => update('slug', slugify(`${form.partnerOne}-va-${form.partnerTwo}`))}>Tạo từ tên</button></div><small>Đổi slug sau khi chia sẻ sẽ làm liên kết cũ ngừng hoạt động.</small></label></section>
    <section className="editor-section"><div className="editor-section-heading"><span>02</span><div><h2>Lời mời & hai gia đình</h2><p>Viết ngắn gọn và chân thành.</p></div></div>{textField("Tiêu đề lời mời *", "headline")}<label className="admin-field"><span>Nội dung lời mời *</span><textarea value={form.message} onChange={(e) => update('message', e.target.value)} rows={4} placeholder="Chúng mình trân trọng mời bạn…" /></label><div className="admin-fields two">{textField("Cha mẹ chú rể", "partnerOneParents")}{textField("Cha mẹ cô dâu", "partnerTwoParents")}{textField("Địa phương nhà trai", "partnerOneAddress")}{textField("Địa phương nhà gái", "partnerTwoAddress")}</div><label className="admin-field"><span>Câu chuyện của hai bạn</span><textarea value={form.story} onChange={(e) => update('story', e.target.value)} rows={3} /></label><label className="admin-field"><span>Lời kết *</span><textarea value={form.closingMessage} onChange={(e) => update('closingMessage', e.target.value)} rows={2} /></label></section>
    <section className="editor-section"><div className="editor-section-heading"><span>03</span><div><h2>Nghi lễ & địa điểm</h2><p>Có thể thêm lễ thành hôn, lễ vu quy, tiệc cưới.</p></div></div>{form.events.map((item, index) => <div className="repeater-card" key={index}><div className="repeater-top"><strong>Sự kiện {index + 1}</strong><button onClick={() => update('events', form.events.filter((_, i) => i !== index))} aria-label="Xóa sự kiện"><Trash2 size={16} /></button></div><div className="admin-fields two"><label className="admin-field"><span>Tên sự kiện *</span><input value={item.title} onChange={(e) => updateEvent(index, 'title', e.target.value)} placeholder="Tiệc cưới" /></label><label className="admin-field"><span>Ngày giờ *</span><input type="datetime-local" value={localDateTime(item.dateTime)} onChange={(e) => updateEvent(index, 'dateTime', utcOffsetDateTime(e.target.value))} /></label><label className="admin-field"><span>Giờ đón khách</span><input value={item.arrivalTime} onChange={(e) => updateEvent(index, 'arrivalTime', e.target.value)} placeholder="17:30" /></label><label className="admin-field"><span>Ngày âm lịch (nhập thủ công)</span><input value={item.lunarDate} onChange={(e) => updateEvent(index, 'lunarDate', e.target.value)} /></label><label className="admin-field"><span>Địa điểm *</span><input value={item.venue} onChange={(e) => updateEvent(index, 'venue', e.target.value)} /></label><label className="admin-field"><span>Địa chỉ *</span><input value={item.address} onChange={(e) => updateEvent(index, 'address', e.target.value)} /></label></div><label className="admin-field"><span>Link Google Maps (https://)</span><input value={item.mapUrl} onChange={(e) => updateEvent(index, 'mapUrl', e.target.value)} placeholder="https://maps.google.com/…" /></label></div>)}<button className="add-row" onClick={() => update('events', [...form.events, { title: '', dateTime: '', arrivalTime: '', lunarDate: '', venue: '', address: '', mapUrl: '', sortOrder: form.events.length }])}><Plus size={16} /> Thêm sự kiện</button></section>
    <section className="editor-section"><div className="editor-section-heading"><span>04</span><div><h2>Ảnh cưới</h2><p>Tải ảnh sau khi lưu thiệp lần đầu.</p></div></div>{!form.id ? <div className="admin-help">Lưu thông tin cơ bản trước khi tải ảnh lên.</div> : <><label className="upload-zone"><ImagePlus size={25} /><strong>{uploading ? 'Đang xử lý ảnh…' : 'Chọn ảnh JPG, PNG hoặc WebP'}</strong><span>Tối đa 12 MB mỗi ảnh · ảnh sẽ được tối ưu sang WebP</span><input type="file" accept="image/jpeg,image/png,image/webp" onChange={upload} disabled={uploading} /></label><div className="admin-media-grid">{media.map((item, index) => <div className="admin-media-item" key={item.id}><div className="admin-media-photo"><Image src={item.url} alt={item.alt} fill sizes="160px" unoptimized /></div><div className="admin-media-controls"><button onClick={() => update('coverMediaId', item.id)} className={form.coverMediaId === item.id ? 'is-cover' : ''}>{form.coverMediaId === item.id ? 'Ảnh bìa ✓' : 'Đặt làm bìa'}</button><div><button onClick={() => changeMediaOrder(index, -1)} disabled={index === 0} aria-label="Chuyển ảnh lên"><ChevronUp size={15} /></button><button onClick={() => changeMediaOrder(index, 1)} disabled={index === media.length - 1} aria-label="Chuyển ảnh xuống"><ChevronDown size={15} /></button><button onClick={() => removeMedia(item)} aria-label="Xóa ảnh"><Trash2 size={15} /></button></div></div><input aria-label="Mô tả ảnh" value={item.alt} placeholder="Mô tả ảnh" onChange={(e) => setMedia((previous) => previous.map((m) => m.id === item.id ? { ...m, alt: e.target.value } : m))} onBlur={() => fetch(`/api/admin/media/${item.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ alt: item.alt }) })} /></div>)}</div>{textField("Mô tả ảnh bìa", "coverAlt")}</>}</section>
    <section className="editor-section"><div className="editor-section-heading"><span>05</span><div><h2>Lịch trình & trang phục</h2><p>Ẩn tự động nếu bạn không nhập.</p></div></div>{textField("Dress code", "dressCode", "Trang phục lịch sự…")}{form.timeline.map((item, index) => <div className="repeater-card compact" key={index}><div className="repeater-top"><strong>Mốc {index + 1}</strong><button onClick={() => update('timeline', form.timeline.filter((_, i) => i !== index))} aria-label="Xóa mốc"><Trash2 size={16} /></button></div><div className="admin-fields two"><label className="admin-field"><span>Giờ *</span><input type="time" value={item.time} onChange={(e) => updateTimeline(index, 'time', e.target.value)} /></label><label className="admin-field"><span>Nội dung *</span><input value={item.title} onChange={(e) => updateTimeline(index, 'title', e.target.value)} /></label></div><label className="admin-field"><span>Mô tả</span><input value={item.description} onChange={(e) => updateTimeline(index, 'description', e.target.value)} /></label></div>)}<button className="add-row" onClick={() => update('timeline', [...form.timeline, { time: '', title: '', description: '', sortOrder: form.timeline.length }])}><Plus size={16} /> Thêm mốc giờ</button></section>
    <section className="editor-section"><div className="editor-section-heading"><span>06</span><div><h2>Phản hồi & lời chúc</h2><p>Quản lý các phần có tương tác với khách.</p></div></div><label className="toggle-row"><input type="checkbox" checked={form.rsvpEnabled} onChange={(e) => update('rsvpEnabled', e.target.checked)} /><span><strong>Bật xác nhận tham dự</strong><small>Khách điền tên, số người và lời nhắn.</small></span></label>{form.rsvpEnabled && <label className="admin-field"><span>Hạn nhận RSVP</span><input type="datetime-local" value={localDateTime(form.rsvpDeadline)} onChange={(e) => update('rsvpDeadline', utcOffsetDateTime(e.target.value))} /></label>}<label className="toggle-row"><input type="checkbox" checked={form.wishesEnabled} onChange={(e) => update('wishesEnabled', e.target.checked)} /><span><strong>Bật sổ lời chúc</strong><small>Lời chúc phải được duyệt trước khi công khai.</small></span></label></section>
    <section className="editor-section"><div className="editor-section-heading"><span>07</span><div><h2>Hộp quà mừng</h2><p>Bật để hiện hộp quà; khi chưa thêm tài khoản sẽ có hai ô QR trống.</p></div></div><label className="toggle-row"><input type="checkbox" checked={form.giftsEnabled} onChange={(e) => update('giftsEnabled', e.target.checked)} /><span><strong>Hiển thị hộp quà</strong><small>Thông tin ngân hàng sẽ công khai trên thiệp.</small></span></label>{form.giftsEnabled && <>{form.gifts.map((gift, index) => <div className="repeater-card" key={index}><div className="repeater-top"><strong>Tài khoản {index + 1}</strong><button onClick={() => update('gifts', form.gifts.filter((_, i) => i !== index))} aria-label="Xóa tài khoản"><Trash2 size={16} /></button></div><div className="admin-fields two">{([['Người nhận','recipient'],['Ngân hàng','bankName'],['Số tài khoản','accountNumber'],['Tên chủ tài khoản','accountHolder']] as const).map(([label,key]) => <label className="admin-field" key={key}><span>{label} *</span><input value={gift[key]} onChange={(e) => updateGift(index,key,e.target.value)} /></label>)}</div><label className="admin-field"><span>Ảnh QR đã tải lên</span><select value={gift.qrMediaId} onChange={(e) => updateGift(index, 'qrMediaId', e.target.value)}><option value="">Không có</option>{media.map((item, i) => <option key={item.id} value={item.id}>Ảnh {i + 1}: {item.alt || item.id.slice(0, 8)}</option>)}</select></label></div>)}<button className="add-row" onClick={() => update('gifts', [...form.gifts, { recipient: '', bankName: '', accountNumber: '', accountHolder: '', qrMediaId: '', sortOrder: form.gifts.length }])}><Plus size={16} /> Thêm tài khoản</button></>}</section>
  </div><aside className="editor-sidebar"><div className="sidebar-card"><span className="eyebrow">TRẠNG THÁI</span><strong className={`status-chip ${form.status}`}>{form.status === 'draft' ? 'Bản nháp' : form.status === 'published' ? 'Đã xuất bản' : 'Lưu trữ'}</strong><p>{form.status === 'published' ? 'Người có liên kết có thể xem thiệp.' : 'Thiệp chưa hiển thị công khai.'}</p>{form.id && <><Link href={`/quan-tri/thiep/${form.id}/xem-truoc`} target="_blank" className="sidebar-link">Xem trước <ExternalLink size={15} /></Link>{form.status === 'published' && <><button className="sidebar-link" onClick={async () => { await navigator.clipboard.writeText(publicUrl); setMessage('Đã sao chép liên kết.'); }}>Sao chép liên kết <Copy size={15} /></button><button className="sidebar-link" onClick={downloadQr}>Tải mã QR <Download size={15} /></button></>}<button className="sidebar-link" onClick={duplicate}>Nhân bản thiệp <Copy size={15} /></button>{form.status !== 'archived' && <button className="sidebar-link danger" onClick={() => save('archived')}>Lưu trữ thiệp <ArrowRight size={15} /></button>}</>}</div><div className="sidebar-note"><strong>Một mẫu thiệp duy nhất</strong><p>Mọi nội dung bạn nhập sẽ được trình bày trong thiết kế hoa trắng, lá xanh và nền giấy kem.</p></div></aside></div> : <div className="responses-panel"><div className="responses-summary"><div><strong>{rsvps.length}</strong><span>Phản hồi</span></div><div><strong>{rsvps.filter((r) => r.attendance === 'yes').reduce((n, r) => n + r.guest_count, 0)}</strong><span>Khách dự kiến</span></div><div><strong>{wishes.filter((w) => w.status === 'pending').length}</strong><span>Lời chúc chờ duyệt</span></div></div><div className="responses-header"><h2>Danh sách RSVP</h2><a className="admin-secondary" href={`/api/admin/invitations/${form.id}/rsvps.csv`}><Download size={15} /> Xuất CSV</a></div><div className="table-scroll"><table><thead><tr><th>Tên khách</th><th>Tham dự</th><th>Số người</th><th>Lời nhắn</th><th>Thời gian</th></tr></thead><tbody>{rsvps.map((r) => <tr key={r.id}><td>{r.guest_name}</td><td>{r.attendance === 'yes' ? 'Có' : 'Không'}</td><td>{r.guest_count}</td><td>{r.message || '—'}</td><td>{new Date(r.created_at).toLocaleString('vi-VN')}</td></tr>)}</tbody></table>{!rsvps.length && <p className="admin-empty">Chưa có phản hồi.</p>}</div><div className="responses-header"><h2>Sổ lời chúc</h2></div><div className="moderation-list">{wishes.map((w) => <div key={w.id}><div><strong>{w.guest_name}</strong><span className={`status-chip ${w.status}`}>{w.status === 'pending' ? 'Chờ duyệt' : w.status === 'approved' ? 'Đã duyệt' : 'Đã ẩn'}</span><p>{w.message}</p><small>{new Date(w.created_at).toLocaleString('vi-VN')}</small></div><div className="moderation-actions">{w.status !== 'approved' && <button onClick={() => setWishStatus(w.id, 'approved')}>Duyệt</button>}{w.status !== 'hidden' && <button onClick={() => setWishStatus(w.id, 'hidden')}>Ẩn</button>}</div></div>)}{!wishes.length && <p className="admin-empty">Chưa có lời chúc.</p>}</div></div>}</div></main>;
}
