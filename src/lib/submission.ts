import { createHash, createHmac, timingSafeEqual } from 'node:crypto';
import type { NextRequest } from 'next/server';
import { serviceDb } from './supabase';

export function submitterHash(request: NextRequest, invitationId: string) {
  const ip = request.headers.get('x-real-ip') || request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  const agent = request.headers.get('user-agent') || '';
  return createHash('sha256').update(`${process.env.SUPABASE_SERVICE_ROLE_KEY}:${invitationId}:${ip}:${agent}`).digest('hex');
}

export async function allowSubmission(kind: 'rsvp' | 'wish' | 'signature', invitationId: string, hash: string) {
  const db = serviceDb();
  if (!db) return false;
  const hour = Math.floor(Date.now() / 3600000);
  const key = createHash('sha256').update(`${kind}:${invitationId}:${hash}:${hour}`).digest('hex');
  const { data, error } = await db.rpc('wedding_take_rate_limit', {
    p_key: key, p_limit: kind === 'rsvp' ? 5 : 3,
    p_expires_at: new Date((hour + 1) * 3600000).toISOString(),
  });
  return !error && data === true;
}

// Proves the caller is the browser that created a wish, so a signature can only be attached to one's own wish.
export function wishSignatureToken(wishId: string) {
  return createHmac('sha256', `${process.env.SUPABASE_SERVICE_ROLE_KEY}`).update(`wish-signature:${wishId}`).digest('hex').slice(0, 40);
}

export function verifyWishSignatureToken(wishId: string, token: string) {
  const expected = Buffer.from(wishSignatureToken(wishId));
  const given = Buffer.from(token);
  return expected.length === given.length && timingSafeEqual(expected, given);
}
