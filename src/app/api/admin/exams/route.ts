import { NextResponse } from "next/server";
import { EXAMS } from "@/lib/curriculum";
import { examTotals } from "@/lib/examServer";
import { requireAdmin, logAdmin } from "@/lib/adminApi";
import { readAcademySettings } from "@/lib/settings";
import { gradeTheoryWithGroq, computeExamResult, persistGrading } from "@/lib/aiGrading";

type TheoryAnswer = { question: string; answer: string; marks: number | null; feedback?: string | null };

// GET /api/admin/exams — examination attempts for grading, newest
// submitted first, with the student's name and email joined in code.
// Admin only. Optional filters: ?status=submitted|graded|passed|failed|
// timed_out|in_progress&level=1|2|3
export async function GET(req: Request) {
  const guard = await requireAdmin(req);
  if ("error" in guard) return guard.error;
  const { client } = guard.ctx;
  try {
    const url = new URL(req.url);
    const statusFilter = url.searchParams.get("status") || "";
    const levelFilter = Number(url.searchParams.get("level") || "");
    let query = client
      .from("examination_attempts")
      .select(
        "id,student_id,level_id,started_at,expires_at,submitted_at,objective_score,theory_score,total_score,status,theory_answers"
      )
      .order("submitted_at", { ascending: false, nullsFirst: false })
      .order("started_at", { ascending: false });
    if (statusFilter) query = query.eq("status", statusFilter);
    if (levelFilter) query = query.eq("level_id", levelFilter);
    const [attempts, profiles] = await Promise.all([
      query,
      client.from("profiles").select("id,full_name,email"),
    ]);
    if (attempts.error || profiles.error)
      return NextResponse.json(
        { error: "Could not load examination attempts." },
        { status: 500 }
      );
    const names = new Map(
      (profiles.data ?? []).map((p) => [p.id, p] as const)
    );
    const list = (attempts.data ?? []).map((a) => ({
      id: a.id,
      studentId: a.student_id,
      studentName: names.get(a.student_id)?.full_name ?? "Unknown student",
      studentEmail: names.get(a.student_id)?.email ?? "",
      level: a.level_id,
      status: a.status,
      objectiveScore: a.objective_score,
      theoryScore: a.theory_score,
      totalScore: a.total_score,
      startedAt: a.started_at,
      expiresAt: a.expires_at,
      submittedAt: a.submitted_at,
      theoryAnswers: Array.isArray(a.theory_answers) ? a.theory_answers : [],
      // AI-graded iff any theory answer carries AI feedback — only the
      // AI path ever writes feedback, so this needs no extra column.
      aiGraded: (Array.isArray(a.theory_answers) ? a.theory_answers : []).some(
        (t: { feedback?: unknown }) =>
          typeof t.feedback === "string" && t.feedback.trim() !== ""
      ),
    }));
    return NextResponse.json({
      attempts: list,
      // B9: the pass mark the grading below enforces, so the admin page's
      // would-pass preview uses the same number as the server.
      examPassMarkPercent: (await readAcademySettings(client)).examPassMarkPercent,
      counts: {
        total: list.length,
        awaiting: list.filter((a) => a.status === "submitted").length,
        passed: list.filter((a) => a.status === "passed").length,
        failed: list.filter((a) => a.status === "failed").length,
        timedOut: list.filter((a) => a.status === "timed_out").length,
        inProgress: list.filter((a) => a.status === "in_progress").length,
      },
    });
  } catch {
    return NextResponse.json(
      { error: "Could not load examination attempts." },
      { status: 500 }
    );
  }
}

