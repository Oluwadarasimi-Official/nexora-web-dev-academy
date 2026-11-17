import { NextResponse } from "next/server";
import { requireAdmin, logAdmin } from "@/lib/adminApi";

// GET /api/admin/codes — real access-code list with statuses and counts.
// Only row ids, statuses and assignees are returned; code hashes and
// plaintext codes are never sent to any client. Admin only.
export async function GET(req: Request) {
  const guard = await requireAdmin(req);
  if ("error" in guard) return guard.error;
  const { client } = guard.ctx;
  try {
    const [codes, redemptions, profiles] = await Promise.all([
      client
        .from("access_codes")
        .select("id,status,assigned_to,assigned_at,created_at")
        .order("created_at", { ascending: true }),
      client
        .from("code_redemptions")
        .select("code_id,student_id,redeemed_at"),
      client.from("profiles").select("id,full_name,email"),
    ]);
    if (codes.error || redemptions.error || profiles.error)
      return NextResponse.json(
        { error: "Could not load access codes." },
        { status: 500 }
      );
    const names = new Map(
      (profiles.data ?? []).map((p) => [p.id, p] as const)
    );
    const redeemed = new Map(
      (redemptions.data ?? []).map((r) => [r.code_id, r] as const)
    );
    const list = (codes.data ?? []).map((c) => ({
      id: c.id,
      status: c.status,
      assigned_to: c.assigned_to,
      assigned_name: c.assigned_to
        ? (names.get(c.assigned_to)?.full_name ?? "Unknown student")
        : null,
      assigned_email: c.assigned_to
        ? (names.get(c.assigned_to)?.email ?? "")
        : null,
      assigned_at: c.assigned_at,
      created_at: c.created_at,
      redeemed_at: redeemed.get(c.id)?.redeemed_at ?? null,
      redeemed_by_name: redeemed.get(c.id)
        ? (names.get(redeemed.get(c.id)!.student_id)?.full_name ??
          "Unknown student")
        : null,
    }));
    const counts = {
      total: list.length,
      unused: list.filter((c) => c.status === "unused").length,
      assigned: list.filter((c) => c.status === "assigned").length,
      redeemed: list.filter((c) => c.status === "redeemed").length,
      revoked: list.filter((c) => c.status === "revoked").length,
      disabled: list.filter((c) => c.status === "disabled").length,
    };
    return NextResponse.json({ codes: list, counts });
  } catch {
    return NextResponse.json(
      { error: "Could not load access codes." },
      { status: 500 }
    );
  }
}

// POST /api/admin/codes — assign or revoke an access code. Admin only.
// Assign only after a payment is approved. Full codes are never returned.
export async function POST(req: Request) {
  const guard = await requireAdmin(req);
  if ("error" in guard) return guard.error;
  const { client, user } = guard.ctx;
  try {
    const body = await req.json();
    const action = String(body.action || "");
    const codeId = String(body.codeId || "");
    if (action === "assign") {
      const studentId = String(body.studentId || "");
      if (!codeId || !studentId)
        return NextResponse.json(
          { error: "Provide a code ID and a student ID." },
          { status: 400 }
        );
      const { error } = await client
        .from("access_codes")
        .update({
          status: "assigned",
          assigned_to: studentId,
          assigned_by: user.id,
          assigned_at: new Date().toISOString(),
        })
        .eq("id", codeId)
        .eq("status", "unused");
      if (error)
        return NextResponse.json(
          { error: "Could not assign the code (it may already be used)." },
          { status: 409 }
        );
    } else if (action === "revoke") {
      const reason = String(body.reason || "").trim().slice(0, 500);
      const { error } = await client
        .from("access_codes")
        .update({ status: "revoked" })
        .eq("id", codeId)
        .eq("status", "unused");
      if (error)
        return NextResponse.json(
          { error: "Could not revoke the code (it may already be used)." },
          { status: 409 }
        );
      await logAdmin(
        client,
        user.id,
        "code_revoked",
        "access_code",
        codeId,
        reason
      );
    } else {
      return NextResponse.json({ error: "Unknown action." }, { status: 400 });
    }
    await logAdmin(
      client,
      user.id,
      `code_${action}`,
      "access_code",
      codeId,
      ""
    );
    return NextResponse.json({ ok: true, action });
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
}
