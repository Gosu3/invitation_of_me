-- Set the reception time and itinerary for the bride-family invitation.
update public.wedding_events
set date_time = '2026-11-29T16:00:00+07:00',
    arrival_time = '14:15'
where title = 'Tiệc cưới'
  and invitation_id in (
    select id
    from public.wedding_invitations
    where slug = 'tho-va-tham-nha-gai'
  );

delete from public.wedding_timeline_items
where invitation_id in (
  select id
  from public.wedding_invitations
  where slug = 'tho-va-tham-nha-gai'
);

insert into public.wedding_timeline_items (invitation_id, time, title, sort_order)
select invitation.id, schedule.time, schedule.title, schedule.sort_order
from public.wedding_invitations invitation
cross join (values
  ('14:20', 'Đón khách', 0),
  ('14:40', 'Tiệc ngọt, lễ ăn hỏi, dẫn cưới', 1),
  ('16:00', 'Khai tiệc', 2),
  ('16:10', 'Phục vụ món chính', 3),
  ('22:00', 'Kết thúc tiệc', 4)
) as schedule(time, title, sort_order)
where invitation.slug = 'tho-va-tham-nha-gai';
