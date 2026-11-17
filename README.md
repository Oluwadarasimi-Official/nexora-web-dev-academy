# Nexora Web Dev. Academy

A production-ready online learning platform: public website, student learning portal, administrator portal, payments and single-use access codes, a complete 3-level curriculum, examinations, and three level-specific certificates.

- **Live target:** https://nexdevacad.vercel.app (deploy from this repo; not live until the parent deploys it)
- **Stack:** Next.js 14 (App Router), React, TypeScript, Tailwind CSS, Supabase Auth + PostgreSQL + RLS, Vercel
- **Academy authorities:** Official Darax & Official Obafemix
- **Payment contact:** +234 813 938 8562 (WhatsApp — payment happens outside the platform)

## Quick start

```bash
npm install
cp .env.example .env.local   # fill in the real values (see below)
npm run dev                  # http://localhost:3000
npm run build                # production build (must pass)
node scripts/verify-counts.mjs
```

## Environment variables (names only — never commit values)

| Variable | Where | Purpose |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Vercel + `.env.local` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Vercel + `.env.local` | Supabase publishable (anon) key |
| `ADMIN_SETUP_TOKEN` | Vercel only (Production, server-only) | One-time admin bootstrap token |

No service-role key is used anywhere in this codebase. No admin password is hardcoded.

## Curriculum

73 topics (Beginner 26, Intermediate 25, Advanced 22), each with a full lesson and exactly 10 quiz questions (730 total), plus 3 final examinations. Source data: `scripts/generate-curriculum.mjs` → generated `src/lib/curriculum.ts`. Regenerate with `node scripts/generate-curriculum.mjs`, then `node scripts/build-seed-sql.mjs` for the database seed.

## Database

Apply in order, in the Supabase SQL editor, after verifying the target project:

1. `supabase/migrations/001_schema.sql` — all tables, RLS, `redeem_code()` RPC
2. `supabase/migrations/002_seed_access_codes.sql` — 30 access-code **hashes only** (no plaintext anywhere in this repo)
3. `supabase/seed-curriculum.sql` — levels, modules, topics, lessons, quizzes, examinations

Then set the Supabase Auth site URL and redirect allow-list to the production domain.

## Admin bootstrap

1. Register the future admin as an ordinary student at `/register`.
2. Set `ADMIN_SETUP_TOKEN` in Vercel (Production, server-only).
3. Open `/admin/setup`, enter the email + token once.
4. That account can then open `/admin`. Further admins: see `HANDOVER.md` (SQL step).

## Key rules enforced by the system

- 3 new topics per student per calendar day (Africa/Lagos), enforced server-side in `POST /api/complete-topic`.
- Quiz pass mark 7/10; topic completes only after a passed quiz.
- Levels unlock in order; examinations open only when the level is complete.
- Certificates only after a passed examination; one valid certificate per student per level.
- Access codes: one code, one student, one use; atomic redemption; hashes only.
- Theory exam answers are never auto-marked — they are graded by an authorised examiner against the published rubric.

## Docs

Stage notes in `docs/` (01–11) and `HANDOVER.md`. Read `HANDOVER.md` first for the deployment checklist and the honest tested-vs-not-tested list.
