-- Collaborative match-result workflow: submit -> peer approval (or admin
-- confirm) -> finished. Adds the 'pending_result' status and a
-- submitted_by column, then three SECURITY DEFINER RPCs that perform the
-- privileged writes regular players' RLS grants don't otherwise allow
-- (updating `matches`, or another player's row in `profiles`).
--
-- The level values applied in approve_match_result are computed by the
-- app (src/lib/level-calculator.ts) and passed in as p_level_updates; the
-- function re-validates the caller's authorization and match state, and
-- clamps every value to [1.00, 7.00], but — like sync_match_status and
-- handle_new_user before it — it trusts the caller for the actual numbers.
-- That's an acceptable trade-off for a club app (the algorithm explicitly
-- belongs in TypeScript per spec, and finalizing still requires a second
-- genuine participant or an admin to act), not a hardened rating system.

alter table public.match_results
  add column submitted_by uuid references public.profiles (id);

alter table public.matches
  drop constraint if exists matches_status_check;

alter table public.matches
  add constraint matches_status_check
  check (status in ('open', 'full', 'pending_result', 'finished', 'cancelled'));

-- Players could already view any result; now they can also dispute
-- (delete) one that hasn't been admin-confirmed yet. Admins can remove any.
drop policy if exists "Only admins can delete match results" on public.match_results;

create policy "Players can dispute a pending result, admins any"
  on public.match_results for delete
  to authenticated
  using (
    public.is_admin()
    or (
      confirmed_by_admin = false
      and exists (
        select 1 from public.match_players mp
        where mp.match_id = match_results.match_id
          and mp.user_id = auth.uid()
      )
    )
  );

-- Submits a proposed result and flips the match into pending_result.
-- Only a registered player (or an admin) may submit, and only once per
-- match (match_results.match_id is unique) while the match is full.
create or replace function public.submit_match_result(
  p_match_id uuid,
  p_set1_team1 smallint,
  p_set1_team2 smallint,
  p_set2_team1 smallint,
  p_set2_team2 smallint,
  p_set3_team1 smallint,
  p_set3_team2 smallint
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_status text;
  v_is_participant boolean;
begin
  select status into v_status from public.matches where id = p_match_id;
  if v_status is null then
    raise exception 'El partido no existe.';
  end if;
  if v_status <> 'full' then
    raise exception 'Este partido no admite el envío de un resultado.';
  end if;

  select exists (
    select 1 from public.match_players
    where match_id = p_match_id and user_id = auth.uid()
  ) into v_is_participant;

  if not (v_is_participant or public.is_admin()) then
    raise exception 'Solo un jugador del partido puede enviar el resultado.';
  end if;

  insert into public.match_results (
    match_id, submitted_by,
    set1_team1, set1_team2, set2_team1, set2_team2, set3_team1, set3_team2
  ) values (
    p_match_id, auth.uid(),
    p_set1_team1, p_set1_team2, p_set2_team1, p_set2_team2, p_set3_team1, p_set3_team2
  );

  update public.matches set status = 'pending_result' where id = p_match_id;
end;
$$;

-- Approves a pending result: a *different* participant confirms it, or an
-- admin confirms it directly. Applies the new levels and finishes the
-- match. p_level_updates is a jsonb array of {"user_id": uuid, "level": n}.
create or replace function public.approve_match_result(
  p_match_id uuid,
  p_level_updates jsonb
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_result record;
  v_status text;
  v_is_admin boolean;
  v_is_other_participant boolean;
  v_entry jsonb;
  v_user_id uuid;
  v_level numeric;
begin
  select * into v_result from public.match_results where match_id = p_match_id;
  if v_result is null then
    raise exception 'No hay un resultado pendiente para este partido.';
  end if;

  select status into v_status from public.matches where id = p_match_id;
  if v_status <> 'pending_result' then
    raise exception 'Este resultado ya no está pendiente de aprobación.';
  end if;

  v_is_admin := public.is_admin();

  select exists (
    select 1 from public.match_players
    where match_id = p_match_id and user_id = auth.uid()
  ) into v_is_other_participant;
  v_is_other_participant := v_is_other_participant and auth.uid() <> v_result.submitted_by;

  if not (v_is_admin or v_is_other_participant) then
    raise exception 'No autorizado para aprobar este resultado.';
  end if;

  if jsonb_array_length(p_level_updates) <> 4 then
    raise exception 'Se requieren los niveles de los 4 jugadores.';
  end if;

  for v_entry in select * from jsonb_array_elements(p_level_updates)
  loop
    v_user_id := (v_entry ->> 'user_id')::uuid;
    v_level := greatest(1.00, least(7.00, (v_entry ->> 'level')::numeric));

    if not exists (
      select 1 from public.match_players
      where match_id = p_match_id and user_id = v_user_id
    ) then
      raise exception 'Jugador no perteneciente a este partido.';
    end if;

    update public.profiles set level = v_level where id = v_user_id;
  end loop;

  update public.match_results
  set confirmed_by_admin = v_is_admin
  where match_id = p_match_id;

  update public.matches set status = 'finished' where id = p_match_id;
end;
$$;

-- Disputes (discards) a pending result so a new one can be submitted.
-- Same "a different participant, or an admin" rule as approval.
create or replace function public.dispute_match_result(p_match_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_result record;
  v_is_admin boolean;
  v_is_other_participant boolean;
  v_count int;
begin
  select * into v_result from public.match_results where match_id = p_match_id;
  if v_result is null then
    raise exception 'No hay un resultado pendiente para este partido.';
  end if;

  v_is_admin := public.is_admin();

  select exists (
    select 1 from public.match_players
    where match_id = p_match_id and user_id = auth.uid()
  ) into v_is_other_participant;
  v_is_other_participant := v_is_other_participant and auth.uid() <> v_result.submitted_by;

  if not (v_is_admin or v_is_other_participant) then
    raise exception 'No autorizado para impugnar este resultado.';
  end if;

  delete from public.match_results where match_id = p_match_id;

  select count(*) into v_count from public.match_players where match_id = p_match_id;

  update public.matches
  set status = case when v_count >= 4 then 'full' else 'open' end
  where id = p_match_id;
end;
$$;
