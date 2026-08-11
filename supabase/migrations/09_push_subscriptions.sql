-- Web Push subscriptions: one row per subscribed device/browser, holding
-- the endpoint + keys returned by PushManager.subscribe() so the server
-- can send notifications via the web-push library.

create table public.push_subscriptions (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.profiles (id) on delete cascade,
  endpoint   text not null unique,
  p256dh     text not null,
  auth       text not null,
  created_at timestamptz not null default now()
);

create index push_subscriptions_user_id_idx on public.push_subscriptions (user_id);

alter table public.push_subscriptions enable row level security;

create policy "Users manage their own push subscriptions, admins manage all"
  on public.push_subscriptions for all
  to authenticated
  using (user_id = auth.uid() or public.is_admin())
  with check (user_id = auth.uid() or public.is_admin());

-- Lets a player fetch push subscriptions of the *other* players in a match
-- they belong to, so joinMatch can push-notify them (the RLS policy above
-- wouldn't otherwise allow reading rows owned by other users). Mirrors
-- notify_match_players in 06_notifications.sql.
create or replace function public.get_match_push_subscriptions(
  p_match_id uuid,
  p_exclude_user_id uuid
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
  join public.match_players mp on mp.user_id = ps.user_id
  where mp.match_id = p_match_id
    and ps.user_id <> p_exclude_user_id;
end;
$$;
