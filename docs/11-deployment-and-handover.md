# Deployment and Handover

## Purpose
Hand over a deployable repo with exact owner steps and an honest tested-vs-not-tested list.

## Decisions
See the body below — decisions are recorded with what was built, not as aspirations.

## What was built
The repo is ready for the parent to create the GitHub repository and deploy to Vercel at nexdevacad.vercel.app. Deployment order: create repo → push → connect Vercel → set env vars (NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, ADMIN_SETUP_TOKEN) → apply migrations 001, 002 and the curriculum seed to the verified Supabase project → set the Supabase Auth site URL/redirects → bootstrap the first admin → verify public, student and admin flows live. The live URL must not be claimed until it has been opened and tested. HANDOVER.md is the single checklist for that work.

## Files changed
README.md, HANDOVER.md, .env.example, docs/01–11.

## Verification done
Build and count checks pass locally (see HANDOVER.md). Deployment itself was explicitly out of scope for this build step and is the parent's next action.

## Risks / open items
Risks: Vercel project ownership/domain availability for nexdevacad.vercel.app must be verified by the parent; the Supabase project must be verified before any migration is applied; the admin bootstrap needs the owner to set ADMIN_SETUP_TOKEN.
