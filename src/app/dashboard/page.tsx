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
 <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
 <Card><p className="text-xs uppercase tracking-widest text-slate-500">Activation</p><p className="mt-1 text-xl font-bold text-navy">{p.activated ? "Activated" : "Not activated"}</p><p className="text-sm text-slate-600">Payment: {p.paymentStatus}</p></Card>
 <Card><p className="text-xs uppercase tracking-widest text-slate-500">Current level</p><p className="mt-1 text-xl font-bold text-navy">{LEVELS[level - 1].name}</p><p className="text-sm text-slate-600">{levelDone} of {levelTopics.length} topics in this level</p></Card>
 <Card><p className="text-xs uppercase tracking-widest text-slate-500">Overall progress</p><p className="mt-1 text-xl font-bold text-navy">{completed} / {TOPICS.length} topics</p><p className="text-sm text-slate-600">{Math.round((completed / TOPICS.length) * 100)}% complete · {TOPICS.length - completed} remaining</p></Card>
 <Card><p className="text-xs uppercase tracking-widest text-slate-500">Today&apos;s new-topic allowance</p><p className="mt-1 text-xl font-bold text-navy">{remaining} of {DAILY_NEW_TOPIC_LIMIT} left</p><p className="text-sm text-slate-600">Lagos date: {today}. Completed topics can be revised any time.</p></Card>
 </div>
 <div className="mt-6">
 <Card>
 <h3 className="font-bold text-navy">Notifications</h3>
 {p.notifications.length === 0 ? <p className="mt-2 text-sm text-slate-600">No notifications yet. Registration, payment decisions, activation, quiz results, level unlocks, exam results and certificates will appear here.</p>
 : <ul className="mt-2 space-y-2 text-sm text-slate-700">{p.notifications.slice(0, 8).map((n) => (<li key={n.id} className="border-b border-slate-200 pb-2">{n.text} <span className="text-xs text-slate-500">· {new Date(n.at).toLocaleString()}</span></li>))}</ul>}
 </Card>
 </div>
 </DashboardShell>
 );
}
