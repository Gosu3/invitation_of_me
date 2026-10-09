import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAdmin } from '@/lib/supabase';
import { mapInvitation } from '@/lib/invitations';
import { describeInvitationIssues, eventSchema, giftSchema, invitationSchema, timelineSchema } from '@/lib/validation';
import { sharedWishSlugs } from '@/lib/wedding-wish-groups';

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: 'Bạn cần đăng nhập quản trị.' }, { status: 401 });
  const { id } = await params;
  const db = admin.service;
  const { data: row } = await db.from('wedding_invitations').select('*').eq('id', id).maybeSingle();
  if (!row) return NextResponse.json({ error: 'Không tìm thấy thiệp.' }, { status: 404 });
  const [events, timeline, media, gifts, wishes] = await Promise.all([
    db.from('wedding_events').select('*').eq('invitation_id', id).order('sort_order'),
    db.from('wedding_timeline_items').select('*').eq('invitation_id', id).order('sort_order'),
    db.from('wedding_media').select('*').eq('invitation_id', id).eq('status', 'ready').order('sort_order'),
    db.from('wedding_gift_accounts').select('*').eq('invitation_id', id).order('sort_order'),
    db.from('wedding_wishes').select('*').eq('invitation_id', id).order('created_at', { ascending: false }),
  ]);
  return NextResponse.json({
    invitation: mapInvitation(row, { events: events.data || [], timeline: timeline.data || [], media: media.data || [], gifts: gifts.data || [], wishes: (wishes.data || []).filter((w) => w.status === 'approved') }),
    coverMediaId: row.cover_media_id,
    // False until migration 202610070001 is applied; the editor then hides the signature settings.
    signatureColumns: 'signatures_enabled' in row,
    // False until migration 202610090001 is applied; the editor then hides the QR toggle.
    giftQrColumn: 'gift_qr_hidden' in row,
    // False until migration 202610090002 is applied; the editor then hides the family-rank fields.
    roleColumns: 'partner_one_role' in row,
    giftQrMediaIds: (gifts.data || []).map((g) => ({ id: g.id, qrMediaId: g.qr_media_id })),
    allWishes: wishes.data || [],
  });
}

// Invitation fields the editor can change one at a time, mapped to their wedding_invitations columns.
const columns = {
  slug: 'slug', status: 'status', adminTitle: 'admin_title', partnerOne: 'partner_one', partnerTwo: 'partner_two',
  partnerOneFullName: 'partner_one_full_name', partnerTwoFullName: 'partner_two_full_name',
  partnerOneRole: 'partner_one_role', partnerTwoRole: 'partner_two_role',
  partnerOneParents: 'partner_one_parents', partnerTwoParents: 'partner_two_parents',
  partnerOneAddress: 'partner_one_address', partnerTwoAddress: 'partner_two_address',
  headline: 'headline', message: 'message', story: 'story', coverMediaId: 'cover_media_id', coverAlt: 'cover_alt',
  dressCode: 'dress_code', closingMessage: 'closing_message', rsvpEnabled: 'rsvp_enabled', rsvpDeadline: 'rsvp_deadline',
  wishesEnabled: 'wishes_enabled', giftsEnabled: 'gifts_enabled', giftQrHidden: 'gift_qr_hidden',
  signaturesEnabled: 'signatures_enabled', signatureImage: 'signature_image', signatureAvoidZones: 'signature_avoid_zones',
} as const;
const fieldsSchema = invitationSchema.omit({ id: true, events: true, timeline: true, gifts: true }).partial().strict();

type Row = Record<string, unknown>;
type Collection = { table: string; schema: z.ZodType; toRow: (item: Row) => Row };
// Lists are saved row by row: unchanged rows are left alone, so one old row never blocks editing another.
const collections: Record<'events' | 'timeline' | 'gifts', Collection> = {
  events: {
    table: 'wedding_events', schema: eventSchema,
    toRow: (i) => ({ title: i.title, date_time: i.dateTime, arrival_time: i.arrivalTime || null, lunar_date: i.lunarDate || null, venue: i.venue ?? '', address: i.address, map_url: i.mapUrl || null, map_query: i.mapQuery || null, sort_order: i.sortOrder }),
  },
  timeline: {
    table: 'wedding_timeline_items', schema: timelineSchema,
    toRow: (i) => ({ time: i.time, title: i.title, description: i.description || null, sort_order: i.sortOrder }),
  },
  gifts: {
    table: 'wedding_gift_accounts', schema: giftSchema,
    toRow: (i) => ({ recipient: i.recipient, bank_name: i.bankName, account_number: i.accountNumber, account_holder: i.accountHolder, qr_media_id: i.qrMediaId || null, sort_order: i.sortOrder }),
  },
};
type CollectionKey = keyof typeof collections;

