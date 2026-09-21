async function send<T>(url: string, body: T) {
  const response = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  const result = await response.json();
  if (!response.ok) throw new Error(result.error || 'Không thể gửi thông tin.');
  return result;
}

export const weddingSubmissions = {
  rsvp: (body: { invitationId: string; guestName: string; attendance: string; guestCount: number; message: string; website: string }) => send('/api/rsvp', body),
  wish: (body: { invitationId: string; guestName: string; message: string; website: string }) => send('/api/wishes', body),
};
