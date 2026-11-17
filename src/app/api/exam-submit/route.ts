import { NextResponse } from "next/server";
import { EXAMS } from "@/lib/curriculum";
import { buildExamQuestions, correctShuffledIndex } from "@/lib/examShuffle";
import { getUserFromRequest, isSupabaseConfigured } from "@/lib/supabase";

// POST /api/exam-submit — marks one examination attempt, honestly.
// Objective questions are auto-marked server-side against the shuffle key
// stored with the attempt (the client only ever saw shuffled options, so
// "always pick option 0" no longer works). Theory is NEVER auto-marked:
// the answers are saved and the attempt waits for an authorised examiner
// (see /api/admin/exams). The timer IS enforced here: the attempt's
// server-recorded expires_at is checked, and a late submission is marked
// timed_out and rejected — the client timer is display only.
// Status after a successful submit is always "submitted" (theory pending).
// "passed"/"failed" can only come from grading, never from this endpoint.
type TheoryAnswer = { question: string; answer: string; marks: number | null };

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
        note: "Theory answers are graded by an authorised examiner against the published rubric. No theory marks are fabricated by this endpoint.",
      });
    }

    // ---- Connected flow.
    const { user, client } = await getUserFromRequest(req);
    if (!user || !client) return NextResponse.json({ error: "Log in first." }, { status: 401 });
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
    return NextResponse.json({
      ok: true,
      level,
      objectiveScore,
      objectiveTotal,
      theoryStatus: theoryStatusText(theoryAnswers, exam.theoryCount),
      status: "submitted",
      persisted: true,
      note: "Theory answers are graded by an authorised examiner against the published rubric. No theory marks are fabricated by this endpoint.",
    });
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
}
