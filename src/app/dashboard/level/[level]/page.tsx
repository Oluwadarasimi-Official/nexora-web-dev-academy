"use client";
import { ArrowRight, Check, Lock } from "lucide-react";
import Link from "next/link";
import DashboardShell from "@/components/DashboardShell";
import { Card } from "@/components/ui";
import { LEVELS, TOPICS, levelUnlocked } from "@/lib/curriculum";
import { useSyncedProgress } from "@/lib/store";
export default function LevelPage({ params }: { params: { level: string } }) {
 const level = Number(params.level) as 1 | 2 | 3;
 const meta = LEVELS.find((l) => l.level === level);
 const p = useSyncedProgress();
 const topics = TOPICS.filter((t) => t.level === level);
 const unlocked = levelUnlocked(level, p.completedTopics.length);
 const modules = Array.from(new Set(topics.map((t) => t.module)));
 if (!meta) return <DashboardShell title="Level not found"><p>That level does not exist.</p></DashboardShell>;
 return (
 <DashboardShell title={`Level ${level} — ${meta.name}`}>
 {!p.activated && <p className="mb-4 text-sm text-slate-600">You can see every topic in this level below, but the lessons and quizzes are locked until your account is activated. See <Link className="font-semibold underline" href="/dashboard/payment">Payment &amp; Activation</Link>.</p>}
 {!unlocked && <div className="mb-4 rounded-lg border border-gold/30 bg-gold/10 px-4 py-3 text-sm text-gold-dark">This level is locked. Complete Level {level - 1} (all topics and quizzes) first.</div>}
 {modules.map((m) => (
 <div key={m} className="mb-6">
 <h3 className="mb-2 font-bold text-navy">{m}</h3>
 <div className="grid gap-3 md:grid-cols-2">
 {topics.filter((t) => t.module === m).map((t) => {
 const done = p.completedTopics.includes(t.slug);
 const locked = !p.activated || !unlocked;
 return (
 <Card key={t.slug}>
 <h4 className="font-semibold text-navy">{t.title} {done && <span className="text-sky-600"><Check className="inline h-4 w-4" /> Completed</span>}</h4>
 <p className="mt-1 text-sm text-slate-600">{t.summary}</p>
 {locked ? (
 <p className="mt-3 text-sm font-semibold text-amber-700"><Lock className="inline h-4 w-4" /> {p.activated ? `Locked — complete Level ${level - 1} first.` : "Locked — redeem your access code to unlock."}</p>
 ) : (
 <div className="mt-3 flex gap-3 text-sm">
 <Link className="font-semibold text-sky" href={`/dashboard/topic/${t.slug}`}>Read lesson <ArrowRight className="inline h-4 w-4" /></Link>
 <Link className="font-semibold text-sky" href={`/dashboard/quiz/${t.slug}`}>Take quiz <ArrowRight className="inline h-4 w-4" /></Link>
 </div>
 )}
 </Card>
 );
 })}
 </div>
 </div>
 ))}
 </DashboardShell>
 );
}
