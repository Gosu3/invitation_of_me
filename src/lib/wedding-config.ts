import type { Invitation, InvitationFeatures, WeddingMedia } from './types';
import { bohoFloralGreen } from './wedding-theme';

const galleryPositions = [
  { x: .5, y: .36 }, { x: .5, y: .42 }, { x: .5, y: .5 },
  { x: .5, y: .44 }, { x: .5, y: .38 }, { x: .5, y: .46 },
];

export function createWeddingConfig(invitation: Invitation) {
  const ceremony = invitation.events.find((event) => /lễ|thành hôn/i.test(event.title)) ?? invitation.events[0];
  const reception = invitation.events.find((event) => /tiệc/i.test(event.title)) ?? invitation.events[0];
  const gallery: WeddingMedia[] = (invitation.media.length ? invitation.media : invitation.coverImage ? [{
    id: 'cover', url: invitation.coverImage, alt: invitation.coverAlt || `${invitation.partnerOne} & ${invitation.partnerTwo}`, sortOrder: 0,
  }] : []).map((photo, index) => ({ ...photo, position: photo.position ?? galleryPositions[index % galleryPositions.length] }));
  const features: InvitationFeatures = {
    showMap: Boolean(reception?.mapUrl),
    showBank: invitation.giftsEnabled,
    showQRInline: false,
    showRsvp: invitation.rsvpEnabled,
    showGuestbook: invitation.wishesEnabled,
    showTimeline: invitation.timeline.length > 0,
    showThankYou: true,
    showFamilyInfo: Boolean(invitation.partnerOneParents || invitation.partnerTwoParents || invitation.partnerOneFullName || invitation.partnerTwoFullName),
    ...invitation.features,
  };
  return {
    id: invitation.id,
    slug: invitation.slug,
    couple: {
      groom: invitation.partnerOne,
      bride: invitation.partnerTwo,
      groomFullName: invitation.partnerOneFullName || invitation.partnerOne,
      brideFullName: invitation.partnerTwoFullName || invitation.partnerTwo,
      names: `${invitation.partnerOne} & ${invitation.partnerTwo}`,
    },
    family: {
      groomParents: invitation.partnerOneParents,
      brideParents: invitation.partnerTwoParents,
      groomAddress: invitation.partnerOneAddress,
      brideAddress: invitation.partnerTwoAddress,
    },
    weddingDate: reception?.dateTime || ceremony?.dateTime || '',
    timezone: invitation.timezone || 'Asia/Ho_Chi_Minh',
    ceremony,
    reception,
    events: invitation.events,
    venue: reception ? { title: reception.venue, address: reception.address, mapUrl: reception.mapUrl } : undefined,
    gallery,
    timeline: invitation.timeline,
    bankAccounts: invitation.gifts,
    music: invitation.music ?? { enabled: true, title: 'Khúc nhạc ngày chung đôi', volume: .22 },
    theme: bohoFloralGreen,
    features,
    content: {
      headline: invitation.headline,
      message: invitation.message,
      story: invitation.story,
      coverImage: invitation.coverImage,
      coverAlt: invitation.coverAlt,
      dressCode: invitation.dressCode,
      closingMessage: invitation.closingMessage,
      rsvpDeadline: invitation.rsvpDeadline,
      wishes: invitation.wishes,
    },
  };
}

export type WeddingInvitationConfig = ReturnType<typeof createWeddingConfig>;
