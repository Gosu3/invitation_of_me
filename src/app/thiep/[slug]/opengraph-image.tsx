import { ImageResponse } from 'next/og';
import { notFound } from 'next/navigation';
import { getInvitation } from '@/lib/invitations';

export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';
export default async function OpenGraphImage({ params }: { params: Promise<{ slug: string }> }) {
  const invitation = await getInvitation((await params).slug);
  if (!invitation) notFound();
  return new ImageResponse(<div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#682638', color: '#f8f2e9', border: '26px solid #f8f2e9' }}>
    <div style={{ fontSize: 28, letterSpacing: 9, textTransform: 'uppercase' }}>Trân trọng kính mời</div>
    <div style={{ fontSize: 98, marginTop: 35, fontFamily: 'serif' }}>{invitation.partnerOne} & {invitation.partnerTwo}</div>
    <div style={{ fontSize: 30, marginTop: 30, letterSpacing: 5 }}>NÉT DUYÊN · WEDDING INVITATION</div>
  </div>, size);
}
