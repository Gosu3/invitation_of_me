-- Update the ceremony location shown on the bride-family invitation.
update public.wedding_events
set address = 'Cạnh Trường Mầm Non Ánh Dương, Thôn Đông Kết, Xã Khoái Châu, Tỉnh Hưng Yên',
    map_url = 'https://maps.app.goo.gl/c8mfHc1CE7SACuyr5'
where title = 'Lễ thành hôn'
  and invitation_id in (
    select id
    from public.wedding_invitations
    where slug = 'tho-va-tham-nha-gai'
  );
