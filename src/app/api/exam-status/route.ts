import { NextResponse } from "next/server";
import { EXAMS } from "@/lib/curriculum";
import { isLevelComplete, examTotals } from "@/lib/examServer";
import { getUserFromRequest, isSupabaseConfigured } from "@/lib/supabase";
import { gradeTheoryWithGroq, computeExamResult, persistGrading } from "@/lib/aiGrading";
import { readAcademySettings } from "@/lib/settings";

// GET /api/exam-status — the signed-in student's own exam + certificate
// state, read from the database (the source of truth). The Examinations
// and My Certificates pages use this instead of trusting local progress
// alone, so a theory grade ("passed"/"failed") and an issued certificate
// show up the next time the student opens the page — including on a
// different device. In the local demo flow there is no database, so the
// pages fall back to local progress.
export async function GET(req: Request) {
  if (!isSupabaseConfigured())
    return NextResponse.json({ ok: true, connected: false });
  const { user, client } = await getUserFromRequest(req);
  if (!user || !client) return NextResponse.json({ error: "Log in first." }, { status: 401 });
  let { data: attempts } = await client
    .from("examination_attempts")
    .select("id,level_id,started_at,expires_at,submitted_at,objective_score,theory_score,total_score,status,theory_answers")
    .eq("student_id", user.id)
    .order("started_at", { ascending: false });
  // AUTO AI GRADING (owner rule, 17 Nov 2026 night: "Auto AI Grade" —
  // no admin tap). Any attempt still "submitted" grades itself right
  // here, with the exact same Groq marking the submit route and the
  // admin "AI grade" action use (same model, rubric, 0–10 per question).
  // Best-effort and silent on failure: if the key is missing or Groq
  // fails, gradeTheoryWithGroq returns null and the attempt simply stays
  // "submitted" — no marks are ever invented. persistGrading is
  // status-guarded, so a concurrent grading can never double-apply, and
  // once an attempt is graded its status is no longer "submitted", so
  // later loads never call Groq again. The admin "AI grade" button stays
  // as a manual retry if the AI was unavailable at load time.
  try {
    const settings = await readAcademySettings(client);
    for (const a of attempts ?? []) {
      if (a.status !== "submitted") continue;
      const exam = EXAMS.find((e) => e.level === a.level_id);
      if (!exam) continue;
      const stored = (Array.isArray(a.theory_answers) ? a.theory_answers : []) as {
        question: string;
        answer: string;
      }[];
      if (stored.length !== exam.theoryCount || stored.every((t) => !t.answer?.trim()))
        continue;
      const ai = await gradeTheoryWithGroq({
        examTitle: exam.title,
        rubric: exam.rubric,
        theoryCount: exam.theoryCount,
        answers: stored,
      });
      if (!ai) continue;
      const graded = stored.map((t, i) => ({
        question: t.question,
        answer: t.answer,
        marks: ai.marks[i] ?? 0,
        feedback: ai.feedback[i] ?? "",
      }));
      const theoryScore = ai.marks.reduce((s, m) => s + m, 0);
      const objectiveScore = a.objective_score ?? 0;
      const { totalPossible } = examTotals(a.level_id);
      const result = computeExamResult(
        objectiveScore,
        theoryScore,
        totalPossible,
        settings.examPassMarkPercent
      );
      const saved = await persistGrading(client, a.id, ["submitted"], {
        theory_answers: graded,
        theory_score: theoryScore,
        total_score: result.totalScore,
        status: result.status,
      });
      if (!saved) continue;
      try {
        await client.from("notifications").insert({
          student_id: user.id,
          text:
            result.status === "passed"
              ? `Your Level ${a.level_id} examination has been graded (AI): PASSED (${result.totalScore}/${totalPossible}). Your certificate can now be issued from My Certificates.`
              : `Your Level ${a.level_id} examination has been graded (AI): not passed (${result.totalScore}/${totalPossible}, pass mark ${result.passThreshold}). Revise the level and try again when ready.`,
          kind: "exam",
        });
      } catch {}
    }
    // Re-read so the response below shows the freshly graded result.
    const refetched = await client
      .from("examination_attempts")
      .select("id,level_id,started_at,expires_at,submitted_at,objective_score,theory_score,total_score,status,theory_answers")
      .eq("student_id", user.id)
      .order("started_at", { ascending: false });
    if (!refetched.error) attempts = refetched.data;
  } catch {
    // Auto-grading must never break the status read: on any error the
    // attempt stays "submitted" and the page shows it awaiting grading.
  }
  const { data: certs } = await client
    .from("certificates")
    .select("level_id,certificate_id,title,issued_at")
    .eq("student_id", user.id)
    .eq("status", "valid")
    .order("issued_at", { ascending: false });
  const attemptsByLevel: Record<
    number,
    {
      id: string;
      status: string;
      objectiveScore: number | null;
      theoryScore: number | null;
      totalScore: number | null;
      submittedAt: string | null;
      startedAt: string;
      expiresAt: string;
      // The student's own theory marks + AI feedback, so the graded
      // result (and why each answer scored what it did) shows on the
      // Examinations page without trusting local progress.
      theoryAnswers: { question: string; marks: number | null; feedback: string | null }[];
      aiGraded: boolean;
    }
  > = {};
  for (const a of attempts ?? []) {
    if (attemptsByLevel[a.level_id]) continue;
    const theoryAnswers: { question: string; marks: number | null; feedback: string | null }[] = (
      Array.isArray(a.theory_answers) ? a.theory_answers : []
    ).map((t: { question?: unknown; marks?: unknown; feedback?: unknown }) => ({
      question: typeof t.question === "string" ? t.question : "",
      marks: typeof t.marks === "number" ? t.marks : null,
      feedback: typeof t.feedback === "string" ? t.feedback : null,
    }));
    attemptsByLevel[a.level_id] = {
      id: a.id,
      status: a.status,
      objectiveScore: a.objective_score,
      theoryScore: a.theory_score,
      totalScore: a.total_score,
      submittedAt: a.submitted_at,
      startedAt: a.started_at,
      expiresAt: a.expires_at,
      theoryAnswers,
      aiGraded: theoryAnswers.some((t) => t.feedback != null && t.feedback.trim() !== ""),
    };
  }
  const levelComplete: Record<number, boolean> = {};
  for (const e of EXAMS) levelComplete[e.level] = await isLevelComplete(client, user.id, e.level);
  return NextResponse.json({
    ok: true,
    connected: true,
    attempts: attemptsByLevel,
    certificates: (certs ?? []).map((c) => ({
      level: c.level_id,
      certificateId: c.certificate_id,
      title: c.title,
      issuedAt: c.issued_at,
    })),
    levelComplete,
  });
}
