import { demoInvitations } from './demo';
import { isDatabaseConfigured, publicDb, serviceDb } from './supabase';
import type { GiftAccount, Invitation, WeddingEvent, WeddingMedia, TimelineItem, Wish } from './types';

type Row = Record<string, unknown>;
const str = (value: unknown) => typeof value === 'string' ? value : '';
const opt = (value: unknown) => typeof value === 'string' && value ? value : undefined;
const bool = (value: unknown) => value === true;
const arr = (value: unknown) => Array.isArray(value) ? value as Row[] : [];

export function mapInvitation(row: Row, relations: {
  events?: Row[]; timeline?: Row[]; media?: Row[]; gifts?: Row[]; wishes?: Row[];
} = {}): Invitation {
  const events: WeddingEvent[] = (relations.events || []).map((e) => ({
    id: str(e.id), title: str(e.title), dateTime: str(e.date_time),
    arrivalTime: opt(e.arrival_time), lunarDate: opt(e.lunar_date),
    venue: str(e.venue), address: str(e.address), mapUrl: opt(e.map_url), sortOrder: Number(e.sort_order || 0),
  })).sort((a, b) => a.sortOrder - b.sortOrder);
  const timeline: TimelineItem[] = (relations.timeline || []).map((t) => ({
    id: str(t.id), time: str(t.time), title: str(t.title), description: opt(t.description), sortOrder: Number(t.sort_order || 0),
  })).sort((a, b) => a.sortOrder - b.sortOrder);
  const media: WeddingMedia[] = (relations.media || []).map((m) => ({
    id: str(m.id), url: `/api/media/${str(m.id)}`, alt: str(m.alt_text), sortOrder: Number(m.sort_order || 0),
  })).sort((a, b) => a.sortOrder - b.sortOrder);
  const gifts: GiftAccount[] = (relations.gifts || []).map((g) => ({
    id: str(g.id), recipient: str(g.recipient), bankName: str(g.bank_name),
    accountNumber: str(g.account_number), accountHolder: str(g.account_holder),
    qrUrl: opt(g.qr_media_id) ? `/api/media/${str(g.qr_media_id)}` : undefined,
    sortOrder: Number(g.sort_order || 0),
  })).sort((a, b) => a.sortOrder - b.sortOrder);
  const wishes: Wish[] = (relations.wishes || []).map((w) => ({
    id: str(w.id), guestName: str(w.guest_name), message: str(w.message), createdAt: str(w.created_at),
  }));
  return {
    id: str(row.id), slug: str(row.slug), status: str(row.status) as Invitation['status'],
    partnerOne: str(row.partner_one), partnerTwo: str(row.partner_two),
    partnerOneFullName: opt(row.partner_one_full_name), partnerTwoFullName: opt(row.partner_two_full_name),
    partnerOneParents: opt(row.partner_one_parents), partnerTwoParents: opt(row.partner_two_parents),
    partnerOneAddress: opt(row.partner_one_address), partnerTwoAddress: opt(row.partner_two_address),
    headline: str(row.headline), message: str(row.message), story: opt(row.story),
    coverImage: opt(row.cover_media_id) ? `/api/media/${str(row.cover_media_id)}` : undefined,
    coverAlt: opt(row.cover_alt), dressCode: opt(row.dress_code),
    closingMessage: str(row.closing_message), rsvpEnabled: bool(row.rsvp_enabled),
    rsvpDeadline: opt(row.rsvp_deadline), wishesEnabled: bool(row.wishes_enabled),
    giftsEnabled: bool(row.gifts_enabled), events, timeline, media, gifts, wishes,
    createdAt: opt(row.created_at), updatedAt: opt(row.updated_at),
  };
}

export async function getInvitation(slug: string, includeDraft = false): Promise<Invitation | null> {
  if (!isDatabaseConfigured()) {
    return demoInvitations.find((item) => item.slug === slug) || null;
  }
  const db = includeDraft ? serviceDb() : publicDb();
  if (!db) return null;
  let query = db.from('wedding_invitations').select('*').eq('slug', slug);
  if (!includeDraft) query = query.eq('status', 'published');
  const { data: invitation, error } = await query.maybeSingle();
  if (error || !invitation) return null;
  const id = invitation.id;
  const [events, timeline, media, gifts, wishes] = await Promise.all([
    db.from('wedding_events').select('*').eq('invitation_id', id),
    db.from('wedding_timeline_items').select('*').eq('invitation_id', id),
    db.from('wedding_media').select('*').eq('invitation_id', id).eq('status', 'ready'),
    db.from('wedding_gift_accounts').select('*').eq('invitation_id', id),
    db.from('wedding_wishes').select('*').eq('invitation_id', id).eq('status', 'approved').order('created_at', { ascending: false }).limit(20),
  ]);
  return mapInvitation(invitation, {
    events: arr(events.data), timeline: arr(timeline.data), media: arr(media.data),
    gifts: arr(gifts.data), wishes: arr(wishes.data),
  });
}

export async function listInvitations(): Promise<Invitation[]> {
  if (!isDatabaseConfigured()) return demoInvitations;
  const db = publicDb();
  if (!db) return [];
  const { data } = await db.from('wedding_invitations').select('*').eq('status', 'published').order('created_at', { ascending: false });
  return (data || []).map((row) => mapInvitation(row));
}
