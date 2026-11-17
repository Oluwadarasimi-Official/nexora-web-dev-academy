"use client";
import { useEffect, useState } from "react";
import DashboardShell from "@/components/DashboardShell";
import { Card } from "@/components/ui";
import { TOPICS, LEVELS, DAILY_NEW_TOPIC_LIMIT } from "@/lib/curriculum";
import { useSyncedProgress, lagosDate } from "@/lib/store";
import { getPublicSettings } from "@/lib/settings";
import { studentGet } from "@/lib/studentClient";

type Announcement = { id: string; title: string; body: string; created_at: string };

export default function Dashboard() {
 const p = useSyncedProgress();
 const [announcements, setAnnouncements] = useState<Announcement[]>([]);
 // B9: the daily limit shown here is the number the server enforces
 // (academy_settings), not the hardcoded constant.
 const [dailyLimit, setDailyLimit] = useState(DAILY_NEW_TOPIC_LIMIT);
 const completed = p.completedTopics.length;
 const level = completed >= 51 ? 3 : completed >= 26 ? 2 : 1;
 const today = lagosDate();
 const usedToday = p.daily[today] || 0;
 const remaining = Math.max(0, dailyLimit - usedToday);
 const levelTopics = TOPICS.filter((t) => t.level === level);
 const levelDone = levelTopics.filter((t) => p.completedTopics.includes(t.slug)).length;
 // B7: announcements the admin posts are shown here — they used to go
 // into a void no student page ever read.
 useEffect(() => {
  (async () => {
   try {
    const data = await studentGet<{ announcements: Announcement[] }>("/api/announcements");
    setAnnouncements(data.announcements ?? []);
   } catch { /* offline / demo flow: no announcements shown */ }
  })();
  getPublicSettings().then((s) => setDailyLimit(s.dailyNewTopicLimit)).catch(() => {});
 }, []);
 return (
 <DashboardShell title="Student Overview">
 <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
 <Card className="p-4"><p className="text-[11px] uppercase tracking-widest text-slate-500">Activation</p><p className="mt-1 text-lg font-bold leading-snug text-navy sm:text-xl">{p.activated ? "Activated" : "Not activated"}</p><p className="mt-0.5 text-sm text-slate-600">{p.activated ? "Lessons unlocked." : "Redeem your code to unlock lessons."}</p></Card>
 <Card className="p-4"><p className="text-[11px] uppercase tracking-widest text-slate-500">Current level</p><p className="mt-1 text-lg font-bold leading-snug text-navy sm:text-xl">{LEVELS[level - 1].name}</p><p className="mt-0.5 text-sm text-slate-600">{levelDone} of {levelTopics.length} topics in this level</p></Card>
 <Card className="p-4"><p className="text-[11px] uppercase tracking-widest text-slate-500">Overall progress</p><p className="mt-1 text-lg font-bold leading-snug text-navy sm:text-xl">{completed} / {TOPICS.length} topics</p><p className="mt-0.5 text-sm text-slate-600">{Math.round((completed / TOPICS.length) * 100)}% complete · {TOPICS.length - completed} remaining</p></Card>
 <Card className="p-4"><p className="text-[11px] uppercase tracking-widest text-slate-500">New topics today</p><p className="mt-1 text-lg font-bold leading-snug text-navy sm:text-xl">{remaining} of {dailyLimit} left</p><p className="mt-0.5 text-sm text-slate-600">Lagos date: {today}. Completed topics can be revised any time.</p></Card>
 </div>
 {announcements.length > 0 && (
 <div className="mt-4">
 <Card className="p-4">
 <h3 className="font-bold text-navy">Announcements</h3>
 <ul className="mt-2 space-y-3">
 {announcements.map((a) => (
 <li key={a.id} className="border-b border-slate-200 pb-2 last:border-b-0">
 <p className="text-sm font-semibold text-navy">{a.title} <span className="font-normal text-xs text-slate-500">· {new Date(a.created_at).toLocaleString()}</span></p>
 <p className="mt-0.5 whitespace-pre-wrap text-sm text-slate-700">{a.body}</p>
 </li>
 ))}
 </ul>
 </Card>
 </div>
 )}
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
