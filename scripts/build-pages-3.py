import pathlib, textwrap
R = pathlib.Path("/home/hatch/workspace/nexora-web-dev-academy/src")
def w(p, s):
    f = R / p; f.parent.mkdir(parents=True, exist_ok=True); f.write_text(textwrap.dedent(s).lstrip("\n"))
    print("wrote", p)

# ---- dashboard shared ----
w("components/DashboardShell.tsx", '''
"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { loadSession, loadProgress, type LocalSession } from "@/lib/store";
import { supabaseSignOut } from "@/components/AuthForm";

const NAV = [
  ["Overview", "/dashboard"], ["My Courses", "/dashboard/courses"], ["Beginner", "/dashboard/level/1"],
  ["Intermediate", "/dashboard/level/2"], ["Advanced", "/dashboard/level/3"], ["My Progress", "/dashboard/progress"],
  ["Quizzes", "/dashboard/courses"], ["Examinations", "/dashboard/exams"], ["My Certificates", "/dashboard/certificates"],
  ["Profile", "/dashboard/profile"], ["Help & Support", "/dashboard/help"],
];

export function useStudent() {
  const [session, setSession] = useState<LocalSession | null>(null);
  const [ready, setReady] = useState(false);
  useEffect(() => { setSession(loadSession()); setReady(true); }, []);
  return { session, ready };
}

export default function DashboardShell({ children, title }: { children: React.ReactNode; title: string }) {
  const router = useRouter(); const pathname = usePathname();
  const { session, ready } = useStudent();
  const [progress, setProgress] = useState(loadProgress());
  useEffect(() => { setProgress(loadProgress()); }, [pathname]);
  if (!ready) return <div className="mx-auto max-w-6xl px-4 py-12 text-slate-600">Loading your dashboard…</div>;
  if (!session) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-12">
        <div className="rounded-2xl border border-[#e8dfc8] bg-white p-6">
          <h1 className="text-2xl font-bold text-navy">Please log in</h1>
          <p className="mt-2 text-slate-600">The student portal is for registered students. Log in, or register if you do not have an account yet.</p>
          <div className="mt-4 flex gap-3">
            <Link href="/login" className="rounded-lg bg-navy px-4 py-2 font-semibold text-white">Student Login</Link>
            <Link href="/register" className="rounded-lg border border-navy px-4 py-2 font-semibold text-navy">Register</Link>
          </div>
        </div>
      </div>
    );
  }
  const completed = progress.completedTopics.length;
  const level = completed >= 51 ? 3 : completed >= 26 ? 2 : 1;
  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-navy">{title}</h1>
          <p className="text-sm text-slate-600">Welcome, {session.name} · {session.email} · Current level: {level === 1 ? "Beginner" : level === 2 ? "Intermediate" : "Advanced"} · {progress.activated ? "Activated" : "Not yet activated"}</p>
        </div>
        <button onClick={async () => { await supabaseSignOut(); router.push("/login"); }} className="rounded-lg border border-navy px-4 py-2 text-sm font-semibold text-navy">Logout</button>
      </div>
      <nav className="mt-5 flex flex-wrap gap-2" aria-label="Student navigation">
        {NAV.map(([label, href]) => (
          <Link key={href + label} href={href} className={`rounded-full border px-3 py-1.5 text-sm font-medium ${pathname === href ? "border-navy bg-navy text-white" : "border-[#e8dfc8] bg-white text-navy hover:border-navy"}`}>{label}</Link>
        ))}
      </nav>
      {!progress.activated && (
        <div className="mt-5 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          Your account is not activated yet. Lesson content is locked until you redeem an access code. Go to <Link className="font-semibold underline" href="/dashboard/payment">Payment &amp; Activation</Link> to submit your payment reference and redeem your code.
        </div>
      )}
      <div className="mt-6">{children}</div>
    </div>
  );
}
''')

