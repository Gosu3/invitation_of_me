import { NextRequest, NextResponse } from 'next/server';
import { wishSchema } from '@/lib/validation';
import { serviceDb } from '@/lib/supabase';
import { allowSubmission, submitterHash } from '@/lib/submission';

export async function POST(request: NextRequest) {
  const db = serviceDb();
  if (!db) return NextResponse.json({ error: 'Chưa kết nối cơ sở dữ liệu.' }, { status: 503 });
  let payload: unknown;
  try { payload = await request.json(); } catch { return NextResponse.json({ error: 'Dữ liệu không hợp lệ.' }, { status: 400 }); }
  const parsed = wishSchema.safeParse(payload);
  if (!parsed.success) return NextResponse.json({ error: 'Vui lòng nhập tên và lời chúc hợp lệ.' }, { status: 400 });
  const input = parsed.data;
  if (input.website) return NextResponse.json({ ok: true });
  const { data: invitation } = await db.from('wedding_invitations').select('id,status,wishes_enabled').eq('id', input.invitationId).maybeSingle();
  if (!invitation || invitation.status !== 'published' || !invitation.wishes_enabled) return NextResponse.json({ error: 'Thiệp không nhận lời chúc.' }, { status: 404 });
  const hash = submitterHash(request, input.invitationId);
  if (!await allowSubmission('wish', input.invitationId, hash)) return NextResponse.json({ error: 'Bạn đã gửi quá nhiều lần. Vui lòng thử lại sau.' }, { status: 429 });
  const { error } = await db.from('wedding_wishes').insert({ invitation_id: input.invitationId, guest_name: input.guestName, message: input.message, status: 'pending', submitter_hash: hash });
  if (error) return NextResponse.json({ error: 'Chưa thể lưu lời chúc. Vui lòng thử lại.' }, { status: 500 });
  return NextResponse.json({ ok: true }, { status: 201 });
}
