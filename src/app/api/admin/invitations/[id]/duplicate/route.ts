import { randomUUID } from 'node:crypto';
import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/supabase';
import { getInvitation } from '@/lib/invitations';

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: 'Bạn cần đăng nhập quản trị.' }, { status: 401 });
  const { id } = await params;
  const db = admin.service;
  const { data: source } = await db.from('wedding_invitations').select('*').eq('id', id).maybeSingle();
  if (!source) return NextResponse.json({ error: 'Không tìm thấy thiệp.' }, { status: 404 });
  const invitation = await getInvitation(source.slug, true);
  if (!invitation) return NextResponse.json({ error: 'Không thể đọc thiệp nguồn.' }, { status: 500 });
  let slug = `${source.slug}-ban-sao`;
  let n = 2;
  while (true) { const { data } = await db.from('wedding_invitations').select('id').eq('slug', slug).maybeSingle(); if (!data) break; slug = `${source.slug}-ban-sao-${n++}`; }
  const payload = {
    slug, status: 'draft', partnerOne: invitation.partnerOne, partnerTwo: invitation.partnerTwo,
    partnerOneFullName: invitation.partnerOneFullName || '', partnerTwoFullName: invitation.partnerTwoFullName || '',
    partnerOneParents: invitation.partnerOneParents || '', partnerTwoParents: invitation.partnerTwoParents || '',
    partnerOneAddress: invitation.partnerOneAddress || '', partnerTwoAddress: invitation.partnerTwoAddress || '',
    headline: invitation.headline, message: invitation.message, story: invitation.story || '',
    coverMediaId: null, coverAlt: invitation.coverAlt || '', dressCode: invitation.dressCode || '',
    closingMessage: invitation.closingMessage, rsvpEnabled: invitation.rsvpEnabled,
    rsvpDeadline: invitation.rsvpDeadline || null, wishesEnabled: invitation.wishesEnabled, giftsEnabled: invitation.giftsEnabled,
    events: invitation.events.map((e, i) => ({ ...e, sortOrder: i })),
    timeline: invitation.timeline.map((t, i) => ({ ...t, sortOrder: i })),
    gifts: invitation.gifts.map((g, i) => ({ ...g, qrMediaId: null, sortOrder: i })),
  };
  const saved = await db.rpc('wedding_save_invitation', { p_data: payload, p_owner: admin.user.id });
  if (saved.error || !saved.data) return NextResponse.json({ error: 'Không thể tạo bản sao.' }, { status: 500 });
  const newId = saved.data as string;
  const { data: sourceMedia } = await db.from('wedding_media').select('*').eq('invitation_id', id).eq('status', 'ready').order('sort_order');
  const copied = new Map<string, string>();
  for (const item of sourceMedia || []) {
    const downloaded = await db.storage.from('wedding-media').download(item.storage_path);
    if (downloaded.error || !downloaded.data) continue;
    const mediaId = randomUUID();
    const path = `${newId}/${mediaId}.webp`;
    const uploaded = await db.storage.from('wedding-media').upload(path, downloaded.data, { contentType: item.mime_type, upsert: false });
    if (uploaded.error) continue;
    const inserted = await db.from('wedding_media').insert({ id: mediaId, invitation_id: newId, storage_path: path, alt_text: item.alt_text, mime_type: item.mime_type, byte_size: item.byte_size, sort_order: item.sort_order });
    if (inserted.error) { await db.storage.from('wedding-media').remove([path]); continue; }
    copied.set(item.id, mediaId);
  }
  if (source.cover_media_id && copied.has(source.cover_media_id)) await db.from('wedding_invitations').update({ cover_media_id: copied.get(source.cover_media_id) }).eq('id', newId);
  const { data: sourceGifts } = await db.from('wedding_gift_accounts').select('*').eq('invitation_id', id).order('sort_order');
  const { data: newGifts } = await db.from('wedding_gift_accounts').select('*').eq('invitation_id', newId).order('sort_order');
  for (let i = 0; i < Math.min(sourceGifts?.length || 0, newGifts?.length || 0); i++) {
    const oldQr = sourceGifts![i].qr_media_id;
    if (oldQr && copied.has(oldQr)) await db.from('wedding_gift_accounts').update({ qr_media_id: copied.get(oldQr) }).eq('id', newGifts![i].id);
  }
  return NextResponse.json({ id: newId, copiedImages: copied.size }, { status: 201 });
}
