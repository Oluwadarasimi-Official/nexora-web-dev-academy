-- Nexora Web Dev. Academy — migration 009: record lesson opens (lesson_views).
-- WHY (owner rule, 17 Nov 2026 night): a real student (Precious, testing on
-- his phone) clicked and landed straight on the quiz, because the UI never
-- separated the course from the quiz. The rule is now: the quiz must NOT
-- open until the student has opened the course (lesson) for that topic.
-- The topic page records the view on mount (POST /api/lesson-view); the
-- quiz page and /api/quiz-submit both read this table. One row per
-- student+topic (idempotent upsert); a completed topic also counts as
-- opened, so topics completed before this table existed (and the parent's
-- Level 1 seed) are not locked out.
-- Apply in the Supabase SQL Editor (the stored management credential cannot
-- run SQL), then verify:
--   select count(*) from public.lesson_views;  -- expect 0 (fresh table)
-- Rerunnable: create table / policy use if not exists / drop-if-exists.
-- NOTE: this is 009 because 008 (pass C, students read academy_settings)
-- already exists. Do not renumber.

create table if not exists public.lesson_views (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references auth.users(id) on delete cascade,
  topic_id uuid not null references public.topics(id) on delete cascade,
  topic_slug text not null,
  viewed_at timestamptz not null default now(),
  unique (student_id, topic_id)
);
create index if not exists lesson_views_student_idx on public.lesson_views (student_id);

alter table public.lesson_views enable row level security;

drop policy if exists "own lesson views" on public.lesson_views;
create policy "own lesson views" on public.lesson_views
  for all using (auth.uid() = student_id) with check (auth.uid() = student_id);

grant select, insert, update, delete on public.lesson_views to authenticated;
grant select, insert, update, delete on public.lesson_views to service_role;
