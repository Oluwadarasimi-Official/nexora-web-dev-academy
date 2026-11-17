# Public Website

## Purpose
Build every public page with complete, consistent navigation and factual content.

## Decisions
See the body below — decisions are recorded with what was built, not as aspirations.

## What was built
Home (academy, 3 levels, outcomes, enrolment/payment process, rules, quiz/exam/certificate conditions, authorities, FAQs, contact), About, Learning Programme, Curriculum (all 73 topics listed by level and module), How It Works (8 steps), Certificate Information (the three exact titles and what each requires), Contact/Support, Student Registration, Student Login, Forgot Password, Password Reset, and public Certificate Verification. No admin link appears in public navigation. No accreditation or endorsement claims. The official logo is used on the home page, About page and certificates.

## Files changed
src/app/page.tsx, about, programme, curriculum, how-it-works, certificates, contact, verify-certificate; src/components/ui.tsx.

## Verification done
Every public route file exists (see scripts/verify-counts.mjs) and the production build passes, which type-checks every page.

## Risks / open items
Copy is factual and generic where the owner has not supplied specifics (no invented fees, addresses or programmes). Fees and payment methods are deliberately not stated — the academy communicates them on WhatsApp.
