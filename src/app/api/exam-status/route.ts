import { NextResponse } from "next/server";
import { EXAMS } from "@/lib/curriculum";
import { isLevelComplete } from "@/lib/examServer";
import { getUserFromRequest, isSupabaseConfigured } from "@/lib/supabase";

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
  const { data: attempts } = await client
    .from("examination_attempts")
    .select("id,level_id,started_at,expires_at,submitted_at,objective_score,theory_score,total_score,status")
    .eq("student_id", user.id)
    .order("started_at", { ascending: false });
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
    }
  > = {};
  for (const a of attempts ?? []) {
    if (attemptsByLevel[a.level_id]) continue;
    attemptsByLevel[a.level_id] = {
      id: a.id,
      status: a.status,
      objectiveScore: a.objective_score,
      theoryScore: a.theory_score,
      totalScore: a.total_score,
      submittedAt: a.submitted_at,
      startedAt: a.started_at,
      expiresAt: a.expires_at,
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
