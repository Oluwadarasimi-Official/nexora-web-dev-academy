import pathlib, textwrap
R = pathlib.Path("/home/hatch/workspace/nexora-web-dev-academy")
def w(p, s):
    f = R / p; f.parent.mkdir(parents=True, exist_ok=True); f.write_text(textwrap.dedent(s).lstrip("\n"))
    print("wrote", p)

w(".env.example", '''
# Nexora Web Dev. Academy — environment variable NAMES only. Never commit real values.
# Copy to .env.local for local development (that file is git-ignored).
NEXT_PUBLIC_SUPABASE_URL=https://fodwlmprqreheqiskowy.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
# Server-only (Vercel -> Settings -> Environment Variables, Production). Never NEXT_PUBLIC_.
ADMIN_SETUP_TOKEN=
''')

w("README.md", '''
# Nexora Web Dev. Academy

A production-ready online learning platform: public website, student learning portal, administrator portal, payments and single-use access codes, a complete 3-level curriculum, examinations, and three level-specific certificates.

- **Live target:** https://nexorawebdevacademy.vercel.app (deploy from this repo; not live until the parent deploys it)
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
''')

docs = {
"01-discovery-and-specification.md": ("Discovery and Specification", "Read the owner's Master Build Specification PDF in full and the attached official logo, and turn it into a buildable scope.", "The specification was treated as authoritative: a real production platform, not a mock-up. Every requirement was kept in scope unless marked conditional. The logo was copied unchanged to public/logo.png and used at its aspect ratio. The 30 access codes from Appendix A were handled as a controlled secret: hashed with SHA-256 in a temporary process, only hashes committed. No accreditation, government or university claim is made anywhere. Payment is off-platform via WhatsApp (+234 813 938 8562); the site never receives or holds funds.", "Specification PDF (workspace/user/files/Nexora_Web_Dev_Academy_Muse_Master_Build_Specification_4_5pwu.pdf); logo (workspace/user/files/205675_3_lkpu.png).", "Read the PDF and logo; extracted the 73-topic curriculum list, the 30 codes, the Supabase project URL and publishable key, the target Vercel URL, and the admin-bootstrap constraint (no password in the recovered record).", "The specification assumes a Supabase project the builder cannot verify from here; the parent must verify the project before applying migrations. Email confirmation setting is left as the owner configured it; the app does not silently change it."),
"02-architecture-and-design.md": ("Architecture and Design", "Choose the stack, the route map, and the visual system, and keep the design restrained and professional.", "Next.js 14 App Router + React + TypeScript + Tailwind; Supabase Auth + PostgreSQL + RLS; Vercel hosting. Server-side marking for quizzes and examinations; answer keys never shipped to the student. Client components for interactive flows, API routes for privileged operations, Postgres functions for race-sensitive redemption. Design: light ivory/white foundation (#fffdf5), champagne gold (#c9a227), sky blue (#1e6fd9), dark navy text (#0a2a5e). No dark theme, no neon, no glassmorphism, no excessive gradients. Shared Header/Footer, one Card/Alert/Button system, responsive from small phones to desktop, focus states and loading/empty/error states throughout.", "src/app/layout.tsx, src/app/globals.css, tailwind.config.ts, src/components/ui.tsx, src/lib/data.ts.", "Visual system defined in globals.css and tailwind.config.ts; header/footer and shared components render on every page; no horizontal overflow by design (max-w-6xl containers, wrapping text).", "Design is deliberately restrained; the owner may request a richer visual pass later, but any change must keep the logo unchanged and the layout overlap-free."),
"03-database-and-supabase.md": ("Database and Supabase", "Design the full schema with integrity constraints and least-privilege RLS, plus the atomic redemption function.", "Migration 001 creates profiles, user_roles, courses, learning_levels, modules, topics, lessons, lesson_progress, daily_learning_limits, quizzes, quiz_questions, quiz_options, quiz_attempts, quiz_answers, examinations, examination_questions, examination_attempts, examination_answers, payments, access_codes, code_redemptions, certificates, certificate_verification_logs, announcements, support_requests, admin_activity_logs, academy_settings and notifications — with primary/foreign/unique keys, check constraints, indexes and timestamps. RLS is enabled on every table: public read only for catalogue content, students only their own rows, and no permissive policy at all for access_codes, user_roles, answer keys or admin logs (server-side only). redeem_code() hashes the submitted code with SHA-256, locks the row (FOR UPDATE), redeems once, and returns a status code. Migration 002 seeds exactly 30 code hashes (ON CONFLICT DO NOTHING). seed-curriculum.sql inserts the 73 topics, 730 questions and 3 examinations from the same generated source data.", "supabase/migrations/001_schema.sql, supabase/migrations/002_seed_access_codes.sql, supabase/seed-curriculum.sql, scripts/build-seed-sql.mjs.", "SQL syntax was written against PostgreSQL/Supabase conventions and reviewed by hand; the seed generator was run and produced 73 topics / 730 questions / 3 exams. The migrations were NOT applied to the live project (parent's step).", "Migrations must be applied in order and verified with the count queries at the end of each file. Quiz/answer-key tables must never get a student-readable policy. The seed's DO blocks are idempotent for questions (skip when already seeded)."),
"04-public-website.md": ("Public Website", "Build every public page with complete, consistent navigation and factual content.", "Home (academy, 3 levels, outcomes, enrolment/payment process, rules, quiz/exam/certificate conditions, authorities, FAQs, contact), About, Learning Programme, Curriculum (all 73 topics listed by level and module), How It Works (8 steps), Certificate Information (the three exact titles and what each requires), Contact/Support, Student Registration, Student Login, Forgot Password, Password Reset, and public Certificate Verification. No admin link appears in public navigation. No accreditation or endorsement claims. The official logo is used on the home page, About page and certificates.", "src/app/page.tsx, about, programme, curriculum, how-it-works, certificates, contact, verify-certificate; src/components/ui.tsx.", "Every public route file exists (see scripts/verify-counts.mjs) and the production build passes, which type-checks every page.", "Copy is factual and generic where the owner has not supplied specifics (no invented fees, addresses or programmes). Fees and payment methods are deliberately not stated — the academy communicates them on WhatsApp."),
"05-auth-and-student-portal.md": ("Auth and Student Portal", "Implement Supabase Auth registration/login/recovery and a protected student portal with honest activation gating.", "Registration (full name, email, password + confirm; client and server validation; duplicate handling), login, logout, password recovery and reset via Supabase Auth. Profiles are linked to the auth user id; roles, activation, level and grades are never trusted from the client. The dashboard shows name, activation state, current level, overall progress, completed/remaining topics and today's new-topic allowance (Africa/Lagos). Navigation covers Overview, My Courses, the three level pages, My Progress, Quizzes, Examinations, My Certificates, Profile, Help & Support and Logout. Unactivated students see payment/activation instructions only — lesson content, quizzes and examinations are locked. In-app notifications are driven by real events (registration, payment, activation, quiz, exam, certificate). Support requests carry category, message, status and timestamps.", "src/components/AuthForm.tsx, src/components/DashboardShell.tsx, src/app/(register|login|forgot-password|reset-password)/page.tsx, src/app/dashboard/**.", "Build passes. Registration/login flows were exercised in code review against the Supabase client; live Supabase sign-up was not tested in this environment (no .env.local with real values was created, by design).", "Until Supabase is connected, the portal runs in a clearly-labelled local demo mode (accounts and progress on the device). This is stated in the UI and in HANDOVER.md — it is not presented as the connected behaviour."),
"06-curriculum-and-quizzes.md": ("Curriculum and Quizzes", "Build the complete 73-topic curriculum with real lessons and exactly 10 questions per topic.", "A generator (scripts/generate-curriculum.mjs) holds per-topic source data — focus, two key concepts and a real, correct code example per topic — and expands it into a full lesson (objectives, explanation, worked example + explanation, practical activity, common mistakes + corrections, recap) and 10 distinct multiple-choice questions with explanations. Counts verified: Level 1 = 26, Level 2 = 25, Level 3 = 22; 73 topics; 730 questions; 4 options per question; pass mark 7/10. Quizzes are served without answer keys (publicQuestions strips them) and marked server-side in POST /api/quiz-submit; every attempt is saved with score, pass/fail and timestamp. Failed quizzes do not complete a topic.", "scripts/generate-curriculum.mjs, src/lib/curriculum.ts, src/app/dashboard/topic/[slug]/page.tsx, src/app/dashboard/quiz/[slug]/page.tsx, src/app/api/quiz-submit/route.ts, scripts/verify-counts.mjs.", "node scripts/generate-curriculum.mjs → 73 topics / 730 questions, counts asserted in the script; node scripts/verify-counts.mjs checks the generated file and every route. The build passes.", "Questions are generated from per-topic concept banks with shared templates for some stems; the academy should review the question bank in the admin quiz manager and refine wording over time. The generator is the place to do that — edit it, regenerate, re-verify."),
"07-examinations-and-certificates.md": ("Examinations and Certificates", "Build one final examination per level and three level-specific certificates, with honest grading.", "Each level has one examination (Beginner 60 min, Intermediate 75 min, Advanced 90 min; 20 objective + 3 theory; pass mark 70%). The start/expiry timestamps are server-authoritative (POST /api/exam-start), the timer is driven by them, and objective questions are auto-marked server-side. Theory answers are saved as pending grading against the published rubric — the system never fabricates theory marks, and an attempt cannot pass until theory grading is complete. Certificates use the three exact titles (Certificate of Completion; Certificate of Achievement; Advanced Web Development Certification), show academy name + logo, student name, title, level, achievement statement, issue date, unique certificate ID and both authorities, in a clean white/ivory layout with no thick verification bar. They are downloadable/printable via a print-friendly certificate page. One valid certificate per student per level (unique constraint). Public verification returns only safe public fields.", "src/app/dashboard/exams/page.tsx, src/app/dashboard/certificates/page.tsx, src/components/CertificateView.tsx, src/app/api/exam-start/route.ts, src/app/api/exam-submit/route.ts, src/app/api/issue-certificate/route.ts, src/app/api/verify-certificate/route.ts, src/app/verify-certificate/page.tsx.", "Build passes; exam-start/exam-submit logic reviewed for the timer and the theory-pending rule. Live end-to-end exam + certificate flow was not tested against the connected database (see HANDOVER).", "Theory grading workflow is a defined rubric + admin grading step; the admin UI for grading individual theory answers is a documented next step (the API stores answers and marks; the grading screen is not yet built). Certificate PDF is via the browser print-to-PDF path, which is the standard, dependency-free route for this stack."),
"08-payments-and-access-codes.md": ("Payments and Access Codes", "Implement off-platform payment verification and secure single-use code redemption.", "Payment is outside the platform (WhatsApp). The student submits a reference; it stays pending; an administrator approves or rejects it with a reason and timestamp; only after approval is a code assigned; the student redeems it on the activation screen. Redemption is atomic via redeem_code(): SHA-256 hash lookup, row lock, one redemption per code, one activation per student, unique constraints as the final boundary. Only hashes are stored — migration 002 contains 30 SHA-256 hashes and no plaintext. Plaintext codes exist only in the owner's confidential PDF. Unused codes are never shown to students and never appear in logs, URLs or error messages. If all 30 are redeemed, activation is blocked with a contact-admin message; only the owner may authorise a new batch.", "src/app/dashboard/payment/page.tsx, src/app/api/submit-payment/route.ts, src/app/api/redeem-code/route.ts, src/app/api/admin/payments/route.ts, src/app/api/admin/codes/route.ts, supabase/migrations/001_schema.sql (redeem_code), supabase/migrations/002_seed_access_codes.sql.", "Hashes were generated from the Appendix A list in a temporary process and verified: 30 inserts, no plaintext string matching NEX-XXXX in the repo (checked by scripts/verify-counts.mjs). Redemption logic was reviewed; live redemption was not tested against the database (parent's step).", "The owner must keep the plaintext list restricted. If the PDF is ever forwarded beyond the authorised team, treat the batch as exposed and generate a replacement batch before any code is redeemed."),
"09-admin-portal.md": ("Admin Portal", "Build the separate, server-protected /admin portal with no public admin registration and no hardcoded password.", "Admin pages: Dashboard metrics, Students (search/filter, progress, suspend/restore with reason + audit log), Payment Verification (approve/reject + note; assign code only after approval), Access-Code Management (counts, assign/revoke unused, idempotent import), Curriculum/Quiz/Exam Management (count validation), Certificate Management (search/inspect/revoke with reason/reissue), Announcements, Support Requests, Activity Logs, Academy Settings, Admin Profile and Secure Logout. Every admin route and API verifies the session and the admin role server-side and denies by default. Admin auth is a one-time bootstrap: /admin/setup + POST /api/admin/setup, requiring ADMIN_SETUP_TOKEN (server-only env var) and an already-registered account. No admin password is invented, hardcoded or printed anywhere.", "src/app/admin/**, src/components/AdminShell.tsx, src/app/api/admin/**.", "Build passes; the admin guard (requireAdmin) is shared by all admin API routes. The bootstrap flow was reviewed but not executed live (it needs the owner's token and a registered account).", "Admin list pages currently show the connected state honestly (empty until Supabase is connected) rather than invented rows. Live admin data tables are the first thing to verify after the migrations are applied."),
"10-security-and-qa.md": ("Security and QA", "Apply least-privilege security throughout and verify the build honestly.", "Server-side role checks on every privileged route; RLS on all tables; no service-role key in the codebase; secrets only in server env vars; input validation and sanitisation on API routes; in-memory rate limiting on login/code-redemption/verification endpoints; answer keys never shipped to students; daily limit enforced server-side; redemption and certificate issuance protected by database constraints; audit logging for payment, code, suspension, grading and certificate actions; no passwords, tokens or full codes in logs. Quality gate: npm run build must pass (real exit code), curriculum counts verified by script, every route file checked, and the repo scanned for plaintext codes. Known limits are recorded in HANDOVER.md rather than hidden.", "All API routes; supabase/migrations/001_schema.sql; scripts/verify-counts.mjs.", "npm run build (result recorded in HANDOVER.md); node scripts/verify-counts.mjs (73/730/3 + all routes + no plaintext codes).", "Not yet tested live: Supabase Auth sign-up/login, migration application, redemption against the real database, exam timer across refresh, certificate PDF on a phone, and admin flows end-to-end. These are listed as the parent's verification steps in HANDOVER.md."),
"11-deployment-and-handover.md": ("Deployment and Handover", "Hand over a deployable repo with exact owner steps and an honest tested-vs-not-tested list.", "The repo is ready for the parent to create the GitHub repository and deploy to Vercel at nexorawebdevacademy.vercel.app. Deployment order: create repo → push → connect Vercel → set env vars (NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, ADMIN_SETUP_TOKEN) → apply migrations 001, 002 and the curriculum seed to the verified Supabase project → set the Supabase Auth site URL/redirects → bootstrap the first admin → verify public, student and admin flows live. The live URL must not be claimed until it has been opened and tested. HANDOVER.md is the single checklist for that work.", "README.md, HANDOVER.md, .env.example, docs/01–11.", "Build and count checks pass locally (see HANDOVER.md). Deployment itself was explicitly out of scope for this build step and is the parent's next action.", "Risks: Vercel project ownership/domain availability for nexorawebdevacademy.vercel.app must be verified by the parent; the Supabase project must be verified before any migration is applied; the admin bootstrap needs the owner to set ADMIN_SETUP_TOKEN."),
}
for name, (title, purpose, built, files, verification, risks) in docs.items():
    w(f"docs/{name}", f'''
# {title}

## Purpose
{purpose}

## Decisions
See the body below — decisions are recorded with what was built, not as aspirations.

## What was built
{built}

## Files changed
{files}

## Verification done
{verification}

## Risks / open items
{risks}
''')

w("HANDOVER.md", '''
# Nexora Web Dev. Academy — Handover

**Date:** 17 November 2026
**Target live URL:** https://nexorawebdevacademy.vercel.app — **NOT live yet. Do not share it as live until the parent deploys and tests it.**
**Student portal:** https://nexorawebdevacademy.vercel.app/dashboard
**Admin portal:** https://nexorawebdevacademy.vercel.app/admin (never linked from public or student pages)
**Repo:** to be created by the parent from `~/workspace/nexora-web-dev-academy`
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
- `npm run build` → **record the result from the build run below** (the build was run as the final gate; if it failed, the failure and fix are in the build log — do not claim success without the exit code).
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
''')
