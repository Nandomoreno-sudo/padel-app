-- Optional phone number captured when generating an invitation, used to
-- pre-fill the WhatsApp share link (wa.me/<phone>) from the admin panel.
alter table public.invitations
  add column phone text;
