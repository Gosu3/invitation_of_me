import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/supabase';

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: 'Bạn cần đăng nhập quản trị.' }, { status: 401 });
  const { id } = await params;
  let body: { alt?: string; sortOrder?: number };
  try { body = await request.json(); } catch { return NextResponse.json({ error: 'Dữ liệu không hợp lệ.' }, { status: 400 }); }
  const patch: { alt_text?: string; sort_order?: number } = {};
  if (typeof body.alt === 'string') patch.alt_text = body.alt.trim().slice(0, 200);
  if (typeof body.sortOrder === 'number' && Number.isInteger(body.sortOrder)) patch.sort_order = body.sortOrder;
  const { error } = await admin.service.from('wedding_media').update(patch).eq('id', id);
  if (error) return NextResponse.json({ error: 'Không thể cập nhật ảnh.' }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: 'Bạn cần đăng nhập quản trị.' }, { status: 401 });
  const { id } = await params;
  const { data: media } = await admin.service.from('wedding_media').select('id,storage_path').eq('id', id).maybeSingle();
  if (!media) return NextResponse.json({ error: 'Không tìm thấy ảnh.' }, { status: 404 });
  const { data: cover } = await admin.service.from('wedding_invitations').select('id').eq('cover_media_id', id).limit(1);
  const { data: gift } = await admin.service.from('wedding_gift_accounts').select('id').eq('qr_media_id', id).limit(1);
  if (cover?.length || gift?.length) return NextResponse.json({ error: 'Hãy gỡ ảnh khỏi bìa hoặc hộp quà trước khi xóa.' }, { status: 409 });
  const removed = await admin.service.storage.from('wedding-media').remove([media.storage_path]);
  if (removed.error) return NextResponse.json({ error: 'Không thể xóa tệp ảnh.' }, { status: 500 });
  const { error } = await admin.service.from('wedding_media').update({ status: 'deleted' }).eq('id', id);
  if (error) return NextResponse.json({ error: 'Ảnh đã xóa khỏi Storage nhưng chưa cập nhật metadata.' }, { status: 500 });
  return NextResponse.json({ ok: true });
}
