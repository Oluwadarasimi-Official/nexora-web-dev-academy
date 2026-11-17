import { NextResponse } from "next/server";
import { getUserFromRequest, isAdmin } from "@/lib/supabase";

// Admin-only route guard: verifies the session, then the admin role,
// server-side, on every call. Deny by default.
async function requireAdmin(req: Request): Promise<{ user: { id: string }; client: NonNullable<Awaited<ReturnType<typeof getUserFromRequest>>["client"]> } | { error: NextResponse }> {
  const { user, client } = await getUserFromRequest(req);
  if (!user || !client) return { error: NextResponse.json({ error: "Log in first." }, { status: 401 }) };
  if (!(await isAdmin(client, user.id))) return { error: NextResponse.json({ error: "Administrator access required." }, { status: 403 }) };
  return { user, client };
}

// POST /api/admin/students — suspend or restore a student. Admin only.
// Body: { studentId, action: "suspend"|"restore", reason }
export async function POST(req: Request) {
  const guard = await requireAdmin(req);
  if ("error" in guard) return guard.error;
  const { client, user } = guard;
  try {
    const body = await req.json();
    const studentId = String(body.studentId || "");
    const action = String(body.action || "");
    const reason = String(body.reason || "").trim().slice(0, 500);
    if (!studentId || !["suspend", "restore"].includes(action)) return NextResponse.json({ error: "Provide a student ID and an action." }, { status: 400 });
    if (action === "suspend" && !reason) return NextResponse.json({ error: "A reason is required to suspend a student." }, { status: 400 });
    const { error } = await client.from("profiles").update({ suspended: action === "suspend", suspension_reason: action === "suspend" ? reason : null }).eq("id", studentId);
    if (error) return NextResponse.json({ error: "Could not update the student." }, { status: 500 });
    await client.from("admin_activity_logs").insert({ admin_id: user.id, action: `student_${action}`, target_type: "profile", target_id: studentId, detail: reason });
    return NextResponse.json({ ok: true, action });
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
}
