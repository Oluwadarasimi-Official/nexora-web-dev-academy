# Nexora Web Dev. Academy — Handover

**Date:** 17 November 2026
**Target live URL:** https://nexorawebdevacademy.vercel.app — **NOT live yet. Do not share it as live until the parent deploys and tests it.**
**Student portal:** https://nexorawebdevacademy.vercel.app/dashboard
**Admin portal:** https://nexorawebdevacademy.vercel.app/admin (never linked from public or student pages)
**Repo:** https://github.com/Oluwadarasimi-Official/nexora-web-dev-academy (public, created + pushed 17 Nov 2026, commit 8a5560b)

## Deployment status — 17 November 2026 (parent run, after the build)

- **GitHub: DONE.** Repo created and pushed: https://github.com/Oluwadarasimi-Official/nexora-web-dev-academy
- **Vercel: BLOCKED — owner action needed (do not present the URL as the new app yet).** The URL https://nexorawebdevacademy.vercel.app exists under the **Tech Nova Academy** team and currently serves an old redirect page to a protected (SSO-locked) deployment — that is NOT this new build. Every Vercel operation from this workspace on that team scope returns **403 forbidden** (list_projects, get_project, get_deployment, create_git_project all tested 17 Nov 2026). The MCP connection has identity/session scopes only, `list_teams` returns empty, and no `authorize_team_access` tool exists — re-running the same calls will not fix it. The real Vercel CLI on this machine has no credentials (`vercel whoami` → logged out).
  - **Owner action (pick one):** (a) in the Vercel dashboard, open the existing `nexorawebdevacademy` project and link/import the GitHub repo `Oluwadarasimi-Official/nexora-web-dev-academy` (auto-deploy then builds every push); or (b) grant the Muse Vercel integration access to the Tech Nova Academy team; or (c) create a Vercel token (Dashboard → Account/Team Settings → Tokens) and give it to Muse through the secure entry, so the real CLI can deploy. After access is restored: set env vars `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `ADMIN_SETUP_TOKEN` (Production), deploy, then verify the live URL serves the new app (not the old redirect) and turn off deployment protection/SSO if it blocks public visitors.
- **Supabase: BLOCKED — owner action needed.** The stored management credential returns **HTTP 403** for project `fodwlmprqreheqiskowy` (insufficient privileges on that project), so migrations could NOT be applied from this workspace. **Owner action:** in the Supabase dashboard for that project, open the SQL Editor and run, in order: `supabase/migrations/001_schema.sql`, then `supabase/migrations/002_seed_access_codes.sql`, then `supabase/seed-curriculum.sql`; verify counts (topics 73, quiz questions 730, examinations 3, access codes 30 unused). Then set Auth site URL + redirect allow-list to the production domain. Until this is done the app runs in its clearly-labelled local demo mode, not connected mode.
**Supabase project:** https://fodwlmprqreheqiskowy.supabase.co (verify ownership before applying anything)

## What was built

- Public website: Home, About, Programme, Curriculum, How It Works, Certificates, Contact, Register, Login, Forgot Password, Reset Password, Verify Certificate.
- Student portal: Overview, My Courses, Beginner / Intermediate / Advanced level pages, lesson pages, quizzes, examinations, certificates, progress, profile, help & support, payment & activation, logout.
- Curriculum: **73 topics** (Beginner 26, Intermediate 25, Advanced 22), each a full lesson; **730 quiz questions** (exactly 10 per topic, 4 options each); **3 final examinations**; **3 certificate types** (Certificate of Completion; Certificate of Achievement; Advanced Web Development Certification).
- Payments + codes: off-platform WhatsApp payment, reference submission, admin approve/reject, single-use code redemption (atomic, hashed).
- Admin portal: dashboard, students, payments, codes, curriculum/quizzes/exams, certificates, announcements, support, logs, settings, one-time setup bootstrap.
- Database: `supabase/migrations/001_schema.sql` (all tables, RLS, `redeem_code()`), `supabase/migrations/002_seed_access_codes.sql` (30 code **hashes only**), `supabase/seed-curriculum.sql` (73 topics / 730 questions / 3 exams).
- Docs: `docs/01`–`docs/11` stage notes, `README.md`, this handover.

## Verified (tested)

- `node scripts/generate-curriculum.mjs` → 73 topics, 730 questions, L1 26 / L2 25 / L3 22; every topic has exactly 10 questions, every question 4 options (asserted in the script).
- `node scripts/build-seed-sql.mjs` → seed written: 73 topics, 730 questions, 3 exams.
- `node scripts/verify-counts.mjs` → all route files present; no plaintext access code (`NEX-XXXX-XXXX-XXXX`) anywhere in the repo.
- `npm run build` → **PASSED, exit code 0** (Next.js 14.2.18, 48 static/dynamic pages generated, lint + type checks passed). Build log tail is in the handover report to the parent.
- Logo copied unchanged to `public/logo.png` and used on home, About and certificates.

## NOT tested (honest list — parent must verify live)

- Supabase Auth sign-up / login / password reset against the real project (no `.env.local` with real values was created).
- Applying migrations 001 / 002 and the curriculum seed to the Supabase project.
- Code redemption against the real database (needs the applied migrations + a registered, payment-approved student).
- Exam timer across refresh/reconnection; theory grading screen (the rubric and storage exist; the admin grading UI is a documented next step).
- Certificate PDF download on a phone.
- Admin flows end-to-end (payments, code assignment, suspension, revocation).
- The Vercel deployment and the `nexorawebdevacademy.vercel.app` domain/ownership.

## Environment variable NAMES (never values)

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `ADMIN_SETUP_TOKEN` (server-only, Vercel Production)

## Deployment steps for the parent

1. Create the GitHub repo (e.g. `Oluwadarasimi-Official/nexora-web-dev-academy`) and push this directory.
2. In Vercel, create/import the project from that repo; verify the `nexorawebdevacademy.vercel.app` domain is available and owned by the right team.
3. Set the three env vars above in Vercel (Production).
4. In Supabase, verify the target project (`fodwlmprqreheqiskowy.supabase.co`), then apply in order: `001_schema.sql`, `002_seed_access_codes.sql`, `seed-curriculum.sql`. Verify with the count queries at the end of each file (topics 73, quiz questions 730, examinations 3, access codes 30 unused).
5. In Supabase Auth, set the site URL to the production domain and add the production + local redirect URLs.
6. Bootstrap the first admin: register the account at `/register`, then open `/admin/setup` with the `ADMIN_SETUP_TOKEN`.
7. Open the live URL and test: public pages → register → payment submission → admin approval → code assignment → redemption → a lesson + quiz → daily-limit behaviour → examination → certificate → public verification → admin suspend/restore and revocation.
8. Only then share the live URL as live.

## Admin bootstrap (exact)

No admin password exists or is hardcoded. Register the future admin as an ordinary student, set `ADMIN_SETUP_TOKEN` in Vercel, open `/admin/setup`, enter the email + token once. Further admins: in the Supabase SQL editor, `insert into public.user_roles (user_id, role) values ('<auth-user-uuid>', 'admin') on conflict do nothing;` — the UUID is the account's id in `auth.users` / `profiles`.

## Future operations

- **New code batch:** hash the new codes with SHA-256 (same method as migration 002), add them in a new migration — never edit 002 and never commit plaintext. Only the owner authorises a new batch.
- **Payment approvals:** verify independently outside the platform; approve/reject in `/admin/payments` with a note; assign a code only after approval.
- **Certificates:** issue only after level completion + passed examination; revoke with a reason; reissue creates a new ID and keeps the audit trail.
- **Curriculum edits:** edit `scripts/generate-curriculum.mjs`, run `node scripts/generate-curriculum.mjs`, then `node scripts/build-seed-sql.mjs`, then `node scripts/verify-counts.mjs`, then apply the matching database change.

## Known issues / open items

- Until Supabase is connected, the app runs in a clearly-labelled local demo mode (accounts/progress on the device). This is intentional and stated in the UI — it is not the connected behaviour.
- Theory exam grading UI for admins is not yet built (rubric, storage and API exist).
- Quiz questions are generated from per-topic concept banks; the academy should review wording in the admin quiz manager over time.
- Certificate download uses the browser print-to-PDF path (no extra PDF dependency).
