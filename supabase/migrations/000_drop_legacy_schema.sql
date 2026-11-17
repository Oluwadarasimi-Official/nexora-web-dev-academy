-- Nexora Web Dev. Academy — migration 000: drop the LEGACY schema (owner-authorised reset).
-- WHY: the Supabase project already holds 15 tables from an earlier, incompatible
-- build (course_levels, course_modules, course_topics, exam_sessions, exam_submissions,
-- lesson_content, payment_submissions, student_topic_progress, topic_attempts,
-- audit_logs, plus old-shape profiles / access_codes / certificates / announcements /
-- quiz_questions). Migration 001 fails on them (e.g. old profiles has no email column,
-- so the profiles_email_idx index errors 42703) and the current app cannot read them
-- (different table names/shapes). This file clears ONLY those legacy tables so 001 can
-- create the current schema cleanly. Run this FIRST, then 001, then 003, then the
-- seed chunks. The live app has no real students yet (profiles = 0 rows; nothing to
-- preserve). Do NOT run this after real students/payments exist.
-- Verified baseline (17 Nov 2026, dashboard): access_codes 30 rows, quiz_questions
-- 700 rows, course_topics 70 rows, profiles 0 rows — all legacy, all superseded.

drop table if exists public.access_codes cascade;
drop table if exists public.announcements cascade;
drop table if exists public.audit_logs cascade;
drop table if exists public.certificates cascade;
drop table if exists public.course_levels cascade;
drop table if exists public.course_modules cascade;
drop table if exists public.course_topics cascade;
drop table if exists public.exam_sessions cascade;
drop table if exists public.exam_submissions cascade;
drop table if exists public.lesson_content cascade;
drop table if exists public.payment_submissions cascade;
drop table if exists public.profiles cascade;
drop table if exists public.quiz_questions cascade;
drop table if exists public.student_topic_progress cascade;
drop table if exists public.topic_attempts cascade;

-- Verification: SELECT count(*) FROM information_schema.tables
--   WHERE table_schema = 'public'; -- expect 0 (before 001 runs)
