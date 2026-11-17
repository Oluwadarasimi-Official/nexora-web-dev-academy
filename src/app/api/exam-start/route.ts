import { NextResponse } from "next/server";
import { EXAMS } from "@/lib/curriculum";
import { buildExamQuestions, shuffleOptions } from "@/lib/examShuffle";
import { isLevelComplete } from "@/lib/examServer";
import {
  getUserFromRequest,
  isSupabaseConfigured,
} from "@/lib/supabase";
import { checkSuspension, suspendedMessage } from "@/lib/studentGuard";

// POST /api/exam-start — starts a real, persisted examination attempt.
// The start/expiry come from the server clock, the attempt is written to
// examination_attempts with a per-attempt shuffle seed, and the objective
// options are shuffled server-side before they reach the client — the
// client only ever sees shuffled options and never learns the key.
// Eligibility (activated account + every topic and quiz in the level
// complete) is enforced here from the database, never trusted from the
// client. In the local demo flow (Supabase not configured) there is no
// database, so the attempt id carries the start time and the seed derives
// from it (demo-only); the connected flow is the real one.
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const level = Number(body.level);
    const exam = EXAMS.find((e) => e.level === level);
    if (!exam) return NextResponse.json({ error: "Unknown examination." }, { status: 404 });
    const startedAt = new Date();
    const expiresAt = new Date(startedAt.getTime() + exam.durationMinutes * 60 * 1000);
    const base = buildExamQuestions(level);

    if (!isSupabaseConfigured()) {
      const attemptId = `local-${Date.now()}`;
      const objective = base.objective.map((q) => ({
        key: q.key,
        q: q.q,
        options: shuffleOptions(attemptId, q.key, q.options).options,
      }));
      return NextResponse.json({
        ok: true,
        attemptId,
        level,
        durationMinutes: exam.durationMinutes,
        startedAt: startedAt.toISOString(),
        expiresAt: expiresAt.toISOString(),
        questions: { objective, theory: base.theory },
        persisted: false,
      });
    }

    const { user, client } = await getUserFromRequest(req);
    if (!user || !client) return NextResponse.json({ error: "Log in first." }, { status: 401 });
    // B8: a suspended student cannot start an examination.
    const susp = await checkSuspension(client, user.id);
    if (susp.suspended)
      return NextResponse.json({ error: suspendedMessage(susp.reason) }, { status: 403 });
    const { data: profile } = await client
      .from("profiles")
      .select("activated")
      .eq("id", user.id)
      .maybeSingle();
    if (!profile?.activated)
      return NextResponse.json({ error: "Activate your account first." }, { status: 403 });
    if (!(await isLevelComplete(client, user.id, level)))
      return NextResponse.json(
        { error: "This examination opens only when every topic and quiz in the level is complete." },
        { status: 403 }
      );
    const { data: examRow } = await client
      .from("examinations")
      .select("id")
      .eq("level_id", level)
      .maybeSingle();
    if (!examRow)
      return NextResponse.json({ error: "Examination not set up yet." }, { status: 503 });
    const seed = `${crypto.randomUUID()}-${Math.random().toString(36).slice(2)}`;
    const { data: attempt, error } = await client
      .from("examination_attempts")
      .insert({
        student_id: user.id,
        examination_id: examRow.id,
        level_id: level,
        started_at: startedAt.toISOString(),
        expires_at: expiresAt.toISOString(),
        shuffle_seed: seed,
        status: "in_progress",
      })
      .select("id")
      .single();
    if (error || !attempt)
      return NextResponse.json({ error: "Could not start the examination." }, { status: 500 });
    const objective = base.objective.map((q) => ({
      key: q.key,
      q: q.q,
      options: shuffleOptions(seed, q.key, q.options).options,
    }));
    return NextResponse.json({
      ok: true,
      attemptId: attempt.id,
      level,
      durationMinutes: exam.durationMinutes,
      startedAt: startedAt.toISOString(),
      expiresAt: expiresAt.toISOString(),
      questions: { objective, theory: base.theory },
      persisted: true,
    });
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
}
