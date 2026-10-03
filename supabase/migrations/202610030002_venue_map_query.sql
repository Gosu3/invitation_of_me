-- Separate what the map searches for from the address text shown to guests, so the wording can change without
-- moving the embedded Google map.
alter table public.wedding_events add column if not exists map_query text;


-- Called only from a server route after the signed-in user is checked against wedding_admins.
-- A Postgres function keeps parent and child edits in one transaction.
create or replace function public.wedding_save_invitation(p_data jsonb, p_owner uuid)
returns uuid language plpgsql set search_path = public
as $$
declare v_id uuid; v_item jsonb; v_status text;
begin
  v_status := p_data->>'status';
  if p_data ? 'id' and nullif(p_data->>'id','') is not null then
    v_id := (p_data->>'id')::uuid;
    update public.wedding_invitations set
      slug = p_data->>'slug', status = v_status,
      partner_one = p_data->>'partnerOne', partner_two = p_data->>'partnerTwo',
      partner_one_full_name = nullif(p_data->>'partnerOneFullName',''), partner_two_full_name = nullif(p_data->>'partnerTwoFullName',''),
      partner_one_parents = nullif(p_data->>'partnerOneParents',''), partner_two_parents = nullif(p_data->>'partnerTwoParents',''),
      partner_one_address = nullif(p_data->>'partnerOneAddress',''), partner_two_address = nullif(p_data->>'partnerTwoAddress',''),
      headline = p_data->>'headline', message = p_data->>'message', story = nullif(p_data->>'story',''),
      cover_media_id = nullif(p_data->>'coverMediaId','')::uuid, cover_alt = nullif(p_data->>'coverAlt',''),
      dress_code = nullif(p_data->>'dressCode',''), closing_message = p_data->>'closingMessage',
      rsvp_enabled = (p_data->>'rsvpEnabled')::boolean,
      rsvp_deadline = nullif(p_data->>'rsvpDeadline','')::timestamptz,
      wishes_enabled = (p_data->>'wishesEnabled')::boolean,
      gifts_enabled = (p_data->>'giftsEnabled')::boolean,
      published_at = case when v_status = 'published' then coalesce(published_at, now()) else published_at end
    where id = v_id;
    if not found then raise exception 'Invitation not found'; end if;
  else
    insert into public.wedding_invitations (
      owner_id, slug, status, partner_one, partner_two, partner_one_full_name, partner_two_full_name,
      partner_one_parents, partner_two_parents, partner_one_address, partner_two_address,
      headline, message, story, cover_media_id, cover_alt, dress_code, closing_message,
      rsvp_enabled, rsvp_deadline, wishes_enabled, gifts_enabled, published_at
    ) values (
      p_owner, p_data->>'slug', v_status, p_data->>'partnerOne', p_data->>'partnerTwo',
      nullif(p_data->>'partnerOneFullName',''), nullif(p_data->>'partnerTwoFullName',''),
      nullif(p_data->>'partnerOneParents',''), nullif(p_data->>'partnerTwoParents',''),
      nullif(p_data->>'partnerOneAddress',''), nullif(p_data->>'partnerTwoAddress',''),
      p_data->>'headline', p_data->>'message', nullif(p_data->>'story',''),
      nullif(p_data->>'coverMediaId','')::uuid, nullif(p_data->>'coverAlt',''), nullif(p_data->>'dressCode',''),
      p_data->>'closingMessage', (p_data->>'rsvpEnabled')::boolean,
      nullif(p_data->>'rsvpDeadline','')::timestamptz,
      (p_data->>'wishesEnabled')::boolean, (p_data->>'giftsEnabled')::boolean,
      case when v_status = 'published' then now() else null end
    ) returning id into v_id;
  end if;

  delete from public.wedding_events where invitation_id = v_id;
  for v_item in select value from jsonb_array_elements(coalesce(p_data->'events','[]'::jsonb)) loop
    insert into public.wedding_events(invitation_id,title,date_time,arrival_time,lunar_date,venue,address,map_url,map_query,sort_order)
    values(v_id,v_item->>'title',(v_item->>'dateTime')::timestamptz,nullif(v_item->>'arrivalTime',''),nullif(v_item->>'lunarDate',''),v_item->>'venue',v_item->>'address',nullif(v_item->>'mapUrl',''),nullif(v_item->>'mapQuery',''),(v_item->>'sortOrder')::integer);
  end loop;
  delete from public.wedding_timeline_items where invitation_id = v_id;
  for v_item in select value from jsonb_array_elements(coalesce(p_data->'timeline','[]'::jsonb)) loop
    insert into public.wedding_timeline_items(invitation_id,time,title,description,sort_order)
    values(v_id,v_item->>'time',v_item->>'title',nullif(v_item->>'description',''),(v_item->>'sortOrder')::integer);
  end loop;
  delete from public.wedding_gift_accounts where invitation_id = v_id;
  for v_item in select value from jsonb_array_elements(coalesce(p_data->'gifts','[]'::jsonb)) loop
    insert into public.wedding_gift_accounts(invitation_id,recipient,bank_name,account_number,account_holder,qr_media_id,sort_order)
    values(v_id,v_item->>'recipient',v_item->>'bankName',v_item->>'accountNumber',v_item->>'accountHolder',nullif(v_item->>'qrMediaId','')::uuid,(v_item->>'sortOrder')::integer);
  end loop;
  return v_id;
end;
$$;
revoke all on function public.wedding_save_invitation(jsonb,uuid) from public, anon, authenticated;
grant execute on function public.wedding_save_invitation(jsonb,uuid) to service_role;

-- Bride family: keep the map on the existing spot, show the new wording.
update public.wedding_events
set map_query = 'Cạnh Trường Mầm Non Ánh Dương, Thôn Đông Kết, Xã Khoái Châu, Tỉnh Hưng Yên',
    address = 'Tư gia nhà gái, thôn Đông Kết, xã Khoái Châu, tỉnh Hưng Yên'
where title = 'Tiệc cưới'
  and invitation_id in (
    select id
    from public.wedding_invitations
    where slug = 'tham-va-tho'
  );
