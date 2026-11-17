# Curriculum and Quizzes

## Purpose
Build the complete 73-topic curriculum with real lessons and exactly 10 questions per topic.

## Decisions
See the body below — decisions are recorded with what was built, not as aspirations.

## What was built
A generator (scripts/generate-curriculum.mjs) holds per-topic source data — focus, two key concepts and a real, correct code example per topic — and expands it into a full lesson (objectives, explanation, worked example + explanation, practical activity, common mistakes + corrections, recap) and 10 distinct multiple-choice questions with explanations. Counts verified: Level 1 = 26, Level 2 = 25, Level 3 = 22; 73 topics; 730 questions; 4 options per question; pass mark 7/10. Quizzes are served without answer keys (publicQuestions strips them) and marked server-side in POST /api/quiz-submit; every attempt is saved with score, pass/fail and timestamp. Failed quizzes do not complete a topic.

## Files changed
scripts/generate-curriculum.mjs, src/lib/curriculum.ts, src/app/dashboard/topic/[slug]/page.tsx, src/app/dashboard/quiz/[slug]/page.tsx, src/app/api/quiz-submit/route.ts, scripts/verify-counts.mjs.

## Verification done
node scripts/generate-curriculum.mjs → 73 topics / 730 questions, counts asserted in the script; node scripts/verify-counts.mjs checks the generated file and every route. The build passes.

## Risks / open items
Questions are generated from per-topic concept banks with shared templates for some stems; the academy should review the question bank in the admin quiz manager and refine wording over time. The generator is the place to do that — edit it, regenerate, re-verify.
