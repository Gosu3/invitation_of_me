async function send<T>(url: string, body: unknown): Promise<T> {
  const response = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  const result = await response.json();
  if (!response.ok) throw new Error(result.error || 'Không thể gửi thông tin.');
  return result;
}

export type PublicWish = { id: string; guestName: string; message: string; createdAt: string };

async function listWishes(invitationId: string): Promise<PublicWish[]> {
  const response = await fetch(`/api/wishes?invitationId=${encodeURIComponent(invitationId)}`, { cache: 'no-store' });
  const result = await response.json();
  if (!response.ok) throw new Error(result.error || 'Không thể tải lời chúc.');
  return Array.isArray(result.wishes) ? result.wishes : [];
}

export const weddingSubmissions = {
  rsvp: (body: { invitationId: string; guestName: string; attendance: string; guestCount: number; message: string; website: string }) => send<{ ok: true }>('/api/rsvp', body),
  wish: (body: { invitationId: string; guestName: string; message: string; website: string }) => send<{ ok: true; wish: PublicWish }>('/api/wishes', body),
  listWishes,
};
