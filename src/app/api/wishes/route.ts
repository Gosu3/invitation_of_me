import { NextRequest, NextResponse } from 'next/server';
import { wishSchema } from '@/lib/validation';
import { publicDb, serviceDb } from '@/lib/supabase';
import { allowSubmission, submitterHash } from '@/lib/submission';
import { sharedWishRateLimitScope, sharedWishSlugs } from '@/lib/wedding-wish-groups';

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function GET(request: NextRequest) {
  const invitationId = request.nextUrl.searchParams.get('invitationId') || '';
  if (!uuidPattern.test(invitationId)) return NextResponse.json({ error: 'Thiệp không hợp lệ.' }, { status: 400 });
  const db = publicDb();
  if (!db) return NextResponse.json({ error: 'Chưa kết nối cơ sở dữ liệu.' }, { status: 503 });
  const { data: invitation } = await db.from('wedding_invitations')
    .select('id,slug').eq('id', invitationId).eq('status', 'published').eq('wishes_enabled', true).maybeSingle();
  if (!invitation) return NextResponse.json({ error: 'Thiệp không nhận lời chúc.' }, { status: 404 });
  const { data: wishInvitations } = await db.from('wedding_invitations')
    .select('id').in('slug', sharedWishSlugs(invitation.slug)).eq('status', 'published').eq('wishes_enabled', true);
  const invitationIds = (wishInvitations || []).map((item) => item.id);
  const { data, error } = await db.from('wedding_wishes')
    .select('id,guest_name,message,created_at')
    .in('invitation_id', invitationIds.length ? invitationIds : [invitationId])
    .eq('status', 'approved')
    .order('created_at', { ascending: false })
    .limit(1000);
  if (error) return NextResponse.json({ error: 'Chưa thể tải lời chúc.' }, { status: 500 });
  return NextResponse.json({ wishes: (data || []).map((wish) => ({
    id: wish.id,
    guestName: wish.guest_name,
    message: wish.message,
    createdAt: wish.created_at,
  })) }, { headers: { 'Cache-Control': 'private, no-store' } });
}

export async function POST(request: NextRequest) {
  const db = serviceDb();
  if (!db) return NextResponse.json({ error: 'Chưa kết nối cơ sở dữ liệu.' }, { status: 503 });
  let payload: unknown;
  try { payload = await request.json(); } catch { return NextResponse.json({ error: 'Dữ liệu không hợp lệ.' }, { status: 400 }); }
  const parsed = wishSchema.safeParse(payload);
  if (!parsed.success) return NextResponse.json({ error: 'Vui lòng nhập tên và lời chúc hợp lệ.' }, { status: 400 });
  const input = parsed.data;
  if (input.website) return NextResponse.json({ ok: true });
  const { data: invitation } = await db.from('wedding_invitations').select('id,slug,status,wishes_enabled').eq('id', input.invitationId).maybeSingle();
  if (!invitation || invitation.status !== 'published' || !invitation.wishes_enabled) return NextResponse.json({ error: 'Thiệp không nhận lời chúc.' }, { status: 404 });
  const wishScope = sharedWishRateLimitScope(invitation.slug, input.invitationId);
  const hash = submitterHash(request, wishScope);
  if (!await allowSubmission('wish', wishScope, hash)) return NextResponse.json({ error: 'Bạn đã gửi quá nhiều lần. Vui lòng thử lại sau.' }, { status: 429 });
  const { data: wish, error } = await db.from('wedding_wishes').insert({ invitation_id: input.invitationId, guest_name: input.guestName, message: input.message, status: 'approved', submitter_hash: hash }).select('id,guest_name,message,created_at').single();
  if (error) return NextResponse.json({ error: 'Chưa thể lưu lời chúc. Vui lòng thử lại.' }, { status: 500 });
  // Broadcast only an invalidation; clients fetch public fields through the RLS-protected API.
  const { data: wishInvitations } = await db.from('wedding_invitations')
    .select('id').in('slug', sharedWishSlugs(invitation.slug)).eq('status', 'published').eq('wishes_enabled', true);
  const realtimeIds = (wishInvitations || []).map((item) => item.id);
  await Promise.all((realtimeIds.length ? realtimeIds : [input.invitationId]).map(async (id) => {
    const channel = db.channel(`wedding-wishes:${id}`);
    try { await channel.httpSend('updated', {}, { timeout: 2000 }); }
    catch { /* Periodic refresh recovers missed broadcasts without failing a saved submission. */ }
    finally { await db.removeChannel(channel); }
  }));
  return NextResponse.json({ ok: true, wish: { id: wish.id, guestName: wish.guest_name, message: wish.message, createdAt: wish.created_at } }, { status: 201 });
}
