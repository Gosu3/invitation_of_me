import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/supabase';
import { invitationSchema } from '@/lib/validation';

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: 'Bạn cần đăng nhập quản trị.' }, { status: 401 });
  const { data, error } = await admin.service.from('wedding_invitations').select('id,slug,status,partner_one,partner_two,cover_media_id,created_at,updated_at,published_at').order('updated_at', { ascending: false });
  if (error) return NextResponse.json({ error: 'Không thể tải danh sách thiệp.' }, { status: 500 });
  return NextResponse.json({ invitations: data });
}

export async function POST(request: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: 'Bạn cần đăng nhập quản trị.' }, { status: 401 });
  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({ error: 'Dữ liệu không hợp lệ.' }, { status: 400 }); }
  const parsed = invitationSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: 'Vui lòng kiểm tra các trường bắt buộc.', details: parsed.error.flatten() }, { status: 400 });
  const { data: id, error } = await admin.service.rpc('wedding_save_invitation', { p_data: parsed.data, p_owner: admin.user.id });
  if (error) return NextResponse.json({ error: error.code === '23505' ? 'Đường dẫn thiệp đã tồn tại.' : 'Không thể lưu thiệp.', detail: error.message }, { status: error.code === '23505' ? 409 : 500 });
  return NextResponse.json({ id }, { status: parsed.data.id ? 200 : 201 });
}
