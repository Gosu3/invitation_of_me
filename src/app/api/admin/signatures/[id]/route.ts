import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAdmin } from '@/lib/supabase';
import { sharedWishSlugs } from '@/lib/wedding-wish-groups';
import { measureMark, SIGNATURE_LIMITS, SIGNATURE_MAX_ROTATE, signatureFontIds, signatureInks, type SignatureMark } from '@/lib/signature-mark';

// Admins may adjust anything a guest chose. Scale goes up to the database limit (guests stop at SIGNATURE_SCALE.max).
const updateSchema = z.object({
  status: z.enum(['approved', 'hidden']),
  guestName: z.string().trim().min(1).max(100),
  ink: z.enum(signatureInks),
  x: z.number().min(0).max(1), y: z.number().min(0).max(1),
  scale: z.number().min(0.2).max(1.5),
  rotate: z.number().min(-SIGNATURE_MAX_ROTATE).max(SIGNATURE_MAX_ROTATE),
  text: z.string().trim().min(1).max(SIGNATURE_LIMITS.textLength),
  font: z.enum(signatureFontIds),
}).partial().strict().refine((value) => Object.keys(value).length > 0);

async function mutate(request: NextRequest, params: Promise<{ id: string }>, remove: boolean) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: 'Bạn cần đăng nhập quản trị.' }, { status: 401 });
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) return NextResponse.json({ error: 'Mã không hợp lệ.' }, { status: 400 });
  const { data: signature } = await admin.service.from('wedding_signatures').select('invitation_id,mark').eq('id', id).maybeSingle();
  if (!signature) return NextResponse.json({ error: 'Không tìm thấy chữ ký.' }, { status: 404 });
  let update: Record<string, unknown> = {};
  if (!remove) {
    const parsed = updateSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) return NextResponse.json({ error: 'Dữ liệu chỉnh sửa không hợp lệ.' }, { status: 400 });
    const { guestName, text, font, ...rest } = parsed.data;
    update = { ...rest, ...(guestName ? { guest_name: guestName } : {}) };
    if (text !== undefined || font !== undefined) {
      const mark = signature.mark as SignatureMark;
      if (mark.kind !== 'text') return NextResponse.json({ error: 'Chữ ký vẽ tay không đổi được nội dung hay kiểu chữ.' }, { status: 400 });
      update.mark = measureMark({ kind: 'text', text: text ?? mark.text, font: font ?? mark.font, w: 0, h: 0 });
    }
  }
  const { error } = remove
    ? await admin.service.from('wedding_signatures').delete().eq('id', id)
    : await admin.service.from('wedding_signatures').update(update).eq('id', id);
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
