-- Keeps matches.status in sync with match_players headcount.
--
-- The "matches" RLS policies only let admins update a match, but any
-- player can join/leave one, so the open<->full transition has to happen
-- here (security definer, bypasses RLS) rather than in application code.
-- Only toggles between 'open' and 'full' — 'finished'/'cancelled' are left
-- alone since those are admin-managed states.

create or replace function public.sync_match_status()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_match_id uuid := coalesce(new.match_id, old.match_id);
  v_count int;
  v_status text;
begin
  select count(*) into v_count
  from public.match_players
  where match_id = v_match_id;

  select status into v_status
  from public.matches
  where id = v_match_id;

  if v_status = 'open' and v_count >= 4 then
    update public.matches set status = 'full' where id = v_match_id;
  elsif v_status = 'full' and v_count < 4 then
    update public.matches set status = 'open' where id = v_match_id;
  end if;

  return coalesce(new, old);
end;
$$;

drop trigger if exists match_players_sync_status on public.match_players;

create trigger match_players_sync_status
  after insert or delete on public.match_players
  for each row
  execute function public.sync_match_status();
