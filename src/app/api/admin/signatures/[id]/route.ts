import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAdmin } from '@/lib/supabase';
import { sharedWishSlugs } from '@/lib/wedding-wish-groups';

async function mutate(request: NextRequest, params: Promise<{ id: string }>, remove: boolean) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: 'Bạn cần đăng nhập quản trị.' }, { status: 401 });
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) return NextResponse.json({ error: 'Mã không hợp lệ.' }, { status: 400 });
  const { data: signature } = await admin.service.from('wedding_signatures').select('invitation_id').eq('id', id).maybeSingle();
  if (!signature) return NextResponse.json({ error: 'Không tìm thấy chữ ký.' }, { status: 404 });
  const parsed = remove ? null : z.object({ status: z.enum(['approved', 'hidden']) }).strict().safeParse(await request.json().catch(() => null));
  if (!remove && !parsed?.success) return NextResponse.json({ error: 'Trạng thái không hợp lệ.' }, { status: 400 });
  const { error } = remove
    ? await admin.service.from('wedding_signatures').delete().eq('id', id)
    : await admin.service.from('wedding_signatures').update(parsed!.data!).eq('id', id);
  if (error) return NextResponse.json({ error: 'Không thể cập nhật chữ ký.' }, { status: 500 });
  // Boards on both shared invitations refresh immediately; polling covers missed broadcasts.
  const { data: invitation } = await admin.service.from('wedding_invitations').select('slug').eq('id', signature.invitation_id).maybeSingle();
  const { data: related } = await admin.service.from('wedding_invitations').select('id').in('slug', sharedWishSlugs(invitation?.slug || ''));
  await Promise.all((related?.length ? related : [{ id: signature.invitation_id }]).map(async ({ id: invitationId }) => {
    const channel = admin.service.channel(`wedding-signatures:${invitationId}`);
    try { await channel.httpSend('updated', {}, { timeout: 2000 }); }
    catch { /* Periodic public refresh recovers missed broadcasts. */ }
    finally { await admin.service.removeChannel(channel); }
  }));
  return NextResponse.json({ ok: true });
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) { return mutate(request, params, false); }
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) { return mutate(request, params, true); }
