-- Align the arrival time shown on the bride-family invitation with its itinerary.
update public.wedding_events
set arrival_time = '14:20'
where title = 'Tiệc cưới'
  and invitation_id in (
    select id
    from public.wedding_invitations
    where slug = 'tho-va-tham-nha-gai'
  );
