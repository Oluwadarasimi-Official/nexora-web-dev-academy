// Verify curriculum + route + migration counts without importing TS.
// Run: node scripts/verify-counts.mjs  (exit 1 on any mismatch)
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const cur = fs.readFileSync(path.join(root, "src/lib/curriculum.ts"), "utf8");
const fail = [];
const check = (name, got, want) => {
  console.log(`${name}: ${got} (expected ${want}) ${got === want ? "OK" : "FAIL"}`);
  if (got !== want) fail.push(name);
};
// Topics: count "slug": occurrences in generated JSON (one per topic)
const topicsSection = cur.slice(cur.indexOf("export const TOPICS"), cur.indexOf("export const EXAMS"));
const slugs = (topicsSection.match(/"slug": "/g) || []).length;
check("topics", slugs, 73);
check("quiz questions (q: fields)", (topicsSection.match(/"q": "/g) || []).length, 730);
check("level-1 topics", (topicsSection.match(/"level": 1,/g) || []).length, 26);
check("level-2 topics", (topicsSection.match(/"level": 2,/g) || []).length, 25);
check("level-3 topics", (topicsSection.match(/"level": 3,/g) || []).length, 22);
check("certificate titles", (cur.match(/Certificate of|Advanced Web Development Certification/g) || []).length >= 3 ? 3 : 0, 3);
const routes = [
  "src/app/page.tsx","src/app/about/page.tsx","src/app/programme/page.tsx",
  "src/app/curriculum/page.tsx","src/app/how-it-works/page.tsx","src/app/certificates/page.tsx",
  "src/app/contact/page.tsx","src/app/register/page.tsx","src/app/login/page.tsx",
  "src/app/forgot-password/page.tsx","src/app/reset-password/page.tsx",
  "src/app/verify-certificate/page.tsx",
  "src/app/dashboard/page.tsx","src/app/dashboard/courses/page.tsx",
  "src/app/dashboard/level/[level]/page.tsx","src/app/dashboard/topic/[slug]/page.tsx",
  "src/app/dashboard/quiz/[slug]/page.tsx","src/app/dashboard/quizzes/page.tsx",
  "src/app/dashboard/exams/page.tsx",
  "src/app/dashboard/certificates/page.tsx","src/app/dashboard/progress/page.tsx",
  "src/app/dashboard/profile/page.tsx","src/app/dashboard/help/page.tsx",
  "src/app/dashboard/payment/page.tsx",
  "src/app/admin/page.tsx","src/app/admin/setup/page.tsx",
  "src/app/admin/students/page.tsx",
  "src/app/admin/codes/page.tsx","src/app/admin/certificates/page.tsx",
  "src/app/admin/curriculum/page.tsx","src/app/admin/announcements/page.tsx",
  "src/app/admin/support/page.tsx","src/app/admin/logs/page.tsx",
  "src/app/admin/settings/page.tsx",
  "src/app/api/redeem-code/route.ts",
  "src/app/api/progress/route.ts","src/app/api/lesson-view/route.ts",
  "src/app/api/complete-topic/route.ts","src/app/api/quiz-submit/route.ts",
  "src/app/api/exam-start/route.ts","src/app/api/exam-submit/route.ts",
  "src/app/api/exam-status/route.ts",
  "src/app/api/issue-certificate/route.ts","src/app/api/verify-certificate/route.ts",
  "src/app/api/admin/setup/route.ts","src/app/api/admin/exams/route.ts",
  "src/app/api/admin/codes/route.ts","src/app/api/admin/students/route.ts",
  "src/app/api/admin/certificates/route.ts",
  "src/app/api/support/route.ts","src/app/api/announcements/route.ts",
  "src/app/api/settings/route.ts","src/app/api/profile/route.ts",
  "src/app/admin/exams/page.tsx",
  "supabase/migrations/001_schema.sql","supabase/migrations/002_seed_access_codes.sql",
  "supabase/migrations/003_replace_access_codes.sql",
  "supabase/migrations/004_admin_access_and_signup_trigger.sql",
  "supabase/migrations/005_redeem_any_unused_code.sql",
  "supabase/migrations/006_student_read_quizzes.sql",
  "supabase/migrations/007_exam_persistence.sql",
  "supabase/migrations/008_student_read_settings.sql",
  "supabase/migrations/009_lesson_views.sql",
];
let missing = routes.filter((r) => !fs.existsSync(path.join(root, r)));
console.log(`routes/files checked: ${routes.length}, missing: ${missing.length}`);
if (missing.length) { console.log(missing.join("\n")); fail.push("missing files"); }
// No plaintext codes anywhere in the repo (excluding this script's own comment is fine)
// — and no Groq API key either: GROQ_API_KEY lives only in Vercel env vars.
const bad = [];
const badKeys = [];
const walk = (d) => { for (const e of fs.readdirSync(d, { withFileTypes: true })) {
  if (["node_modules", ".next", ".git"].includes(e.name)) continue;
  const p = path.join(d, e.name);
  if (e.isDirectory()) walk(p);
  else if (/\.(ts|tsx|js|mjs|sql|md|json)$/.test(e.name)) {
    const t = fs.readFileSync(p, "utf8");
    // Real codes only: the format placeholder NEX-XXXX-XXXX-XXXX is not a code.
    const hits = (t.match(/NEX-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}/g) || []).filter((m) => m !== "NEX-XXXX-XXXX-XXXX");
    if (hits.length) bad.push(p);
    if (/gsk_[A-Za-z0-9]{10,}/.test(t)) badKeys.push(p);
  } } };
walk(root);
console.log(`plaintext access codes in repo: ${bad.length} ${bad.length ? bad.join(", ") : "(clean) OK"}`);
if (bad.length) fail.push("plaintext codes");
console.log(`Groq API keys in repo: ${badKeys.length} ${badKeys.length ? badKeys.join(", ") : "(clean) OK"}`);
if (badKeys.length) fail.push("groq api key in repo");
if (fail.length) { console.error("FAILED:", fail.join(", ")); process.exit(1); }
console.log("ALL CHECKS PASSED");
