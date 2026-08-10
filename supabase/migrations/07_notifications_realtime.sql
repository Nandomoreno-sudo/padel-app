-- Lets the browser subscribe to INSERTs on notifications (Supabase
-- Realtime only streams changes for tables added to this publication),
-- so the bottom-nav badge and the join sound can react live.
alter publication supabase_realtime add table public.notifications;
