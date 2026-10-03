import type { Invitation } from './types';
import { siteUrl } from './utils';

// Link previews (Messenger, Zalo…): a 1200×630 photo with the couple centred, so square crops keep both of them.
// New file name instead of overwriting og-avatar.jpg: Messenger caches previews by image URL.
export function shareImage(invitation: Pick<Invitation, 'partnerOne' | 'partnerTwo'>) {
  return { url: `${siteUrl()}/photos/og-cover.jpg`, width: 1200, height: 630, alt: `Ảnh cưới ${invitation.partnerOne} & ${invitation.partnerTwo}` };
}

// Short enough (< 90 chars) to show in full under the preview image instead of being cut mid-sentence.
export function shareDescription(invitation: Pick<Invitation, 'partnerOne' | 'partnerTwo'>) {
  return `Trân trọng kính mời bạn đến chung vui cùng ${invitation.partnerOne} & ${invitation.partnerTwo} ♡`;
}
