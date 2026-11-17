import { NextResponse } from "next/server";
import { EXAMS } from "@/lib/curriculum";

// POST /api/exam-start — returns a server-authoritative start/expiry.
// The expiry is computed here, from the server clock, not the device clock.
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const level = Number(body.level);
    const exam = EXAMS.find((e) => e.level === level);
    if (!exam) return NextResponse.json({ error: "Unknown examination." }, { status: 404 });
    const startedAt = new Date();
    const expiresAt = new Date(startedAt.getTime() + exam.durationMinutes * 60 * 1000);
    // In the connected flow this attempt is inserted into examination_attempts
    // with these timestamps; in the local flow the timestamps are returned
    // and the client timer is driven by them.
    return NextResponse.json({ ok: true, attemptId: `local-${Date.now()}`, level, durationMinutes: exam.durationMinutes, startedAt: startedAt.toISOString(), expiresAt: expiresAt.toISOString(), persisted: false });
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
}
