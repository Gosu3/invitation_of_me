import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { getInvitation } from '@/lib/invitations';
import { shareDescription, shareImage } from '@/lib/share-metadata';
import { siteUrl } from '@/lib/utils';
import { InvitationExperience } from '@/components/invitation-experience';
import { isDatabaseConfigured } from '@/lib/supabase';

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const invitation = await getInvitation(slug);
  if (!invitation) return { title: 'Không tìm thấy thiệp', robots: { index: false, follow: false } };
  const title = `Thiệp cưới ${invitation.partnerOne} & ${invitation.partnerTwo}`;
  return {
    title, description: invitation.message,
    robots: { index: false, follow: false },
    openGraph: { title, description: shareDescription(invitation), type: 'website', url: `${siteUrl()}/thiep/${slug}`, images: [shareImage(invitation)] },
  };
}

export default async function InvitationPage({ params }: Props) {
  const { slug } = await params;
  if (slug === 'tho-va-tham-nha-gai') redirect('/thiep/tham-va-tho');
  if (!isDatabaseConfigured() && slug === 'an-va-minh') redirect('/thiep/tho-va-tham');
  const invitation = await getInvitation(slug);
  if (!invitation) notFound();
  return <InvitationExperience invitation={invitation} connected={isDatabaseConfigured()} />;
}
