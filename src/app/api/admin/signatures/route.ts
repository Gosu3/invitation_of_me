import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/supabase';

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: 'Bạn cần đăng nhập quản trị.' }, { status: 401 });
  const rows = [];
  for (let offset = 0; ; offset += 500) {
    const { data, error } = await admin.service.from('wedding_signatures')
      .select('id,invitation_id,guest_name,mark,ink,x,y,scale,rotate,status,created_at,wish:wedding_wishes(guest_name,message,status)')
      .order('created_at', { ascending: false }).order('id').range(offset, offset + 499);
    // Table missing because migration 202610070001 has not been applied yet (PostgREST / Postgres codes).
    if (error?.code === 'PGRST205' || error?.code === '42P01') return NextResponse.json({ error: 'Chưa áp dụng migration chữ ký (202610070001).' }, { status: 409 });
    if (error) return NextResponse.json({ error: 'Không thể tải chữ ký.' }, { status: 500 });
    rows.push(...(data || []));
    if (!data || data.length < 500) break;
  }
  // Board photo and no-sign zones per invitation, so the editor can show a signature where guests see it.
  const { data: boards } = await admin.service.from('wedding_invitations').select('id,slug,signature_image,signature_avoid_zones');
  return NextResponse.json({ signatures: rows, boards: boards || [] }, { headers: { 'Cache-Control': 'no-store' } });
}
