-- Nexora Web Dev. Academy — migration 006: let signed-in students read the quizzes catalogue row.
-- WHY (live bug, 17 Nov 2026): quiz-submit resolves the quiz for a topic with
--   select id from public.quizzes where topic_id = <public.topics.id UUID>
-- as the signed-in student (anon key + user Bearer token, so RLS applies).
-- public.quizzes has RLS enabled but NO select policy in any earlier migration:
-- 001 only grants select to authenticated, and a grant does NOT bypass RLS,
-- so every such select returned zero rows — no quiz_attempts row was ever
-- written, and the complete-topic gate always answered
-- "Pass the topic quiz (7/10) before completing the topic." even after a
-- 10/10 pass. (The first cause was the code lookup itself, which matched
-- quizzes.topic_id against the curriculum id "L1-T01" instead of the UUID;
-- that is fixed in the app code. This policy is the second half — without
-- it the fixed lookup still returns nothing.)
-- The quizzes row carries only topic_id + pass_mark (no questions, no
-- answers), so a student read policy is safe. quiz_questions / quiz_options
-- stay server-side only.
-- Apply in the Supabase SQL Editor (the stored management credential cannot
-- run SQL), then verify:
--   select count(*) from public.quizzes;  -- expect 73
-- The live fix is only complete once this migration is applied AND the app
-- code (quiz-submit lookup + quiz-sync + complete-topic gate) is deployed.
-- Rerunnable: drops the policy first if it already exists.

drop policy if exists "students read quizzes" on public.quizzes;
create policy "students read quizzes" on public.quizzes for select to authenticated using (true);
