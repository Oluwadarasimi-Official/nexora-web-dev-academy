"use client";
import { Check, Lock } from "lucide-react";
import Link from "next/link";
import DashboardShell from "@/components/DashboardShell";
import { Card } from "@/components/ui";
import { LEVELS, TOPICS, levelUnlocked } from "@/lib/curriculum";
import { useSyncedProgress } from "@/lib/store";

// Quizzes — the real destination of the sidebar "Quizzes" link (it used to
// point at /dashboard/courses, which is not a quizzes list). Every quiz in
// the academy, grouped by level, with its status: passed, attempted, not
// taken, or locked. A quiz is locked until the account is activated AND
// its level is unlocked (same rule as the lesson and quiz pages).
export default function Quizzes() {
 const p = useSyncedProgress();
 return (
 <DashboardShell title="Quizzes">
 <p className="mb-4 text-sm text-slate-600">All 73 topic quizzes — 10 questions each, pass mark 7/10. {!p.activated && "Redeem your access code to unlock them."}</p>
 <div className="space-y-4">
 {LEVELS.map((l) => {
 const topics = TOPICS.filter((t) => t.level === l.level);
 const levelOpen = levelUnlocked(l.level, p.completedTopics.length);
 return (
 <Card key={l.level}>
 <h3 className="font-bold text-navy">Level {l.level} — {l.name} {!levelOpen && <span className="text-sm font-semibold text-amber-700"><Lock className="inline h-4 w-4" /> Locked — complete Level {l.level - 1} first</span>}</h3>
 <ul className="mt-3 space-y-1 text-sm">
 {topics.map((t) => {
 const done = p.completedTopics.includes(t.slug);
 const q = p.quizAttempts[t.slug];
 const locked = !p.activated || !levelOpen;
 // Lesson-view gate (owner rule): the quiz link stays shut until the
 // course (lesson) for this topic has been opened. A completed topic
 // counts as opened (legacy: completed before lesson_views existed).
 const opened = done || (p.openedLessons ?? []).includes(t.slug);
 return (
 <li key={t.slug} className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2">
 <span className="text-slate-700">{t.title}</span>
 <span className="flex items-center gap-3">
 {done ? (<span className="font-semibold text-sky-600"><Check className="inline h-4 w-4" /> Complete</span>)
 : q ? (<span>{`Quiz ${q.score}/10 ${q.passed ? "(passed)" : "(not passed)"}`}</span>)
 : locked ? (<span className="font-semibold text-amber-700"><Lock className="inline h-4 w-4" /> Locked</span>)
 : (<span className="text-slate-500">Not taken</span>)}
 {!locked && opened && !done && <Link className="font-semibold text-sky" href={`/dashboard/quiz/${t.slug}`}>Take quiz</Link>}
 {!locked && opened && done && <Link className="font-semibold text-sky" href={`/dashboard/quiz/${t.slug}`}>Retake</Link>}
 {!locked && !opened && <Link className="font-semibold text-sky" href={`/dashboard/topic/${t.slug}`}>Open the course first</Link>}
 </span>
 </li>
 );
 })}
 </ul>
 </Card>
 );
 })}
 </div>
 </DashboardShell>
 );
}
