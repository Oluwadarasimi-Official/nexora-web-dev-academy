"use client";
import { Check, Lock } from "lucide-react";
import { useState } from "react";
import Link from "next/link";
import DashboardShell from "@/components/DashboardShell";
import { Card, Alert } from "@/components/ui";
import { topicBySlug, topicsForLevel, levelUnlocked } from "@/lib/curriculum";
import { loadProgress, saveProgress, lagosDate, pushNotification, useSyncedProgress } from "@/lib/store";
import { studentPost } from "@/lib/studentClient";

export default function TopicPage({ params }: { params: { slug: string } }) {
 const topic = topicBySlug(params.slug);
 const [msg, setMsg] = useState(""); const [err, setErr] = useState("");
 const [busy, setBusy] = useState(false);
 // Hook must run before the early return below (rules of hooks).
 const p = useSyncedProgress();
 if (!topic) return <DashboardShell title="Topic not found"><p className="text-slate-600">That topic does not exist. Return to <Link className="text-sky" href="/dashboard/courses">My Courses</Link>.</p></DashboardShell>;
 const done = p.completedTopics.includes(topic.slug);
 const isNew = !done;
 const today = lagosDate();
 const remaining = Math.max(0, 3 - (p.daily[today] || 0));
 const levelDone = topicsForLevel(topic.level).filter((t) => p.completedTopics.includes(t.slug)).length;
 const levelTotal = topicsForLevel(topic.level).length;
 const unlocked = levelUnlocked(topic.level, p.completedTopics.length);
 const locked = !p.activated || !unlocked;

 const topicSlug = topic.slug; const topicLevel = topic.level; const topicTitle = topic.title;
 async function completeTopic() {
 setErr(""); setMsg("");
 if (!p.activated) return setErr("Your account is not activated yet. Redeem your access code first.");
 if (!unlocked) return setErr("This level is locked. Complete the previous level first.");
 const quiz = p.quizAttempts[topicSlug];
 if (!quiz?.passed) return setErr("Complete this topic's quiz first and score at least 7/10. A passed quiz is required before a topic can be marked complete.");
 setBusy(true);
 try {
 // No client-score sync step any more: the old repair endpoint that
 // trusted client-asserted scores was deleted. The server's
 // complete-topic gate reads the persisted quiz_attempts table directly,
 // and quiz-submit persists the attempt when the quiz is marked — a
 // passed quiz is already on the server by the time the student gets here.
 const data = await studentPost<{ persisted?: boolean }>("/api/complete-topic", { slug: topicSlug, level: topicLevel, isNew, lagosDate: today });
 const next = loadProgress();
 if (!next.completedTopics.includes(topicSlug)) next.completedTopics.push(topicSlug);
 if (isNew) next.daily[today] = (next.daily[today] || 0) + 1;
 pushNotification(next, `Topic completed: ${topicTitle} (Level ${topicLevel}).`);
 saveProgress(next);
 setMsg(`Topic completed. ${data.persisted ? "Saved to the academy database." : "Saved on this device."} Remaining new topics today: ${isNew ? Math.max(0, remaining - 1) : remaining}.`);
 } catch (e) { setErr(e instanceof Error ? e.message : "Network error. Try again."); }
 finally { setBusy(false); }
 }

 return (
 <DashboardShell title={topic.title}>
 <p className="text-sm text-slate-600">Level {topic.level} · {topic.module} · {done ? (<>Completed <Check className="inline h-4 w-4 text-sky-600" /></>) : "Not yet completed"} · Level progress: {levelDone}/{levelTotal}</p>
 {locked ? (
 <Card className="mt-4">
 <h3 className="font-bold text-navy"><Lock className="inline h-5 w-5 text-amber-700" /> This lesson is locked</h3>
 <p className="mt-2 text-sm leading-relaxed text-slate-700">{!p.activated ? "Your account is not activated yet. Pay on WhatsApp, get your access code from the owner, and redeem it to unlock this lesson and its quiz." : `This level is locked. Complete Level ${topic.level - 1} (all topics and quizzes) first.`}</p>
 {!p.activated && <Link href="/dashboard/payment" className="mt-4 inline-block btn-gold px-4 py-2 text-sm font-semibold">Go to Payment &amp; Activation</Link>}
 </Card>
 ) : (
 <div className="mt-4 space-y-5">
 <Card>
 <h3 className="font-bold text-navy">Learning objectives</h3>
 <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-700">{topic.objectives.map((o, i) => (<li key={i}>{o}</li>))}</ul>
 </Card>
 <Card>
 <h3 className="font-bold text-navy">Lesson</h3>
 {topic.explanation.map((para, i) => (<p key={i} className="mt-2 text-sm leading-relaxed text-slate-700">{para}</p>))}
 </Card>
 <Card>
 <h3 className="font-bold text-navy">Worked example — {topic.codeLang}</h3>
 <pre className="mt-2 overflow-x-auto rounded-lg bg-[#0a2a5e] p-4 text-sm text-white">{topic.code}</pre>
 <p className="mt-2 text-sm text-slate-600">{topic.codeExplanation}</p>
 </Card>
 <Card>
 <h3 className="font-bold text-navy">Practical activity / assignment</h3>
 <p className="mt-2 text-sm text-slate-700">{topic.activity}</p>
 </Card>
 <Card>
 <h3 className="font-bold text-navy">Common mistakes &amp; corrections</h3>
 <ul className="mt-2 space-y-3">{topic.mistakes.map((m, i) => (<li key={i} className="text-sm"><span className="font-semibold text-red-700">Mistake:</span> <span className="text-slate-700">{m.mistake}</span><br /><span className="font-semibold text-sky-600">Correction:</span> <span className="text-slate-700">{m.correction}</span></li>))}</ul>
 </Card>
 <Card>
 <h3 className="font-bold text-navy">Recap</h3>
 <p className="mt-2 text-sm text-slate-700">{topic.recap}</p>
 </Card>
 {msg && <Alert kind="success">{msg}</Alert>}
 {err && <Alert kind="error">{err}</Alert>}
 <div className="flex flex-wrap gap-3">
 <Link href={`/dashboard/quiz/${topic.slug}`} className="btn-gold px-5 py-2.5 font-semibold">Take the 10-Question Quiz</Link>
 <button onClick={completeTopic} disabled={busy || done} className="btn-gold px-5 py-2.5 font-semibold disabled:opacity-50">{done ? (<>Topic Completed <Check className="inline h-4 w-4" /></>) : busy ? "Saving…" : "Mark Topic Complete (after passing the quiz)"}</button>
 </div>
 <p className="text-sm text-slate-500">Today&apos;s new-topic allowance: {remaining} left (Africa/Lagos, {today}). Completing a new topic uses one allowance; revising a completed topic uses none. The limit is enforced server-side in /api/complete-topic.</p>
 </div>
 )}
 </DashboardShell>
 );
}
