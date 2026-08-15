-- Lets the (unauthenticated) register form check an invitation code before
-- attempting sign-up. Without this, an invalid/used code only surfaces once
-- handle_new_user's trigger raises inside the auth.users insert — and
-- Supabase Auth wraps any trigger exception into an opaque "Database error
-- saving new user", losing the real reason. SECURITY DEFINER so it can read
-- `invitations` despite its RLS policies requiring an authenticated role
-- (there's no session yet at this point in the sign-up flow).
create or replace function public.validate_invitation_code(p_code text)
returns text
language plpgsql
security definer
set search_path = public
stable
as $$
declare
  v_is_used boolean;
begin
  select is_used into v_is_used
  from public.invitations
  where code = p_code;

  if not found then
    return 'invalid';
  end if;

  if v_is_used then
    return 'used';
  end if;

  return 'valid';
end;
$$;

grant execute on function public.validate_invitation_code(text) to anon, authenticated;
