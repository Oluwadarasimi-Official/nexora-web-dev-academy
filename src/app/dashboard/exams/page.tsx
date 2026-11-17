"use client";
import { useEffect, useRef, useState } from "react";
import DashboardShell from "@/components/DashboardShell";
import { Card, Alert } from "@/components/ui";
import { EXAMS, LEVELS, TOPICS } from "@/lib/curriculum";
import { loadProgress, saveProgress, pushNotification } from "@/lib/store";
import { studentPost, studentGet } from "@/lib/studentClient";

type ExamQuestion = { key: string; q: string; options: string[] };
type ExamTheoryQuestion = { key: string; q: string };
type StartedExam = {
  level: number;
  attemptId: string;
  durationMinutes: number;
  startedAt: string;
  expiresAt: string;
  questions: { objective: ExamQuestion[]; theory: ExamTheoryQuestion[] };
};
type ExamStatusResponse = {
  connected?: boolean;
  attempts?: Record<string, { status: string; submittedAt: string | null; startedAt: string }>;
};

export default function Exams() {
 const [p, setP] = useState(loadProgress());
 const [started, setStarted] = useState<StartedExam | null>(null);
 const [answers, setAnswers] = useState<Record<string, string>>({});
 const [result, setResult] = useState<{ level: number; objectiveScore: number; objectiveTotal: number; theoryStatus: string; status: string } | null>(null);
 const [err, setErr] = useState(""); const [busy, setBusy] = useState(false);
 const [secondsLeft, setSecondsLeft] = useState(0);
 const [expired, setExpired] = useState(false);
 const submitRef = useRef<(() => void) | null>(null);
 const autoSubmittedRef = useRef(false);

 // Server truth: a theory grade ("passed"/"failed") lands after the exam
 // is submitted, so refresh the local attempt list from the database on
 // mount — otherwise a passed exam never shows up here.
 useEffect(() => {
  (async () => {
   try {
    const data = await studentGet<ExamStatusResponse>("/api/exam-status");
    if (!data.connected || !data.attempts) return;
    const next = loadProgress();
    let changed = false;
    for (const [level, a] of Object.entries(data.attempts)) {
     const key = `level-${level}`;
     if (next.examAttempts[key]?.status !== a.status) {
      next.examAttempts[key] = { status: a.status, at: a.submittedAt || a.startedAt };
      changed = true;
     }
    }
    if (changed) { saveProgress(next); setP(next); }
   } catch { /* offline / demo flow: local progress stands */ }
  })();
 }, []);
 useEffect(() => { setP(loadProgress()); }, []);
 useEffect(() => {
 if (!started) return;
 const t = setInterval(() => {
 const left = Math.max(0, Math.floor((new Date(started.expiresAt).getTime() - Date.now()) / 1000));
 setSecondsLeft(left);
 if (left === 0) {
  clearInterval(t);
  setErr("Time expired. Submitting automatically — the server enforces the expiry time.");
  setExpired(true);
 }
 }, 1000);
 return () => clearInterval(t);
 }, [started]);
 // On expiry the exam submits itself once; the server marks the attempt
 // timed_out and rejects the answers. The client timer is display only.
 useEffect(() => {
  if (expired && started && !autoSubmittedRef.current) {
   autoSubmittedRef.current = true;
   submitRef.current?.();
  }
 }, [expired, started]);
 const levelComplete = (level: number) => TOPICS.filter((t) => t.level === level).every((t) => p.completedTopics.includes(t.slug));
 async function startExam(level: number) {
 setErr(""); setResult(null); setExpired(false); autoSubmittedRef.current = false;
 if (!p.activated) return setErr("Activate your account first.");
 if (!levelComplete(level)) return setErr("This examination opens only when every topic and quiz in the level is complete.");
 setBusy(true);
 try {
 const data = await studentPost<{ attemptId: string; durationMinutes: number; startedAt: string; expiresAt: string; questions: { objective: ExamQuestion[]; theory: ExamTheoryQuestion[] } }>("/api/exam-start", { level });
 setStarted({ level, ...data });
 setSecondsLeft(data.durationMinutes * 60);
 } catch (e) { setErr(e instanceof Error ? e.message : "Network error."); } finally { setBusy(false); }
 }
 async function submitExam() {
 if (!started) return;
 setBusy(true);
 try {
 const data = await studentPost<{ level: number; objectiveScore: number; objectiveTotal: number; theoryStatus: string; status: string }>("/api/exam-submit", { level: started.level, attemptId: started.attemptId, answers });
 setResult(data);
 const next = loadProgress();
 next.examAttempts[`level-${started.level}`] = { status: data.status, at: new Date().toISOString() };
 pushNotification(next, `Examination submitted: Level ${started.level} — ${data.status}. Objective ${data.objectiveScore}/${data.objectiveTotal}; theory ${data.theoryStatus}.`);
 saveProgress(next);
 setStarted(null);
 } catch (e) { setErr(e instanceof Error ? e.message : "Network error."); } finally { setBusy(false); }
 }
 submitRef.current = submitExam;
 const exam = started ? EXAMS.find((e) => e.level === started.level) : null;
 const objectiveQs = started ? started.questions.objective : [];
 const theoryQs = started ? started.questions.theory : [];
 const mm = String(Math.floor(secondsLeft / 60)).padStart(2, "0"); const ss = String(secondsLeft % 60).padStart(2, "0");
 return (
 <DashboardShell title="Examinations">
 {err && <div className="mb-4"><Alert kind="error">{err}</Alert></div>}
 {result && (
 <Card className="mb-4">
 <h3 className="text-lg font-bold text-navy">Examination result — Level {result.level}</h3>
 <p className="mt-2 text-sm text-slate-700">Objective: {result.objectiveScore}/{result.objectiveTotal} (marked automatically on the server). Theory: {result.theoryStatus} — graded by an authorised examiner against the published rubric; no marks are fabricated. Overall status: <strong>{result.status}</strong>.</p>
 <p className="mt-2 text-sm text-slate-600">{result.status === "passed" ? "Congratulations — your certificate for this level can now be issued from My Certificates." : result.status === "timed_out" ? "The time expired before your submission arrived, so it was not accepted. You can start the examination again when ready." : result.status === "submitted" ? "Submitted. Your theory answers are now with an authorised examiner — your graded result will appear on this page once grading is complete." : "You have not passed yet. Revise the level and try again when ready."}</p>
 </Card>
 )}
 {started && exam ? (
 <Card>
 <div className="flex flex-wrap justify-between gap-3">
 <h3 className="text-lg font-bold text-navy">{exam.title}</h3>
 <p className="font-mono text-lg font-bold text-red-700">Time left: {mm}:{ss}</p>
 </div>
 <p className="mt-2 text-sm text-slate-600">{exam.instructions}</p>
 <p className="mt-2 text-sm text-slate-600"><strong>Rubric:</strong> {exam.rubric}</p>
 <h4 className="mt-6 font-bold text-navy">Section A — Objective ({exam.objectiveCount} questions)</h4>
 <div className="mt-3 space-y-3">
 {objectiveQs.map((q) => (
 <div key={q.key} className="card-soft rounded-2xl border border-slate-200 p-3">
 <p className="text-sm font-semibold text-navy">{q.q}</p>
 <div className="mt-2 space-y-1">{q.options.map((o, oi) => (<label key={oi} className="flex gap-2 text-sm"><input type="radio" name={q.key} checked={answers[q.key] === String(oi)} onChange={() => setAnswers({ ...answers, [q.key]: String(oi) })} disabled={expired} />{o}</label>))}</div>
 </div>
 ))}
 </div>
 <h4 className="mt-6 font-bold text-navy">Section B — Theory ({exam.theoryCount} questions)</h4>
 <div className="mt-3 space-y-3">
 {theoryQs.map((q) => (
 <div key={q.key} className="card-soft rounded-2xl border border-slate-200 p-3">
 <p className="text-sm font-semibold text-navy">{q.q}</p>
 <textarea className="mt-2 w-full input-std text-sm" rows={4} value={answers[q.key] || ""} onChange={(e) => setAnswers({ ...answers, [q.key]: e.target.value })} placeholder="Write your answer here…" disabled={expired} />
 </div>
 ))}
 </div>
 <button onClick={submitExam} disabled={busy || expired} className="mt-6 btn-gold px-5 py-2.5 font-semibold disabled:opacity-50">{busy ? "Submitting…" : "Submit Examination"}</button>
 </Card>
 ) : (
 <div className="space-y-4">
 {EXAMS.map((e) => {
 const done = levelComplete(e.level);
 const att = p.examAttempts[`level-${e.level}`];
 return (
 <Card key={e.level}>
 <h3 className="text-lg font-bold text-navy">{e.title}</h3>
 <p className="mt-1 text-sm text-slate-600">{LEVELS[e.level - 1].description}</p>
 <p className="mt-1 text-sm text-slate-600">Duration {e.durationMinutes} minutes · {e.objectiveCount} objective + {e.theoryCount} theory · Pass mark {e.passMarkPercent}% · {done ? "Eligible — all topics and quizzes complete." : "Locked — complete all topics and quizzes in this level first."}</p>
 {att && <p className="mt-1 text-sm text-slate-600">Last attempt: {att.status} · {new Date(att.at).toLocaleString()}</p>}
 <button onClick={() => startExam(e.level)} disabled={!done || busy} className="mt-3 btn-gold px-4 py-2 text-sm font-semibold disabled:opacity-50">Start Examination</button>
 </Card>
 );
 })}
 </div>
 )}
 </DashboardShell>
 );
}
