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
  const [result, setResult] = useState<{ score: number; passed: boolean; review: { q: string; correct: boolean; yourAnswer: string | null; correctAnswer: string; explanation: string }[] } | null>(null);
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
            {result.review.map((r, i: number) => (
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
