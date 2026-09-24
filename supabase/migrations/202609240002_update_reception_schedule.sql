-- Update only the groom-family invitation. The bride-family copy remains independent.
update public.wedding_events
set date_time = '2026-11-29T09:00:00+07:00',
    arrival_time = '08:30'
where title = 'Tiệc cưới'
  and invitation_id in (
    select id from public.wedding_invitations
    where slug = 'tho-va-tham'
  );

delete from public.wedding_timeline_items
where invitation_id in (
  select id from public.wedding_invitations
  where slug = 'tho-va-tham'
);

insert into public.wedding_timeline_items (invitation_id, time, title, sort_order)
select invitation.id, schedule.time, schedule.title, schedule.sort_order
from public.wedding_invitations invitation
cross join (values
  ('08:30', 'Đón khách', 0),
  ('09:00', 'Khai tiệc', 1),
  ('09:15', 'Rót rượu, cắt bánh', 2),
  ('09:20', 'Phục vụ món chính', 3),
  ('11:30', 'Kết thúc tiệc', 4)
) as schedule(time, title, sort_order)
where invitation.slug = 'tho-va-tham';
