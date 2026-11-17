# Nexora Web Dev. Academy — Handover

**Date:** 17 November 2026
**Target live URL:** https://nexorawebdevacademy.vercel.app — **NOT live yet. Do not share it as live until the parent deploys and tests it.**
**Student portal:** https://nexorawebdevacademy.vercel.app/dashboard
**Admin portal:** https://nexorawebdevacademy.vercel.app/admin (never linked from public or student pages)
**Repo:** https://github.com/Oluwadarasimi-Official/nexora-web-dev-academy (public, created + pushed 17 Nov 2026, commit 8a5560b)

## Deployment status — 17 November 2026 (parent run, after the build)

- **GitHub: DONE.** Repo created and pushed: https://github.com/Oluwadarasimi-Official/nexora-web-dev-academy
- **Vercel: LIVE 17 Nov 2026 ~18:47 WAT.** https://nexorawebdevacademy.vercel.app serves the new app (home, curriculum, login, admin all 200; logo 200). Fixes applied by the parent after CLI login (oluwadavid2011-7798): project linked (`vercel link`, prj_X9omZ9VpKIN8tx3tNt9xtOII3p17), env vars confirmed (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` already set; `ADMIN_SETUP_TOKEN` added, Production, secret — value held by the owner only, never in this repo), SSO/deployment protection disabled (`ssoProtection: null` — it was serving the Vercel login page to everyone), project framework corrected from `null` to `nextjs` (that was the cause of the edge 404s on every URL), GitHub repo linked for auto-deploy (`vercel git connect`, production branch master — pushes to master now deploy automatically). NOTE: one approval prompt timed out during the final live checks on 17 Nov evening, so the certificate-verification API re-check did not run — re-run it before calling verification fully proven.
- **Supabase: STILL BLOCKED — owner action needed.** The stored management credential returns **HTTP 403** for project `fodwlmprqreheqiskowy` (insufficient privileges on that project), so migrations could NOT be applied from this workspace; live probe returns PGRST205 (table `public.topics` not in schema cache). **Owner action:** in the Supabase dashboard for that project, open the SQL Editor and run, in order: `supabase/migrations/001_schema.sql`, then `supabase/migrations/002_seed_access_codes.sql`, then `supabase/seed-curriculum.sql`; verify counts (topics 73, quiz questions 730, examinations 3, access codes 30 unused). Then set Auth site URL + redirect allow-list to the production domain. Until this is done the app runs in its clearly-labelled local demo mode, not connected mode.

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
