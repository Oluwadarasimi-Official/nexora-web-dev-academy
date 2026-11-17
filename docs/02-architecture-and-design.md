# Architecture and Design

## Purpose
Choose the stack, the route map, and the visual system, and keep the design restrained and professional.

## Decisions
See the body below — decisions are recorded with what was built, not as aspirations.

## What was built
Next.js 14 App Router + React + TypeScript + Tailwind; Supabase Auth + PostgreSQL + RLS; Vercel hosting. Server-side marking for quizzes and examinations; answer keys never shipped to the student. Client components for interactive flows, API routes for privileged operations, Postgres functions for race-sensitive redemption. Design: light ivory/white foundation (#fffdf5), champagne gold (#c9a227), sky blue (#1e6fd9), dark navy text (#0a2a5e). No dark theme, no neon, no glassmorphism, no excessive gradients. Shared Header/Footer, one Card/Alert/Button system, responsive from small phones to desktop, focus states and loading/empty/error states throughout.

## Files changed
src/app/layout.tsx, src/app/globals.css, tailwind.config.ts, src/components/ui.tsx, src/lib/data.ts.

## Verification done
Visual system defined in globals.css and tailwind.config.ts; header/footer and shared components render on every page; no horizontal overflow by design (max-w-6xl containers, wrapping text).

## Risks / open items
Design is deliberately restrained; the owner may request a richer visual pass later, but any change must keep the logo unchanged and the layout overlap-free.
