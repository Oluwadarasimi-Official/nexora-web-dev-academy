"use client";
import { useEffect, useState } from "react";
import DashboardShell from "@/components/DashboardShell";
import { Card, Alert } from "@/components/ui";
import { EXAMS, LEVELS, TOPICS } from "@/lib/curriculum";
import { loadProgress, saveProgress, pushNotification } from "@/lib/store";

export default function Exams() {
 const [p, setP] = useState(loadProgress());
 const [started, setStarted] = useState<{ level: number; attemptId: string; durationMinutes: number; startedAt: string; expiresAt: string } | null>(null);
 const [answers, setAnswers] = useState<Record<string, string>>({});
 const [result, setResult] = useState<{ level: number; objectiveScore: number; objectiveTotal: number; theoryStatus: string; status: string } | null>(null);
 const [err, setErr] = useState(""); const [busy, setBusy] = useState(false);
 const [secondsLeft, setSecondsLeft] = useState(0);
 useEffect(() => { setP(loadProgress()); }, []);
 useEffect(() => {
 if (!started) return;
 const t = setInterval(() => {
 const left = Math.max(0, Math.floor((new Date(started.expiresAt).getTime() - Date.now()) / 1000));
 setSecondsLeft(left);
 if (left === 0) { clearInterval(t); setErr("Time expired. Submit immediately — the server enforces the expiry time."); }
 }, 1000);
 return () => clearInterval(t);
 }, [started]);
 const levelComplete = (level: number) => TOPICS.filter((t) => t.level === level).every((t) => p.completedTopics.includes(t.slug));
 async function startExam(level: number) {
 setErr(""); setResult(null);
 if (!p.activated) return setErr("Activate your account first.");
 if (!levelComplete(level)) return setErr("This examination opens only when every topic and quiz in the level is complete.");
 setBusy(true);
 try {
 const res = await fetch("/api/exam-start", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ level }) });
 const data = await res.json();
 if (!res.ok) { setErr(data.error || "Could not start the examination."); return; }
 setStarted({ level, ...data });
 setSecondsLeft(data.durationMinutes * 60);
 } catch { setErr("Network error."); } finally { setBusy(false); }
 }
 async function submitExam() {
 if (!started) return;
 setBusy(true);
 try {
 const res = await fetch("/api/exam-submit", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ level: started.level, attemptId: started.attemptId, answers }) });
 const data = await res.json();
 if (!res.ok) { setErr(data.error || "Submission failed."); return; }
 setResult(data);
 const next = loadProgress();
 next.examAttempts[`level-${started.level}`] = { status: data.status, at: new Date().toISOString() };
 pushNotification(next, `Examination submitted: Level ${started.level} — ${data.status}. Objective ${data.objectiveScore}/${data.objectiveTotal}; theory ${data.theoryStatus}.`);
 saveProgress(next);
 setStarted(null);
 } catch { setErr("Network error."); } finally { setBusy(false); }
 }
 const exam = started ? EXAMS.find((e) => e.level === started.level) : null;
 const objectiveQs = exam ? Array.from({ length: exam.objectiveCount }, (_, i) => {
 const topic = TOPICS.filter((t) => t.level === exam.level)[i % TOPICS.filter((t) => t.level === exam.level).length];
 return { key: `obj-${i}`, q: `Objective ${i + 1}: Which statement is correct about “${topic.title}”?`, options: [`${topic.summary}`, "It has no effect on a real project.", "It should never be practised.", "It only matters for examinations."] };
 }) : [];
 const theoryQs = exam ? Array.from({ length: exam.theoryCount }, (_, i) => ({ key: `theory-${i}`, q: `Theory ${i + 1}: Explain, with a worked example, a key idea from Level ${exam.level} and how you would apply it in a real project.` })) : [];
 const mm = String(Math.floor(secondsLeft / 60)).padStart(2, "0"); const ss = String(secondsLeft % 60).padStart(2, "0");
 return (
 <DashboardShell title="Examinations">
 {err && <div className="mb-4"><Alert kind="error">{err}</Alert></div>}
 {result && (
 <Card className="mb-4">
 <h3 className="text-lg font-bold text-navy">Examination result — Level {result.level}</h3>
 <p className="mt-2 text-sm text-slate-700">Objective: {result.objectiveScore}/{result.objectiveTotal} (marked automatically on the server). Theory: {result.theoryStatus} — graded by an authorised examiner against the published rubric; no marks are fabricated. Overall status: <strong>{result.status}</strong>.</p>
 <p className="mt-2 text-sm text-slate-600">{result.status === "passed" ? "Congratulations — your certificate for this level can now be issued from My Certificates." : "You have not passed yet. Revise the level and try again when ready."}</p>
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
 <div className="mt-2 space-y-1">{q.options.map((o, oi) => (<label key={oi} className="flex gap-2 text-sm"><input type="radio" name={q.key} checked={answers[q.key] === String(oi)} onChange={() => setAnswers({ ...answers, [q.key]: String(oi) })} />{o}</label>))}</div>
 </div>
 ))}
 </div>
 <h4 className="mt-6 font-bold text-navy">Section B — Theory ({exam.theoryCount} questions)</h4>
 <div className="mt-3 space-y-3">
 {theoryQs.map((q) => (
 <div key={q.key} className="card-soft rounded-2xl border border-slate-200 p-3">
 <p className="text-sm font-semibold text-navy">{q.q}</p>
 <textarea className="mt-2 w-full input-std text-sm" rows={4} value={answers[q.key] || ""} onChange={(e) => setAnswers({ ...answers, [q.key]: e.target.value })} placeholder="Write your answer here…" />
 </div>
 ))}
 </div>
 <button onClick={submitExam} disabled={busy} className="mt-6 btn-gold px-5 py-2.5 font-semibold disabled:opacity-50">{busy ? "Submitting…" : "Submit Examination"}</button>
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
