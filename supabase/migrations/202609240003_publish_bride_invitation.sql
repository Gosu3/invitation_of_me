-- Publish the independent bride-family invitation and set its admin display title.
update public.wedding_invitations
set status = 'published',
    admin_title = 'Hồng Thắm & Văn Thọ',
    published_at = coalesce(published_at, now())
where slug = 'tho-va-tham-nha-gai';
