import { NextResponse } from "next/server";
import { EXAMS } from "@/lib/curriculum";
import { buildExamQuestions, correctShuffledIndex } from "@/lib/examShuffle";
import { getUserFromRequest, isSupabaseConfigured } from "@/lib/supabase";
import { checkSuspension, suspendedMessage } from "@/lib/studentGuard";
import { gradeTheoryWithGroq, computeExamResult, persistGrading } from "@/lib/aiGrading";
import { readAcademySettings } from "@/lib/settings";
import { examTotals } from "@/lib/examServer";

// POST /api/exam-submit — marks one examination attempt, honestly.
// Objective questions are auto-marked server-side against the shuffle key
// stored with the attempt (the client only ever saw shuffled options, so
// "always pick option 0" no longer works). Theory is auto-marked by AI
// (Groq, openai/gpt-oss-120b) against the published rubric — right here,
// after the answers are stored. If the AI grading service is unavailable
// (no GROQ_API_KEY, call failed, reply would not parse), the attempt
// stays "submitted" (awaiting grading) exactly as before: the submission
// still succeeds, no marks are ever fabricated, and an authorised
// examiner (or the admin "AI grade" action) grades it later. The timer
// IS enforced here: the attempt's server-recorded expires_at is checked,
// and a late submission is marked timed_out and rejected — the client
// timer is display only.
// Status after a successful submit is "submitted" (theory pending) unless
// the AI grading succeeded, in which case it is "passed"/"failed".
type TheoryAnswer = { question: string; answer: string; marks: number | null; feedback?: string | null };

