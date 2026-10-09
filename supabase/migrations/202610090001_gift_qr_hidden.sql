-- Hide the bank QR images inside the gift box while keeping the empty frames and couple artwork.
-- Groom-side invitation (tho-va-tham) no longer shows QR codes; the bride-side one is unchanged.

alter table public.wedding_invitations
  add column if not exists gift_qr_hidden boolean not null default false;

update public.wedding_invitations
set gift_qr_hidden = true
where slug = 'tho-va-tham';
