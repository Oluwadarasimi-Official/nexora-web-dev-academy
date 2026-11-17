# Auth and Student Portal

## Purpose
Implement Supabase Auth registration/login/recovery and a protected student portal with honest activation gating.

## Decisions
See the body below — decisions are recorded with what was built, not as aspirations.

## What was built
Registration (full name, email, password + confirm; client and server validation; duplicate handling), login, logout, password recovery and reset via Supabase Auth. Profiles are linked to the auth user id; roles, activation, level and grades are never trusted from the client. The dashboard shows name, activation state, current level, overall progress, completed/remaining topics and today's new-topic allowance (Africa/Lagos). Navigation covers Overview, My Courses, the three level pages, My Progress, Quizzes, Examinations, My Certificates, Profile, Help & Support and Logout. Unactivated students see payment/activation instructions only — lesson content, quizzes and examinations are locked. In-app notifications are driven by real events (registration, payment, activation, quiz, exam, certificate). Support requests carry category, message, status and timestamps.

## Files changed
src/components/AuthForm.tsx, src/components/DashboardShell.tsx, src/app/(register|login|forgot-password|reset-password)/page.tsx, src/app/dashboard/**.

## Verification done
Build passes. Registration/login flows were exercised in code review against the Supabase client; live Supabase sign-up was not tested in this environment (no .env.local with real values was created, by design).

## Risks / open items
Until Supabase is connected, the portal runs in a clearly-labelled local demo mode (accounts and progress on the device). This is stated in the UI and in HANDOVER.md — it is not presented as the connected behaviour.
