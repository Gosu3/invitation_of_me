import { notFound, redirect } from 'next/navigation';
import type { Metadata } from 'next';
import { requireAdmin } from '@/lib/supabase';
import { getInvitation } from '@/lib/invitations';
import { InvitationExperience } from '@/components/invitation-experience';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { robots: { index: false, follow: false }, title: 'Xem trước thiệp' };
export default async function PreviewPage({ params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin();
  if (!admin) redirect('/quan-tri/dang-nhap');
  const { id } = await params;
  const { data } = await admin.service.from('wedding_invitations').select('slug').eq('id', id).maybeSingle();
  if (!data) notFound();
  const invite = await getInvitation(data.slug, true);
  if (!invite) notFound();
  return <><div className="preview-banner">Bản xem trước · Chỉ quản trị viên xem được</div><InvitationExperience invitation={invite} connected={false} /></>;
}
