"use client";
import { useCallback, useEffect, useState } from "react";
import AdminShell from "@/components/AdminShell";
import { Card, Alert } from "@/components/ui";
import { adminGet, adminPost, AdminApiError } from "@/lib/adminClient";
import { EXAMS } from "@/lib/curriculum";

/* Admin examination grading. Objective questions are marked automatically
 * on the server; this page is where an authorised examiner grades the
 * theory answers against the published rubric (0–10 per question).
 * The total (objective + theory) decides pass/fail at 70% (35/50) — the
 * page shows the live total and the outcome before saving, and the server
 * re-checks everything. Theory is NEVER auto-marked. */

type TheoryAnswer = { question: string; answer: string; marks: number | null };

type Attempt = {
  id: string;
  studentId: string;
  studentName: string;
  studentEmail: string;
  level: number;
  status: string;
  objectiveScore: number | null;
  theoryScore: number | null;
  totalScore: number | null;
  startedAt: string;
  expiresAt: string;
  submittedAt: string | null;
  theoryAnswers: TheoryAnswer[];
};

type StatusFilter = "submitted" | "all" | "passed" | "failed" | "timed_out" | "in_progress";

export default function Page() {
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [counts, setCounts] = useState({ total: 0, awaiting: 0, passed: 0, failed: 0, timedOut: 0, inProgress: 0 });
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [msg, setMsg] = useState("");
  const [filter, setFilter] = useState<StatusFilter>("submitted");
  const [levelFilter, setLevelFilter] = useState<number>(0);
  const [marks, setMarks] = useState<Record<string, number[]>>({});
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const q = new URLSearchParams();
      if (filter !== "all") q.set("status", filter);
      if (levelFilter) q.set("level", String(levelFilter));
      const data = await adminGet<{ attempts: Attempt[]; counts: { total: number; awaiting: number; passed: number; failed: number; timedOut: number; inProgress: number } }>(`/api/admin/exams?${q.toString()}`);
      setAttempts(data.attempts);
      setCounts(data.counts);
      setErr("");
    } catch (e: unknown) {
      setErr(e instanceof AdminApiError ? e.message : "Could not load examination attempts.");
    } finally {
      setLoading(false);
    }
  }, [filter, levelFilter]);
  useEffect(() => { load(); }, [load]);

  const rubric = EXAMS[0]?.rubric ?? "";

  function setMark(attemptId: string, idx: number, value: string) {
    const n = value === "" ? 0 : Math.max(0, Math.min(10, Number(value) || 0));
    setMarks((prev) => {
      const cur = prev[attemptId] ?? [];
      const next = [...cur];
      next[idx] = n;
      return { ...prev, [attemptId]: next };
    });
  }

  async function grade(attempt: Attempt) {
    const theoryCount = EXAMS.find((e) => e.level === attempt.level)?.theoryCount ?? 3;
    const entered = marks[attempt.id] ?? attempt.theoryAnswers.map(() => 0);
    if (entered.length !== theoryCount || entered.some((m) => !Number.isInteger(m) || m < 0 || m > 10)) {
      setErr(`Enter one whole-number mark (0–10) for each of the ${theoryCount} theory questions.`);
      return;
    }
    setBusyId(attempt.id);
    setErr("");
    setMsg("");
    try {
      const data = await adminPost<{ status: string; theoryScore: number; totalScore: number; totalPossible: number; passThreshold: number }>("/api/admin/exams", { attemptId: attempt.id, theoryMarks: entered });
      setMsg(`${attempt.studentName} — Level ${attempt.level}: graded ${data.status.toUpperCase()} (${data.totalScore}/${data.totalPossible}, pass mark ${data.passThreshold}).`);
      await load();
    } catch (e: unknown) {
      setErr(e instanceof AdminApiError ? e.message : "Could not save the grading.");
    } finally {
      setBusyId(null);
    }
  }

  const statusLabel = (s: string) =>
    s === "submitted" ? "Awaiting grading" : s === "timed_out" ? "Timed out" : s === "in_progress" ? "In progress" : s.charAt(0).toUpperCase() + s.slice(1);

  return (
    <AdminShell title="Examination Grading" intro="Grade theory answers against the published rubric. Objective questions are marked automatically on the server — only theory needs an examiner, and theory is never auto-marked.">
      {err && <div className="mb-4"><Alert kind="error">{err}</Alert></div>}
      {msg && <div className="mb-4"><Alert kind="success">{msg}</Alert></div>}
      <Card className="mb-4">
        <p className="text-sm text-slate-600"><strong>Rubric (each theory question, 10 marks):</strong> {rubric}</p>
        <p className="mt-2 text-sm text-slate-600">
          Awaiting grading: <strong>{counts.awaiting}</strong> · Passed: <strong>{counts.passed}</strong> · Failed: <strong>{counts.failed}</strong> · Timed out: <strong>{counts.timedOut}</strong> · In progress: <strong>{counts.inProgress}</strong> · Total attempts: <strong>{counts.total}</strong>
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {(["submitted", "all", "passed", "failed", "timed_out", "in_progress"] as StatusFilter[]).map((f) => (
            <button key={f} onClick={() => setFilter(f)} className={`shrink-0 rounded-full border px-3 py-1.5 text-sm font-medium ${filter === f ? "border-gold bg-gold text-ink" : "chip text-navy hover:border-gold"}`}>
              {f === "submitted" ? "Awaiting grading" : f === "all" ? "All" : statusLabel(f)}
            </button>
          ))}
          {[0, 1, 2, 3].map((l) => (
            <button key={l} onClick={() => setLevelFilter(l)} className={`shrink-0 rounded-full border px-3 py-1.5 text-sm font-medium ${levelFilter === l ? "border-gold bg-gold text-ink" : "chip text-navy hover:border-gold"}`}>
              {l === 0 ? "All levels" : `Level ${l}`}
            </button>
          ))}
        </div>
      </Card>
      {loading ? (
        <Card><p className="text-sm text-slate-600">Loading attempts…</p></Card>
      ) : attempts.length === 0 ? (
        <Card><p className="text-sm text-slate-600">No attempts in this view.</p></Card>
      ) : (
        <div className="space-y-4">
          {attempts.map((a) => {
            const exam = EXAMS.find((e) => e.level === a.level);
            const theoryCount = exam?.theoryCount ?? 3;
            const totalPossible = (exam?.objectiveCount ?? 20) + theoryCount * 10;
            const passThreshold = Math.ceil((totalPossible * (exam?.passMarkPercent ?? 70)) / 100);
            const entered = marks[a.id] ?? a.theoryAnswers.map((t) => t.marks ?? 0);
            const theorySum = entered.reduce((s, m) => s + (m || 0), 0);
            const total = (a.objectiveScore ?? 0) + theorySum;
            const gradable = a.status === "submitted";
            return (
              <Card key={a.id}>
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <h3 className="text-lg font-bold text-navy">{a.studentName} — Level {a.level}</h3>
                    <p className="text-sm text-slate-600">{a.studentEmail} · Submitted {a.submittedAt ? new Date(a.submittedAt).toLocaleString() : "not submitted"} · Started {new Date(a.startedAt).toLocaleString()}</p>
                  </div>
                  <span className="rounded-full bg-gold/15 px-2.5 py-1 text-xs font-semibold text-gold-dark ring-1 ring-gold/50">{statusLabel(a.status)}</span>
                </div>
                <p className="mt-2 text-sm text-slate-700">
                  Objective: <strong>{a.objectiveScore ?? "—"}/{exam?.objectiveCount ?? 20}</strong>
                  {a.theoryScore !== null && <> · Theory: <strong>{a.theoryScore}/{theoryCount * 10}</strong></>}
                  {a.totalScore !== null && <> · Total: <strong>{a.totalScore}/{totalPossible}</strong></>}
                  {gradable && <> · Your marks so far: <strong>{total}/{totalPossible}</strong> (pass mark {passThreshold}) — <strong>{total >= passThreshold ? "would PASS" : "would FAIL"}</strong></>}
                </p>
                {a.theoryAnswers.length === 0 ? (
                  <p className="mt-3 text-sm text-slate-600">No theory answers on this attempt.</p>
                ) : (
                  <div className="mt-3 space-y-3">
                    {a.theoryAnswers.map((t, i) => (
                      <div key={i} className="card-soft rounded-2xl border border-slate-200 p-3">
                        <p className="text-sm font-semibold text-navy">{t.question}</p>
                        <p className="mt-1 whitespace-pre-wrap text-sm text-slate-700">{t.answer || "(no answer given)"}</p>
                        <div className="mt-2 flex items-center gap-2">
                          <label className="text-sm font-medium text-navy">Mark (0–10):</label>
                          <input
                            type="number"
                            min={0}
                            max={10}
                            step={1}
                            value={entered[i] ?? 0}
                            disabled={!gradable || busyId === a.id}
                            onChange={(e) => setMark(a.id, i, e.target.value)}
                            className="input-std w-20 text-sm"
                          />
                          {t.marks !== null && <span className="text-sm text-slate-600">Graded: {t.marks}/10</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {gradable && (
                  <button onClick={() => grade(a)} disabled={busyId === a.id} className="mt-4 btn-gold px-5 py-2.5 font-semibold disabled:opacity-50">
                    {busyId === a.id ? "Saving…" : "Save Grading"}
                  </button>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </AdminShell>
  );
}
