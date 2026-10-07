async function send<T>(url: string, body: unknown): Promise<T> {
  const response = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  const result = await response.json();
  if (!response.ok) throw new Error(result.error || 'Không thể gửi thông tin.');
  return result;
}

import type { PublicSignature, SignatureInk, SignatureMark } from './signature-mark';

export type PublicWish = { id: string; guestName: string; message: string; createdAt: string };

async function listWishes(invitationId: string): Promise<PublicWish[]> {
  const response = await fetch(`/api/wishes?invitationId=${encodeURIComponent(invitationId)}`, { cache: 'no-store' });
  const result = await response.json();
  if (!response.ok) throw new Error(result.error || 'Không thể tải lời chúc.');
  return Array.isArray(result.wishes) ? result.wishes : [];
}

async function listSignatures(invitationId: string): Promise<PublicSignature[]> {
  const response = await fetch(`/api/signatures?invitationId=${encodeURIComponent(invitationId)}`, { cache: 'no-store' });
  const result = await response.json();
  if (!response.ok) throw new Error(result.error || 'Không thể tải chữ ký.');
  return Array.isArray(result.signatures) ? result.signatures : [];
}

export const weddingSubmissions = {
  rsvp: (body: { invitationId: string; guestName: string; attendance: string; guestCount: number; message: string; website: string }) => send<{ ok: true }>('/api/rsvp', body),
  wish: (body: { invitationId: string; guestName: string; message: string; website: string }) => send<{ ok: true; wish: PublicWish; signatureToken: string }>('/api/wishes', body),
  listWishes,
  signature: (body: {
    invitationId: string; guestName: string; mark: SignatureMark; ink: SignatureInk;
    x: number; y: number; scale: number; rotate: number; wishId?: string; wishToken?: string; website: string;
  }) => send<{ ok: true; signature: PublicSignature }>('/api/signatures', body),
  listSignatures,
};