w("app/dashboard/page.tsx", '''
"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
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
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <Card>
          <h3 className="font-bold text-navy">Notifications</h3>
          {p.notifications.length === 0 ? <p className="mt-2 text-sm text-slate-600">No notifications yet. Registration, payment decisions, activation, quiz results, level unlocks, exam results and certificates will appear here.</p>
          : <ul className="mt-2 space-y-2 text-sm text-slate-700">{p.notifications.slice(0, 8).map((n) => (<li key={n.id} className="border-b border-slate-100 pb-2">{n.text} <span className="text-xs text-slate-400">· {new Date(n.at).toLocaleString()}</span></li>))}</ul>}
        </Card>
        <Card>
          <h3 className="font-bold text-navy">Next steps</h3>
          <ul className="mt-2 space-y-2 text-sm">
            {!p.activated && <li><Link className="font-semibold text-sky" href="/dashboard/payment">→ Complete payment &amp; activation</Link></li>}
            {p.activated && <li><Link className="font-semibold text-sky" href="/dashboard/courses">→ Continue your next lesson</Link></li>}
            <li><Link className="font-semibold text-sky" href="/dashboard/exams">→ View examinations</Link></li>
            <li><Link className="font-semibold text-sky" href="/dashboard/certificates">→ View my certificates</Link></li>
            <li><Link className="font-semibold text-sky" href="/dashboard/help">→ Help &amp; Support</Link></li>
          </ul>
        </Card>
      </div>
    </DashboardShell>
  );
}
''')

w("app/dashboard/courses/page.tsx", '''
"use client";
import Link from "next/link";
import DashboardShell from "@/components/DashboardShell";
import { Card, SectionTitle } from "@/components/ui";
import { LEVELS, TOPICS } from "@/lib/curriculum";
import { loadProgress } from "@/lib/store";
export default function Courses() {
  const p = loadProgress();
  const levelOf = (n: number) => (p.completedTopics.length >= 51 ? 3 : p.completedTopics.length >= 26 ? 2 : 1);
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
''')

w("app/dashboard/level/[level]/page.tsx", '''
"use client";
import Link from "next/link";
import DashboardShell from "@/components/DashboardShell";
import { Card } from "@/components/ui";
import { LEVELS, TOPICS } from "@/lib/curriculum";
import { loadProgress } from "@/lib/store";
export default function LevelPage({ params }: { params: { level: string } }) {
  const level = Number(params.level) as 1 | 2 | 3;
  const meta = LEVELS.find((l) => l.level === level);
  const p = loadProgress();
  const topics = TOPICS.filter((t) => t.level === level);
  const unlocked = level === 1 || (level === 2 && p.completedTopics.length >= 26) || (level === 3 && p.completedTopics.length >= 51);
  const modules = [...new Set(topics.map((t) => t.module))];
  if (!meta) return <DashboardShell title="Level not found"><p>That level does not exist.</p></DashboardShell>;
  return (
    <DashboardShell title={`Level ${level} — ${meta.name}`}>
      {!p.activated && <p className="mb-4 text-sm text-slate-600">Lesson content is locked until your account is activated. See Payment &amp; Activation.</p>}
      {!unlocked && <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">This level is locked. Complete Level {level - 1} (all topics and quizzes) first.</div>}
      {modules.map((m) => (
        <div key={m} className="mb-6">
          <h3 className="mb-2 font-bold text-navy">{m}</h3>
          <div className="grid gap-3 md:grid-cols-2">
            {topics.filter((t) => t.module === m).map((t) => {
              const done = p.completedTopics.includes(t.slug);
              return (
                <Card key={t.slug}>
                  <h4 className="font-semibold text-navy">{t.title} {done && <span className="text-emerald-700">✓ Completed</span>}</h4>
                  <p className="mt-1 text-sm text-slate-600">{t.summary}</p>
                  <div className="mt-3 flex gap-3 text-sm">
                    <Link className="font-semibold text-sky" href={`/dashboard/topic/${t.slug}`}>Read lesson →</Link>
                    <Link className="font-semibold text-sky" href={`/dashboard/quiz/${t.slug}`}>Take quiz →</Link>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      ))}
    </DashboardShell>
  );
}
''')

