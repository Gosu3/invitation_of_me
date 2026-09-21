import { NextRequest, NextResponse } from 'next/server';
import { rsvpSchema } from '@/lib/validation';
import { serviceDb } from '@/lib/supabase';
import { allowSubmission, submitterHash } from '@/lib/submission';

export async function POST(request: NextRequest) {
  const db = serviceDb();
  if (!db) return NextResponse.json({ error: 'Chưa kết nối cơ sở dữ liệu.' }, { status: 503 });
  let payload: unknown;
  try { payload = await request.json(); } catch { return NextResponse.json({ error: 'Dữ liệu không hợp lệ.' }, { status: 400 }); }
  const parsed = rsvpSchema.safeParse(payload);
  if (!parsed.success) return NextResponse.json({ error: 'Vui lòng kiểm tra thông tin đã nhập.' }, { status: 400 });
  const input = parsed.data;
  if (input.website) return NextResponse.json({ ok: true });
  const { data: invitation } = await db.from('wedding_invitations').select('id,status,rsvp_enabled,rsvp_deadline').eq('id', input.invitationId).maybeSingle();
  if (!invitation || invitation.status !== 'published' || !invitation.rsvp_enabled) return NextResponse.json({ error: 'Thiệp không nhận phản hồi.' }, { status: 404 });
  if (invitation.rsvp_deadline && new Date(invitation.rsvp_deadline).getTime() < Date.now()) return NextResponse.json({ error: 'Đã hết hạn xác nhận tham dự.' }, { status: 403 });
  const hash = submitterHash(request, input.invitationId);
  if (!await allowSubmission('rsvp', input.invitationId, hash)) return NextResponse.json({ error: 'Bạn đã gửi quá nhiều lần. Vui lòng thử lại sau.' }, { status: 429 });
  const since = new Date(Date.now() - 5 * 60000).toISOString();
  const { data: duplicate } = await db.from('wedding_rsvps').select('id').eq('invitation_id', input.invitationId).eq('submitter_hash', hash).ilike('guest_name', input.guestName).gte('created_at', since).limit(1);
  if (duplicate?.length) return NextResponse.json({ error: 'Phản hồi này vừa được gửi. Cảm ơn bạn!' }, { status: 409 });
  const { error } = await db.from('wedding_rsvps').insert({ invitation_id: input.invitationId, guest_name: input.guestName, attendance: input.attendance, guest_count: input.attendance === 'yes' ? input.guestCount : 1, message: input.message || null, submitter_hash: hash });
  if (error) return NextResponse.json({ error: 'Chưa thể lưu phản hồi. Vui lòng thử lại.' }, { status: 500 });
  return NextResponse.json({ ok: true }, { status: 201 });
}
