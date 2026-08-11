-- Lets the browser subscribe to changes on match_players and matches
-- (Supabase Realtime only streams changes for tables added to this
-- publication), so the matches list can refresh live while the app is
-- open in the foreground. Mirrors 07_notifications_realtime.sql.
alter publication supabase_realtime add table public.match_players;
alter publication supabase_realtime add table public.matches;
