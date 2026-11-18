-- Nexora Web Dev. Academy — migration 010: public certificate verification.
-- WHY (live failure, 18 Nov 2026 ~01:40 WAT): a certificate issued live
-- (NEX-B1-2026-782233, Certificate of Completion, Level 1) showed as
-- issued and persisted on the student's own certificates page, but the
-- public verification page rejected it on both domains with
-- "No valid certificate matches that ID" — the API returned
-- {valid:false, status:"not_found"}.
-- ROOT CAUSE: the verify route reads with the ANON key
-- (getServerSupabase() with no token), but public.certificates only ever
-- had the "own certificates" SELECT policy (auth.uid() = student_id) and
-- a SELECT grant to authenticated only. The anon read therefore returned
-- zero rows for every ID. The issue route was fine — the row existed all
-- along; only the public read was blocked.
-- FIX: a public SELECT policy + a SELECT grant to anon, so the public
-- verify endpoint can read the certificate record. The verify API still
-- returns only narrow public fields (name, title, level, issue date,
-- status) — no email or private account data. The student UUIDs on the
-- row are random identifiers, not secrets. The policy uses (true) rather
-- than (status = 'valid') so a revoked certificate still reads as
-- "revoked" instead of "not found" (the verify page distinguishes them).
-- Apply in the Supabase SQL Editor, then verify:
--   select certificate_id, student_name, level_id, status
--   from public.certificates where certificate_id = 'NEX-B1-2026-782233';
--   -- expect one row, status 'valid'
-- Rerunnable: drop-if-exists / grant are idempotent.

drop policy if exists "public verify certificates" on public.certificates;
create policy "public verify certificates" on public.certificates
  for select using (true);

grant select on public.certificates to anon;
