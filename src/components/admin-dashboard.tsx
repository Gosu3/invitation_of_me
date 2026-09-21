'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { createBrowserClient } from '@supabase/ssr';
import { ArrowRight, ExternalLink, FilePlus2, LogOut, Search } from 'lucide-react';
import { useRouter } from 'next/navigation';

type ListRow = { id: string; slug: string; status: 'draft' | 'published' | 'archived'; partner_one: string; partner_two: string; cover_media_id: string | null; updated_at: string };
const labels = { draft: 'Bản nháp', published: 'Đã xuất bản', archived: 'Lưu trữ' };

export function AdminDashboard() {
  const router = useRouter();
  const [items, setItems] = useState<ListRow[]>([]);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('all');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  useEffect(() => { fetch('/api/admin/invitations').then(async (r) => { if (!r.ok) throw new Error('Không thể tải danh sách thiệp.'); return r.json(); }).then((data) => setItems(data.invitations)).catch((e) => setError(e.message)).finally(() => setLoading(false)); }, []);
  const shown = items.filter((item) => (filter === 'all' || item.status === filter) && `${item.partner_one} ${item.partner_two} ${item.slug}`.toLocaleLowerCase('vi').includes(query.toLocaleLowerCase('vi')));
  async function signOut() { const client = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!); await client.auth.signOut(); router.push('/quan-tri/dang-nhap'); router.refresh(); }
  return <main className="admin-page"><header className="admin-header"><Link href="/" className="admin-brand">Nét Duyên <span>✧</span></Link><nav><Link href="/">Xem website <ExternalLink size={14} /></Link><button onClick={signOut}>Đăng xuất <LogOut size={15} /></button></nav></header><div className="admin-shell"><div className="admin-page-title"><div><span className="eyebrow">KHÔNG GIAN QUẢN LÝ</span><h1>Kho thiệp cưới</h1><p>Mỗi tấm thiệp, một câu chuyện riêng. Tất cả cùng một thiết kế.</p></div><Link className="admin-primary" href="/quan-tri/thiep/moi"><FilePlus2 size={17} /> Tạo thiệp mới</Link></div><div className="admin-stat-row"><div><strong>{items.length}</strong><span>Tổng số thiệp</span></div><div><strong>{items.filter((i) => i.status === 'published').length}</strong><span>Đang xuất bản</span></div><div><strong>{items.filter((i) => i.status === 'draft').length}</strong><span>Bản nháp</span></div></div><div className="admin-toolbar"><label className="admin-search"><Search size={17} /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Tìm tên cặp đôi hoặc đường dẫn" aria-label="Tìm thiệp" /></label><select value={filter} onChange={(e) => setFilter(e.target.value)} aria-label="Lọc trạng thái"><option value="all">Tất cả trạng thái</option><option value="draft">Bản nháp</option><option value="published">Đã xuất bản</option><option value="archived">Lưu trữ</option></select></div>{error && <div className="admin-alert">{error}</div>}{loading ? <p className="admin-empty">Đang tải thiệp…</p> : shown.length ? <div className="admin-card-grid">{shown.map((item) => <Link className="admin-invite-card" key={item.id} href={`/quan-tri/thiep/${item.id}`}><div className="admin-card-image">{item.cover_media_id ? <Image src={`/api/media/${item.cover_media_id}`} alt="Ảnh bìa thiệp" fill unoptimized sizes="260px" /> : <span>{item.partner_one[0]} & {item.partner_two[0]}</span>}</div><div className="admin-card-body"><span className={`status-chip ${item.status}`}>{labels[item.status]}</span><h2>{item.partner_one} <em>&</em> {item.partner_two}</h2><p>/thiep/{item.slug}</p><div className="admin-card-bottom"><span>Cập nhật {new Date(item.updated_at).toLocaleDateString('vi-VN')}</span><ArrowRight size={17} /></div></div></Link>)}</div> : <div className="admin-empty"><p>{items.length ? 'Không tìm thấy thiệp phù hợp.' : 'Chưa có thiệp nào. Hãy tạo thiệp đầu tiên.'}</p>{!items.length && <Link href="/quan-tri/thiep/moi">Tạo thiệp <ArrowRight size={16} /></Link>}</div>}</div></main>;
}
