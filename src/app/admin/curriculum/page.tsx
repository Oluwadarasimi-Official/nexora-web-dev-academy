import AdminShell from "@/components/AdminShell";
import { Card } from "@/components/ui";
export default function Page() {
 return (
 <AdminShell title="Curriculum, Quiz & Exam Management" intro="73 topics, 10 questions per topic, 3 level examinations. Validate counts before publishing any change.">
 <Card>
 <h3 className="font-bold text-navy">Curriculum inventory (from src/lib/curriculum.ts)</h3>
 <p className="mt-2 text-sm text-slate-600">Level 1 Beginner — 26 topics · Level 2 Intermediate — 25 topics · Level 3 Advanced — 22 topics · Total 73 topics · 730 quiz questions (10 per topic, 4 options each) · 3 final examinations.</p>
 <p className="mt-2 text-sm text-slate-600">Run <code>node scripts/verify-counts.mjs</code> after any curriculum edit. It fails the build check if a topic has anything other than exactly 10 questions or a question has anything other than 4 options.</p>
 <p className="mt-2 text-sm text-slate-600">Editing flow: edit the per-topic data in scripts/generate-curriculum.mjs, regenerate with <code>node scripts/generate-curriculum.mjs</code>, re-run the count check, then apply the matching change to the Supabase topics/lessons/quiz_questions tables (see supabase/seed-curriculum.sql). Preview as a student before publishing.</p>
 <h3 className="mt-6 font-bold text-navy">Examinations</h3>
 <p className="mt-2 text-sm text-slate-600">Beginner 60 min · Intermediate 75 min · Advanced 90 min · 20 objective + 3 theory each · pass mark 70% · theory graded against the published rubric, never auto-fabricated.</p>
</Card>
 </AdminShell>
 );
}
