"use client";
import Link from "next/link";
import DashboardShell from "@/components/DashboardShell";
import { Card } from "@/components/ui";
import { LEVELS, TOPICS } from "@/lib/curriculum";
import { loadProgress } from "@/lib/store";
export default function Courses() {
  const p = loadProgress();
  return (
    <DashboardShell title="My Courses">
      <div className="space-y-4">
        {LEVELS.map((l) => {
          const topics = TOPICS.filter((t) => t.level === l.level);
          const done = topics.filter((t) => p.completedTopics.includes(t.slug)).length;
          const unlocked = l.level === 1 || (l.level === 2 && p.completedTopics.length >= 26) || (l.level === 3 && p.completedTopics.length >= 51);
          return (
            <Card key={l.level}>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="text-lg font-bold text-navy">Level {l.level} — {l.name} · {done}/{topics.length} topics</h3>
                  <p className="text-sm text-slate-600">{l.description}</p>
                  <p className="text-sm text-slate-600">{unlocked ? "Unlocked" : `Locked — complete Level ${l.level - 1} first.`} · Certificate: {l.certificateTitle}</p>
                </div>
                <Link href={`/dashboard/level/${l.level}`} className="rounded-lg bg-navy px-4 py-2 text-sm font-semibold text-white">Open Level {l.level}</Link>
              </div>
            </Card>
          );
        })}
      </div>
    </DashboardShell>
  );
}
