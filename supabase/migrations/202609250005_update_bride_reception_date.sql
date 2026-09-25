-- Set the bride-family reception date to Saturday, 28 November 2026.
update public.wedding_events
set date_time = '2026-11-28T16:00:00+07:00',
    lunar_date = 'Tức ngày 20 tháng 10 năm Bính Ngọ'
where title = 'Tiệc cưới'
  and invitation_id in (
    select id
    from public.wedding_invitations
    where slug = 'tho-va-tham-nha-gai'
  );
