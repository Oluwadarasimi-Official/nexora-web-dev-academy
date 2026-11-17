"use client";
import { Lock } from "lucide-react";
import Link from "next/link";
import DashboardShell from "@/components/DashboardShell";
import { Card } from "@/components/ui";
import { LEVELS, TOPICS, levelUnlocked } from "@/lib/curriculum";
import { useSyncedProgress } from "@/lib/store";
export default function Courses() {
 const p = useSyncedProgress();
 return (
 <DashboardShell title="My Courses">
 {!p.activated && <p className="mb-4 text-sm text-slate-600">You can browse the full catalogue below — every level and topic is listed — but lessons and quizzes stay locked until you redeem your access code. See <Link className="font-semibold underline" href="/dashboard/payment">Payment &amp; Activation</Link>.</p>}
 <div className="space-y-4">
 {LEVELS.map((l) => {
 const topics = TOPICS.filter((t) => t.level === l.level);
 const done = topics.filter((t) => p.completedTopics.includes(t.slug)).length;
 const levelOpen = levelUnlocked(l.level, p.completedTopics.length);
 const locked = !p.activated || !levelOpen;
 const lockReason = !p.activated ? "Locked — redeem your access code to unlock." : `Locked — complete Level ${l.level - 1} first.`;
 return (
 <Card key={l.level}>
 <div className="flex flex-wrap items-center justify-between gap-3">
 <div>
 <h3 className="text-lg font-bold text-navy">Level {l.level} — {l.name} · {done}/{topics.length} topics</h3>
 <p className="text-sm text-slate-600">{l.description}</p>
 <p className="text-sm text-slate-600">{locked ? <span className="font-semibold text-amber-700"><Lock className="inline h-4 w-4" /> {lockReason}</span> : "Unlocked"} · Certificate: {l.certificateTitle}</p>
 </div>
 <Link href={`/dashboard/level/${l.level}`} className="btn-gold px-4 py-2 text-sm font-semibold">Open Level {l.level}</Link>
 </div>
 </Card>
 );
 })}
 </div>
 </DashboardShell>
 );
}
