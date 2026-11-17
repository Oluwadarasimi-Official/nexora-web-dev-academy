# Discovery and Specification

## Purpose
Read the owner's Master Build Specification PDF in full and the attached official logo, and turn it into a buildable scope.

## Decisions
See the body below — decisions are recorded with what was built, not as aspirations.

## What was built
The specification was treated as authoritative: a real production platform, not a mock-up. Every requirement was kept in scope unless marked conditional. The logo was copied unchanged to public/logo.png and used at its aspect ratio. The 30 access codes from Appendix A were handled as a controlled secret: hashed with SHA-256 in a temporary process, only hashes committed. No accreditation, government or university claim is made anywhere. Payment is off-platform via WhatsApp (+234 813 938 8562); the site never receives or holds funds.

## Files changed
Specification PDF (workspace/user/files/Nexora_Web_Dev_Academy_Muse_Master_Build_Specification_4_5pwu.pdf); logo (workspace/user/files/205675_3_lkpu.png).

## Verification done
Read the PDF and logo; extracted the 73-topic curriculum list, the 30 codes, the Supabase project URL and publishable key, the target Vercel URL, and the admin-bootstrap constraint (no password in the recovered record).

## Risks / open items
The specification assumes a Supabase project the builder cannot verify from here; the parent must verify the project before applying migrations. Email confirmation setting is left as the owner configured it; the app does not silently change it.
