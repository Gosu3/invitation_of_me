-- Guests may sign over the couple's joined hands: drop that no-sign zone, keep faces and bouquet.
update public.wedding_invitations
set signature_avoid_zones = '[
      {"x":0.27,"y":0.20,"w":0.22,"h":0.18},
      {"x":0.49,"y":0.26,"w":0.20,"h":0.17},
      {"x":0.69,"y":0.27,"w":0.24,"h":0.23}
    ]'::jsonb
where slug in ('tho-va-tham', 'tham-va-tho');
