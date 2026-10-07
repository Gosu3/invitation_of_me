-- Guest signatures drawn on a wedding photo ("bức tường chữ ký").
-- Kept separate from wishes; a signature may link to the guest's own wish via wish_id.
-- Disabled by default: applying this migration does not change any live invitation.

alter table public.wedding_invitations
  add column if not exists signatures_enabled boolean not null default false,
  add column if not exists signature_image text
    check (signature_image is null or signature_image ~ '^/photos/[A-Za-z0-9._-]+$' or signature_image ~ '^/api/media/[0-9a-f-]{36}$'),
  add column if not exists signature_avoid_zones jsonb not null default '[]'::jsonb
    check (jsonb_typeof(signature_avoid_zones) = 'array' and jsonb_array_length(signature_avoid_zones) <= 12);

create table if not exists public.wedding_signatures (
  id uuid primary key default gen_random_uuid(),
  invitation_id uuid not null references public.wedding_invitations(id) on delete cascade,
  wish_id uuid references public.wedding_wishes(id) on delete set null,
  guest_name text not null check (char_length(guest_name) between 1 and 100),
  -- {kind:'draw', strokes:number[][], w, h} | {kind:'text', text, w, h}; coordinates in a 1000x1500 viewBox relative to the signature centre.
  mark jsonb not null check (jsonb_typeof(mark) = 'object' and mark->>'kind' in ('draw','text') and octet_length(mark::text) <= 65536),
  ink text not null default 'moss' check (ink in ('moss','ivory','gold')),
  x real not null check (x between 0 and 1),
  y real not null check (y between 0 and 1),
  scale real not null check (scale between 0.2 and 1.5),
  rotate real not null default 0 check (rotate between -30 and 30),
  status text not null default 'approved' check (status in ('approved','hidden')),
  submitter_hash text,
  created_at timestamptz not null default now()
);
create index if not exists wedding_signatures_invitation_idx on public.wedding_signatures(invitation_id, status, created_at);
-- One signature per wish keeps a guest's wish from being attached to several marks.
create unique index if not exists wedding_signatures_wish_idx on public.wedding_signatures(wish_id) where wish_id is not null;

alter table public.wedding_signatures enable row level security;

drop policy if exists "Approved signatures are visible" on public.wedding_signatures;
create policy "Approved signatures are visible" on public.wedding_signatures for select to anon, authenticated
  using (status = 'approved' and exists(select 1 from public.wedding_invitations i where i.id = invitation_id and i.status = 'published' and i.signatures_enabled));
drop policy if exists "Admins manage signatures" on public.wedding_signatures;
create policy "Admins manage signatures" on public.wedding_signatures for all to authenticated
  using (public.wedding_is_admin()) with check (public.wedding_is_admin());
-- Inserts go through /api/signatures with the service role (validation + rate limit); no anon insert policy.

-- Board photo and no-sign zones (faces, bouquet, hands) for Thọ & Thắm. Both invitations share one board.
update public.wedding_invitations
set signature_image = '/photos/signature-board-tho.webp',
    signature_avoid_zones = '[
      {"x":0.27,"y":0.20,"w":0.22,"h":0.18},
      {"x":0.49,"y":0.26,"w":0.20,"h":0.17},
      {"x":0.69,"y":0.27,"w":0.24,"h":0.23},
      {"x":0.29,"y":0.55,"w":0.16,"h":0.09}
    ]'::jsonb
where slug in ('tho-va-tham', 'tham-va-tho');
