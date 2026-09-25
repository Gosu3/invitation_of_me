import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/supabase';
import { sharedWishSlugs } from '@/lib/wedding-wish-groups';
import { z } from 'zod';

async function mutate(request: NextRequest, params: Promise<{ id: string }>, remove: boolean) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: 'Bạn cần đăng nhập quản trị.' }, { status: 401 });
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) return NextResponse.json({ error: 'Mã không hợp lệ.' }, { status: 400 });
  const { data: wish } = await admin.service.from('wedding_wishes').select('invitation_id').eq('id', id).maybeSingle();
  if (!wish) return NextResponse.json({ error: 'Không tìm thấy lời chúc.' }, { status: 404 });
  const schema = z.object({ status: z.enum(['pending', 'approved', 'hidden']).optional(), guest_name: z.string().trim().min(2).max(100).optional(), message: z.string().trim().min(3).max(1000).optional() }).strict().refine(value => Object.keys(value).length > 0);
  const parsed = remove ? null : schema.safeParse(await request.json().catch(() => null));
  if (!remove && !parsed?.success) return NextResponse.json({ error: 'Tên hoặc lời chúc không hợp lệ.' }, { status: 400 });
  const { error } = remove ? await admin.service.from('wedding_wishes').delete().eq('id', id) : await admin.service.from('wedding_wishes').update(parsed!.data!).eq('id', id);
  if (error) return NextResponse.json({ error: 'Không thể cập nhật lời chúc.' }, { status: 500 });
  const { data: invitation } = await admin.service.from('wedding_invitations').select('slug').eq('id', wish.invitation_id).maybeSingle();
  const { data: related } = await admin.service.from('wedding_invitations').select('id').in('slug', sharedWishSlugs(invitation?.slug || ''));
  await Promise.all((related?.length ? related : [{ id: wish.invitation_id }]).map(async ({ id: invitationId }) => {
    const channel = admin.service.channel(`wedding-wishes:${invitationId}`);
    try { await channel.httpSend('updated', {}, { timeout: 2000 }); }
    catch { /* Periodic public refresh recovers missed broadcasts. */ }
    finally { await admin.service.removeChannel(channel); }
  }));
  return NextResponse.json({ ok: true });
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) { return mutate(request, params, false); }
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) { return mutate(request, params, true); }
