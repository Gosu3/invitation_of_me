import type { serviceDb } from './supabase';
import { sharedWishSlugs } from './wedding-wish-groups';

// Links a guest's wish and signature by name when the browser no longer has the wish token (left the invitation,
// other device, in-app browser). Names must match exactly — same case and spacing as typed (the API only trims
// the ends). A wish or signature that is already linked belongs to a guest who did both, so it is never
// re-linked: a second guest with the same name stays separate. Among several open matches the same device
// (submitter hash) wins, else the newest.

type Db = NonNullable<ReturnType<typeof serviceDb>>;

const exact = (name: string) => name.normalize('NFC');

function pick<T extends { id: string; guest_name: string; submitter_hash: string | null }>(rows: T[], guestName: string, deviceHash: string) {
  const open = rows.filter((row) => exact(row.guest_name) === exact(guestName));
  return (open.find((row) => row.submitter_hash === deviceHash) ?? open[0])?.id ?? null;
}

/** An approved, not yet signed wish with this exact name, for a new signature. */
export async function openWishForName(db: Db, invitationIds: string[], guestName: string, deviceHash: string) {
  const { data: wishes } = await db.from('wedding_wishes')
    .select('id,guest_name,submitter_hash')
    .in('invitation_id', invitationIds).eq('status', 'approved').eq('guest_name', guestName)
    .order('created_at', { ascending: false }).limit(50);
  if (!wishes?.length) return null;
  const { data: signed } = await db.from('wedding_signatures').select('wish_id').in('wish_id', wishes.map((wish) => wish.id));
  const taken = new Set((signed || []).map((sig) => sig.wish_id));
  return pick(wishes.filter((wish) => !taken.has(wish.id)), guestName, deviceHash);
}

/** A signature with this exact name and no wish yet, for a new wish. */
export async function openSignatureForName(db: Db, invitationIds: string[], guestName: string, deviceHash: string) {
  const { data: signatures } = await db.from('wedding_signatures')
    .select('id,guest_name,submitter_hash')
    .in('invitation_id', invitationIds).is('wish_id', null).eq('guest_name', guestName)
    .order('created_at', { ascending: false }).limit(50);
  return pick(signatures || [], guestName, deviceHash);
}

/** After a new wish: attach it to a signature the guest left earlier under the same name, and refresh the boards.
 *  Best effort — the wish is already saved, so failures here are ignored. */
export async function linkEarlierSignature(db: Db, slug: string, guestName: string, wishId: string, deviceHash: string) {
  try {
    const { data: boards } = await db.from('wedding_invitations')
      .select('id').in('slug', sharedWishSlugs(slug)).eq('status', 'published').eq('signatures_enabled', true);
    const boardIds = (boards || []).map((board) => board.id);
    if (!boardIds.length) return;
    const signatureId = await openSignatureForName(db, boardIds, guestName, deviceHash);
    if (!signatureId) return;
    const { data: linked } = await db.from('wedding_signatures').update({ wish_id: wishId })
      .eq('id', signatureId).is('wish_id', null).select('id');
    if (!linked?.length) return;
    await Promise.all(boardIds.map(async (id) => {
      const channel = db.channel(`wedding-signatures:${id}`);
      try { await channel.httpSend('updated', {}, { timeout: 2000 }); }
      catch { /* Polling picks up missed broadcasts. */ }
      finally { await db.removeChannel(channel); }
    }));
  } catch { /* Linking is optional. */ }
}
