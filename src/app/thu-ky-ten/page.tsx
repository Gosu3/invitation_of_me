import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { SignaturePrototype } from './signature-prototype';

export const metadata: Metadata = {
  title: 'Bản thử ký tên lên ảnh',
  robots: { index: false, follow: false },
};

export default function SignaturePrototypePage() {
  // Prototype for local/preview review only; production guests use the board inside the invitation.
  if (process.env.VERCEL_ENV === 'production') notFound();
  return <SignaturePrototype />;
}
