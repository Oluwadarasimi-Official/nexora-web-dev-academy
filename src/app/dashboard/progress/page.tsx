"use client";
import DashboardShell from "@/components/DashboardShell";
import { Card } from "@/components/ui";
import { TOPICS, LEVELS } from "@/lib/curriculum";
import { loadProgress } from "@/lib/store";
export default function Progress() {
  const p = loadProgress();
  return (
    <DashboardShell title="My Progress">
      <div className="space-y-4">
        {LEVELS.map((l) => {
          const topics = TOPICS.filter((t) => t.level === l.level);
          const done = topics.filter((t) => p.completedTopics.includes(t.slug)).length;
          return (
            <Card key={l.level}>
              <h3 className="font-bold text-white">Level {l.level} — {l.name}: {done}/{topics.length} topics ({Math.round((done / topics.length) * 100)}%)</h3>
              <div className="mt-2 h-3 overflow-hidden rounded-full bg-white/10"><div className="h-full bg-gradient-to-r from-emerald-400 to-cyan-400" style={{ width: `${(done / topics.length) * 100}%` }} /></div>
              <ul className="mt-3 space-y-1 text-sm">
                {topics.map((t) => {
                  const q = p.quizAttempts[t.slug];
                  return <li key={t.slug} className="flex justify-between gap-2"><span>{t.title}</span><span>{p.completedTopics.includes(t.slug) ? "✓ Complete" : q ? `Quiz ${q.score}/10 ${q.passed ? "(passed)" : "(not passed)"}` : "Not started"}</span></li>;
                })}
              </ul>
            </Card>
          );
        })}
        <Card>
          <h3 className="font-bold text-white">Quiz attempts</h3>
          {Object.keys(p.quizAttempts).length === 0 ? <p className="mt-2 text-sm text-slate-300">No quiz attempts yet.</p>
          : <ul className="mt-2 space-y-1 text-sm">{Object.entries(p.quizAttempts).map(([slug, a]) => (<li key={slug}>{slug}: {a.score}/10 — {a.passed ? "Passed" : "Not passed"} · {new Date(a.at).toLocaleString()}</li>))}</ul>}
        </Card>
      </div>
    </DashboardShell>
  );
}