w("app/dashboard/topic/[slug]/page.tsx", '''
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
  if (!topic) return <DashboardShell title="Topic not found"><p className="text-slate-600">That topic does not exist. Return to <Link className="text-sky" href="/dashboard/courses">My Courses</Link>.</p></DashboardShell>;
  const p = loadProgress();
  const done = p.completedTopics.includes(topic.slug);
  const isNew = !done;
  const today = lagosDate();
  const remaining = Math.max(0, 3 - (p.daily[today] || 0));
  const levelDone = topicsForLevel(topic.level).filter((t) => p.completedTopics.includes(t.slug)).length;
  const levelTotal = topicsForLevel(topic.level).length;
  const unlocked = topic.level === 1 || (topic.level === 2 && p.completedTopics.length >= 26) || (topic.level === 3 && p.completedTopics.length >= 51);

  async function completeTopic() {
    setErr(""); setMsg("");
    if (!p.activated) return setErr("Your account is not activated yet. Redeem your access code first.");
    if (!unlocked) return setErr("This level is locked. Complete the previous level first.");
    const quiz = p.quizAttempts[topic.slug];
    if (!quiz?.passed) return setErr("Complete this topic's quiz first and score at least 7/10. A passed quiz is required before a topic can be marked complete.");
    setBusy(true);
    try {
      const res = await fetch("/api/complete-topic", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ slug: topic.slug, level: topic.level, isNew, lagosDate: today }) });
      const data = await res.json();
      if (!res.ok) { setErr(data.error || "Could not complete the topic."); return; }
      const next = loadProgress();
      if (!next.completedTopics.includes(topic.slug)) next.completedTopics.push(topic.slug);
      if (isNew) next.daily[today] = (next.daily[today] || 0) + 1;
      pushNotification(next, `Topic completed: ${topic.title} (Level ${topic.level}).`);
      saveProgress(next);
      setMsg(`Topic completed. ${data.persisted ? "Saved to the academy database." : "Saved on this device (database sync pending — see HANDOVER)."} Remaining new topics today: ${isNew ? Math.max(0, remaining - 1) : remaining}.`);
    } catch { setErr("Network error. Try again."); }
    finally { setBusy(false); }
  }

  return (
    <DashboardShell title={topic.title}>
      <p className="text-sm text-slate-600">Level {topic.level} · {topic.module} · {done ? "Completed ✓" : "Not yet completed"} · Level progress: {levelDone}/{levelTotal}</p>
      {!p.activated && <div className="mt-4"><Alert kind="error">Lesson content is shown for reference only while unactivated — quizzes, examinations and topic completion are locked until activation.</Alert></div>}
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
          <ul className="mt-2 space-y-3">{topic.mistakes.map((m, i) => (<li key={i} className="text-sm"><span className="font-semibold text-red-700">Mistake:</span> <span className="text-slate-700">{m.mistake}</span><br /><span className="font-semibold text-emerald-700">Correction:</span> <span className="text-slate-700">{m.correction}</span></li>))}</ul>
        </Card>
        <Card>
          <h3 className="font-bold text-navy">Recap</h3>
          <p className="mt-2 text-sm text-slate-700">{topic.recap}</p>
        </Card>
        {msg && <Alert kind="success">{msg}</Alert>}
        {err && <Alert kind="error">{err}</Alert>}
        <div className="flex flex-wrap gap-3">
          <Link href={`/dashboard/quiz/${topic.slug}`} className="rounded-lg bg-navy px-5 py-2.5 font-semibold text-white">Take the 10-Question Quiz</Link>
          <button onClick={completeTopic} disabled={busy || done} className="rounded-lg bg-gold px-5 py-2.5 font-semibold text-navy disabled:opacity-50">{done ? "Topic Completed ✓" : busy ? "Saving…" : "Mark Topic Complete (after passing the quiz)"}</button>
        </div>
        <p className="text-sm text-slate-500">Today&apos;s new-topic allowance: {remaining} left (Africa/Lagos, {today}). Completing a new topic uses one allowance; revising a completed topic uses none. The limit is enforced server-side in /api/complete-topic.</p>
      </div>
    </DashboardShell>
  );
}
''')

