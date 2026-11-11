-- Groom family: use the full Google Maps place link for Nhà Văn Hóa An Tử 1 so the embedded map pins that exact place
-- (a single red pin with its name) on desktop and mobile; the directions button opens the same place.
update public.wedding_events
set map_url = 'https://www.google.com/maps/place/Nh%C3%A0+V%C4%83n+H%C3%B3a+An+T%E1%BB%AD+1/@20.7361632,106.5271624,17z/data=!4m6!3m5!1s0x31358b005ce28013:0x251fdfafc940617c!8m2!3d20.7361632!4d106.5271624'
where title = 'Tiệc cưới'
  and invitation_id in (
    select id
    from public.wedding_invitations
    where slug = 'tho-va-tham'
  );
