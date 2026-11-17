-- Nexora Web Dev. Academy — migration 004: admin read/write access + signup trigger.
-- WHY: (1) The admin portal is a single owner-admin (davidoluwadarasimi011@gmail.com),
-- but 001 gave admins NO read policies: the admin dashboard shows "—" and the
-- students page says "not connected", even though the data is in the tables.
-- (2) The legacy trigger public.handle_new_academy_user() (old build, on auth.users)
-- inserted profiles WITHOUT email and broke registration ("Database error saving
-- new user"); it was fixed live on 17 Nov 2026. This file codifies the correct
-- trigger so a future reset keeps it. The app's AuthForm also upserts the profile
-- after signup; both paths are idempotent (ON CONFLICT DO NOTHING).
-- (3) 001 never granted the authenticated role privileges on the admin tables, so
-- even with policies the admin could not read them. Grants added below.
-- RLS stays restrictive: every new policy requires public.is_admin() (the caller
-- must hold the admin role). Students gain nothing new.

-- ---------------------------------------------------------------- is_admin()
create or replace function public.is_admin()
returns boolean
language sql
security definer
stable
as $$
  select exists (
    select 1 from public.user_roles
    where user_id = auth.uid() and role = 'admin'
  );
$$;

-- A user can always read their own role row (lets the app check "am I admin?").
drop policy if exists "own role" on public.user_roles;
create policy "own role" on public.user_roles
  for select using (auth.uid() = user_id);

-- Admins: full access to the tables they manage. (Permissive RLS: any passing
-- policy grants access, so student own-row policies keep working alongside.)
do $$
declare
  t text;
begin
  foreach t in array array[
    'user_roles','profiles','payments','access_codes','code_redemptions',
    'certificates','certificate_verification_logs','lesson_progress',
    'daily_learning_limits','quiz_attempts','quiz_answers',
    'examination_attempts','examination_answers','announcements',
    'support_requests','admin_activity_logs','academy_settings','notifications',
    'quizzes','examinations','examination_questions',
    'quiz_questions','quiz_options'
  ]
  loop
    execute format('drop policy if exists "admins manage %s" on public.%I', t, t);
    execute format(
      'create policy "admins manage %s" on public.%I for all using (public.is_admin()) with check (public.is_admin())',
      t, t
    );
  end loop;
end $$;

-- Privileges so the policies can take effect for the authenticated role.
grant select on public.user_roles, public.access_codes, public.code_redemptions,
  public.admin_activity_logs, public.academy_settings, public.quiz_questions,
  public.quiz_options, public.examinations, public.examination_questions,
  public.certificate_verification_logs, public.quizzes to authenticated;
grant select, insert, update, delete on public.user_roles, public.access_codes,
  public.admin_activity_logs, public.academy_settings to authenticated;
grant insert, update, delete on public.announcements, public.certificates,
  public.code_redemptions, public.certificate_verification_logs to authenticated;

-- ---------------------------------------------------------------- signup trigger
-- Replaces the legacy handle_new_academy_user() (old build). Creates the profile
-- row at signup with id, full name AND email (email is NOT NULL in the new schema).
create or replace function public.handle_new_academy_user()
returns trigger
language plpgsql
security definer
as $$
begin
  insert into public.profiles (id, full_name, email)
  values (
    new.id,
    coalesce(nullif(new.raw_user_meta_data ->> 'full_name', ''), 'Student'),
    new.email
  )
  on conflict (id) do nothing;
  return new;
end;
$$;
drop trigger if exists on_auth_user_created_academy on auth.users;
create trigger on_auth_user_created_academy
  after insert on auth.users
  for each row execute function public.handle_new_academy_user();

-- Verification (run after applying):
-- SELECT public.is_admin(); -- false when run as anon (no session); true for the admin session.
-- SELECT count(*) FROM public.user_roles WHERE role = 'admin'; -- expect 1
