import pathlib, textwrap
R = pathlib.Path("/home/hatch/workspace/nexora-web-dev-academy/src/app/api")
def w(p, s):
    f = R / p; f.parent.mkdir(parents=True, exist_ok=True); f.write_text(textwrap.dedent(s).lstrip("\n"))
    print("wrote", p)

ADMIN_GUARD = '''
import { NextResponse } from "next/server";
import { getUserFromRequest, isAdmin } from "@/lib/supabase";

// Admin-only route guard: verifies the session, then the admin role,
// server-side, on every call. Deny by default.
async function requireAdmin(req: Request) {
  const { user, client } = await getUserFromRequest(req);
  if (!user || !client) return { error: NextResponse.json({ error: "Log in first." }, { status: 401 }) };
  if (!(await isAdmin(client, user.id))) return { error: NextResponse.json({ error: "Administrator access required." }, { status: 403 }) };
  return { user, client };
}
'''

w("admin/setup/route.ts", '''
import { NextResponse } from "next/server";
import { getServerSupabase, isSupabaseConfigured } from "@/lib/supabase";

// POST /api/admin/setup — one-time bootstrap. Requires ADMIN_SETUP_TOKEN
// (server-only env var, set by the owner in Vercel). The token is compared
// server-side and never logged. If it is not set, this always refuses.
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const email = String(body.email || "").trim().toLowerCase();
    const setupToken = String(body.setupToken || "");
    const expected = process.env.ADMIN_SETUP_TOKEN || "";
    if (!expected) return NextResponse.json({ error: "Admin bootstrap is not configured. The owner must set ADMIN_SETUP_TOKEN in Vercel first (see HANDOVER.md)." }, { status: 503 });
    if (!setupToken || setupToken !== expected) return NextResponse.json({ error: "Invalid setup token." }, { status: 403 });
    if (!/^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(email)) return NextResponse.json({ error: "Enter a valid registered email." }, { status: 400 });
    if (!isSupabaseConfigured()) return NextResponse.json({ error: "Supabase is not connected. Connect it first, then retry the bootstrap." }, { status: 503 });
    const client = getServerSupabase();
    if (!client) return NextResponse.json({ error: "Service unavailable." }, { status: 503 });
    const { data: profile } = await client.from("profiles").select("id").eq("email", email).maybeSingle();
    if (!profile) return NextResponse.json({ error: "No registered account uses that email. Register the account first at /register." }, { status: 404 });
    const { error } = await client.from("user_roles").upsert({ user_id: profile.id, role: "admin" }, { onConflict: "user_id,role" });
    if (error) return NextResponse.json({ error: "Could not grant the admin role." }, { status: 500 });
    return NextResponse.json({ ok: true, message: "Administrator role granted. That account can now sign in and open /admin." });
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
}
''')

w("admin/payments/route.ts", ADMIN_GUARD + '''
// POST /api/admin/payments — approve/reject a payment. Admin only.
// Body: { paymentId, decision: "approved"|"rejected", note }
export async function POST(req: Request) {
  const guard = await requireAdmin(req);
  if (guard.error) return guard.error;
  const { client, user } = guard as any;
  try {
    const body = await req.json();
    const paymentId = String(body.paymentId || "");
    const decision = String(body.decision || "");
    const note = String(body.note || "").trim().slice(0, 500);
    if (!paymentId || !["approved", "rejected"].includes(decision)) {
      return NextResponse.json({ error: "Provide a payment ID and a decision (approved or rejected)." }, { status: 400 });
    }
    const { error } = await client.from("payments").update({ status: decision, review_note: note, reviewed_by: user.id, reviewed_at: new Date().toISOString() }).eq("id", paymentId).eq("status", "pending");
    if (error) return NextResponse.json({ error: "Could not update the payment." }, { status: 500 });
    await client.from("admin_activity_logs").insert({ admin_id: user.id, action: `payment_${decision}`, target_type: "payment", target_id: paymentId, detail: note });
    return NextResponse.json({ ok: true, decision });
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
}
''')

w("admin/codes/route.ts", ADMIN_GUARD + '''
// POST /api/admin/codes — assign or revoke an access code. Admin only.
// Assign only after a payment is approved. Full codes are never returned.
export async function POST(req: Request) {
  const guard = await requireAdmin(req);
  if (guard.error) return guard.error;
  const { client, user } = guard as any;
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
''')

w("admin/students/route.ts", ADMIN_GUARD + '''
// POST /api/admin/students — suspend or restore a student. Admin only.
// Body: { studentId, action: "suspend"|"restore", reason }
export async function POST(req: Request) {
  const guard = await requireAdmin(req);
  if (guard.error) return guard.error;
  const { client, user } = guard as any;
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
''')

w("admin/certificates/route.ts", ADMIN_GUARD + '''
// POST /api/admin/certificates — revoke or reissue a certificate. Admin only.
// Body: { certificateId, action: "revoke"|"reissue", reason? }
export async function POST(req: Request) {
  const guard = await requireAdmin(req);
  if (guard.error) return guard.error;
  const { client, user } = guard as any;
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
''')
