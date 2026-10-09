-- The template used to hardcode the invitation wording, family ranks and ceremony venue, so editing them in the
-- admin had no effect. The template now reads these fields; store exactly what both Thọ & Thắm cards show today.

alter table public.wedding_invitations
  add column if not exists partner_one_role text,
  add column if not exists partner_two_role text;

update public.wedding_invitations
set partner_one_role = 'Út nam',
    partner_two_role = 'Trưởng nữ',
    headline = 'Trân trọng kính mời',
    message = 'Tới dự lễ thành hôn chung vui cùng gia đình chúng tôi',
    dress_code = 'Bạn hãy cứ diện bộ đồ cảm thấy đẹp và tự tin nhất ♥',
    closing_message = 'Sự hiện diện của bạn là món quà quý giá nhất đối với chúng mình ♡'
where slug in ('tho-va-tham', 'tham-va-tho');

-- Ceremony card reads "LỄ THÀNH HÔN ĐƯỢC CỬ HÀNH TẠI / TƯ GIA".
update public.wedding_events
set venue = 'Tư gia'
where title = 'Lễ thành hôn'
  and invitation_id in (select id from public.wedding_invitations where slug in ('tho-va-tham', 'tham-va-tho'));
