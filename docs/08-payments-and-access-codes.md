# Payments and Access Codes

## Purpose
Implement off-platform payment verification and secure single-use code redemption.

## Decisions
See the body below — decisions are recorded with what was built, not as aspirations.

## What was built
Payment is outside the platform (WhatsApp). The student submits a reference; it stays pending; an administrator approves or rejects it with a reason and timestamp; only after approval is a code assigned; the student redeems it on the activation screen. Redemption is atomic via redeem_code(): SHA-256 hash lookup, row lock, one redemption per code, one activation per student, unique constraints as the final boundary. Only hashes are stored — migration 002 contains 30 SHA-256 hashes and no plaintext. Plaintext codes exist only in the owner's confidential PDF. Unused codes are never shown to students and never appear in logs, URLs or error messages. If all 30 are redeemed, activation is blocked with a contact-admin message; only the owner may authorise a new batch.

## Files changed
src/app/dashboard/payment/page.tsx, src/app/api/submit-payment/route.ts, src/app/api/redeem-code/route.ts, src/app/api/admin/payments/route.ts, src/app/api/admin/codes/route.ts, supabase/migrations/001_schema.sql (redeem_code), supabase/migrations/002_seed_access_codes.sql.

## Verification done
Hashes were generated from the Appendix A list in a temporary process and verified: 30 inserts, no plaintext string matching NEX-XXXX in the repo (checked by scripts/verify-counts.mjs). Redemption logic was reviewed; live redemption was not tested against the database (parent's step).

## Risks / open items
The owner must keep the plaintext list restricted. If the PDF is ever forwarded beyond the authorised team, treat the batch as exposed and generate a replacement batch before any code is redeemed.
