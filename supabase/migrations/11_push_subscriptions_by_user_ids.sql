-- get_match_push_subscriptions previously resolved "the other players in
-- the match" itself from p_exclude_user_id. Server Actions now resolve
-- that list themselves with a plain SELECT against match_players (already
-- readable by any authenticated user per its RLS policy) and pass the
-- resulting user_ids straight through. This function's only remaining job
-- is bypassing push_subscriptions' RLS (readable only where
-- user_id = auth.uid(), or by admins) so a player can read their fellow
-- match members' subscriptions.
--
-- The membership check still keys off auth.uid() — the authenticated
-- caller's own session — rather than a client-supplied id, since trusting
-- a caller-supplied "I am this user" value here would let anyone who
-- knows a match member's uuid read that match's push subscription
-- endpoints/keys without actually belonging to it.
drop function if exists public.get_match_push_subscriptions(uuid, uuid);

create or replace function public.get_match_push_subscriptions(
  p_match_id uuid,
  p_user_ids uuid[]
)
returns table (user_id uuid, endpoint text, p256dh text, auth text)
language plpgsql
security definer
set search_path = public
stable
as $$
begin
  if not exists (
    select 1 from public.match_players
    where match_id = p_match_id and user_id = auth.uid()
  ) then
    raise exception 'Solo un jugador del partido puede consultar sus suscripciones.';
  end if;

  return query
  select ps.user_id, ps.endpoint, ps.p256dh, ps.auth
  from public.push_subscriptions ps
  where ps.user_id = any(p_user_ids)
    and exists (
      select 1 from public.match_players mp
      where mp.match_id = p_match_id and mp.user_id = ps.user_id
    );
end;
$$;
