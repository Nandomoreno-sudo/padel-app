-- Padel club app: base schema + RLS policies
-- Tables: profiles, invitations, matches, match_players, match_results

create extension if not exists pgcrypto;

-- =========================================================
-- Tables
-- =========================================================

create table public.profiles (
  id         uuid primary key references auth.users (id) on delete cascade,
  name       text,
  phone      text,
  level      real not null default 2.5,
  is_admin   boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.invitations (
  id         uuid primary key default gen_random_uuid(),
  code       text not null unique,
  created_by uuid references public.profiles (id) on delete set null,
  used_by    uuid references public.profiles (id) on delete set null,
  is_used    boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.matches (
  id               uuid primary key default gen_random_uuid(),
  court_name       text not null,
  start_time       timestamptz not null,
  duration_minutes integer not null default 90,
  min_level        real,
  max_level        real,
  status           text not null default 'open'
                     check (status in ('open', 'full', 'finished', 'cancelled')),
  created_at       timestamptz not null default now()
);

create table public.match_players (
  id                    uuid primary key default gen_random_uuid(),
  match_id              uuid not null references public.matches (id) on delete cascade,
  user_id               uuid not null references public.profiles (id) on delete cascade,
  team                  smallint not null check (team in (1, 2)),
  confirmed_attendance  boolean not null default false,
  registered_at         timestamptz not null default now(),
  unique (match_id, user_id)
);

create table public.match_results (
  id                 uuid primary key default gen_random_uuid(),
  match_id           uuid not null unique references public.matches (id) on delete cascade,
  set1_team1         smallint check (set1_team1 >= 0),
  set1_team2         smallint check (set1_team2 >= 0),
  set2_team1         smallint check (set2_team1 >= 0),
  set2_team2         smallint check (set2_team2 >= 0),
  set3_team1         smallint check (set3_team1 >= 0),
  set3_team2         smallint check (set3_team2 >= 0),
  confirmed_by_admin boolean not null default false,
  created_at         timestamptz not null default now()
);

create index match_players_match_id_idx on public.match_players (match_id);
create index match_players_user_id_idx on public.match_players (user_id);
create index matches_status_idx on public.matches (status);
create index invitations_code_idx on public.invitations (code);

-- =========================================================
-- Helpers
-- =========================================================

-- Runs as the table owner (bypassing RLS) so it can be safely called
-- from within the profiles policies below without recursive RLS checks.
create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select coalesce(
    (select is_admin from public.profiles where id = auth.uid()),
    false
  );
$$;

-- Prevents a user from granting themselves admin rights through the
-- "update own profile" policy below.
create or replace function public.protect_profile_admin_field()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.is_admin is distinct from old.is_admin and not public.is_admin() then
    new.is_admin := old.is_admin;
  end if;
  return new;
end;
$$;

create trigger protect_profile_admin_field
  before update on public.profiles
  for each row
  execute function public.protect_profile_admin_field();

-- =========================================================
-- Row Level Security
-- =========================================================

alter table public.profiles enable row level security;
alter table public.invitations enable row level security;
alter table public.matches enable row level security;
alter table public.match_players enable row level security;
alter table public.match_results enable row level security;

-- profiles ---------------------------------------------------

create policy "Profiles are viewable by authenticated users"
  on public.profiles for select
  to authenticated
  using (true);

create policy "Users can insert their own profile"
  on public.profiles for insert
  to authenticated
  with check (id = auth.uid());

create policy "Users can update their own profile, admins update any"
  on public.profiles for update
  to authenticated
  using (id = auth.uid() or public.is_admin())
  with check (id = auth.uid() or public.is_admin());

create policy "Admins can delete profiles"
  on public.profiles for delete
  to authenticated
  using (public.is_admin());

-- invitations ------------------------------------------------

create policy "Admins manage invitations"
  on public.invitations for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy "Authenticated users can view unused invitations"
  on public.invitations for select
  to authenticated
  using (is_used = false);

create policy "Users can redeem an unused invitation"
  on public.invitations for update
  to authenticated
  using (is_used = false)
  with check (used_by = auth.uid() and is_used = true);

-- matches ------------------------------------------------------

create policy "Matches are viewable by authenticated users"
  on public.matches for select
  to authenticated
  using (true);

create policy "Admins create matches"
  on public.matches for insert
  to authenticated
  with check (public.is_admin());

create policy "Admins update matches"
  on public.matches for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy "Admins delete matches"
  on public.matches for delete
  to authenticated
  using (public.is_admin());

-- match_players --------------------------------------------------

create policy "Match players are viewable by authenticated users"
  on public.match_players for select
  to authenticated
  using (true);

create policy "Users register themselves, admins register anyone"
  on public.match_players for insert
  to authenticated
  with check (user_id = auth.uid() or public.is_admin());

create policy "Users update their own registration, admins update any"
  on public.match_players for update
  to authenticated
  using (user_id = auth.uid() or public.is_admin())
  with check (user_id = auth.uid() or public.is_admin());

create policy "Users cancel their own registration, admins cancel any"
  on public.match_players for delete
  to authenticated
  using (user_id = auth.uid() or public.is_admin());

-- match_results ----------------------------------------------------

create policy "Match results are viewable by authenticated users"
  on public.match_results for select
  to authenticated
  using (true);

create policy "Players in the match or admins can submit a result"
  on public.match_results for insert
  to authenticated
  with check (
    public.is_admin()
    or exists (
      select 1 from public.match_players mp
      where mp.match_id = match_results.match_id
        and mp.user_id = auth.uid()
    )
  );

create policy "Only admins can update match results"
  on public.match_results for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy "Only admins can delete match results"
  on public.match_results for delete
  to authenticated
  using (public.is_admin());
