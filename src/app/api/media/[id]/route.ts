import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, serviceDb } from '@/lib/supabase';
import { sharedWishSlugs } from '@/lib/wedding-wish-groups';

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const db = serviceDb();
  if (!db) return new NextResponse(null, { status: 404 });
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) return new NextResponse(null, { status: 404 });
  const { data: media } = await db.from('wedding_media').select('id,invitation_id,storage_path,mime_type,status').eq('id', id).maybeSingle();
  if (!media || media.status !== 'ready') return new NextResponse(null, { status: 404 });
  const { data: invitation } = await db.from('wedding_invitations').select('status,slug').eq('id', media.invitation_id).maybeSingle();
  let published = invitation?.status === 'published';
  if (!published && invitation) {
    // Album dùng chung: ảnh công khai nếu một thiệp trong nhóm đã xuất bản.
    const group = sharedWishSlugs(invitation.slug);
    if (group.length > 1) {
      const { data: siblings } = await db.from('wedding_invitations').select('id').in('slug', group).eq('status', 'published').limit(1);
      published = !!siblings?.length;
    }
  }
  if (!published && !await requireAdmin()) return new NextResponse(null, { status: 404 });
  const { data, error } = await db.storage.from('wedding-media').download(media.storage_path);
  if (error || !data) return new NextResponse(null, { status: 404 });
  return new NextResponse(new Uint8Array(await data.arrayBuffer()), {
    headers: { 'Content-Type': media.mime_type, 'Cache-Control': published ? 'public, max-age=300, s-maxage=300' : 'private, no-store', 'X-Content-Type-Options': 'nosniff' },
  });
}
