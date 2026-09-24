'use client';

import { useEffect, useState, type FormEvent } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { createBrowserClient } from '@supabase/ssr';
import { ArrowRight, Check, Copy, ExternalLink, FilePlus2, Link2, LogOut, Search, UserRoundPlus } from 'lucide-react';
import { useRouter } from 'next/navigation';

type ListRow = {
  id: string;
  slug: string;
  status: 'draft' | 'published' | 'archived';
  admin_title: string | null;
  partner_one: string;
  partner_two: string;
  cover_media_id: string | null;
  updated_at: string;
};

type GuestLinkRow = {
  id: string;
  invitation_id: string;
  code: string;
  guest_name: string;
  created_at: string;
};

const labels = { draft: 'Bản nháp', published: 'Đã xuất bản', archived: 'Lưu trữ' };

export function AdminDashboard() {
  const router = useRouter();
  const [items, setItems] = useState<ListRow[]>([]);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('all');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [guestLinks, setGuestLinks] = useState<GuestLinkRow[]>([]);
  const [selectedInvitation, setSelectedInvitation] = useState('');
  const [guestName, setGuestName] = useState('');
  const [generatedUrl, setGeneratedUrl] = useState('');
  const [guestLinkError, setGuestLinkError] = useState('');
  const [creatingLink, setCreatingLink] = useState(false);
  const [copiedCode, setCopiedCode] = useState('');

  useEffect(() => {
    fetch('/api/admin/invitations')
      .then(async (response) => {
        if (!response.ok) throw new Error('Không thể tải danh sách thiệp.');
        return response.json();
      })
      .then((data) => {
        const invitations = data.invitations as ListRow[];
        setItems(invitations);
        setSelectedInvitation((current) => current || invitations.find((item) => item.status === 'published')?.id || '');
      })
      .catch((caught) => setError(caught.message))
      .finally(() => setLoading(false));

    fetch('/api/admin/guest-links')
      .then(async (response) => {
        if (!response.ok) throw new Error('Chưa thể tải danh sách link khách mời.');
        return response.json();
      })
      .then((data) => setGuestLinks(data.links || []))
      .catch(() => setGuestLinks([]));
  }, []);

  const shown = items.filter((item) =>
    (filter === 'all' || item.status === filter)
    && `${item.admin_title || ''} ${item.partner_one} ${item.partner_two} ${item.slug}`.toLocaleLowerCase('vi').includes(query.toLocaleLowerCase('vi')),
  );

  async function signOut() {
    const client = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
    await client.auth.signOut();
    router.push('/quan-tri/dang-nhap');
    router.refresh();
  }

  async function copyLink(path: string, code: string) {
    const url = new URL(path, window.location.origin).toString();
    await navigator.clipboard.writeText(url);
    setCopiedCode(code);
    window.setTimeout(() => setCopiedCode(''), 1800);
  }

  async function createGuestLink(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setGuestLinkError('');
    setGeneratedUrl('');
    setCreatingLink(true);
    try {
      const response = await fetch('/api/admin/guest-links', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ invitationId: selectedInvitation, guestName }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Không thể tạo link khách mời.');
      const url = new URL(data.path, window.location.origin).toString();
      setGeneratedUrl(url);
      setGuestLinks((current) => [data.link, ...current].slice(0, 12));
      setGuestName('');
      await navigator.clipboard.writeText(url);
      setCopiedCode(data.link.code);
      window.setTimeout(() => setCopiedCode(''), 1800);
    } catch (caught) {
      setGuestLinkError(caught instanceof Error ? caught.message : 'Không thể tạo link khách mời.');
    } finally {
      setCreatingLink(false);
    }
  }

  return <main className="admin-page">
    <header className="admin-header">
      <Link href="/" className="admin-brand">Nét Duyên <span>✧</span></Link>
      <nav><Link href="/">Xem website <ExternalLink size={14} /></Link><button onClick={signOut}>Đăng xuất <LogOut size={15} /></button></nav>
    </header>
    <div className="admin-shell">
      <div className="admin-page-title">
        <div><span className="eyebrow">KHÔNG GIAN QUẢN LÝ</span><h1>Kho thiệp cưới</h1><p>Mỗi tấm thiệp, một câu chuyện riêng. Tất cả cùng một thiết kế.</p></div>
        <Link className="admin-primary" href="/quan-tri/thiep/moi"><FilePlus2 size={17} /> Tạo thiệp mới</Link>
      </div>

      <div className="admin-stat-row">
        <div><strong>{items.length}</strong><span>Tổng số thiệp</span></div>
        <div><strong>{items.filter((item) => item.status === 'published').length}</strong><span>Đang xuất bản</span></div>
        <div><strong>{items.filter((item) => item.status === 'draft').length}</strong><span>Bản nháp</span></div>
      </div>

      <section className="guest-link-builder" aria-labelledby="guest-link-title">
        <div className="guest-link-heading">
          <span><UserRoundPlus size={20} /></span>
          <div><h2 id="guest-link-title">Tạo link mời riêng</h2><p>Nhập tên khách, hệ thống tự tạo và sao chép một đường dẫn ngắn.</p></div>
        </div>
        <form onSubmit={createGuestLink}>
          <label className="admin-field"><span>Chọn thiệp</span><select value={selectedInvitation} onChange={(event) => setSelectedInvitation(event.target.value)} required><option value="">Chọn một thiệp đã xuất bản</option>{items.filter((item) => item.status === 'published').map((item) => <option key={item.id} value={item.id}>{item.admin_title || `${item.partner_one} & ${item.partner_two}`}</option>)}</select></label>
          <label className="admin-field"><span>Thân mời</span><input value={guestName} onChange={(event) => setGuestName(event.target.value)} placeholder="Ví dụ: Bạn A & người thương" maxLength={100} required /></label>
          <button className="admin-primary guest-link-submit" disabled={creatingLink || !selectedInvitation || !guestName.trim()}>{creatingLink ? 'Đang tạo…' : <><Link2 size={16} /> Tạo và sao chép link</>}</button>
        </form>
        {guestLinkError && <div className="admin-alert error">{guestLinkError}</div>}
        {generatedUrl && <div className="guest-link-result"><div><Check size={17} /><span>Đã tạo và sao chép link</span></div><a href={generatedUrl} target="_blank" rel="noreferrer">{generatedUrl}</a></div>}
        {guestLinks.length > 0 && <div className="guest-link-recent"><h3>Link vừa tạo</h3>{guestLinks.map((link) => {
          const invitation = items.find((item) => item.id === link.invitation_id);
          return <div key={link.id}><div><strong>{link.guest_name}</strong><span>{invitation ? invitation.admin_title || `${invitation.partner_one} & ${invitation.partner_two}` : 'Thiệp cưới'} · /m/{link.code}</span></div><div><button type="button" onClick={() => copyLink(`/m/${link.code}`, link.code)} aria-label={`Sao chép link của ${link.guest_name}`}>{copiedCode === link.code ? <Check size={15} /> : <Copy size={15} />}</button><a href={`/m/${link.code}`} target="_blank" rel="noreferrer" aria-label={`Mở thiệp của ${link.guest_name}`}><ExternalLink size={15} /></a></div></div>;
        })}</div>}
      </section>

      <div className="admin-toolbar">
        <label className="admin-search"><Search size={17} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Tìm tên cặp đôi hoặc đường dẫn" aria-label="Tìm thiệp" /></label>
        <select value={filter} onChange={(event) => setFilter(event.target.value)} aria-label="Lọc trạng thái"><option value="all">Tất cả trạng thái</option><option value="draft">Bản nháp</option><option value="published">Đã xuất bản</option><option value="archived">Lưu trữ</option></select>
      </div>
      {error && <div className="admin-alert">{error}</div>}
      {loading ? <p className="admin-empty">Đang tải thiệp…</p> : shown.length ? <div className="admin-card-grid">{shown.map((item) => <Link className="admin-invite-card" key={item.id} href={`/quan-tri/thiep/${item.id}`}><div className="admin-card-image">{item.cover_media_id ? <Image src={`/api/media/${item.cover_media_id}`} alt="Ảnh bìa thiệp" fill unoptimized sizes="260px" /> : <span>{item.partner_one[0]} & {item.partner_two[0]}</span>}</div><div className="admin-card-body"><span className={`status-chip ${item.status}`}>{labels[item.status]}</span><h2>{item.admin_title || <>{item.partner_one} <em>&</em> {item.partner_two}</>}</h2><p>/thiep/{item.slug}</p><div className="admin-card-bottom"><span>Cập nhật {new Date(item.updated_at).toLocaleDateString('vi-VN')}</span><ArrowRight size={17} /></div></div></Link>)}</div> : <div className="admin-empty"><p>{items.length ? 'Không tìm thấy thiệp phù hợp.' : 'Chưa có thiệp nào. Hãy tạo thiệp đầu tiên.'}</p>{!items.length && <Link href="/quan-tri/thiep/moi">Tạo thiệp <ArrowRight size={16} /></Link>}</div>}
    </div>
  </main>;
}