const norm = (value: unknown) => value === '' || value === undefined ? null : value;
const sameRow = (next: Row, current: Row) => Object.entries(next).every(([column, value]) =>
  column === 'date_time' && value && current[column] ? Date.parse(String(value)) === Date.parse(String(current[column])) : norm(value) === norm(current[column]));

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: 'Bạn cần đăng nhập quản trị.' }, { status: 401 });
  const { id } = await params;
  const db = admin.service;
  let body: Row;
  try { body = await request.json(); } catch { return NextResponse.json({ error: 'Dữ liệu không hợp lệ.' }, { status: 400 }); }

  const parsedFields = fieldsSchema.safeParse(body.fields ?? {});
  if (!parsedFields.success) return NextResponse.json({ error: `Vui lòng kiểm tra: ${describeInvitationIssues(parsedFields.error.issues)}.` }, { status: 400 });

  // Work out which list rows were added, edited or removed; only those are validated and written.
  const plans: { table: string; inserts: Row[]; updates: { id: string; row: Row }[]; deletes: string[] }[] = [];
  const issues: { path: PropertyKey[] }[] = [];
  for (const key of Object.keys(collections) as CollectionKey[]) {
    const items = body[key];
    if (items === undefined) continue;
    if (!Array.isArray(items) || items.length > 30) return NextResponse.json({ error: 'Dữ liệu không hợp lệ.' }, { status: 400 });
    const { table, schema, toRow } = collections[key];
    const { data: existing, error } = await db.from(table).select('*').eq('invitation_id', id);
    if (error) return NextResponse.json({ error: 'Không thể tải dữ liệu hiện tại của thiệp.' }, { status: 500 });
    const byId = new Map((existing as Row[]).map((row) => [String(row.id), row]));
    const plan = { table, inserts: [] as Row[], updates: [] as { id: string; row: Row }[], deletes: [] as string[] };
    const kept = new Set<string>();
    (items as Row[]).forEach((item, index) => {
      const current = typeof item?.id === 'string' ? byId.get(item.id) : undefined;
      if (current) kept.add(String(current.id));
      if (current && sameRow(toRow(item), current)) return;
      const parsed = schema.safeParse(item);
      if (!parsed.success) { issues.push(...parsed.error.issues.map((issue) => ({ path: [key, index, ...issue.path] }))); return; }
      const row = toRow(parsed.data as Row);
      if (!current) plan.inserts.push({ ...row, invitation_id: id });
      else if (!sameRow(row, current)) plan.updates.push({ id: String(current.id), row });
    });
    plan.deletes = [...byId.keys()].filter((rowId) => !kept.has(rowId));
    plans.push(plan);
  }
  if (issues.length) return NextResponse.json({ error: `Vui lòng kiểm tra: ${describeInvitationIssues(issues)}.` }, { status: 400 });

  const fields = parsedFields.data as Row;
  const update: Row = {};
  for (const [field, value] of Object.entries(fields)) update[columns[field as keyof typeof columns]] = value === '' ? null : value;
  if (fields.status === 'published') {
    const { data: current } = await db.from('wedding_invitations').select('published_at').eq('id', id).maybeSingle();
    if (!current?.published_at) update.published_at = new Date().toISOString();
  }
  if (Object.keys(update).length) {
    const { data: saved, error } = await db.from('wedding_invitations').update(update).eq('id', id).select('id');
    if (error) return NextResponse.json({ error: error.code === '23505' ? 'Đường dẫn thiệp đã tồn tại.' : 'Không thể lưu thiệp.', detail: error.message }, { status: error.code === '23505' ? 409 : 500 });
    if (!saved?.length) return NextResponse.json({ error: 'Không tìm thấy thiệp.' }, { status: 404 });
  }
  // Thọ & Thắm share one signature board, so the no-signing zones must stay identical on both invitations.
  if (fields.signatureAvoidZones !== undefined) {
    const { data: current } = await db.from('wedding_invitations').select('slug').eq('id', id).maybeSingle();
    const partnerSlugs = sharedWishSlugs(String(current?.slug ?? '')).filter((slug) => slug !== current?.slug);
    if (partnerSlugs.length) {
      const { error } = await db.from('wedding_invitations').update({ signature_avoid_zones: fields.signatureAvoidZones }).in('slug', partnerSlugs);
      if (error) return NextResponse.json({ error: 'Đã lưu thiệp này nhưng chưa đồng bộ được vùng tránh sang thiệp còn lại.', detail: error.message }, { status: 500 });
    }
  }

  // Inserts and updates before deletes: a failure part-way never loses rows that were meant to stay.
  let changedRows = 0;
  for (const { table, inserts, updates, deletes } of plans) {
    if (inserts.length) {
      const { error } = await db.from(table).insert(inserts);
      if (error) return NextResponse.json({ error: 'Không thể thêm dòng mới.', detail: error.message }, { status: 500 });
    }
    for (const { id: rowId, row } of updates) {
      const { error } = await db.from(table).update(row).eq('id', rowId).eq('invitation_id', id);
      if (error) return NextResponse.json({ error: 'Không thể cập nhật thay đổi.', detail: error.message }, { status: 500 });
    }
    if (deletes.length) {
      const { error } = await db.from(table).delete().in('id', deletes).eq('invitation_id', id);
      if (error) return NextResponse.json({ error: 'Không thể xóa dòng đã bỏ.', detail: error.message }, { status: 500 });
    }
    changedRows += inserts.length + updates.length + deletes.length;
  }
  return NextResponse.json({ id, changed: Object.keys(fields).length + changedRows });
}
