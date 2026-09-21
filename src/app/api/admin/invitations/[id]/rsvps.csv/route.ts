import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/supabase';

function cell(value: unknown) { return `"${String(value ?? '').replaceAll('"', '""')}"`; }

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: 'Bạn cần đăng nhập quản trị.' }, { status: 401 });
  const { id } = await params;
  const { data, error } = await admin.service.from('wedding_rsvps').select('guest_name,attendance,guest_count,message,created_at').eq('invitation_id', id).order('created_at');
  if (error) return NextResponse.json({ error: 'Không thể xuất phản hồi.' }, { status: 500 });
  const rows = [['Tên khách', 'Tham dự', 'Số người', 'Lời nhắn', 'Thời gian'].map(cell).join(',')];
  for (const row of data || []) rows.push([row.guest_name, row.attendance === 'yes' ? 'Có' : 'Không', row.guest_count, row.message, row.created_at].map(cell).join(','));
  return new NextResponse(`\uFEFF${rows.join('\r\n')}`, { headers: { 'Content-Type': 'text/csv; charset=utf-8', 'Content-Disposition': `attachment; filename="rsvp-${id}.csv"`, 'Cache-Control': 'private, no-store' } });
}
