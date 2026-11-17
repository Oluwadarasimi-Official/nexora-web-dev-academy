# Admin Portal

## Purpose
Build the separate, server-protected /admin portal with no public admin registration and no hardcoded password.

## Decisions
See the body below — decisions are recorded with what was built, not as aspirations.

## What was built
Admin pages: Dashboard metrics, Students (search/filter, progress, suspend/restore with reason + audit log), Payment Verification (approve/reject + note; assign code only after approval), Access-Code Management (counts, assign/revoke unused, idempotent import), Curriculum/Quiz/Exam Management (count validation), Certificate Management (search/inspect/revoke with reason/reissue), Announcements, Support Requests, Activity Logs, Academy Settings, Admin Profile and Secure Logout. Every admin route and API verifies the session and the admin role server-side and denies by default. Admin auth is a one-time bootstrap: /admin/setup + POST /api/admin/setup, requiring ADMIN_SETUP_TOKEN (server-only env var) and an already-registered account. No admin password is invented, hardcoded or printed anywhere.

## Files changed
src/app/admin/**, src/components/AdminShell.tsx, src/app/api/admin/**.

## Verification done
Build passes; the admin guard (requireAdmin) is shared by all admin API routes. The bootstrap flow was reviewed but not executed live (it needs the owner's token and a registered account).

## Risks / open items
Admin list pages currently show the connected state honestly (empty until Supabase is connected) rather than invented rows. Live admin data tables are the first thing to verify after the migrations are applied.
