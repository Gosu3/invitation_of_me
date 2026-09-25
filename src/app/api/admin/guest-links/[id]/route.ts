import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/supabase';
import { z } from 'zod';

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: 'Bạn cần đăng nhập quản trị.' }, { status: 401 });
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) return NextResponse.json({ error: 'Link không hợp lệ.' }, { status: 400 });
  const { data, error } = await admin.service.from('wedding_guest_links').delete().eq('id', id).select('id').maybeSingle();
  if (error) return NextResponse.json({ error: 'Không thể xoá link.' }, { status: 500 });
  if (!data) return NextResponse.json({ error: 'Link không còn tồn tại.' }, { status: 404 });
  return NextResponse.json({ ok: true });
}
