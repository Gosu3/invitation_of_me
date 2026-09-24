import { z } from 'zod';

const safeText = (max: number) => z.string().trim().min(1).max(max);
const optionalText = (max: number) => z.string().trim().max(max).optional().nullable();
const optionalUrl = z.union([z.url().startsWith('https://'), z.literal('')]).optional().nullable();

export const rsvpSchema = z.object({
  invitationId: z.uuid(), guestName: safeText(100).min(2),
  attendance: z.enum(['yes', 'no']), guestCount: z.number().int().min(1).max(5),
  message: z.string().trim().max(500).optional().default(''), website: z.string().optional().default(''),
});

export const wishSchema = z.object({
  invitationId: z.uuid(), guestName: safeText(100).min(2),
  message: safeText(1000).min(3), website: z.string().optional().default(''),
});

export const guestLinkSchema = z.object({
  invitationId: z.uuid(),
  guestName: safeText(100),
});

const eventSchema = z.object({
  title: safeText(100), dateTime: z.iso.datetime({ offset: true }), arrivalTime: optionalText(30),
  lunarDate: optionalText(120), venue: safeText(200), address: safeText(400), mapUrl: optionalUrl,
  sortOrder: z.number().int().min(0).max(1000),
});
const timelineSchema = z.object({
  time: safeText(20), title: safeText(100), description: optionalText(300),
  sortOrder: z.number().int().min(0).max(1000),
});
const giftSchema = z.object({
  recipient: safeText(100), bankName: safeText(100), accountNumber: safeText(50),
  accountHolder: safeText(100), qrMediaId: z.uuid().optional().nullable(),
  sortOrder: z.number().int().min(0).max(1000),
});

export const invitationSchema = z.object({
  id: z.uuid().optional(), slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).max(100),
  status: z.enum(['draft', 'published', 'archived']),
  adminTitle: optionalText(150),
  partnerOne: safeText(100), partnerTwo: safeText(100),
  partnerOneFullName: optionalText(150), partnerTwoFullName: optionalText(150),
  partnerOneParents: optionalText(200), partnerTwoParents: optionalText(200),
  partnerOneAddress: optionalText(200), partnerTwoAddress: optionalText(200),
  headline: safeText(120), message: safeText(1200), story: optionalText(1200),
  coverMediaId: z.uuid().optional().nullable(), coverAlt: optionalText(200),
  dressCode: optionalText(300), closingMessage: safeText(500),
  rsvpEnabled: z.boolean(), rsvpDeadline: z.union([z.iso.datetime({ offset: true }), z.literal('')]).optional().nullable(),
  wishesEnabled: z.boolean(), giftsEnabled: z.boolean(),
  events: z.array(eventSchema).max(10), timeline: z.array(timelineSchema).max(30), gifts: z.array(giftSchema).max(4),
});
