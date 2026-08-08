-- Auto-provisions a profiles row when a new auth user is created, and
-- enforces that sign-up only succeeds with a valid, unused invitation code.
--
-- Expects the code (and optionally name/phone) to be passed as user metadata
-- on signUp, e.g.:
--   supabase.auth.signUp({
--     email, password,
--     options: { data: { invitation_code, name, phone } },
--   })
--
-- Because this runs inside the same transaction as the auth.users insert,
-- an invalid code raises an exception and rolls back the entire sign-up —
-- no auth user is left behind.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_code text;
begin
  v_code := new.raw_user_meta_data ->> 'invitation_code';

  if v_code is null or not exists (
    select 1 from public.invitations
    where code = v_code and is_used = false
  ) then
    raise exception 'A valid invitation code is required to sign up.';
  end if;

  insert into public.profiles (id, name, phone)
  values (
    new.id,
    new.raw_user_meta_data ->> 'name',
    new.raw_user_meta_data ->> 'phone'
  );

  update public.invitations
  set is_used = true,
      used_by = new.id
  where code = v_code;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();
