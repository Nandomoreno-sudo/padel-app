-- Adds an explicit court position (derecha/reves) to match_players so a
-- player picks their exact slot on join, instead of it being derived from
-- registration order at render time.

alter table public.match_players
  add column position text check (position in ('derecha', 'reves'));

-- Backfill existing rows: first player registered within a team gets
-- 'derecha', the second gets 'reves' (matches the old order-based display).
with ranked as (
  select id, row_number() over (
    partition by match_id, team order by registered_at
  ) as rn
  from public.match_players
)
update public.match_players mp
set position = case when ranked.rn = 1 then 'derecha' else 'reves' end
from ranked
where mp.id = ranked.id;

alter table public.match_players
  alter column position set not null;

-- A team can't have two players in the same position.
create unique index match_players_match_team_position_idx
  on public.match_players (match_id, team, position);
