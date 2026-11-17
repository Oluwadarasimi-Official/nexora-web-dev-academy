import { NextResponse } from "next/server";
import { requireAdmin, logAdmin } from "@/lib/adminApi";

// GET /api/admin/payments — real payment list, newest first, with the
// student's name and email joined in code. Admin only.
export async function GET(req: Request) {
  const guard = await requireAdmin(req);
  if ("error" in guard) return guard.error;
  const { client } = guard.ctx;
  try {
    const [payments, profiles] = await Promise.all([
      client
        .from("payments")
        .select(
          "id,student_id,reference,evidence_note,amount_text,status,review_note,reviewed_at,created_at"
        )
        .order("created_at", { ascending: false }),
      client.from("profiles").select("id,full_name,email"),
    ]);
    if (payments.error || profiles.error)
      return NextResponse.json(
        { error: "Could not load payments." },
        { status: 500 }
      );
    const names = new Map(
      (profiles.data ?? []).map((p) => [p.id, p] as const)
    );
    const list = (payments.data ?? []).map((p) => ({
      id: p.id,
      student_id: p.student_id,
      student_name: names.get(p.student_id)?.full_name ?? "Unknown student",
      student_email: names.get(p.student_id)?.email ?? "",
      reference: p.reference,
      evidence_note: p.evidence_note,
      amount_text: p.amount_text,
      status: p.status,
      review_note: p.review_note,
      reviewed_at: p.reviewed_at,
      created_at: p.created_at,
    }));
    return NextResponse.json({ payments: list });
  } catch {
    return NextResponse.json(
      { error: "Could not load payments." },
      { status: 500 }
    );
  }
}

// POST /api/admin/payments — approve/reject a payment. Admin only.
// Body: { paymentId, decision: "approved"|"rejected", note }
export async function POST(req: Request) {
  const guard = await requireAdmin(req);
  if ("error" in guard) return guard.error;
  const { client, user } = guard.ctx;
  try {
    const body = await req.json();
    const paymentId = String(body.paymentId || "");
    const decision = String(body.decision || "");
    const note = String(body.note || "").trim().slice(0, 500);
    if (!paymentId || !["approved", "rejected"].includes(decision)) {
      return NextResponse.json(
        { error: "Provide a payment ID and a decision (approved or rejected)." },
        { status: 400 }
      );
    }
    const { error } = await client
      .from("payments")
      .update({
        status: decision,
        review_note: note,
        reviewed_by: user.id,
        reviewed_at: new Date().toISOString(),
      })
      .eq("id", paymentId)
      .eq("status", "pending");
    if (error)
      return NextResponse.json(
        { error: "Could not update the payment." },
        { status: 500 }
      );
    await logAdmin(
      client,
      user.id,
      `payment_${decision}`,
      "payment",
      paymentId,
      note
    );
    return NextResponse.json({ ok: true, decision });
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
}
