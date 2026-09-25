-- The venue section is driven by the reception event on the bride-family invitation.
update public.wedding_events
set venue = 'Trường Mầm Non Ánh Dương',
    address = 'Cạnh Trường Mầm Non Ánh Dương, Thôn Đông Kết, Xã Khoái Châu, Tỉnh Hưng Yên',
    map_url = 'https://maps.app.goo.gl/c8mfHc1CE7SACuyr5'
where title = 'Tiệc cưới'
  and invitation_id in (
    select id
    from public.wedding_invitations
    where slug = 'tham-va-tho'
  );
