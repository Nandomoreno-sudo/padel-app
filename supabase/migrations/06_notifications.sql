-- In-app notifications: when a player joins a match, every other player
-- already registered for it gets a notification row.
--
-- The message text is built in the app (joinMatch, reusing formatMatchDate)
-- rather than in SQL, same trade-off as approve_match_result's level
-- updates in 04_match_results_workflow.sql: formatting stays in one place
-- in TypeScript, and the RPC just validates the caller is a participant
-- before fanning the message out to the other players' rows (a write RLS
-- wouldn't otherwise allow, since it's one user inserting rows owned by
-- other users).

create table public.notifications (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.profiles (id) on delete cascade,
  match_id   uuid not null references public.matches (id) on delete cascade,
  message    text not null,
  read       boolean not null default false,
  created_at timestamptz not null default now()
);

create index notifications_user_id_created_at_idx
  on public.notifications (user_id, created_at desc);

alter table public.notifications enable row level security;

create policy "Users can view their own notifications"
  on public.notifications for select
  to authenticated
  using (auth.uid() = user_id);

create policy "Users can mark their own notifications as read"
  on public.notifications for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create or replace function public.notify_match_players(
  p_match_id uuid,
  p_message text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (
    select 1 from public.match_players
    where match_id = p_match_id and user_id = auth.uid()
  ) then
    raise exception 'Solo un jugador del partido puede notificar a los demás.';
  end if;

  insert into public.notifications (user_id, match_id, message)
  select mp.user_id, p_match_id, p_message
  from public.match_players mp
  where mp.match_id = p_match_id
    and mp.user_id <> auth.uid();
end;
$$;
