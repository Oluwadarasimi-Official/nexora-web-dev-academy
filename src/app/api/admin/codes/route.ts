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

// POST /api/admin/codes — assign or revoke an access code. Admin only.
// Assign only after a payment is approved. Full codes are never returned.
export async function POST(req: Request) {
  const guard = await requireAdmin(req);
  if ("error" in guard) return guard.error;
  const { client, user } = guard;
  try {
    const body = await req.json();
    const action = String(body.action || "");
    const codeId = String(body.codeId || "");
    if (action === "assign") {
      const studentId = String(body.studentId || "");
      if (!codeId || !studentId) return NextResponse.json({ error: "Provide a code ID and a student ID." }, { status: 400 });
      const { error } = await client.from("access_codes").update({ status: "assigned", assigned_to: studentId, assigned_by: user.id, assigned_at: new Date().toISOString() }).eq("id", codeId).eq("status", "unused");
      if (error) return NextResponse.json({ error: "Could not assign the code (it may already be used)." }, { status: 409 });
    } else if (action === "revoke") {
      const reason = String(body.reason || "").trim().slice(0, 500);
      const { error } = await client.from("access_codes").update({ status: "revoked" }).eq("id", codeId).eq("status", "unused");
      if (error) return NextResponse.json({ error: "Could not revoke the code (it may already be used)." }, { status: 409 });
      await client.from("admin_activity_logs").insert({ admin_id: user.id, action: "code_revoked", target_type: "access_code", target_id: codeId, detail: reason });
    } else {
      return NextResponse.json({ error: "Unknown action." }, { status: 400 });
    }
    await client.from("admin_activity_logs").insert({ admin_id: user.id, action: `code_${action}`, target_type: "access_code", target_id: codeId, detail: "" });
    return NextResponse.json({ ok: true, action });
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
}
