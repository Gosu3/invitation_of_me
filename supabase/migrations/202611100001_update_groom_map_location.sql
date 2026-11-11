-- Groom family: the reception moves to Nhà Văn Hóa An Tử 1; update the displayed venue, map and directions together.
update public.wedding_events
set venue = 'Nhà Văn Hóa An Tử 1',
    map_query = 'Nhà Văn Hóa An Tử 1, Xã Tiên Lãng, Thành phố Hải Phòng',
    map_url = 'https://maps.app.goo.gl/oyUHh9DWvBjTSCeZ9'
where title = 'Tiệc cưới'
  and invitation_id in (
    select id
    from public.wedding_invitations
    where slug = 'tho-va-tham'
  );
