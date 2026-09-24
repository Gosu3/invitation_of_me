export type InvitationStatus = 'draft' | 'published' | 'archived';

export type WeddingEvent = {
  id: string;
  title: string;
  dateTime: string;
  arrivalTime?: string;
  lunarDate?: string;
  venue: string;
  address: string;
  mapUrl?: string;
  sortOrder: number;
};

export type TimelineItem = {
  id: string;
  time: string;
  title: string;
  description?: string;
  sortOrder: number;
};

export type WeddingMedia = {
  id: string;
  url: string;
  alt: string;
  sortOrder: number;
  position?: { x: number; y: number };
};

export type GiftAccount = {
  id: string;
  recipient: string;
  bankName: string;
  accountNumber: string;
  accountHolder: string;
  qrUrl?: string;
  bankBin?: string;
  bankCode?: string;
  bankLogo?: string;
  role?: 'groom' | 'bride';
  sortOrder: number;
};

export type InvitationFeatures = {
  showMap: boolean;
  showBank: boolean;
  showQRInline: boolean;
  showRsvp: boolean;
  showGuestbook: boolean;
  showTimeline: boolean;
  showThankYou: boolean;
  showFamilyInfo: boolean;
};

export type WeddingMusic = {
  enabled: boolean;
  title: string;
  src?: string;
  volume: number;
};

export type Wish = {
  id: string;
  guestName: string;
  message: string;
  createdAt: string;
};

export type Invitation = {
  id: string;
  slug: string;
  status: InvitationStatus;
  adminTitle?: string;
  partnerOne: string;
  partnerTwo: string;
  partnerOneFullName?: string;
  partnerTwoFullName?: string;
  partnerOneParents?: string;
  partnerTwoParents?: string;
  partnerOneAddress?: string;
  partnerTwoAddress?: string;
  headline: string;
  message: string;
  story?: string;
  coverImage?: string;
  coverAlt?: string;
  dressCode?: string;
  closingMessage: string;
  rsvpEnabled: boolean;
  rsvpDeadline?: string;
  wishesEnabled: boolean;
  giftsEnabled: boolean;
  events: WeddingEvent[];
  timeline: TimelineItem[];
  media: WeddingMedia[];
  gifts: GiftAccount[];
  wishes: Wish[];
  timezone?: string;
  themeId?: 'boho-floral-green';
  music?: WeddingMusic;
  features?: Partial<InvitationFeatures>;
  createdAt?: string;
  updatedAt?: string;
};
