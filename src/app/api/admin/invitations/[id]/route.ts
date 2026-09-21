import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/supabase';
import { mapInvitation } from '@/lib/invitations';

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: 'Bạn cần đăng nhập quản trị.' }, { status: 401 });
  const { id } = await params;
  const db = admin.service;
  const { data: row } = await db.from('wedding_invitations').select('*').eq('id', id).maybeSingle();
  if (!row) return NextResponse.json({ error: 'Không tìm thấy thiệp.' }, { status: 404 });
  const [events, timeline, media, gifts, wishes] = await Promise.all([
    db.from('wedding_events').select('*').eq('invitation_id', id).order('sort_order'),
    db.from('wedding_timeline_items').select('*').eq('invitation_id', id).order('sort_order'),
    db.from('wedding_media').select('*').eq('invitation_id', id).eq('status', 'ready').order('sort_order'),
    db.from('wedding_gift_accounts').select('*').eq('invitation_id', id).order('sort_order'),
    db.from('wedding_wishes').select('*').eq('invitation_id', id).order('created_at', { ascending: false }),
  ]);
  return NextResponse.json({
    invitation: mapInvitation(row, { events: events.data || [], timeline: timeline.data || [], media: media.data || [], gifts: gifts.data || [], wishes: (wishes.data || []).filter((w) => w.status === 'approved') }),
    coverMediaId: row.cover_media_id,
    giftQrMediaIds: (gifts.data || []).map((g) => ({ id: g.id, qrMediaId: g.qr_media_id })),
    allWishes: wishes.data || [],
  });
}
