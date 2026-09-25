-- Give the bride-family invitation a distinct public name and URL.
update public.wedding_invitations
set slug = 'tham-va-tho',
    admin_title = 'Văn Thọ & Hồng Thắm (Thiệp Nhà Gái)'
where slug = 'tho-va-tham-nha-gai';
