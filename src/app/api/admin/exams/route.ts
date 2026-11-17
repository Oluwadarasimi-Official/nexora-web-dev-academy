import { NextResponse } from "next/server";
import { EXAMS } from "@/lib/curriculum";
import { examTotals } from "@/lib/examServer";
import { requireAdmin, logAdmin } from "@/lib/adminApi";

type TheoryAnswer = { question: string; answer: string; marks: number | null };

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
    }));
    return NextResponse.json({
      attempts: list,
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

// POST /api/admin/exams — grade one submitted attempt's theory answers.
// Admin only. Body: { attemptId, theoryMarks: number[] } — one mark
// (0–10) per theory question, against the published rubric. Theory is
// NEVER auto-marked; this is the only place marks are awarded. The total
// (objective + theory) decides pass/fail against the rubric pass mark
// (70% — 35/50). The student is notified of the outcome.
export async function POST(req: Request) {
  const guard = await requireAdmin(req);
  if ("error" in guard) return guard.error;
  const { client, user } = guard.ctx;
  try {
    const body = await req.json();
    const attemptId = String(body.attemptId || "");
    const theoryMarks = body.theoryMarks as unknown;
    if (!attemptId)
      return NextResponse.json({ error: "Provide an attempt ID." }, { status: 400 });
    const { data: attempt, error: loadError } = await client
      .from("examination_attempts")
      .select("id,student_id,level_id,objective_score,status,theory_answers")
      .eq("id", attemptId)
      .maybeSingle();
    if (loadError || !attempt)
      return NextResponse.json({ error: "Attempt not found." }, { status: 404 });
    if (attempt.status !== "submitted")
      return NextResponse.json(
        { error: `This attempt is ${attempt.status}, not awaiting grading.` },
        { status: 409 }
      );
    const exam = EXAMS.find((e) => e.level === attempt.level_id);
    if (!exam)
      return NextResponse.json({ error: "Unknown examination." }, { status: 404 });
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
    const stored: TheoryAnswer[] = Array.isArray(attempt.theory_answers)
      ? (attempt.theory_answers as TheoryAnswer[])
      : [];
    const graded: TheoryAnswer[] = stored.map((a, i) => ({
      question: a.question,
      answer: a.answer,
      marks: (theoryMarks as number[])[i] ?? 0,
    }));
    // If the stored answers are missing (old attempt), grade from the
    // marks alone against blank answers rather than refusing.
    while (graded.length < exam.theoryCount)
      graded.push({
        question: `Theory ${graded.length + 1}`,
        answer: "",
        marks: (theoryMarks as number[])[graded.length] ?? 0,
      });
    const theoryScore = (theoryMarks as number[]).reduce((s, m) => s + m, 0);
    const objectiveScore = attempt.objective_score ?? 0;
    const totalScore = objectiveScore + theoryScore;
    const { totalPossible, passThreshold } = examTotals(attempt.level_id);
    const status = totalScore >= passThreshold ? "passed" : "failed";
    const { error: updateError } = await client
      .from("examination_attempts")
      .update({
        theory_answers: graded,
        theory_score: theoryScore,
        total_score: totalScore,
        status,
      })
      .eq("id", attempt.id)
      .eq("status", "submitted");
    if (updateError)
      return NextResponse.json({ error: "Could not save the grading." }, { status: 500 });
    await logAdmin(
      client,
      user.id,
      `exam_graded_${status}`,
      "examination_attempt",
      attempt.id,
      `Level ${attempt.level_id}: objective ${objectiveScore}, theory ${theoryScore}, total ${totalScore}/${totalPossible} — ${status}`
    );
    try {
      await client.from("notifications").insert({
        student_id: attempt.student_id,
        text:
          status === "passed"
            ? `Your Level ${attempt.level_id} examination has been graded: PASSED (${totalScore}/${totalPossible}). Your certificate can now be issued from My Certificates.`
            : `Your Level ${attempt.level_id} examination has been graded: not passed (${totalScore}/${totalPossible}, pass mark ${passThreshold}). Revise the level and try again when ready.`,
        kind: "exam",
      });
    } catch {}
    return NextResponse.json({
      ok: true,
      attemptId: attempt.id,
      status,
      objectiveScore,
      theoryScore,
      totalScore,
      totalPossible,
      passThreshold,
    });
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
}
