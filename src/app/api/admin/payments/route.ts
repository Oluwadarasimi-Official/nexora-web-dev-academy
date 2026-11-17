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

// POST /api/admin/payments — approve/reject a payment. Admin only.
// Body: { paymentId, decision: "approved"|"rejected", note }
export async function POST(req: Request) {
  const guard = await requireAdmin(req);
  if ("error" in guard) return guard.error;
  const { client, user } = guard;
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
