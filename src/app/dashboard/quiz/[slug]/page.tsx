"use client";
import { Check, Lock, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import DashboardShell from "@/components/DashboardShell";
import { Card, Alert } from "@/components/ui";
import { topicBySlug, publicQuestions, levelUnlocked, PASS_MARK } from "@/lib/curriculum";
import { loadProgress, saveProgress, pushNotification, useSyncedProgress } from "@/lib/store";
import { getPublicSettings } from "@/lib/settings";
import { studentPost } from "@/lib/studentClient";

export default function QuizPage({ params }: { params: { slug: string } }) {
 const topic = topicBySlug(params.slug);
 const questions = useMemo(() => (topic ? publicQuestions(topic) : []), [topic]);
 // Shuffle question order once per mount (client-side presentation only;
 // marking is server-side in /api/quiz-submit).
 const shuffled = useMemo(() => [...questions].sort(() => Math.random() - 0.5), [questions]);
 const [answers, setAnswers] = useState<Record<number, number>>({});
 const [result, setResult] = useState<{ score: number; passed: boolean; passMark?: number; persisted?: boolean; review: { q: string; correct: boolean; yourAnswer: string | null; correctAnswer: string; explanation: string }[] } | null>(null);
 const [err, setErr] = useState(""); const [busy, setBusy] = useState(false);
 // B9: the pass mark shown here is the number the server enforces
 // (academy_settings), not the hardcoded 7.
 const [passMark, setPassMark] = useState(PASS_MARK);
 useEffect(() => { getPublicSettings().then((s) => setPassMark(s.quizPassMark)).catch(() => {}); }, []);
 // Hook must run before the early return below (rules of hooks).
 const p = useSyncedProgress();
 if (!topic) return <DashboardShell title="Quiz not found"><p>That quiz does not exist.</p></DashboardShell>;
 // B15: a quiz is locked until the account is activated AND its level is
 // unlocked — previously the quiz page checked activation only, so a
 // student could take a Level 3 quiz before finishing Level 1.
 const levelOpen = levelUnlocked(topic.level, p.completedTopics.length);
 const locked = !p.activated || !levelOpen;
 // Lesson-view gate (owner rule): the quiz must not open until the
 // student has opened the course (lesson) for this topic. A completed
 // topic counts as opened (legacy: completed before lesson_views existed).
 const done = p.completedTopics.includes(topic.slug);
 const opened = done || (p.openedLessons ?? []).includes(topic.slug);
 const needsLesson = !opened;
 async function submit(e: React.FormEvent) {
 e.preventDefault(); setErr("");
 if (Object.keys(answers).length < 10) return setErr("Answer all 10 questions before submitting.");
 if (!p.activated) return setErr("Your account is not activated yet. Quizzes are locked until activation.");
 if (!levelOpen) return setErr(`This level is locked. Complete Level ${topic!.level - 1} first.`);
 if (needsLesson) return setErr("Open the course first — read the lesson, then take its quiz.");
 setBusy(true);
 try {
 const data = await studentPost<{ score: number; passed: boolean; passMark?: number; persisted?: boolean; review: { q: string; correct: boolean; yourAnswer: string | null; correctAnswer: string; explanation: string }[] }>("/api/quiz-submit", { slug: topic!.slug, answers });
 setResult(data);
 if (typeof data.passMark === "number") setPassMark(data.passMark);
 const next = loadProgress();
 next.quizAttempts[topic!.slug] = { score: data.score, passed: data.passed, at: new Date().toISOString() };
 // Honest copy: only promise "mark the topic complete" when the server
 // actually saved the attempt. If it did not persist, the lesson page's
 // "Mark Topic Complete" will not see the pass — submit the quiz again
 // (the server is the authority; there is no local-only repair path).
 if (data.persisted === false) {
 pushNotification(next, `Quiz ${data.passed ? "passed" : "submitted"}: ${topic!.title} — ${data.score}/10. Your result was marked but could not be saved to the academy database — submit the quiz again to save it.`);
 } else {
 pushNotification(next, `Quiz ${data.passed ? "passed" : "submitted"}: ${topic!.title} — ${data.score}/10${data.passed ? ". You may now mark the topic complete." : `. You need ${data.passMark ?? passMark}/10 to pass — try again.`}`);
 }
 saveProgress(next);
 } catch (e) { setErr(e instanceof Error ? e.message : "Network error. Try again."); }
 finally { setBusy(false); }
 }
 return (
 <DashboardShell title={`Quiz — ${topic.title}`}>
 <p className="text-sm text-slate-600">10 multiple-choice questions · Pass mark {passMark}/10 ({Math.round((passMark / 10) * 100)}%) · Questions are marked on the server. Answer keys are not sent to your browser before submission.</p>
 {locked && !result ? (
 <Card className="mt-4">
 <h3 className="font-bold text-navy"><Lock className="inline h-5 w-5 text-amber-700" /> This quiz is locked</h3>
 <p className="mt-2 text-sm leading-relaxed text-slate-700">{!p.activated ? "Your account is not activated yet. Pay on WhatsApp, get your access code from the owner, and redeem it to unlock this quiz." : `This level is locked. Complete Level ${topic.level - 1} (all topics and quizzes) first.`}</p>
 {!p.activated && <Link href="/dashboard/payment" className="mt-4 inline-block btn-gold px-4 py-2 text-sm font-semibold">Go to Payment &amp; Activation</Link>}
 </Card>
 ) : needsLesson && !result ? (
 <Card className="mt-4">
 <h3 className="font-bold text-navy"><Lock className="inline h-5 w-5 text-amber-700" /> Open the course first</h3>
 <p className="mt-2 text-sm leading-relaxed text-slate-700">This quiz opens only after you have opened the course for this topic. Read the lesson first, then come back here.</p>
 <Link href={`/dashboard/topic/${topic.slug}`} className="mt-4 inline-block btn-gold px-4 py-2 text-sm font-semibold">Open the Course</Link>
 </Card>
 ) : result ? (
 <Card className="mt-4">
 <h3 className="text-xl font-bold text-navy">Your result: {result.score}/10 — {result.passed ? (<>Passed <Check className="inline h-5 w-5" /></>) : "Not passed"}</h3>
 <p className="mt-2 text-sm text-slate-600">{result.passed ? "Well done. You can now mark this topic complete from the lesson page." : `You need at least ${result.passMark ?? passMark} correct. Review the explanations below and try again.`}</p>
 {result.persisted === false && <p className="mt-2 text-sm font-semibold text-amber-700">Your result was marked but could not be saved to the academy database just now. Submit the quiz again to save it — the lesson page can only mark the topic complete once the server has your pass.</p>}
 <div className="mt-4 space-y-3">
 {result.review.map((r, i: number) => (
 <div key={i} className="card-soft rounded-2xl border border-slate-200 p-3 text-sm">
 <p className="font-semibold text-navy">{i + 1}. {r.q}</p>
 <p className={r.correct ? "text-sky-600" : "text-red-700"}>{r.correct ? (<><Check className="inline h-4 w-4" /> Correct</>) : (<><X className="inline h-4 w-4" /> Your answer: {r.yourAnswer ?? "No answer given"} · Correct answer: {r.correctAnswer}</>)}</p>
 <p className="text-slate-600">{r.explanation}</p>
 </div>
 ))}
 </div>
 <div className="mt-4 flex flex-wrap gap-3">
 <Link href={`/dashboard/topic/${topic.slug}`} className="btn-gold px-4 py-2 text-sm font-semibold">Back to Lesson</Link>
 {!result.passed && <button onClick={() => { setResult(null); setAnswers({}); }} className="btn-sky px-4 py-2 text-sm">Try Again</button>}
 </div>
 </Card>
 ) : (
 <form onSubmit={submit} className="mt-4 space-y-4">
 {shuffled.map((q, qi) => (
 <Card key={q.index}>
 <p className="font-semibold text-navy">{qi + 1}. {q.q}</p>
 <div className="mt-2 space-y-2">
 {q.options.map((opt, oi) => (
 <label key={oi} className="flex cursor-pointer items-start gap-2 rounded-full border border-slate-200 card-soft px-3 py-2 text-sm hover:border-gold/60">
 <input type="radio" name={`q-${q.index}`} checked={answers[q.index] === oi} onChange={() => setAnswers({ ...answers, [q.index]: oi })} className="mt-1" />
 <span>{opt}</span>
 </label>
 ))}
 </div>
 </Card>
 ))}
 {err && <Alert kind="error">{err}</Alert>}
 <button disabled={busy} className="btn-gold px-5 py-2.5 font-semibold disabled:opacity-50">{busy ? "Marking…" : "Submit Quiz"}</button>
 </form>
 )}
 </DashboardShell>
 );
}
