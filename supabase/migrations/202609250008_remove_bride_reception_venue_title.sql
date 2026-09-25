-- Show only the full address below the bride-family reception heading.
update public.wedding_events
set venue = ''
where title = 'Tiệc cưới'
  and invitation_id in (
    select id
    from public.wedding_invitations
    where slug = 'tham-va-tho'
  );
