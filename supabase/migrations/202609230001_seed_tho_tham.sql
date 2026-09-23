-- Bootstrap the published Tho & Tham invitation without overwriting existing data.
insert into public.wedding_invitations (
  id, slug, status, partner_one, partner_two,
  partner_one_full_name, partner_two_full_name,
  partner_one_parents, partner_two_parents,
  partner_one_address, partner_two_address,
  headline, message, story, cover_alt, dress_code, closing_message,
  rsvp_enabled, rsvp_deadline, wishes_enabled, gifts_enabled, published_at
)
values (
  '8a0f8b1e-67e8-4fa8-ae3e-291120260001',
  'tho-va-tham', 'published', 'Văn Thọ', 'Hồng Thắm',
  'Nguyễn Văn Thọ', 'Trương Thị Hồng Thắm',
  'Ông A · Bà B', 'Ông C · Bà D',
  'Ba Đình, Hà Nội', 'Cầu Giấy, Hà Nội',
  'Trân trọng kính mời',
  'Cùng gia đình, Văn Thọ và Hồng Thắm hân hạnh mời bạn đến chung vui trong ngày bắt đầu hành trình mới của chúng mình.',
  'Giữa rất nhiều cuộc gặp gỡ, chúng mình đã tìm thấy một người để cùng đi qua những ngày bình thường đẹp nhất.',
  'Văn Thọ và Hồng Thắm trong bộ ảnh cưới',
  'Trang phục lịch sự - Bạn hãy cứ diện bộ đồ cảm thấy đẹp và tự tin nhất ♥',
  'Sự hiện diện của bạn là món quà quý giá nhất đối với chúng mình.',
  true, '2026-11-23T23:59:00+07:00', true, true, now()
)
on conflict (slug) do nothing;

insert into public.wedding_events (
  id, invitation_id, title, date_time, arrival_time, lunar_date,
  venue, address, map_url, sort_order
)
select
  '8a0f8b1e-67e8-4fa8-ae3e-291120260101', i.id,
  'Lễ thành hôn', '2026-11-29T09:00:00+07:00', null,
  'Tức ngày 21 tháng 10 năm Bính Ngọ', 'Tư gia nhà gái',
  'Cầu Giấy, Hà Nội',
  'https://www.google.com/maps/search/?api=1&query=C%E1%BA%A7u+Gi%E1%BA%A5y+H%C3%A0+N%E1%BB%99i', 0
from public.wedding_invitations i
where i.slug = 'tho-va-tham'
  and not exists (
    select 1 from public.wedding_events e
    where e.invitation_id = i.id and e.title = 'Lễ thành hôn'
  );

insert into public.wedding_events (
  id, invitation_id, title, date_time, arrival_time, lunar_date,
  venue, address, map_url, sort_order
)
select
  '8a0f8b1e-67e8-4fa8-ae3e-291120260102', i.id,
  'Tiệc cưới', '2026-11-29T18:00:00+07:00', '17:30',
  'Tức ngày 21 tháng 10 năm Bính Ngọ', 'Nhà Văn Hóa Thôn An Tử 2',
  'Xã Tiên Lãng, Thành phố Hải Phòng',
  'https://www.google.com/maps/dir/?api=1&destination=Nh%C3%A0+V%C4%83n+H%C3%B3a+Th%C3%B4n+An+T%E1%BB%AD+2%2C+X%C3%A3+Ti%C3%AAn+L%C3%A3ng%2C+Th%C3%A0nh+ph%E1%BB%91+H%E1%BA%A3i+Ph%C3%B2ng', 1
from public.wedding_invitations i
where i.slug = 'tho-va-tham'
  and not exists (
    select 1 from public.wedding_events e
    where e.invitation_id = i.id and e.title = 'Tiệc cưới'
  );

insert into public.wedding_timeline_items (id, invitation_id, time, title, sort_order)
select v.id::uuid, i.id, v.time, v.title, v.sort_order
from public.wedding_invitations i
cross join (values
  ('8a0f8b1e-67e8-4fa8-ae3e-291120260201', '17:30', 'Đón khách', 0),
  ('8a0f8b1e-67e8-4fa8-ae3e-291120260202', '18:00', 'Khai tiệc', 1),
  ('8a0f8b1e-67e8-4fa8-ae3e-291120260203', '18:15', 'Rót rượu, cắt bánh', 2),
  ('8a0f8b1e-67e8-4fa8-ae3e-291120260204', '18:30', 'Phục vụ món chính', 3),
  ('8a0f8b1e-67e8-4fa8-ae3e-291120260205', '21:00', 'Kết thúc tiệc', 4)
) as v(id, time, title, sort_order)
where i.slug = 'tho-va-tham'
  and not exists (
    select 1 from public.wedding_timeline_items t
    where t.invitation_id = i.id and t.time = v.time and t.title = v.title
  );
