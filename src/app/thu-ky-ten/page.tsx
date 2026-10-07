import type { Metadata } from 'next';
import { SignaturePrototype } from './signature-prototype';

export const metadata: Metadata = {
  title: 'Bản thử ký tên lên ảnh',
  robots: { index: false, follow: false },
};

export default function SignaturePrototypePage() {
  return <SignaturePrototype />;
}
