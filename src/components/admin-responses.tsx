'use client';

import { useEffect, useState } from 'react';

type Invitation = { id: string; slug: string; admin_title: string | null };
type Rsvp = { id: string; invitation_id: string; guest_name: string; attendance: string; guest_count: number; message: string | null; created_at: string };
type Wish = { id: string; invitation_id: string; guest_name: string; message: string; status: string; created_at: string };

export function AdminResponses({ invitations, tab }: { invitations: Invitation[]; tab: 'rsvps' | 'wishes' }) {
  const [rsvps, setRsvps] = useState<Rsvp[]>([]);
  const [wishes, setWishes] = useState<Wish[]>([]);
  const [filter, setFilter] = useState('all');
  const [query, setQuery] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState('');
  const [editing, setEditing] = useState<Wish | null>(null);
  const [editingRsvp, setEditingRsvp] = useState<Rsvp | null>(null);
  async function refresh() {
    try {
      const response = await fetch('/api/admin/responses', { cache: 'no-store' });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      setError(''); setRsvps(data.rsvps); setWishes(data.wishes);
    } catch { setError('Không thể tải phản hồi. Hãy bấm Làm mới để thử lại.'); }
    finally { setLoading(false); }
  }
  useEffect(() => {
    const initial = window.setTimeout(() => { void refresh(); }, 0);
    return () => window.clearTimeout(initial);
  }, []);
  async function change(wish: Wish, changes?: Partial<Wish>) {
    if (!changes && !window.confirm('Xoá vĩnh viễn lời chúc của ' + wish.guest_name + '?')) return;
    setBusy(wish.id); setError('');
    try {
      const response = await fetch('/api/admin/wishes/' + wish.id, { method: changes ? 'PATCH' : 'DELETE', headers: { 'Content-Type': 'application/json' }, body: changes ? JSON.stringify(changes) : undefined });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      setWishes(current => changes ? current.map(item => item.id === wish.id ? { ...item, ...changes } : item) : current.filter(item => item.id !== wish.id));
      setEditing(null);
    } catch (caught) { setError(caught instanceof Error ? caught.message : 'Không thể lưu thay đổi.'); }
    finally { setBusy(''); }
  }
  async function changeRsvp(rsvp: Rsvp, changes?: Partial<Rsvp>) {
    if (!changes && !window.confirm('Xoá vĩnh viễn xác nhận tham dự của ' + rsvp.guest_name + '?')) return;
    setBusy(rsvp.id); setError('');
    try {
      const response = await fetch('/api/admin/rsvps/' + rsvp.id, { method: changes ? 'PATCH' : 'DELETE', headers: { 'Content-Type': 'application/json' }, body: changes ? JSON.stringify(changes) : undefined });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      setRsvps(current => changes ? current.map(item => item.id === rsvp.id ? { ...item, ...changes, message: changes.message?.trim() || null } : item) : current.filter(item => item.id !== rsvp.id));
      setEditingRsvp(null);
    } catch (caught) { setError(caught instanceof Error ? caught.message : 'Không thể lưu thay đổi.'); }
    finally { setBusy(''); }
  }
  // Totals for the wrap-up: everyone who replied, who is coming (and how many people), who is not.
  const summary = (list: Rsvp[]) => {
    const coming = list.filter(item => item.attendance === 'yes');
    const people = coming.reduce((sum, item) => sum + item.guest_count, 0);
    return <div className="responses-summary">
      <div><strong>{list.length}</strong><span>Khách đã gửi</span></div>
      <div><strong>{coming.length}</strong><span>Xác nhận đi{people !== coming.length ? ` · ${people} người` : ''}</span></div>
      <div><strong>{list.filter(item => item.attendance === 'no').length}</strong><span>Vắng mặt</span></div>
    </div>;
  };
  const groups = ['tho-va-tham', 'tham-va-tho'].map((slug, index) => ({ title: index ? 'Nhà gái' : 'Nhà trai', ids: invitations.filter(item => item.slug === slug).map(item => item.id) }));
  const other = invitations.filter(item => !['tho-va-tham', 'tham-va-tho'].includes(item.slug));
  if (other.length) groups.push({ title: 'Thiệp khác', ids: other.map(item => item.id) });
  const matches = (name: string) => name.toLocaleLowerCase('vi').includes(query.toLocaleLowerCase('vi'));
  return <section className="admin-response-panel">
    <div className="admin-toolbar">
      <input className="admin-response-search" aria-label="Tìm người gửi" placeholder="Tìm tên khách…" value={query} onChange={event => setQuery(event.target.value)} />
      {tab === 'rsvps' && <select aria-label="Lọc xác nhận tham dự" value={filter} onChange={event => setFilter(event.target.value)}><option value="all">Tất cả phản hồi</option><option value="yes">Sẽ tham dự</option><option value="no">Vắng mặt</option></select>}
      <button className="admin-secondary" onClick={refresh}>Làm mới</button>
    </div>
    {error && <p className="admin-alert error" role="alert">{error}</p>}
    {loading ? <p>Đang tải phản hồi…</p> : tab === 'rsvps' ? <>{groups.length > 1 && <section className="admin-rsvp-total"><h2>Tổng cộng</h2>{summary(rsvps)}</section>}<div className="admin-family-columns">{groups.map(group => {
      const all = rsvps.filter(item => group.ids.includes(item.invitation_id));
      const rows = all.filter(item => (filter === 'all' || item.attendance === filter) && matches(item.guest_name));
      return <section className="admin-family-column" key={group.title}><h2>{group.title}</h2>{summary(all)}{rows.map(item => <article className="admin-response-card" key={item.id}>
        {editingRsvp?.id === item.id ? <form className="admin-wish-edit" onSubmit={event => { event.preventDefault(); void changeRsvp(item, { guest_name: editingRsvp.guest_name, attendance: editingRsvp.attendance, guest_count: editingRsvp.guest_count, message: editingRsvp.message ?? '' }); }}>
          <label>Tên khách<input required minLength={2} maxLength={100} value={editingRsvp.guest_name} onChange={event => setEditingRsvp({ ...editingRsvp, guest_name: event.target.value })} /></label>
          <label>Trạng thái<select value={editingRsvp.attendance} onChange={event => setEditingRsvp({ ...editingRsvp, attendance: event.target.value })}><option value="yes">Sẽ tham dự</option><option value="no">Vắng mặt</option></select></label>
          <label>Số người<input type="number" required min={1} max={5} value={editingRsvp.guest_count} onChange={event => setEditingRsvp({ ...editingRsvp, guest_count: Number(event.target.value) })} /></label>
          <label>Lời nhắn<textarea maxLength={500} rows={3} value={editingRsvp.message ?? ''} onChange={event => setEditingRsvp({ ...editingRsvp, message: event.target.value })} /></label>
          <button className="admin-primary" disabled={!!busy}>Lưu thay đổi</button><button type="button" className="admin-secondary" disabled={!!busy} onClick={() => setEditingRsvp(null)}>Huỷ</button>
        </form> : <><strong>{item.guest_name}</strong><span className={'status-chip ' + (item.attendance === 'yes' ? 'approved' : 'hidden')}>{item.attendance === 'yes' ? 'Sẽ tham dự' : 'Vắng mặt'}</span><p>Số người: {item.guest_count}</p>{item.message && <p>{item.message}</p>}<small>{new Date(item.created_at).toLocaleString('vi-VN')}</small><div className="moderation-actions"><button disabled={!!busy} onClick={() => setEditingRsvp({ ...item })}>Sửa</button><button disabled={!!busy} onClick={() => changeRsvp(item)}>Xoá</button></div></>}
      </article>)}{!rows.length && <p>Chưa có phản hồi phù hợp.</p>}</section>;
    })}</div></> :<div className="admin-all-wishes"><h2>Tất cả lời chúc ({wishes.length})</h2>{wishes.filter(item => matches(item.guest_name)).map(wish => <article className="admin-response-card" key={wish.id}>
      {editing?.id === wish.id ? <form className="admin-wish-edit" onSubmit={event => { event.preventDefault(); void change(wish, { guest_name: editing.guest_name, message: editing.message }); }}>
        <label>Tên người gửi<input required minLength={2} maxLength={100} value={editing.guest_name} onChange={event => setEditing({ ...editing, guest_name: event.target.value })} /></label>
        <label>Lời chúc<textarea required minLength={3} maxLength={1000} rows={4} value={editing.message} onChange={event => setEditing({ ...editing, message: event.target.value })} /></label>
        <button className="admin-primary" disabled={!!busy}>Lưu thay đổi</button><button type="button" className="admin-secondary" disabled={!!busy} onClick={() => setEditing(null)}>Huỷ</button>
      </form> : <><strong>{wish.guest_name}</strong><span className={'status-chip ' + wish.status}>{wish.status === 'approved' ? 'Đang hiển thị' : wish.status === 'hidden' ? 'Đã ẩn' : 'Chờ duyệt'}</span><p>{wish.message}</p><small>{invitations.find(item => item.id === wish.invitation_id)?.admin_title || 'Thiệp cưới'} · {new Date(wish.created_at).toLocaleString('vi-VN')}</small><div className="moderation-actions"><button disabled={!!busy} onClick={() => setEditing({ ...wish })}>Sửa</button><button disabled={!!busy} onClick={() => change(wish, { status: wish.status === 'approved' ? 'hidden' : 'approved' })}>{wish.status === 'approved' ? 'Ẩn' : 'Hiển thị'}</button><button disabled={!!busy} onClick={() => change(wish)}>Xoá</button></div></>}
    </article>)}{!wishes.length && <p>Chưa có lời chúc.</p>}</div>}
  </section>;
}
