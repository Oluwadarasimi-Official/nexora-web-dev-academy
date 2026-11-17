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

// POST /api/admin/certificates — revoke or reissue a certificate. Admin only.
// Body: { certificateId, action: "revoke"|"reissue", reason? }
export async function POST(req: Request) {
  const guard = await requireAdmin(req);
  if ("error" in guard) return guard.error;
  const { client, user } = guard;
  try {
    const body = await req.json();
    const certificateId = String(body.certificateId || "").trim();
    const action = String(body.action || "");
    const reason = String(body.reason || "").trim().slice(0, 500);
    if (!certificateId || !["revoke", "reissue"].includes(action)) return NextResponse.json({ error: "Provide a certificate ID and an action." }, { status: 400 });
    if (action === "revoke") {
      if (!reason) return NextResponse.json({ error: "A reason is required to revoke a certificate." }, { status: 400 });
      const { error } = await client.from("certificates").update({ status: "revoked", revoke_reason: reason }).eq("certificate_id", certificateId).eq("status", "valid");
      if (error) return NextResponse.json({ error: "Could not revoke the certificate." }, { status: 500 });
    } else {
      // Reissue: revoke the old record, then the student re-issues from
      // their dashboard (which creates a fresh ID). The audit trail keeps both.
      const { error } = await client.from("certificates").update({ status: "revoked", revoke_reason: reason || "Reissued with corrections" }).eq("certificate_id", certificateId).eq("status", "valid");
      if (error) return NextResponse.json({ error: "Could not reissue the certificate." }, { status: 500 });
    }
    await client.from("admin_activity_logs").insert({ admin_id: user.id, action: `certificate_${action}`, target_type: "certificate", target_id: certificateId, detail: reason });
    return NextResponse.json({ ok: true, action });
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
}
