const thoThamWishSlugs = ['tho-va-tham', 'tho-va-tham-nha-gai'] as const;

export function sharedWishSlugs(slug: string) {
  return thoThamWishSlugs.includes(slug as (typeof thoThamWishSlugs)[number])
    ? [...thoThamWishSlugs]
    : [slug];
}

export function sharedWishRateLimitScope(slug: string, invitationId: string) {
  return sharedWishSlugs(slug).length > 1 ? 'tho-tham-shared-wishes' : invitationId;
}
