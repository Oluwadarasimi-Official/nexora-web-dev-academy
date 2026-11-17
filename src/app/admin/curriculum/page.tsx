"use client";
import { useEffect, useState } from "react";
import AdminShell from "@/components/AdminShell";
import { Card, Alert } from "@/components/ui";
import { adminGet, AdminApiError } from "@/lib/adminClient";

type CurriculumData = {
  topicsTotal: number;
  topicsByLevel: Record<number, number>;
  lessonsTotal: number;
  quizzesTotal: number;
  questionsTotal: number;
  examinations: { id: string; level_id: number; title: string; duration_minutes: number; pass_mark_percent: number }[];
};

const LEVEL_NAMES = ["", "Beginner", "Intermediate", "Advanced"];

export default function Page() {
  const [data, setData] = useState<CurriculumData | null>(null);
  const [err, setErr] = useState("");
  useEffect(() => {
    let alive = true;
    adminGet<CurriculumData>("/api/admin/curriculum")
      .then((d) => { if (alive) setData(d); })
      .catch((e: unknown) => {
        if (alive) setErr(e instanceof AdminApiError ? e.message : "Could not load curriculum data.");
      });
    return () => { alive = false; };
  }, []);
  return (
    <AdminShell title="Curriculum, Quiz & Exam Management" intro="73 topics, 10 questions per topic, 3 level examinations. Validate counts before publishing any change.">
      {err && <div className="mb-4"><Alert kind="error">{err}</Alert></div>}
      <Card>
        <h3 className="font-bold text-navy">Live database</h3>
        {!data ? (
          <p className="mt-2 text-sm text-slate-600">Loading live counts from the database…</p>
        ) : (
          <>
            <p className="mt-2 text-sm text-slate-600">
              Level 1 {LEVEL_NAMES[1]} — {data.topicsByLevel[1] ?? 0} topics · Level 2 {LEVEL_NAMES[2]} — {data.topicsByLevel[2] ?? 0} topics · Level 3 {LEVEL_NAMES[3]} — {data.topicsByLevel[3] ?? 0} topics · Total {data.topicsTotal} topics · {data.lessonsTotal} lessons · {data.quizzesTotal} quizzes · {data.questionsTotal} quiz questions · {data.examinations.length} final examinations.
            </p>
            <ul className="mt-3 space-y-1 text-sm text-slate-700">
              {data.examinations.map((e) => (
                <li key={e.id}>
                  <strong>Level {e.level_id} — {e.title}:</strong> {e.duration_minutes} min · pass mark {e.pass_mark_percent}%
                </li>
              ))}
            </ul>
          </>
        )}
      </Card>
      <Card className="mt-4">
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