function theoryStatusText(answers: TheoryAnswer[], theoryCount: number): string {
  const answered = answers.filter((a) => a.answer.trim().length >= 20).length;
  return answered === theoryCount
    ? "pending grading"
    : "incomplete — theory answers missing or too short";
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const level = Number(body.level);
    const exam = EXAMS.find((e) => e.level === level);
    if (!exam) return NextResponse.json({ error: "Unknown examination." }, { status: 404 });
    const attemptId = String(body.attemptId || "");
    const answers = (body.answers || {}) as Record<string, string>;
    const base = buildExamQuestions(level);
    const objectiveTotal = exam.objectiveCount;

    // ---- Local demo flow (Supabase not configured): no database. The
    // attempt id carries the start time, so the expiry is still enforced
    // server-side from it; the shuffle seed derives from the attempt id
    // (demo-only — the connected flow stores a random seed instead).
    if (!isSupabaseConfigured()) {
      if (!attemptId.startsWith("local-"))
        return NextResponse.json({ error: "Unknown examination attempt." }, { status: 404 });
      const startedMs = Number(attemptId.slice("local-".length));
      if (!Number.isFinite(startedMs))
        return NextResponse.json({ error: "Unknown examination attempt." }, { status: 404 });
      const expiresMs = startedMs + exam.durationMinutes * 60 * 1000;
      if (Date.now() > expiresMs)
        return NextResponse.json({
          ok: true,
          level,
          objectiveScore: 0,
          objectiveTotal,
          theoryStatus: "not graded — time expired",
          status: "timed_out",
          persisted: false,
          note: "The time expired before this submission arrived, so it was not accepted.",
        });
      let objectiveScore = 0;
      for (const q of base.objective) {
        if (Number(answers[q.key]) === correctShuffledIndex(attemptId, q.key, q.options.length))
          objectiveScore += 1;
      }
      const theoryAnswers: TheoryAnswer[] = base.theory.map((q) => ({
        question: q.q,
        answer: String(answers[q.key] || ""),
        marks: null,
      }));
      return NextResponse.json({
        ok: true,
        level,
        objectiveScore,
        objectiveTotal,
        theoryStatus: theoryStatusText(theoryAnswers, exam.theoryCount),
        status: "submitted",
        persisted: false,
        note: "Theory answers are graded automatically by AI against the published rubric when the grading service is available; otherwise an authorised examiner grades them. No theory marks are fabricated by this endpoint.",
      });
    }

    // ---- Connected flow.
    const { user, client } = await getUserFromRequest(req);
    if (!user || !client) return NextResponse.json({ error: "Log in first." }, { status: 401 });
    // B8: a suspended student cannot submit an examination.
    const susp = await checkSuspension(client, user.id);
    if (susp.suspended)
      return NextResponse.json({ error: suspendedMessage(susp.reason) }, { status: 403 });
    if (!attemptId || attemptId.startsWith("local-"))
      return NextResponse.json({ error: "Unknown examination attempt." }, { status: 404 });
    const { data: attempt } = await client
      .from("examination_attempts")
      .select(
        "id,student_id,level_id,expires_at,submitted_at,objective_score,theory_score,total_score,status,shuffle_seed,theory_answers"
      )
      .eq("id", attemptId)
      .maybeSingle();
    if (!attempt) return NextResponse.json({ error: "Unknown examination attempt." }, { status: 404 });
    if (attempt.student_id !== user.id)
      return NextResponse.json({ error: "This attempt belongs to another student." }, { status: 403 });
    if (attempt.level_id !== level)
      return NextResponse.json({ error: "Attempt does not match this examination." }, { status: 400 });

    // Already submitted (e.g. double-click / retry): return the stored
    // outcome instead of marking twice.
    if (attempt.status !== "in_progress") {
      const storedTheory: TheoryAnswer[] = Array.isArray(attempt.theory_answers)
        ? (attempt.theory_answers as TheoryAnswer[])
        : [];
      return NextResponse.json({
        ok: true,
        level,
        objectiveScore: attempt.objective_score ?? 0,
        objectiveTotal,
        theoryStatus:
          attempt.status === "timed_out"
            ? "not graded — time expired"
            : attempt.status === "submitted"
              ? theoryStatusText(storedTheory, exam.theoryCount)
              : "graded",
        status: attempt.status,
        persisted: true,
        note: "This attempt was already submitted.",
      });
    }

    // Timer enforced on the server clock, from the attempt's own expiry.
    if (Date.now() > new Date(attempt.expires_at).getTime()) {
      await client
        .from("examination_attempts")
        .update({ status: "timed_out", submitted_at: new Date().toISOString() })
        .eq("id", attempt.id);
      return NextResponse.json({
        ok: true,
        level,
        objectiveScore: 0,
        objectiveTotal,
        theoryStatus: "not graded — time expired",
        status: "timed_out",
        persisted: true,
        note: "The time expired before this submission arrived, so it was not accepted.",
      });
    }

    const seed = String(attempt.shuffle_seed || attempt.id);
    let objectiveScore = 0;
    for (const q of base.objective) {
      if (Number(answers[q.key]) === correctShuffledIndex(seed, q.key, q.options.length))
        objectiveScore += 1;
    }
    const theoryAnswers: TheoryAnswer[] = base.theory.map((q) => ({
      question: q.q,
      answer: String(answers[q.key] || ""),
      marks: null,
    }));
    const { error } = await client
      .from("examination_attempts")
      .update({
        submitted_at: new Date().toISOString(),
        objective_score: objectiveScore,
        theory_score: null,
        total_score: null,
        status: "submitted",
        theory_answers: theoryAnswers,
      })
      .eq("id", attempt.id);
    if (error)
      return NextResponse.json({ error: "Could not save the examination." }, { status: 500 });

    // AI auto-marking: grade the stored theory answers now. A null
    // result (no key / service failed / bad reply) is the designed
    // fallback — the attempt simply stays "submitted" and the student
    // sees "awaiting grading". Nothing is fabricated.
    const ai = await gradeTheoryWithGroq({
      examTitle: exam.title,
      rubric: exam.rubric,
      theoryCount: exam.theoryCount,
      answers: theoryAnswers,
    });
    if (ai) {
      const graded: TheoryAnswer[] = theoryAnswers.map((a, i) => ({
        question: a.question,
        answer: a.answer,
        marks: ai.marks[i] ?? 0,
        feedback: ai.feedback[i] ?? "",
      }));
      const theoryScore = ai.marks.reduce((s, m) => s + m, 0);
      const settings = await readAcademySettings(client);
      const { totalPossible } = examTotals(level);
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
      if (saved) {
        try {
          await client.from("notifications").insert({
            student_id: user.id,
            text:
              result.status === "passed"
                ? `Your Level ${level} examination has been graded (AI): PASSED (${result.totalScore}/${result.totalPossible}). Your certificate can now be issued from My Certificates.`
                : `Your Level ${level} examination has been graded (AI): not passed (${result.totalScore}/${result.totalPossible}, pass mark ${result.passThreshold}). Revise the level and try again when ready.`,
            kind: "exam",
          });
        } catch {}
        return NextResponse.json({
          ok: true,
          level,
          objectiveScore,
          objectiveTotal,
          theoryScore,
          totalScore: result.totalScore,
          totalPossible: result.totalPossible,
          passThreshold: result.passThreshold,
          theoryStatus: "graded by AI",
          status: result.status,
          grading: "ai",
          persisted: true,
          note: "Theory answers were graded automatically by AI against the published rubric.",
        });
      }
      // The row changed under us (already graded) — fall through to the
      // submitted response rather than reporting a second grading.
    }
    return NextResponse.json({
      ok: true,
      level,
      objectiveScore,
      objectiveTotal,
      theoryStatus: theoryStatusText(theoryAnswers, exam.theoryCount),
      status: "submitted",
      persisted: true,
      note: "Theory answers are graded automatically by AI against the published rubric when the grading service is available; otherwise an authorised examiner grades them. No theory marks are fabricated by this endpoint.",
    });
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
}
