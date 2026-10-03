-- Shorten the 14:40 item on the bride-family invitation so it fits on one line.
update public.wedding_timeline_items
set title = 'Lễ ăn hỏi - dẫn cưới'
where time = '14:40'
  and invitation_id in (
    select id
    from public.wedding_invitations
    where slug = 'tham-va-tho'
  );
