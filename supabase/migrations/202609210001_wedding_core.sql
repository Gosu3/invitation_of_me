-- Nét Duyên: additive wedding schema. Review the existing project before applying.
create table if not exists public.wedding_admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create or replace function public.wedding_is_admin()
returns boolean language sql stable security definer set search_path = public
as $$ select exists(select 1 from public.wedding_admins where user_id = (select auth.uid())); $$;

create or replace function public.wedding_touch_updated_at()
returns trigger language plpgsql set search_path = public
as $$ begin new.updated_at = now(); return new; end; $$;

create table if not exists public.wedding_invitations (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references auth.users(id) on delete set null,
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  status text not null default 'draft' check (status in ('draft','published','archived')),
  partner_one text not null,
  partner_two text not null,
  partner_one_full_name text,
  partner_two_full_name text,
  partner_one_parents text,
  partner_two_parents text,
  partner_one_address text,
  partner_two_address text,
  headline text not null default 'Trân trọng kính mời',
  message text not null default '',
  story text,
  cover_media_id uuid,
  cover_alt text,
  dress_code text,
  closing_message text not null default 'Sự hiện diện của quý khách là niềm vinh hạnh của gia đình chúng tôi.',
  rsvp_enabled boolean not null default true,
  rsvp_deadline timestamptz,
  wishes_enabled boolean not null default true,
  gifts_enabled boolean not null default false,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists wedding_invitations_status_created_idx on public.wedding_invitations(status, created_at desc);
drop trigger if exists wedding_invitations_touch on public.wedding_invitations;
create trigger wedding_invitations_touch before update on public.wedding_invitations for each row execute function public.wedding_touch_updated_at();

create table if not exists public.wedding_events (
  id uuid primary key default gen_random_uuid(),
  invitation_id uuid not null references public.wedding_invitations(id) on delete cascade,
  title text not null,
  date_time timestamptz not null,
  arrival_time text,
  lunar_date text,
  venue text not null default '',
  address text not null default '',
  map_url text,
  sort_order integer not null default 0
);
create index if not exists wedding_events_invitation_idx on public.wedding_events(invitation_id, sort_order);

create table if not exists public.wedding_timeline_items (
  id uuid primary key default gen_random_uuid(),
  invitation_id uuid not null references public.wedding_invitations(id) on delete cascade,
  time text not null,
  title text not null,
  description text,
  sort_order integer not null default 0
);
create index if not exists wedding_timeline_invitation_idx on public.wedding_timeline_items(invitation_id, sort_order);

create table if not exists public.wedding_media (
  id uuid primary key default gen_random_uuid(),
  invitation_id uuid not null references public.wedding_invitations(id) on delete cascade,
  storage_path text not null unique,
  alt_text text not null default '',
  mime_type text not null default 'image/webp',
  byte_size integer not null default 0,
  status text not null default 'ready' check (status in ('ready','deleted')),
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists wedding_media_invitation_idx on public.wedding_media(invitation_id, sort_order);

create table if not exists public.wedding_gift_accounts (
  id uuid primary key default gen_random_uuid(),
  invitation_id uuid not null references public.wedding_invitations(id) on delete cascade,
  recipient text not null,
  bank_name text not null,
  account_number text not null,
  account_holder text not null,
  qr_media_id uuid references public.wedding_media(id) on delete set null,
  sort_order integer not null default 0
);
create index if not exists wedding_gifts_invitation_idx on public.wedding_gift_accounts(invitation_id, sort_order);

create table if not exists public.wedding_rsvps (
  id uuid primary key default gen_random_uuid(),
  invitation_id uuid not null references public.wedding_invitations(id) on delete cascade,
  guest_name text not null,
  attendance text not null check (attendance in ('yes','no')),
  guest_count integer not null default 1 check (guest_count between 1 and 5),
  message text,
  submitter_hash text,
  created_at timestamptz not null default now()
);
create index if not exists wedding_rsvps_invitation_idx on public.wedding_rsvps(invitation_id, created_at desc);

create table if not exists public.wedding_wishes (
  id uuid primary key default gen_random_uuid(),
  invitation_id uuid not null references public.wedding_invitations(id) on delete cascade,
  guest_name text not null,
  message text not null,
  status text not null default 'pending' check (status in ('pending','approved','hidden')),
  submitter_hash text,
  created_at timestamptz not null default now()
);
create index if not exists wedding_wishes_invitation_idx on public.wedding_wishes(invitation_id, status, created_at desc);

create table if not exists public.wedding_submission_limits (
  key text primary key,
  count integer not null default 0,
  expires_at timestamptz not null
);
create index if not exists wedding_limits_expiry_idx on public.wedding_submission_limits(expires_at);

create or replace function public.wedding_take_rate_limit(p_key text, p_limit integer, p_expires_at timestamptz)
returns boolean language plpgsql security definer set search_path = public
as $$
declare n integer;
begin
  insert into public.wedding_submission_limits(key, count, expires_at) values (p_key, 1, p_expires_at)
  on conflict (key) do update set count = case when wedding_submission_limits.expires_at < now() then 1 else wedding_submission_limits.count + 1 end,
    expires_at = case when wedding_submission_limits.expires_at < now() then p_expires_at else wedding_submission_limits.expires_at end
  returning count into n;
  return n <= p_limit;
end;
$$;
revoke all on function public.wedding_take_rate_limit(text,integer,timestamptz) from public, anon, authenticated;
grant execute on function public.wedding_take_rate_limit(text,integer,timestamptz) to service_role;

alter table public.wedding_admins enable row level security;
alter table public.wedding_invitations enable row level security;
alter table public.wedding_events enable row level security;
alter table public.wedding_timeline_items enable row level security;
alter table public.wedding_media enable row level security;
alter table public.wedding_gift_accounts enable row level security;
alter table public.wedding_rsvps enable row level security;
alter table public.wedding_wishes enable row level security;
alter table public.wedding_submission_limits enable row level security;

create policy "Wedding admins read own role" on public.wedding_admins for select to authenticated using (user_id = (select auth.uid()));
create policy "Published weddings are visible" on public.wedding_invitations for select to anon, authenticated using (status = 'published');
create policy "Admins manage weddings" on public.wedding_invitations for all to authenticated using (public.wedding_is_admin()) with check (public.wedding_is_admin());
create policy "Published events are visible" on public.wedding_events for select to anon, authenticated using (exists(select 1 from public.wedding_invitations i where i.id = invitation_id and i.status = 'published'));
create policy "Admins manage events" on public.wedding_events for all to authenticated using (public.wedding_is_admin()) with check (public.wedding_is_admin());
create policy "Published timeline is visible" on public.wedding_timeline_items for select to anon, authenticated using (exists(select 1 from public.wedding_invitations i where i.id = invitation_id and i.status = 'published'));
create policy "Admins manage timeline" on public.wedding_timeline_items for all to authenticated using (public.wedding_is_admin()) with check (public.wedding_is_admin());
create policy "Published media metadata is visible" on public.wedding_media for select to anon, authenticated using (status = 'ready' and exists(select 1 from public.wedding_invitations i where i.id = invitation_id and i.status = 'published'));
create policy "Admins manage media" on public.wedding_media for all to authenticated using (public.wedding_is_admin()) with check (public.wedding_is_admin());
create policy "Published gifts are visible when enabled" on public.wedding_gift_accounts for select to anon, authenticated using (exists(select 1 from public.wedding_invitations i where i.id = invitation_id and i.status = 'published' and i.gifts_enabled));
create policy "Admins manage gifts" on public.wedding_gift_accounts for all to authenticated using (public.wedding_is_admin()) with check (public.wedding_is_admin());
create policy "Admins read RSVPs" on public.wedding_rsvps for select to authenticated using (public.wedding_is_admin());
create policy "Approved wishes are visible" on public.wedding_wishes for select to anon, authenticated using (status = 'approved' and exists(select 1 from public.wedding_invitations i where i.id = invitation_id and i.status = 'published' and i.wishes_enabled));
create policy "Admins manage wishes" on public.wedding_wishes for all to authenticated using (public.wedding_is_admin()) with check (public.wedding_is_admin());

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
    insert into public.wedding_events(invitation_id,title,date_time,arrival_time,lunar_date,venue,address,map_url,sort_order)
    values(v_id,v_item->>'title',(v_item->>'dateTime')::timestamptz,nullif(v_item->>'arrivalTime',''),nullif(v_item->>'lunarDate',''),v_item->>'venue',v_item->>'address',nullif(v_item->>'mapUrl',''),(v_item->>'sortOrder')::integer);
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
