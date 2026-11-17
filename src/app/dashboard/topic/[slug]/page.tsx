"use client";
import { useState } from "react";
import Link from "next/link";
import DashboardShell from "@/components/DashboardShell";
import { Card, Alert } from "@/components/ui";
import { topicBySlug, topicsForLevel } from "@/lib/curriculum";
import { loadProgress, saveProgress, lagosDate, pushNotification } from "@/lib/store";

export default function TopicPage({ params }: { params: { slug: string } }) {
  const topic = topicBySlug(params.slug);
  const [msg, setMsg] = useState(""); const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  if (!topic) return <DashboardShell title="Topic not found"><p className="text-slate-300">That topic does not exist. Return to <Link className="text-cyan-300" href="/dashboard/courses">My Courses</Link>.</p></DashboardShell>;
  const p = loadProgress();
  const done = p.completedTopics.includes(topic.slug);
  const isNew = !done;
  const today = lagosDate();
  const remaining = Math.max(0, 3 - (p.daily[today] || 0));
  const levelDone = topicsForLevel(topic.level).filter((t) => p.completedTopics.includes(t.slug)).length;
  const levelTotal = topicsForLevel(topic.level).length;
  const unlocked = topic.level === 1 || (topic.level === 2 && p.completedTopics.length >= 26) || (topic.level === 3 && p.completedTopics.length >= 51);

  const topicSlug = topic.slug; const topicLevel = topic.level; const topicTitle = topic.title;
  async function completeTopic() {
    setErr(""); setMsg("");
    if (!p.activated) return setErr("Your account is not activated yet. Redeem your access code first.");
    if (!unlocked) return setErr("This level is locked. Complete the previous level first.");
    const quiz = p.quizAttempts[topicSlug];
    if (!quiz?.passed) return setErr("Complete this topic's quiz first and score at least 7/10. A passed quiz is required before a topic can be marked complete.");
    setBusy(true);
    try {
      const res = await fetch("/api/complete-topic", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ slug: topicSlug, level: topicLevel, isNew, lagosDate: today }) });
      const data = await res.json();
      if (!res.ok) { setErr(data.error || "Could not complete the topic."); return; }
      const next = loadProgress();
      if (!next.completedTopics.includes(topicSlug)) next.completedTopics.push(topicSlug);
      if (isNew) next.daily[today] = (next.daily[today] || 0) + 1;
      pushNotification(next, `Topic completed: ${topicTitle} (Level ${topicLevel}).`);
      saveProgress(next);
      setMsg(`Topic completed. ${data.persisted ? "Saved to the academy database." : "Saved on this device (database sync pending — see HANDOVER)."} Remaining new topics today: ${isNew ? Math.max(0, remaining - 1) : remaining}.`);
    } catch { setErr("Network error. Try again."); }
    finally { setBusy(false); }
  }

  return (
    <DashboardShell title={topic.title}>
      <p className="text-sm text-slate-300">Level {topic.level} · {topic.module} · {done ? "Completed ✓" : "Not yet completed"} · Level progress: {levelDone}/{levelTotal}</p>
      {!p.activated && <div className="mt-4"><Alert kind="error">Lesson content is shown for reference only while unactivated — quizzes, examinations and topic completion are locked until activation.</Alert></div>}
      <div className="mt-4 space-y-5">
        <Card>
          <h3 className="font-bold text-white">Learning objectives</h3>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-200">{topic.objectives.map((o, i) => (<li key={i}>{o}</li>))}</ul>
        </Card>
        <Card>
          <h3 className="font-bold text-white">Lesson</h3>
          {topic.explanation.map((para, i) => (<p key={i} className="mt-2 text-sm leading-relaxed text-slate-200">{para}</p>))}
        </Card>
        <Card>
          <h3 className="font-bold text-white">Worked example — {topic.codeLang}</h3>
          <pre className="mt-2 overflow-x-auto rounded-lg bg-[#0a2a5e] p-4 text-sm text-white">{topic.code}</pre>
          <p className="mt-2 text-sm text-slate-300">{topic.codeExplanation}</p>
        </Card>
        <Card>
          <h3 className="font-bold text-white">Practical activity / assignment</h3>
          <p className="mt-2 text-sm text-slate-200">{topic.activity}</p>
        </Card>
        <Card>
          <h3 className="font-bold text-white">Common mistakes &amp; corrections</h3>
          <ul className="mt-2 space-y-3">{topic.mistakes.map((m, i) => (<li key={i} className="text-sm"><span className="font-semibold text-rose-300">Mistake:</span> <span className="text-slate-200">{m.mistake}</span><br /><span className="font-semibold text-emerald-300">Correction:</span> <span className="text-slate-200">{m.correction}</span></li>))}</ul>
        </Card>
        <Card>
          <h3 className="font-bold text-white">Recap</h3>
          <p className="mt-2 text-sm text-slate-200">{topic.recap}</p>
        </Card>
        {msg && <Alert kind="success">{msg}</Alert>}
        {err && <Alert kind="error">{err}</Alert>}
        <div className="flex flex-wrap gap-3">
          <Link href={`/dashboard/quiz/${topic.slug}`} className="btn-gold px-5 py-2.5 font-semibold text-white">Take the 10-Question Quiz</Link>
          <button onClick={completeTopic} disabled={busy || done} className="btn-gold px-5 py-2.5 font-semibold text-white disabled:opacity-50">{done ? "Topic Completed ✓" : busy ? "Saving…" : "Mark Topic Complete (after passing the quiz)"}</button>
        </div>
        <p className="text-sm text-slate-400">Today&apos;s new-topic allowance: {remaining} left (Africa/Lagos, {today}). Completing a new topic uses one allowance; revising a completed topic uses none. The limit is enforced server-side in /api/complete-topic.</p>
      </div>
    </DashboardShell>
  );
}
