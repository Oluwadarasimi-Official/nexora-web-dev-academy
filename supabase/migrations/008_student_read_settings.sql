-- Nexora Web Dev. Academy — migration 008: students may read academy_settings.
-- WHY (fix pass C, B9): the quiz pass mark, daily new-topic limit and exam
-- pass mark are stored in academy_settings, but migration 001 created NO
-- select policy for the table (only the admin "admins manage academy_settings"
-- policy from migration 004 exists). A student-token read therefore returned
-- zero rows, so no server route could ever enforce the stored values — the
-- routes hardcoded their own marks instead. The values are NOT sensitive:
-- the same numbers are already published in the FAQ ("Three new topics per
-- calendar day", "at least 7 out of 10", "70% pass mark") and on student
-- pages, so a public read policy is safe. Writes stay admin-only via
-- public.is_admin() (migration 004). No data changes; rerunnable.
-- Apply in the Supabase SQL Editor (the stored management credential cannot
-- run SQL), then verify:
--   select key, value from public.academy_settings;  -- expect the stored rows

drop policy if exists "public read settings" on public.academy_settings;
create policy "public read settings" on public.academy_settings
  for select using (true);
