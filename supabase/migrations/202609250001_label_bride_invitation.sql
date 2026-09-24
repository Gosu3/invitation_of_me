-- Give the bride-family invitation a distinct label in the admin invitation picker.
update public.wedding_invitations
set admin_title = 'Hồng Thắm & Văn Thọ - Nhà Gái'
where slug = 'tho-va-tham-nha-gai';
