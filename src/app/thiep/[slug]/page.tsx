import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { getInvitation } from '@/lib/invitations';
import { siteUrl } from '@/lib/utils';
import { InvitationExperience } from '@/components/invitation-experience';
import { isDatabaseConfigured } from '@/lib/supabase';

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function guestNameFromSearchParams(params: Record<string, string | string[] | undefined>) {
  const raw = params.guest ?? params.khach;
  const value = Array.isArray(raw) ? raw[0] : raw;
  return value?.replace(/[\u0000-\u001f\u007f]/g, '').replace(/\s+/g, ' ').trim().slice(0, 80) || undefined;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const invitation = await getInvitation(slug);
  if (!invitation) return { title: 'Không tìm thấy thiệp', robots: { index: false, follow: false } };
  const title = `Thiệp cưới ${invitation.partnerOne} & ${invitation.partnerTwo}`;
  return {
    title, description: invitation.message,
    robots: { index: false, follow: false },
    openGraph: { title, description: invitation.message, type: 'website', url: `${siteUrl()}/thiep/${slug}`, images: [`${siteUrl()}/thiep/${slug}/opengraph-image`] },
  };
}

export default async function InvitationPage({ params, searchParams }: Props) {
  const { slug } = await params;
  if (!isDatabaseConfigured() && slug === 'an-va-minh') redirect('/thiep/tho-va-tham');
  const invitation = await getInvitation(slug);
  if (!invitation) notFound();
  const guestName = guestNameFromSearchParams(await searchParams);
  return <InvitationExperience invitation={invitation} connected={isDatabaseConfigured()} guestName={guestName} />;
}
