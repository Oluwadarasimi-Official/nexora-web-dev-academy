"use client";
import Link from "next/link";
import DashboardShell from "@/components/DashboardShell";
import { Card } from "@/components/ui";
import { LEVELS, TOPICS } from "@/lib/curriculum";
import { loadProgress } from "@/lib/store";
export default function LevelPage({ params }: { params: { level: string } }) {
  const level = Number(params.level) as 1 | 2 | 3;
  const meta = LEVELS.find((l) => l.level === level);
  const p = loadProgress();
  const topics = TOPICS.filter((t) => t.level === level);
  const unlocked = level === 1 || (level === 2 && p.completedTopics.length >= 26) || (level === 3 && p.completedTopics.length >= 51);
  const modules = Array.from(new Set(topics.map((t) => t.module)));
  if (!meta) return <DashboardShell title="Level not found"><p>That level does not exist.</p></DashboardShell>;
  return (
    <DashboardShell title={`Level ${level} — ${meta.name}`}>
      {!p.activated && <p className="mb-4 text-sm text-slate-600">Lesson content is locked until your account is activated. See Payment &amp; Activation.</p>}
      {!unlocked && <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">This level is locked. Complete Level {level - 1} (all topics and quizzes) first.</div>}
      {modules.map((m) => (
        <div key={m} className="mb-6">
          <h3 className="mb-2 font-bold text-navy">{m}</h3>
          <div className="grid gap-3 md:grid-cols-2">
            {topics.filter((t) => t.module === m).map((t) => {
              const done = p.completedTopics.includes(t.slug);
              return (
                <Card key={t.slug}>
                  <h4 className="font-semibold text-navy">{t.title} {done && <span className="text-emerald-700">✓ Completed</span>}</h4>
                  <p className="mt-1 text-sm text-slate-600">{t.summary}</p>
                  <div className="mt-3 flex gap-3 text-sm">
                    <Link className="font-semibold text-sky" href={`/dashboard/topic/${t.slug}`}>Read lesson →</Link>
                    <Link className="font-semibold text-sky" href={`/dashboard/quiz/${t.slug}`}>Take quiz →</Link>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      ))}
    </DashboardShell>
  );
}
