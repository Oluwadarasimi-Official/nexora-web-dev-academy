# Database and Supabase

## Purpose
Design the full schema with integrity constraints and least-privilege RLS, plus the atomic redemption function.

## Decisions
See the body below — decisions are recorded with what was built, not as aspirations.

## What was built
Migration 001 creates profiles, user_roles, courses, learning_levels, modules, topics, lessons, lesson_progress, daily_learning_limits, quizzes, quiz_questions, quiz_options, quiz_attempts, quiz_answers, examinations, examination_questions, examination_attempts, examination_answers, payments, access_codes, code_redemptions, certificates, certificate_verification_logs, announcements, support_requests, admin_activity_logs, academy_settings and notifications — with primary/foreign/unique keys, check constraints, indexes and timestamps. RLS is enabled on every table: public read only for catalogue content, students only their own rows, and no permissive policy at all for access_codes, user_roles, answer keys or admin logs (server-side only). redeem_code() hashes the submitted code with SHA-256, locks the row (FOR UPDATE), redeems once, and returns a status code. Migration 002 seeds exactly 30 code hashes (ON CONFLICT DO NOTHING). seed-curriculum.sql inserts the 73 topics, 730 questions and 3 examinations from the same generated source data.

## Files changed
supabase/migrations/001_schema.sql, supabase/migrations/002_seed_access_codes.sql, supabase/seed-curriculum.sql, scripts/build-seed-sql.mjs.

## Verification done
SQL syntax was written against PostgreSQL/Supabase conventions and reviewed by hand; the seed generator was run and produced 73 topics / 730 questions / 3 exams. The migrations were NOT applied to the live project (parent's step).

## Risks / open items
Migrations must be applied in order and verified with the count queries at the end of each file. Quiz/answer-key tables must never get a student-readable policy. The seed's DO blocks are idempotent for questions (skip when already seeded).
