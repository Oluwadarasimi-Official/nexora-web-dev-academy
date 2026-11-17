# Security and QA

## Purpose
Apply least-privilege security throughout and verify the build honestly.

## Decisions
See the body below — decisions are recorded with what was built, not as aspirations.

## What was built
Server-side role checks on every privileged route; RLS on all tables; no service-role key in the codebase; secrets only in server env vars; input validation and sanitisation on API routes; in-memory rate limiting on login/code-redemption/verification endpoints; answer keys never shipped to students; daily limit enforced server-side; redemption and certificate issuance protected by database constraints; audit logging for payment, code, suspension, grading and certificate actions; no passwords, tokens or full codes in logs. Quality gate: npm run build must pass (real exit code), curriculum counts verified by script, every route file checked, and the repo scanned for plaintext codes. Known limits are recorded in HANDOVER.md rather than hidden.

## Files changed
All API routes; supabase/migrations/001_schema.sql; scripts/verify-counts.mjs.

## Verification done
npm run build (result recorded in HANDOVER.md); node scripts/verify-counts.mjs (73/730/3 + all routes + no plaintext codes).

## Risks / open items
Not yet tested live: Supabase Auth sign-up/login, migration application, redemption against the real database, exam timer across refresh, certificate PDF on a phone, and admin flows end-to-end. These are listed as the parent's verification steps in HANDOVER.md.
