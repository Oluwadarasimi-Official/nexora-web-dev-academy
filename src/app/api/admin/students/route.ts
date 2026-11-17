import { NextResponse } from "next/server";
import { requireAdmin, logAdmin } from "@/lib/adminApi";

// GET /api/admin/students — real student list from profiles, with each
// student's latest payment status, completed-topic count and certificate
// count joined in code. Admin only.
export async function GET(req: Request) {
  const guard = await requireAdmin(req);
  if ("error" in guard) return guard.error;
  const { client } = guard.ctx;
  try {
    const [profiles, payments, progress, certs] = await Promise.all([
      client
        .from("profiles")
        .select(
          "id,full_name,email,activated,suspended,suspension_reason,current_level,created_at"
        )
        .order("created_at", { ascending: false }),
      client
        .from("payments")
        .select("student_id,status,created_at")
        .order("created_at", { ascending: false }),
      client.from("lesson_progress").select("student_id"),
      client.from("certificates").select("student_id"),
    ]);
    const err =
      profiles.error || payments.error || progress.error || certs.error;
    if (err)
      return NextResponse.json(
        { error: "Could not load students." },
        { status: 500 }
      );
    const latestPayment = new Map<string, string>();
    for (const p of payments.data ?? []) {
      if (!latestPayment.has(p.student_id))
        latestPayment.set(p.student_id, p.status);
    }
    const topicCount = new Map<string, number>();
    for (const row of progress.data ?? [])
      topicCount.set(row.student_id, (topicCount.get(row.student_id) ?? 0) + 1);
    const certCount = new Map<string, number>();
    for (const row of certs.data ?? [])
      certCount.set(row.student_id, (certCount.get(row.student_id) ?? 0) + 1);
    const students = (profiles.data ?? []).map((s) => ({
      id: s.id,
      full_name: s.full_name,
      email: s.email,
      activated: s.activated,
      suspended: s.suspended,
      suspension_reason: s.suspension_reason,
      current_level: s.current_level,
      created_at: s.created_at,
      paymentStatus: latestPayment.get(s.id) ?? "none",
      completedTopics: topicCount.get(s.id) ?? 0,
      certificates: certCount.get(s.id) ?? 0,
    }));
    return NextResponse.json({ students });
  } catch {
    return NextResponse.json(
      { error: "Could not load students." },
      { status: 500 }
    );
  }
}

// POST /api/admin/students — suspend or restore a student. Admin only.
// Body: { studentId, action: "suspend"|"restore", reason }
export async function POST(req: Request) {
  const guard = await requireAdmin(req);
  if ("error" in guard) return guard.error;
  const { client, user } = guard.ctx;
  try {
    const body = await req.json();
    const studentId = String(body.studentId || "");
    const action = String(body.action || "");
    const reason = String(body.reason || "").trim().slice(0, 500);
    if (!studentId || !["suspend", "restore"].includes(action))
      return NextResponse.json(
        { error: "Provide a student ID and an action." },
        { status: 400 }
      );
    if (action === "suspend" && !reason)
      return NextResponse.json(
        { error: "A reason is required to suspend a student." },
        { status: 400 }
      );
    const { error } = await client
      .from("profiles")
      .update({
        suspended: action === "suspend",
        suspension_reason: action === "suspend" ? reason : null,
      })
      .eq("id", studentId);
    if (error)
      return NextResponse.json(
        { error: "Could not update the student." },
        { status: 500 }
      );
    await logAdmin(
      client,
      user.id,
      `student_${action}`,
      "profile",
      studentId,
      reason
    );
    return NextResponse.json({ ok: true, action });
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
}
