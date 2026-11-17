# Nexora Web Dev. Academy — Handover

**Date:** 17 November 2026
**Target live URL:** https://nexdevacad.vercel.app — **LIVE and verified 17 Nov 2026 evening (see status below).**
**Student portal:** https://nexdevacad.vercel.app/dashboard
**Admin portal:** https://nexdevacad.vercel.app/admin (never linked from public or student pages)
**Repo:** https://github.com/Oluwadarasimi-Official/nexora-web-dev-academy (public, created + pushed 17 Nov 2026)

## Deployment status — 17 November 2026 evening (FINAL, verified live)

- **GitHub: DONE.** Repo: https://github.com/Oluwadarasimi-Official/nexora-web-dev-academy — master at `4645129` (admin live-data wiring). Pushes to master auto-deploy via Vercel.
- **Vercel: LIVE.** https://nexdevacad.vercel.app serves UI v4 (real light glassmorphism on the standard champagne-gold + sky-blue layout, circular cropped logo top-left only, FAQ in the sliding sidebar). Home, curriculum, login, register, verify-certificate, admin, how-it-works, certificates all 200; logo-circle.png 200. Project `prj_X9omZ9VpKIN8tx3tNt9xtOII3p17`, team Tech Nova Academy. Env vars set (Production): `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `ADMIN_SETUP_TOKEN` (secret — value held by the owner only, never in this repo). SSO/deployment protection disabled; framework `nextjs`; GitHub auto-deploy linked (branch master).
- **Supabase: CONNECTED — all migrations applied live in the dashboard SQL Editor 17 Nov 2026 evening (owner-approved).** Project `fodwlmprqreheqiskowy.supabase.co`. Applied in order: `000_drop_legacy_schema.sql` (dropped the 15 legacy tables from an earlier incompatible build — owner-approved wipe), `001_schema.sql`, `003_replace_access_codes.sql` (fresh batch-2 codes, hashes only), seed chunks `seed-01`–`seed-07` (statement-safe regeneration; the original byte-split chunks could not run standalone), `004_admin_access_and_signup_trigger.sql` (admin RLS policies + grants + correct signup trigger). Migration `002_seed_access_codes.sql` was NEVER run — superseded by 003, do not run it. Final verification (SQL Editor + independent REST probe): topics **73**, quiz questions **730**, examinations **3**, unused access codes **30**, redemptions **0**, admin policies **23**, admin accounts **1**. Two defects found and fixed during the run: a leftover old-build trigger `handle_new_academy_user()` that broke registration (now correct in 004), and the seed chunks splitting mid-statement (regenerated dollar-quote-aware).
- **Admin: SINGLE login, created and verified live.** davidoluwadarasimi011@gmail.com — registered at /register, promoted to admin, signed in at /login and opened /admin with no error. Exactly 1 profile, 1 admin. The admin portal is wired to live data (all 10 pages read the real tables via session-token API routes + `requireAdmin` guard + migration 004 policies); verified live signed-in: dashboard shows Registered Students 1, Activated 0, Pending Payments 0, Codes Total 30 / Unused 30 / Redeemed 0, Certificates 0; students page lists the 1 student; payments 0; codes list 30 unused; sidebar FAQ expands. `/api/admin/setup` now requires a signed-in admin + the token (the old anon-key lookup always failed under RLS).
- **Certificate verification API: PROVEN LIVE 17 Nov evening.** `POST /api/verify-certificate` with an unknown ID returns `{"valid":false,"status":"not_found"}` HTTP 200.

## Environment variable NAMES (never values)

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `ADMIN_SETUP_TOKEN` (server-only, Vercel Production)

## Deployment steps for the parent

1. Create the GitHub repo (e.g. `Oluwadarasimi-Official/nexora-web-dev-academy`) and push this directory.
2. In Vercel, create/import the project from that repo; verify the `nexdevacad.vercel.app` domain is available and owned by the right team.
3. Set the three env vars above in Vercel (Production).
4. In Supabase, verify the target project (`fodwlmprqreheqiskowy.supabase.co`), then apply in order: `000_drop_legacy_schema.sql` (only if legacy tables from an earlier build block 001), `001_schema.sql`, `003_replace_access_codes.sql`, seed chunks `seed-01`–`seed-07`, `004_admin_access_and_signup_trigger.sql`. NEVER run `002_seed_access_codes.sql` (superseded by 003). Verify with the count queries at the end of each file (topics 73, quiz questions 730, examinations 3, access codes 30 unused, admin policies 23, admin accounts 1).
5. In Supabase Auth, set the site URL to the production domain and add the production + local redirect URLs. (Email confirmation behaviour: the owner admin signed in with no confirmation step on 17 Nov 2026.)
6. Bootstrap the first admin: register the account at `/register`, then open `/admin/setup` signed in with the `ADMIN_SETUP_TOKEN`. (Done 17 Nov 2026 for davidoluwadarasimi011@gmail.com — the single admin. Further admins only via the SQL step below, and only if the owner authorises a second admin.)
7. Open the live URL and test: public pages → register → payment submission → admin approval → code assignment → redemption → a lesson + quiz → daily-limit behaviour → examination → certificate → public verification → admin suspend/restore and revocation. (Done for: public pages, register, admin login, admin dashboard/students/payments/codes live data, sidebar FAQ, verify-certificate API. Still to test live with a real student: payment submission → approval → code assignment → redemption → lesson + quiz → exam → certificate.)
8. Only then share the live URL as live.

## Admin bootstrap (exact)

No admin password exists or is hardcoded. The single admin (davidoluwadarasimi011@gmail.com) is already created and verified — do not create another admin unless the owner explicitly authorises it. `/api/admin/setup` now requires a signed-in admin + the token. Further admins (owner-authorised only): in the Supabase SQL editor, `insert into public.user_roles (user_id, role) values ('<auth-user-uuid>', 'admin') on conflict do nothing;` — the UUID is the account's id in `auth.users` / `profiles`.

## Future operations

- **New code batch:** hash the new codes with SHA-256 (same method as migration 003), add them in a new migration that wipes the old batch first — never edit 003 and never commit plaintext. Only the owner authorises a new batch. Current batch: batch 2 (30 codes, migration 003, applied 17 Nov 2026; plaintext list held privately by the owner only).
- **Payment approvals:** verify independently outside the platform; approve/reject in `/admin/payments` with a note; assign a code only after approval.
- **Certificates:** issue only after level completion + passed examination; revoke with a reason; reissue creates a new ID and keeps the audit trail.
- **Curriculum edits:** edit `scripts/generate-curriculum.mjs`, run `node scripts/generate-curriculum.mjs`, then `node scripts/build-seed-sql.mjs`, then `node scripts/verify-counts.mjs`, then apply the matching database change.

## Known issues / open items

- Theory exam grading UI for admins is not yet built (rubric, storage and API exist).
- `academy_settings` values are read/edited in /admin/settings, but no server code enforces them yet (quiz/exam marking still enforces 7/10 and 70% in code).
- Logged-in student flows (lesson, quiz, exam, certificate issue, redemption) are verified by build + code only so far — a live run with a real student (payment → approval → code → lesson → quiz → exam → certificate) is still owed.
- Quiz questions are generated from per-topic concept banks; the academy should review wording in the admin quiz manager over time.
- Certificate download uses the browser print-to-PDF path (no extra PDF dependency).