// POST /api/admin/exams — grade one attempt's theory answers.
// Admin only. Two actions:
//   { action: "ai_grade", attemptId } — run the same Groq AI marking the
//   submit route uses (openai/gpt-oss-120b, published rubric, 0-10 per
//   question + one feedback sentence per answer). Only for attempts still
//   "submitted". If the AI service is unavailable the attempt stays
//   awaiting grading (503) — no marks are ever fabricated.
//   { attemptId, theoryMarks: number[] } — manual marks (0-10 per theory
//   question). This is now the OVERRIDE: it works on a "submitted"
//   attempt (first grading) and on an already-graded "passed"/"failed"
//   attempt (adjusting the marks, AI feedback kept). The total
//   (objective + theory) decides pass/fail against the rubric pass mark
//   (70% — 35/50 by default, from Academy Settings). The student is
//   notified of the outcome.
export async function POST(req: Request) {
  const guard = await requireAdmin(req);
  if ("error" in guard) return guard.error;
  const { client, user } = guard.ctx;
  try {
    const body = await req.json();
    const attemptId = String(body.attemptId || "");
    if (!attemptId)
      return NextResponse.json({ error: "Provide an attempt ID." }, { status: 400 });
    const { data: attempt, error: loadError } = await client
      .from("examination_attempts")
      .select("id,student_id,level_id,objective_score,theory_score,status,theory_answers")
      .eq("id", attemptId)
      .maybeSingle();
    if (loadError || !attempt)
      return NextResponse.json({ error: "Attempt not found." }, { status: 404 });
    const exam = EXAMS.find((e) => e.level === attempt.level_id);
    if (!exam)
      return NextResponse.json({ error: "Unknown examination." }, { status: 404 });
    const settings = await readAcademySettings(client);
    const { totalPossible } = examTotals(attempt.level_id);

    // ---- AI grading action (submitted attempts only).
    if (body.action === "ai_grade") {
      if (attempt.status !== "submitted")
        return NextResponse.json(
          { error: `This attempt is ${attempt.status}, not awaiting grading.` },
          { status: 409 }
        );
      const stored: TheoryAnswer[] = Array.isArray(attempt.theory_answers)
        ? (attempt.theory_answers as TheoryAnswer[])
        : [];
      if (stored.length !== exam.theoryCount || stored.every((a) => !a.answer?.trim()))
        return NextResponse.json(
          { error: "This attempt has no theory answers to grade." },
          { status: 400 }
        );
      const ai = await gradeTheoryWithGroq({
        examTitle: exam.title,
        rubric: exam.rubric,
        theoryCount: exam.theoryCount,
        answers: stored,
      });
      if (!ai)
        return NextResponse.json(
          {
            error:
              "AI grading is unavailable right now — the Groq key may not be set, or the grading service failed. The attempt stays awaiting grading; try again later. No marks were invented.",
          },
          { status: 503 }
        );
      const graded: TheoryAnswer[] = stored.map((a, i) => ({
        question: a.question,
        answer: a.answer,
        marks: ai.marks[i] ?? 0,
        feedback: ai.feedback[i] ?? "",
      }));
      const theoryScore = ai.marks.reduce((s, m) => s + m, 0);
      const objectiveScore = attempt.objective_score ?? 0;
      const result = computeExamResult(
        objectiveScore,
        theoryScore,
        totalPossible,
        settings.examPassMarkPercent
      );
      const saved = await persistGrading(client, attempt.id, ["submitted"], {
        theory_answers: graded,
        theory_score: theoryScore,
        total_score: result.totalScore,
        status: result.status,
      });
      if (!saved)
        return NextResponse.json(
          { error: "Could not save the grading (the attempt may already be graded)." },
          { status: 409 }
        );
      await logAdmin(
        client,
        user.id,
        `exam_ai_graded_${result.status}`,
        "examination_attempt",
        attempt.id,
        `Level ${attempt.level_id} (AI): objective ${objectiveScore}, theory ${theoryScore}, total ${result.totalScore}/${totalPossible} — ${result.status}`
      );
      try {
        await client.from("notifications").insert({
          student_id: attempt.student_id,
          text:
            result.status === "passed"
              ? `Your Level ${attempt.level_id} examination has been graded (AI): PASSED (${result.totalScore}/${totalPossible}). Your certificate can now be issued from My Certificates.`
              : `Your Level ${attempt.level_id} examination has been graded (AI): not passed (${result.totalScore}/${totalPossible}, pass mark ${result.passThreshold}). Revise the level and try again when ready.`,
          kind: "exam",
        });
      } catch {}
      return NextResponse.json({
        ok: true,
        attemptId: attempt.id,
        status: result.status,
        objectiveScore,
        theoryScore,
        totalScore: result.totalScore,
        totalPossible,
        passThreshold: result.passThreshold,
        grading: "ai",
      });
    }

    // ---- Manual grading / override.
    const theoryMarks = body.theoryMarks as unknown;
    if (
      !Array.isArray(theoryMarks) ||
      theoryMarks.length !== exam.theoryCount ||
      theoryMarks.some(
        (m) => typeof m !== "number" || !Number.isInteger(m) || m < 0 || m > 10
      )
    )
      return NextResponse.json(
        { error: `Provide one whole-number mark (0–10) for each of the ${exam.theoryCount} theory questions.` },
        { status: 400 }
      );
    const isOverride = attempt.status === "passed" || attempt.status === "failed";
    if (attempt.status !== "submitted" && !isOverride)
      return NextResponse.json(
        { error: `This attempt is ${attempt.status} and cannot be graded.` },
        { status: 409 }
      );
    if (isOverride && attempt.theory_score == null)
      return NextResponse.json(
        { error: "This attempt has no grading to override." },
        { status: 409 }
      );
    const stored: TheoryAnswer[] = Array.isArray(attempt.theory_answers)
      ? (attempt.theory_answers as TheoryAnswer[])
      : [];
    const graded: TheoryAnswer[] = stored.map((a, i) => ({
      question: a.question,
      answer: a.answer,
      marks: (theoryMarks as number[])[i] ?? 0,
      // An override keeps the AI feedback that was already there.
      feedback: a.feedback ?? null,
    }));
    // If the stored answers are missing (old attempt), grade from the
    // marks alone against blank answers rather than refusing.
    while (graded.length < exam.theoryCount)
      graded.push({
        question: `Theory ${graded.length + 1}`,
        answer: "",
        marks: (theoryMarks as number[])[graded.length] ?? 0,
        feedback: null,
      });
    const theoryScore = (theoryMarks as number[]).reduce((s, m) => s + m, 0);
    const objectiveScore = attempt.objective_score ?? 0;
    const result = computeExamResult(
      objectiveScore,
      theoryScore,
      totalPossible,
      settings.examPassMarkPercent
    );
    const saved = await persistGrading(
      client,
      attempt.id,
      ["submitted", "passed", "failed"],
      {
        theory_answers: graded,
        theory_score: theoryScore,
        total_score: result.totalScore,
        status: result.status,
      }
    );
    if (!saved)
      return NextResponse.json(
        { error: "Could not save the grading (the attempt may already be graded)." },
        { status: 409 }
      );
    await logAdmin(
      client,
      user.id,
      isOverride ? `exam_grade_overridden_${result.status}` : `exam_graded_${result.status}`,
      "examination_attempt",
      attempt.id,
      `Level ${attempt.level_id}${isOverride ? " (manual override)" : ""}: objective ${objectiveScore}, theory ${theoryScore}, total ${result.totalScore}/${totalPossible} — ${result.status}`
    );
    try {
      await client.from("notifications").insert({
        student_id: attempt.student_id,
        text:
          result.status === "passed"
            ? `Your Level ${attempt.level_id} examination has been graded: PASSED (${result.totalScore}/${totalPossible}). Your certificate can now be issued from My Certificates.`
            : `Your Level ${attempt.level_id} examination has been graded: not passed (${result.totalScore}/${totalPossible}, pass mark ${result.passThreshold}). Revise the level and try again when ready.`,
        kind: "exam",
      });
    } catch {}
    return NextResponse.json({
      ok: true,
      attemptId: attempt.id,
      status: result.status,
      objectiveScore,
      theoryScore,
      totalScore: result.totalScore,
      totalPossible,
      passThreshold: result.passThreshold,
      grading: isOverride ? "manual-override" : "manual",
    });
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
}
