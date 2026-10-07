'use client';

import { useMemo, useSyncExternalStore } from 'react';

// Remembers the wish this browser sent so the signature board can link to it (token proves ownership server-side).

export type MyWish = { wishId: string; token: string; guestName: string };

const EVENT = 'net-duyen:my-wish';
const storageKey = (invitationId: string) => `net-duyen:my-wish:${invitationId}`;

export function rememberMyWish(invitationId: string, wish: MyWish) {
  try { window.localStorage.setItem(storageKey(invitationId), JSON.stringify(wish)); } catch { /* private mode: board just won't link */ }
  window.dispatchEvent(new Event(EVENT));
}

function subscribe(onChange: () => void) {
  window.addEventListener(EVENT, onChange);
  window.addEventListener('storage', onChange);
  return () => { window.removeEventListener(EVENT, onChange); window.removeEventListener('storage', onChange); };
}

function parse(raw: string | null): MyWish | null {
  if (!raw) return null;
  try {
    const value: unknown = JSON.parse(raw);
    if (value && typeof value === 'object' && 'wishId' in value && 'token' in value && 'guestName' in value
      && typeof value.wishId === 'string' && typeof value.token === 'string' && typeof value.guestName === 'string') {
      return { wishId: value.wishId, token: value.token, guestName: value.guestName };
    }
  } catch { /* ignore malformed storage */ }
  return null;
}

// The name a guest typed when confirming attendance, so the signature sheet can prefill it.
const nameKey = (invitationId: string) => `net-duyen:guest-name:${invitationId}`;

export function rememberGuestName(invitationId: string, guestName: string) {
  try { window.localStorage.setItem(nameKey(invitationId), guestName); } catch { /* private mode: guest types it again */ }
  window.dispatchEvent(new Event(EVENT));
}

export function useGuestName(invitationId: string) {
  return useSyncExternalStore(subscribe, () => {
    try { return window.localStorage.getItem(nameKey(invitationId)) ?? ''; } catch { return ''; }
  }, () => '');
}

export function useMyWish(invitationId: string) {
  const raw = useSyncExternalStore(subscribe, () => {
    try { return window.localStorage.getItem(storageKey(invitationId)); } catch { return null; }
  }, () => null);
  return useMemo(() => parse(raw), [raw]);
}
