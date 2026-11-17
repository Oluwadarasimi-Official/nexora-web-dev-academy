# Examinations and Certificates

## Purpose
Build one final examination per level and three level-specific certificates, with honest grading.

## Decisions
See the body below — decisions are recorded with what was built, not as aspirations.

## What was built
Each level has one examination (Beginner 60 min, Intermediate 75 min, Advanced 90 min; 20 objective + 3 theory; pass mark 70%). The start/expiry timestamps are server-authoritative (POST /api/exam-start), the timer is driven by them, and objective questions are auto-marked server-side. Theory answers are saved as pending grading against the published rubric — the system never fabricates theory marks, and an attempt cannot pass until theory grading is complete. Certificates use the three exact titles (Certificate of Completion; Certificate of Achievement; Advanced Web Development Certification), show academy name + logo, student name, title, level, achievement statement, issue date, unique certificate ID and both authorities, in a clean white/ivory layout with no thick verification bar. They are downloadable/printable via a print-friendly certificate page. One valid certificate per student per level (unique constraint). Public verification returns only safe public fields.

## Files changed
src/app/dashboard/exams/page.tsx, src/app/dashboard/certificates/page.tsx, src/components/CertificateView.tsx, src/app/api/exam-start/route.ts, src/app/api/exam-submit/route.ts, src/app/api/issue-certificate/route.ts, src/app/api/verify-certificate/route.ts, src/app/verify-certificate/page.tsx.

## Verification done
Build passes; exam-start/exam-submit logic reviewed for the timer and the theory-pending rule. Live end-to-end exam + certificate flow was not tested against the connected database (see HANDOVER).

## Risks / open items
Theory grading workflow is a defined rubric + admin grading step; the admin UI for grading individual theory answers is a documented next step (the API stores answers and marks; the grading screen is not yet built). Certificate PDF is via the browser print-to-PDF path, which is the standard, dependency-free route for this stack.
