-- Black ink for guest signatures (in addition to moss, ivory and gold).
-- The original check was declared inline on the column, so drop it by looking it up rather than by a guessed name.
do $$
declare constraint_name text;
begin
  for constraint_name in
    select con.conname from pg_constraint con
    where con.conrelid = 'public.wedding_signatures'::regclass and con.contype = 'c'
      and pg_get_constraintdef(con.oid) like '%ink%' and pg_get_constraintdef(con.oid) like '%moss%'
  loop
    execute format('alter table public.wedding_signatures drop constraint %I', constraint_name);
  end loop;
end $$;

alter table public.wedding_signatures
  add constraint wedding_signatures_ink_check check (ink in ('moss','ivory','gold','black'));
