import { NextRequest, NextResponse } from 'next/server';
import { signatureSchema } from '@/lib/validation';
import { publicDb, serviceDb } from '@/lib/supabase';
import { allowSubmission, submitterHash, verifyWishSignatureToken } from '@/lib/submission';
import { measureMark, signatureCoversZone, type PublicSignature, type SignatureMark, type SignatureZone } from '@/lib/signature-mark';
import { sharedWishRateLimitScope, sharedWishSlugs } from '@/lib/wedding-wish-groups';

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const columns = 'id,guest_name,mark,ink,x,y,scale,rotate,created_at,wish:wedding_wishes(guest_name,message,status)';

type Row = {
  id: string; guest_name: string; mark: SignatureMark; ink: PublicSignature['ink'];
  x: number; y: number; scale: number; rotate: number; created_at: string;
  wish: { guest_name: string; message: string; status: string } | { guest_name: string; message: string; status: string }[] | null;
};

function toPublic(row: Row): PublicSignature {
  const wish = Array.isArray(row.wish) ? row.wish[0] : row.wish;
  return {
    id: row.id, guestName: row.guest_name, mark: row.mark, ink: row.ink,
    x: row.x, y: row.y, scale: row.scale, rotate: row.rotate, createdAt: row.created_at,
    wish: wish && wish.status === 'approved' ? { guestName: wish.guest_name, message: wish.message } : undefined,
  };
}

// Thọ & Thắm share one board, mirroring how they share wishes.
async function boardInvitationIds(db: NonNullable<ReturnType<typeof publicDb>>, slug: string, fallbackId: string) {
  const { data } = await db.from('wedding_invitations')
    .select('id').in('slug', sharedWishSlugs(slug)).eq('status', 'published').eq('signatures_enabled', true);
  const ids = (data || []).map((item) => item.id);
  return ids.length ? ids : [fallbackId];
}

export async function GET(request: NextRequest) {
  const invitationId = request.nextUrl.searchParams.get('invitationId') || '';
  if (!uuidPattern.test(invitationId)) return NextResponse.json({ error: 'Thiệp không hợp lệ.' }, { status: 400 });
  const db = publicDb();
  if (!db) return NextResponse.json({ error: 'Chưa kết nối cơ sở dữ liệu.' }, { status: 503 });
  const { data: invitation } = await db.from('wedding_invitations')
    .select('id,slug').eq('id', invitationId).eq('status', 'published').eq('signatures_enabled', true).maybeSingle();
  if (!invitation) return NextResponse.json({ error: 'Thiệp không nhận chữ ký.' }, { status: 404 });
  const { data, error } = await db.from('wedding_signatures')
    .select(columns)
    .in('invitation_id', await boardInvitationIds(db, invitation.slug, invitation.id))
    .eq('status', 'approved')
    .order('created_at', { ascending: true })
    .limit(300);
  if (error) return NextResponse.json({ error: 'Chưa thể tải chữ ký.' }, { status: 500 });
  return NextResponse.json({ signatures: ((data || []) as unknown as Row[]).map(toPublic) }, { headers: { 'Cache-Control': 'private, no-store' } });
}

export async function POST(request: NextRequest) {
  const db = serviceDb();
  if (!db) return NextResponse.json({ error: 'Chưa kết nối cơ sở dữ liệu.' }, { status: 503 });
  let payload: unknown;
  try { payload = await request.json(); } catch { return NextResponse.json({ error: 'Dữ liệu không hợp lệ.' }, { status: 400 }); }
  const parsed = signatureSchema.safeParse(payload);
  if (!parsed.success) return NextResponse.json({ error: 'Chữ ký không hợp lệ. Vui lòng ký lại.' }, { status: 400 });
  const input = parsed.data;
  if (input.website) return NextResponse.json({ ok: true });
  const { data: invitation } = await db.from('wedding_invitations').select('id,slug,status,signatures_enabled,signature_avoid_zones').eq('id', input.invitationId).maybeSingle();
  if (!invitation || invitation.status !== 'published' || !invitation.signatures_enabled) return NextResponse.json({ error: 'Thiệp không nhận chữ ký.' }, { status: 404 });

  const boardIds = await boardInvitationIds(db, invitation.slug, invitation.id);
  let wishId: string | null = null;
  if (input.wishId && input.wishToken && verifyWishSignatureToken(input.wishId, input.wishToken)) {
    const wishIds = sharedWishSlugs(invitation.slug).length > 1 ? boardIds : [invitation.id];
    const { data: wish } = await db.from('wedding_wishes').select('id').eq('id', input.wishId).in('invitation_id', wishIds).maybeSingle();
    wishId = wish?.id ?? null;
  }

  // Checked before the rate limit so a rejected placement does not use up an attempt.
  const mark = measureMark({ ...input.mark, w: 0, h: 0 });
  const zones = Array.isArray(invitation.signature_avoid_zones) ? invitation.signature_avoid_zones as SignatureZone[] : [];
  if (signatureCoversZone({ mark, x: input.x, y: input.y, scale: input.scale }, zones)) {
    return NextResponse.json({ error: 'Chữ ký đang nằm trong vùng không được ký. Hãy kéo ra khỏi vùng đỏ.' }, { status: 400 });
  }

  const scope = `signature:${sharedWishRateLimitScope(invitation.slug, invitation.id)}`;
  const hash = submitterHash(request, scope);
  if (!await allowSubmission('signature', scope, hash)) return NextResponse.json({ error: 'Bạn đã ký quá nhiều lần. Vui lòng thử lại sau.' }, { status: 429 });

  const { data: row, error } = await db.from('wedding_signatures').insert({
    invitation_id: invitation.id, wish_id: wishId, guest_name: input.guestName, mark, ink: input.ink,
    x: input.x, y: input.y, scale: input.scale, rotate: input.rotate, status: 'approved', submitter_hash: hash,
  }).select(columns).single();
  if (error?.code === '23505') return NextResponse.json({ error: 'Lời chúc này đã có chữ ký đi kèm.' }, { status: 409 });
  if (error || !row) return NextResponse.json({ error: 'Chưa thể lưu chữ ký. Vui lòng thử lại.' }, { status: 500 });

  await Promise.all(boardIds.map(async (id) => {
    const channel = db.channel(`wedding-signatures:${id}`);
    try { await channel.httpSend('updated', {}, { timeout: 2000 }); }
    catch { /* Polling picks up missed broadcasts. */ }
    finally { await db.removeChannel(channel); }
  }));
  return NextResponse.json({ ok: true, signature: toPublic(row as unknown as Row) }, { status: 201 });
}
