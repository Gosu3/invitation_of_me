-- Thọ & Thắm share one signature board, so both invitations must block the same areas of the photo.
-- The admin now saves avoid-zones to both; align the existing data on the groom-side (most recently edited) zones.
update public.wedding_invitations
set signature_avoid_zones = (select signature_avoid_zones from public.wedding_invitations where slug = 'tho-va-tham')
where slug = 'tham-va-tho'
  and exists (select 1 from public.wedding_invitations where slug = 'tho-va-tham');
