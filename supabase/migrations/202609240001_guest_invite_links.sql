-- Short, personalized links for individual wedding guests.
alter table public.wedding_invitations
  add column if not exists admin_title text check (admin_title is null or char_length(admin_title) between 1 and 150);

create table if not exists public.wedding_guest_links (
  id uuid primary key default gen_random_uuid(),
  invitation_id uuid not null references public.wedding_invitations(id) on delete cascade,
  code text not null unique check (code ~ '^[A-Za-z2-9]{5}$'),
  guest_name text not null check (char_length(guest_name) between 1 and 100),
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists wedding_guest_links_invitation_idx
  on public.wedding_guest_links(invitation_id, created_at desc);

alter table public.wedding_guest_links enable row level security;

drop policy if exists "Admins manage guest links" on public.wedding_guest_links;
create policy "Admins manage guest links"
  on public.wedding_guest_links for all to authenticated
  using (public.wedding_is_admin())
  with check (public.wedding_is_admin());

-- Public links are resolved only by a server route using the service role.
-- No anon SELECT policy is intentionally created for this table.

-- Create an editable bride-family copy of the current invitation.
insert into public.wedding_invitations (
  id, owner_id, slug, status, admin_title, partner_one, partner_two,
  partner_one_full_name, partner_two_full_name, partner_one_parents, partner_two_parents,
  partner_one_address, partner_two_address, headline, message, story, cover_alt,
  dress_code, closing_message, rsvp_enabled, rsvp_deadline, wishes_enabled, gifts_enabled
)
select
  '8a0f8b1e-67e8-4fa8-ae3e-291120260002', owner_id, 'tho-va-tham-nha-gai', 'draft',
  'Hồng Thắm & Văn Thọ (Nhà gái)', partner_one, partner_two,
  partner_one_full_name, partner_two_full_name, partner_one_parents, partner_two_parents,
  partner_one_address, partner_two_address, headline, message, story, cover_alt,
  dress_code, closing_message, rsvp_enabled, rsvp_deadline, wishes_enabled, gifts_enabled
from public.wedding_invitations
where slug = 'tho-va-tham'
on conflict (slug) do update set admin_title = excluded.admin_title;

insert into public.wedding_events (
  invitation_id, title, date_time, arrival_time, lunar_date, venue, address, map_url, sort_order
)
select destination.id, event.title, event.date_time, event.arrival_time, event.lunar_date,
  event.venue, event.address, event.map_url, event.sort_order
from public.wedding_invitations source
join public.wedding_invitations destination on destination.slug = 'tho-va-tham-nha-gai'
join public.wedding_events event on event.invitation_id = source.id
where source.slug = 'tho-va-tham'
  and not exists (select 1 from public.wedding_events existing where existing.invitation_id = destination.id);

insert into public.wedding_timeline_items (invitation_id, time, title, description, sort_order)
select destination.id, item.time, item.title, item.description, item.sort_order
from public.wedding_invitations source
join public.wedding_invitations destination on destination.slug = 'tho-va-tham-nha-gai'
join public.wedding_timeline_items item on item.invitation_id = source.id
where source.slug = 'tho-va-tham'
  and not exists (select 1 from public.wedding_timeline_items existing where existing.invitation_id = destination.id);
