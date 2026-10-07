'use client';

import { useEffect, useState } from 'react';
import type { SignatureInk, SignatureMark } from '@/lib/signature-mark';
import { SignatureMarkPreview } from './wedding/signature-board';

type Invitation = { id: string; slug: string; admin_title: string | null };
type LinkedWish = { guest_name: string; message: string; status: string };
type SignatureRow = {
  id: string; invitation_id: string; guest_name: string; mark: SignatureMark; ink: SignatureInk;
  status: 'approved' | 'hidden'; created_at: string; wish: LinkedWish | LinkedWish[] | null;
};

const linkedWish = (row: SignatureRow) => Array.isArray(row.wish) ? row.wish[0] : row.wish;

export function AdminSignatures({ invitations }: { invitations: Invitation[] }) {
  const [rows, setRows] = useState<SignatureRow[]>([]);
  const [query, setQuery] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState('');

  async function refresh() {
    try {
      const response = await fetch('/api/admin/signatures', { cache: 'no-store' });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Không thể tải chữ ký.');
      setError(''); setRows(data.signatures);
    } catch (caught) { setError(caught instanceof Error ? caught.message : 'Không thể tải chữ ký.'); }
    finally { setLoading(false); }
  }
  useEffect(() => {
    const initial = window.setTimeout(() => { void refresh(); }, 0);
    return () => window.clearTimeout(initial);
  }, []);

  async function change(row: SignatureRow, status?: SignatureRow['status']) {
    if (!status && !window.confirm('Xoá vĩnh viễn chữ ký của ' + row.guest_name + '?')) return;
    setBusy(row.id); setError('');
    try {
      const response = await fetch('/api/admin/signatures/' + row.id, { method: status ? 'PATCH' : 'DELETE', headers: { 'Content-Type': 'application/json' }, body: status ? JSON.stringify({ status }) : undefined });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      setRows(current => status ? current.map(item => item.id === row.id ? { ...item, status } : item) : current.filter(item => item.id !== row.id));
    } catch (caught) { setError(caught instanceof Error ? caught.message : 'Không thể lưu thay đổi.'); }
    finally { setBusy(''); }
  }

  const visible = rows.filter(row => row.guest_name.toLocaleLowerCase('vi').includes(query.toLocaleLowerCase('vi')));
  return <section className="admin-response-panel">
    <div className="admin-toolbar">
      <input className="admin-response-search" aria-label="Tìm người ký" placeholder="Tìm tên khách…" value={query} onChange={event => setQuery(event.target.value)} />
      <button className="admin-secondary" onClick={refresh}>Làm mới</button>
    </div>
    {error && <p className="admin-alert error" role="alert">{error}</p>}
    {loading ? <p>Đang tải chữ ký…</p> : <div className="admin-all-wishes"><h2>Tất cả chữ ký ({rows.length})</h2>
      {visible.map(row => {
        const wish = linkedWish(row);
        return <article className="admin-response-card admin-signature-card" key={row.id}>
          <SignatureMarkPreview className="admin-signature-preview" mark={row.mark} ink={row.ink} />
          <div>
            <strong>{row.guest_name}</strong><span className={'status-chip ' + row.status}>{row.status === 'approved' ? 'Đang hiển thị' : 'Đã ẩn'}</span>
            <p>{wish ? `Lời chúc: “${wish.message}”${wish.status === 'approved' ? '' : ' (lời chúc đang ẩn)'}` : 'Không gắn lời chúc'}</p>
            <small>{invitations.find(item => item.id === row.invitation_id)?.admin_title || 'Thiệp cưới'} · {new Date(row.created_at).toLocaleString('vi-VN')}</small>
            <div className="moderation-actions">
              <button disabled={!!busy} onClick={() => change(row, row.status === 'approved' ? 'hidden' : 'approved')}>{row.status === 'approved' ? 'Ẩn' : 'Hiển thị'}</button>
              <button disabled={!!busy} onClick={() => change(row)}>Xoá</button>
            </div>
          </div>
        </article>;
      })}
      {!rows.length && <p>Chưa có chữ ký.</p>}
    </div>}
  </section>;
}
