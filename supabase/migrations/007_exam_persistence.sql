-- Nexora Web Dev. Academy — migration 007: exam persistence (fix pass B).
-- WHY: exams were never persisted. exam-start returned a fake local id,
-- exam-submit never wrote an attempt, so the timer could not be enforced,
-- theory had nowhere to be graded, and certificates could never be issued
-- from a real exam pass.
-- 1. examination_attempts gains a per-attempt shuffle seed (the objective
--    answer key lives server-side only; the client only ever sees shuffled
--    options) and a theory_answers JSONB column (each theory answer plus
--    the marks the examiner awards, 0-10). The examination_questions /
--    examination_answers tables are NOT used: no question rows are seeded
--    for exams (objective questions are generated from TOPICS at runtime),
--    so there is no stable question id to reference; the attempt row
--    carries everything the examiner needs.
-- 2. examinations becomes public-read catalogue data (title, duration,
--    pass mark, instructions, rubric — no answer keys), so a signed-in
--    student can resolve the examination row for their level.
-- 3. Students may insert their own certificate rows. The issue route
--    checks eligibility first (level complete + exam passed); RLS only
--    guarantees a student can insert rows for their own id. The grant
--    already exists (004); only the policy was missing — "own
--    certificates" was select-only, so every student insert was denied.

alter table public.examination_attempts
  add column if not exists shuffle_seed text;
alter table public.examination_attempts
  add column if not exists theory_answers jsonb not null default '[]'::jsonb;

drop policy if exists "public read examinations" on public.examinations;
create policy "public read examinations" on public.examinations
  for select using (true);

drop policy if exists "own certificates insert" on public.certificates;
create policy "own certificates insert" on public.certificates
  for insert with check (auth.uid() = student_id);
