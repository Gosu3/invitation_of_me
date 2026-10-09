import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAdmin } from '@/lib/supabase';

const changesSchema = z.object({
  guest_name: z.string().trim().min(2).max(100).optional(),
  attendance: z.enum(['yes', 'no']).optional(),
  guest_count: z.number().int().min(1).max(5).optional(),
  message: z.string().trim().max(500).transform((value) => value || null).optional(),
}).strict().refine((value) => Object.keys(value).length > 0);

async function mutate(request: NextRequest, params: Promise<{ id: string }>, remove: boolean) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: 'Bạn cần đăng nhập quản trị.' }, { status: 401 });
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) return NextResponse.json({ error: 'Mã không hợp lệ.' }, { status: 400 });
  const parsed = remove ? null : changesSchema.safeParse(await request.json().catch(() => null));
  if (parsed && !parsed.success) return NextResponse.json({ error: 'Tên, trạng thái hoặc số người không hợp lệ.' }, { status: 400 });
  const table = admin.service.from('wedding_rsvps');
  const { data, error } = await (parsed ? table.update(parsed.data) : table.delete()).eq('id', id).select('id');
  if (error) return NextResponse.json({ error: remove ? 'Không thể xoá phản hồi.' : 'Không thể cập nhật phản hồi.' }, { status: 500 });
  if (!data?.length) return NextResponse.json({ error: 'Không tìm thấy phản hồi.' }, { status: 404 });
  return NextResponse.json({ ok: true });
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) { return mutate(request, params, false); }
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) { return mutate(request, params, true); }
