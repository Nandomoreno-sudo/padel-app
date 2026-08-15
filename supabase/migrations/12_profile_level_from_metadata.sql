-- Reads the self-declared level (src/app/register/level-options.ts) from
-- the sign-up metadata and uses it as the new profile's starting level,
-- instead of always falling back to the profiles.level column default of
-- 2.5. Falls back to 2.5 itself when no level was passed in metadata (e.g.
-- accounts provisioned some other way than the register form).
--
-- Expects the level (in addition to invitation_code/name/phone, already
-- handled by 02_auth_trigger.sql) as user metadata on signUp:
--   supabase.auth.signUp({
--     email, password,
--     options: { data: { invitation_code, name, phone, level } },
--   })

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_code text;
  v_level real;
begin
  v_code := new.raw_user_meta_data ->> 'invitation_code';

  if v_code is null or not exists (
    select 1 from public.invitations
    where code = v_code and is_used = false
  ) then
    raise exception 'A valid invitation code is required to sign up.';
  end if;

  v_level := coalesce(
    (new.raw_user_meta_data ->> 'level')::real,
    2.5
  );

  insert into public.profiles (id, name, phone, level)
  values (
    new.id,
    new.raw_user_meta_data ->> 'name',
    new.raw_user_meta_data ->> 'phone',
    v_level
  );

  update public.invitations
  set is_used = true,
      used_by = new.id
  where code = v_code;

  return new;
end;
$$;
