import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/supabase';

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: 'Bạn cần đăng nhập quản trị.' }, { status: 401 });
  async function readAll(table: string, fields: string) {
    const rows = [];
    for (let offset = 0; ; offset += 500) {
      const { data, error } = await admin!.service.from(table).select(fields).order('created_at', { ascending: false }).order('id').range(offset, offset + 499);
      if (error) throw error;
      rows.push(...(data || []));
      if (!data || data.length < 500) return rows;
    }
  }
  try {
    const [rsvps, wishes] = await Promise.all([
      readAll('wedding_rsvps', 'id,invitation_id,guest_name,attendance,guest_count,message,created_at'),
      readAll('wedding_wishes', 'id,invitation_id,guest_name,message,status,created_at'),
    ]);
    return NextResponse.json({ rsvps, wishes }, { headers: { 'Cache-Control': 'no-store' } });
  } catch {
    return NextResponse.json({ error: 'Không thể tải phản hồi. Vui lòng thử lại.' }, { status: 500 });
  }
}
