import type { Metadata } from 'next';
import { cache } from 'react';
import { notFound } from 'next/navigation';
import { InvitationExperience } from '@/components/invitation-experience';
import { getInvitation } from '@/lib/invitations';
import { isDatabaseConfigured, serviceDb } from '@/lib/supabase';
import { shareImage } from '@/lib/share-metadata';
import { siteUrl } from '@/lib/utils';

export const dynamic = 'force-dynamic';

type Props = { params: Promise<{ code: string }> };

const getPersonalizedInvitation = cache(async (code: string) => {
  if (!/^[A-Za-z2-9]{5}$/.test(code)) return null;
  const db = serviceDb();
  if (!db) return null;
  const { data: guestLink } = await db
    .from('wedding_guest_links')
    .select('invitation_id,guest_name')
    .eq('code', code)
    .maybeSingle();
  if (!guestLink) return null;
  const { data: row } = await db
    .from('wedding_invitations')
    .select('slug,status')
    .eq('id', guestLink.invitation_id)
    .eq('status', 'published')
    .maybeSingle();
  if (!row) return null;
  const invitation = await getInvitation(row.slug);
  return invitation ? { invitation, guestName: guestLink.guest_name as string } : null;
});

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const result = await getPersonalizedInvitation((await params).code);
  if (!result) return { title: 'Không tìm thấy thiệp', robots: { index: false, follow: false } };
  const { code } = await params;
  const title = `Thiệp cưới ${result.invitation.partnerOne} & ${result.invitation.partnerTwo}`;
  const description = result.invitation.message;
  return {
    title, description,
    robots: { index: false, follow: false },
    // Without an explicit og:image, Messenger scrapes a random page image (the transparent flower PNG renders on black).
    openGraph: {
      title, description, type: 'website', url: `${siteUrl()}/m/${code}`,
      images: [shareImage(result.invitation)],
    },
  };
}

export default async function PersonalizedInvitationPage({ params }: Props) {
  const result = await getPersonalizedInvitation((await params).code);
  if (!result) notFound();
  return <InvitationExperience invitation={result.invitation} connected={isDatabaseConfigured()} guestName={result.guestName} />;
}
