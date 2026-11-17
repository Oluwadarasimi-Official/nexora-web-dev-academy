"use client";
import { useEffect, useState } from "react";
import DashboardShell from "@/components/DashboardShell";
import { Card } from "@/components/ui";
import { TOPICS, LEVELS, DAILY_NEW_TOPIC_LIMIT } from "@/lib/curriculum";
import { loadProgress, lagosDate, type LocalProgress } from "@/lib/store";

export default function Dashboard() {
 const [p, setP] = useState<LocalProgress>(loadProgress());
 useEffect(() => { setP(loadProgress()); }, []);
 const completed = p.completedTopics.length;
 const level = completed >= 51 ? 3 : completed >= 26 ? 2 : 1;
 const today = lagosDate();
 const usedToday = p.daily[today] || 0;
 const remaining = Math.max(0, DAILY_NEW_TOPIC_LIMIT - usedToday);
 const levelTopics = TOPICS.filter((t) => t.level === level);
 const levelDone = levelTopics.filter((t) => p.completedTopics.includes(t.slug)).length;
 return (
 <DashboardShell title="Student Overview">
 <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
 <Card className="p-4"><p className="text-[11px] uppercase tracking-widest text-slate-500">Activation</p><p className="mt-1 text-lg font-bold leading-snug text-navy sm:text-xl">{p.activated ? "Activated" : "Not activated"}</p><p className="mt-0.5 text-sm text-slate-600">{p.activated ? "Lessons unlocked." : "Redeem your code to unlock lessons."}</p></Card>
 <Card className="p-4"><p className="text-[11px] uppercase tracking-widest text-slate-500">Current level</p><p className="mt-1 text-lg font-bold leading-snug text-navy sm:text-xl">{LEVELS[level - 1].name}</p><p className="mt-0.5 text-sm text-slate-600">{levelDone} of {levelTopics.length} topics in this level</p></Card>
 <Card className="p-4"><p className="text-[11px] uppercase tracking-widest text-slate-500">Overall progress</p><p className="mt-1 text-lg font-bold leading-snug text-navy sm:text-xl">{completed} / {TOPICS.length} topics</p><p className="mt-0.5 text-sm text-slate-600">{Math.round((completed / TOPICS.length) * 100)}% complete · {TOPICS.length - completed} remaining</p></Card>
 <Card className="p-4"><p className="text-[11px] uppercase tracking-widest text-slate-500">New topics today</p><p className="mt-1 text-lg font-bold leading-snug text-navy sm:text-xl">{remaining} of {DAILY_NEW_TOPIC_LIMIT} left</p><p className="mt-0.5 text-sm text-slate-600">Lagos date: {today}. Completed topics can be revised any time.</p></Card>
 </div>
 <div className="mt-4">
 <Card className="p-4">
 <h3 className="font-bold text-navy">Notifications</h3>
 {p.notifications.length === 0 ? <p className="mt-2 text-sm text-slate-600">No notifications yet. Activation, quiz results, level unlocks, exam results and certificates will appear here.</p>
 : <ul className="mt-2 space-y-2 text-sm text-slate-700">{p.notifications.slice(0, 8).map((n) => (<li key={n.id} className="border-b border-slate-200 pb-2">{n.text} <span className="text-xs text-slate-500">· {new Date(n.at).toLocaleString()}</span></li>))}</ul>}
 </Card>
 </div>
 </DashboardShell>
 );
}
