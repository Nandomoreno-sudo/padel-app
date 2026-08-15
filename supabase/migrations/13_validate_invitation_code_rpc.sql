-- Lets the (unauthenticated) register form check an invitation code before
-- attempting sign-up. Without this, an invalid/used code only surfaces once
-- handle_new_user's trigger raises inside the auth.users insert — and
-- Supabase Auth wraps any trigger exception into an opaque "Database error
-- saving new user", losing the real reason. SECURITY DEFINER so it can read
-- `invitations` despite its RLS policies requiring an authenticated role
-- (there's no session yet at this point in the sign-up flow).
--
-- Filters on invitations.is_used (boolean, not null, default false) —
-- confirmed 2026-08-15 against the live schema via information_schema, the
-- table has no used_at column.
create or replace function public.validate_invitation_code(p_code text)
returns text
language plpgsql
security definer
set search_path = public
stable
as $$
declare
  v_is_available boolean;
begin
  select (is_used = false) into v_is_available
  from public.invitations
  where code = p_code;

  if not found then
    return 'invalid';
  end if;

  if not v_is_available then
    return 'used';
  end if;

  return 'valid';
end;
$$;

grant execute on function public.validate_invitation_code(text) to anon, authenticated;
