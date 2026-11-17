import { NextResponse } from "next/server";
import { requireAdmin, logAdmin } from "@/lib/adminApi";

// GET /api/admin/certificates — real certificate list, newest first.
// Admin only.
export async function GET(req: Request) {
  const guard = await requireAdmin(req);
  if ("error" in guard) return guard.error;
  const { client } = guard.ctx;
  try {
    const { data, error } = await client
      .from("certificates")
      .select(
        "id,certificate_id,student_id,student_name,level_id,title,status,issued_at,revoke_reason"
      )
      .order("issued_at", { ascending: false });
    if (error)
      return NextResponse.json(
        { error: "Could not load certificates." },
        { status: 500 }
      );
    const list = data ?? [];
    return NextResponse.json({
      certificates: list,
      counts: {
        total: list.length,
        valid: list.filter((c) => c.status === "valid").length,
        revoked: list.filter((c) => c.status === "revoked").length,
      },
    });
  } catch {
    return NextResponse.json(
      { error: "Could not load certificates." },
      { status: 500 }
    );
  }
}

// POST /api/admin/certificates — revoke or reissue a certificate. Admin only.
// Body: { certificateId, action: "revoke"|"reissue", reason? }
export async function POST(req: Request) {
  const guard = await requireAdmin(req);
  if ("error" in guard) return guard.error;
  const { client, user } = guard.ctx;
  try {
    const body = await req.json();
    const certificateId = String(body.certificateId || "").trim();
    const action = String(body.action || "");
    const reason = String(body.reason || "").trim().slice(0, 500);
    if (!certificateId || !["revoke", "reissue"].includes(action))
      return NextResponse.json(
        { error: "Provide a certificate ID and an action." },
        { status: 400 }
      );
    if (action === "revoke") {
      if (!reason)
        return NextResponse.json(
          { error: "A reason is required to revoke a certificate." },
          { status: 400 }
        );
      const { data, error } = await client
        .from("certificates")
        .update({ status: "revoked", revoke_reason: reason })
        .eq("certificate_id", certificateId)
        .eq("status", "valid")
        .select("id");
      if (error || !data || data.length === 0)
        return NextResponse.json(
          { error: "Could not revoke the certificate (it may already be revoked or not exist)." },
          { status: 409 }
        );
    } else {
      // Reissue: revoke the old record, then the student re-issues from
      // their dashboard (which creates a fresh ID). The audit trail keeps both.
      const { data, error } = await client
        .from("certificates")
        .update({
          status: "revoked",
          revoke_reason: reason || "Reissued with corrections",
        })
        .eq("certificate_id", certificateId)
        .eq("status", "valid")
        .select("id");
      if (error || !data || data.length === 0)
        return NextResponse.json(
          { error: "Could not reissue the certificate (it may already be revoked or not exist)." },
          { status: 409 }
        );
    }
    await logAdmin(
      client,
      user.id,
      `certificate_${action}`,
      "certificate",
      certificateId,
      reason
    );
    return NextResponse.json({ ok: true, action });
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
}