w("app/dashboard/quiz/[slug]/page.tsx", '''
"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
import DashboardShell from "@/components/DashboardShell";
import { Card, Alert } from "@/components/ui";
import { topicBySlug, publicQuestions } from "@/lib/curriculum";
import { loadProgress, saveProgress, pushNotification } from "@/lib/store";

export default function QuizPage({ params }: { params: { slug: string } }) {
  const topic = topicBySlug(params.slug);
  const questions = useMemo(() => (topic ? publicQuestions(topic) : []), [topic]);
  // Shuffle question order once per mount (client-side presentation only;
  // marking is server-side in /api/quiz-submit).
  const shuffled = useMemo(() => [...questions].sort(() => Math.random() - 0.5), [questions]);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [result, setResult] = useState<any>(null);
  const [err, setErr] = useState(""); const [busy, setBusy] = useState(false);
  if (!topic) return <DashboardShell title="Quiz not found"><p>That quiz does not exist.</p></DashboardShell>;
  const p = loadProgress();
  async function submit(e: React.FormEvent) {
    e.preventDefault(); setErr("");
    if (Object.keys(answers).length < 10) return setErr("Answer all 10 questions before submitting.");
    if (!p.activated) return setErr("Your account is not activated yet. Quizzes are locked until activation.");
    setBusy(true);
    try {
      const res = await fetch("/api/quiz-submit", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ slug: topic!.slug, answers }) });
      const data = await res.json();
      if (!res.ok) { setErr(data.error || "Quiz submission failed."); return; }
      setResult(data);
      const next = loadProgress();
      next.quizAttempts[topic!.slug] = { score: data.score, passed: data.passed, at: new Date().toISOString() };
      pushNotification(next, `Quiz ${data.passed ? "passed" : "submitted"}: ${topic!.title} — ${data.score}/10${data.passed ? ". You may now mark the topic complete." : ". You need 7/10 to pass — try again."}`);
      saveProgress(next);
    } catch { setErr("Network error. Try again."); }
    finally { setBusy(false); }
  }
  return (
    <DashboardShell title={`Quiz — ${topic.title}`}>
      <p className="text-sm text-slate-600">10 multiple-choice questions · Pass mark 7/10 (70%) · Questions are marked on the server. Answer keys are not sent to your browser before submission.</p>
      {!p.activated && <div className="mt-4"><Alert kind="error">Quizzes are locked until your account is activated.</Alert></div>}
      {result ? (
        <Card className="mt-4">
          <h3 className="text-xl font-bold text-navy">Your result: {result.score}/10 — {result.passed ? "Passed ✓" : "Not passed"}</h3>
          <p className="mt-2 text-sm text-slate-600">{result.passed ? "Well done. You can now mark this topic complete from the lesson page." : "You need at least 7 correct. Review the explanations below and try again."}</p>
          <div className="mt-4 space-y-3">
            {result.review.map((r: any, i: number) => (
              <div key={i} className="rounded-lg border border-slate-200 p-3 text-sm">
                <p className="font-semibold text-navy">{i + 1}. {r.q}</p>
                <p className={r.correct ? "text-emerald-700" : "text-red-700"}>{r.correct ? "✓ Correct" : `✗ Your answer: ${r.yourAnswer ?? "—"} · Correct answer: ${r.correctAnswer}`}</p>
                <p className="text-slate-600">{r.explanation}</p>
              </div>
            ))}
          </div>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link href={`/dashboard/topic/${topic.slug}`} className="rounded-lg bg-navy px-4 py-2 text-sm font-semibold text-white">Back to Lesson</Link>
            {!result.passed && <button onClick={() => { setResult(null); setAnswers({}); }} className="rounded-lg border border-navy px-4 py-2 text-sm font-semibold text-navy">Try Again</button>}
          </div>
        </Card>
      ) : (
        <form onSubmit={submit} className="mt-4 space-y-4">
          {shuffled.map((q, qi) => (
            <Card key={q.index}>
              <p className="font-semibold text-navy">{qi + 1}. {q.q}</p>
              <div className="mt-2 space-y-2">
                {q.options.map((opt, oi) => (
                  <label key={oi} className="flex cursor-pointer items-start gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm hover:border-sky">
                    <input type="radio" name={`q-${q.index}`} checked={answers[q.index] === oi} onChange={() => setAnswers({ ...answers, [q.index]: oi })} className="mt-1" />
                    <span>{opt}</span>
                  </label>
                ))}
              </div>
            </Card>
          ))}
          {err && <Alert kind="error">{err}</Alert>}
          <button disabled={busy} className="rounded-lg bg-navy px-5 py-2.5 font-semibold text-white disabled:opacity-50">{busy ? "Marking…" : "Submit Quiz"}</button>
        </form>
      )}
    </DashboardShell>
  );
}
''')
