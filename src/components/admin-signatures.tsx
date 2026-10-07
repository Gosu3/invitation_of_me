'use client';

import { useEffect, useState } from 'react';
import type { SignatureInk, SignatureMark, SignatureZone } from '@/lib/signature-mark';
import { sharedWishSlugs } from '@/lib/wedding-wish-groups';
import { SignatureMarkPreview } from './wedding/signature-board';
import { AdminSignatureEditor, type SignatureEdit } from './admin-signature-editor';

type Invitation = { id: string; slug: string; admin_title: string | null };
type LinkedWish = { guest_name: string; message: string; status: string };
type SignatureRow = {
  id: string; invitation_id: string; guest_name: string; mark: SignatureMark; ink: SignatureInk;
  x: number; y: number; scale: number; rotate: number;
  status: 'approved' | 'hidden'; created_at: string; wish: LinkedWish | LinkedWish[] | null;
};
type Board = { id: string; slug: string; signature_image: string | null; signature_avoid_zones: SignatureZone[] | null };

const linkedWish = (row: SignatureRow) => Array.isArray(row.wish) ? row.wish[0] : row.wish;

export function AdminSignatures({ invitations }: { invitations: Invitation[] }) {
  const [rows, setRows] = useState<SignatureRow[]>([]);
  const [query, setQuery] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState('');
  const [boards, setBoards] = useState<Board[]>([]);
  const [editing, setEditing] = useState<string | null>(null);

  async function refresh() {
    try {
      const response = await fetch('/api/admin/signatures', { cache: 'no-store' });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Không thể tải chữ ký.');
      setError(''); setRows(data.signatures); setBoards(data.boards || []);
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

  async function patch(row: SignatureRow, edit: SignatureEdit) {
    const response = await fetch('/api/admin/signatures/' + row.id, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(edit) });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || 'Không thể lưu thay đổi.');
    // Reload so the stored mark (re-measured on the server after a text/font change) is what we show.
    await refresh();
    setEditing(null);
  }
  async function remove(row: SignatureRow) {
    const response = await fetch('/api/admin/signatures/' + row.id, { method: 'DELETE' });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || 'Không thể xoá chữ ký.');
    setRows(current => current.filter(item => item.id !== row.id));
    setEditing(null);
  }
  // The editor shows the signature on its own board, with the rest of that board (Thọ & Thắm share one).
  const editRow = rows.find(row => row.id === editing);
  const editBoard = editRow && boards.find(board => board.id === editRow.invitation_id);
  const boardIds = editBoard ? boards.filter(board => sharedWishSlugs(editBoard.slug).includes(board.slug)).map(board => board.id) : [];

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
              <button disabled={!!busy} onClick={() => setEditing(row.id)}>Chỉnh sửa</button>
              <button disabled={!!busy} onClick={() => change(row, row.status === 'approved' ? 'hidden' : 'approved')}>{row.status === 'approved' ? 'Ẩn' : 'Hiển thị'}</button>
              <button disabled={!!busy} onClick={() => change(row)}>Xoá</button>
            </div>
          </div>
        </article>;
      })}
      {!rows.length && <p>Chưa có chữ ký.</p>}
    </div>}
    {editRow && <AdminSignatureEditor
      key={editRow.id}
      signature={editRow}
      others={rows.filter(row => row.id !== editRow.id && row.status === 'approved' && (boardIds.length ? boardIds.includes(row.invitation_id) : row.invitation_id === editRow.invitation_id))}
      photo={editBoard?.signature_image ?? null}
      avoidZones={editBoard?.signature_avoid_zones ?? []}
      onSave={edit => patch(editRow, edit)}
      onDelete={() => remove(editRow)}
      onClose={() => setEditing(null)}
    />}
  </section>;
}
