import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/supabase';

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: 'Bạn cần đăng nhập quản trị.' }, { status: 401 });
  const { id } = await params;
  let body: { status?: string };
  try { body = await request.json(); } catch { return NextResponse.json({ error: 'Dữ liệu không hợp lệ.' }, { status: 400 }); }
  if (!['pending', 'approved', 'hidden'].includes(body.status || '')) return NextResponse.json({ error: 'Trạng thái không hợp lệ.' }, { status: 400 });
  const { error } = await admin.service.from('wedding_wishes').update({ status: body.status }).eq('id', id);
  if (error) return NextResponse.json({ error: 'Không thể cập nhật lời chúc.' }, { status: 500 });
  return NextResponse.json({ ok: true });
}
