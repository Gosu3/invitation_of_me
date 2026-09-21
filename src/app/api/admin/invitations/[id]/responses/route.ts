import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/supabase';

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: 'Bạn cần đăng nhập quản trị.' }, { status: 401 });
  const { id } = await params;
  const [rsvps, wishes] = await Promise.all([
    admin.service.from('wedding_rsvps').select('id,guest_name,attendance,guest_count,message,created_at').eq('invitation_id', id).order('created_at', { ascending: false }),
    admin.service.from('wedding_wishes').select('id,guest_name,message,status,created_at').eq('invitation_id', id).order('created_at', { ascending: false }),
  ]);
  if (rsvps.error || wishes.error) return NextResponse.json({ error: 'Không thể tải phản hồi.' }, { status: 500 });
  return NextResponse.json({ rsvps: rsvps.data || [], wishes: wishes.data || [] });
}
