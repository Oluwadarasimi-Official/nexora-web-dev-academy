import { NextResponse } from "next/server";
import { requireAdmin, logAdmin } from "@/lib/adminApi";

// GET /api/admin/support — real support requests, newest first, with the
// student's name and email joined in code. Admin only.
// POST — reply to a request and set its status. Admin only.
// Body: { requestId, reply, status: "open"|"in_progress"|"resolved" }
export async function GET(req: Request) {
  const guard = await requireAdmin(req);
  if ("error" in guard) return guard.error;
  const { client } = guard.ctx;
  try {
    const [requests, profiles] = await Promise.all([
      client
        .from("support_requests")
        .select(
          "id,student_id,category,message,status,admin_reply,created_at,updated_at"
        )
        .order("created_at", { ascending: false }),
      client.from("profiles").select("id,full_name,email"),
    ]);
    if (requests.error || profiles.error)
      return NextResponse.json(
        { error: "Could not load support requests." },
        { status: 500 }
      );
    const names = new Map(
      (profiles.data ?? []).map((p) => [p.id, p] as const)
    );
    const list = (requests.data ?? []).map((r) => ({
      id: r.id,
      student_id: r.student_id,
      student_name: names.get(r.student_id)?.full_name ?? "Unknown student",
      student_email: names.get(r.student_id)?.email ?? "",
      category: r.category,
      message: r.message,
      status: r.status,
      admin_reply: r.admin_reply,
      created_at: r.created_at,
      updated_at: r.updated_at,
    }));
    return NextResponse.json({ requests: list });
  } catch {
    return NextResponse.json(
      { error: "Could not load support requests." },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  const guard = await requireAdmin(req);
  if ("error" in guard) return guard.error;
  const { client, user } = guard.ctx;
  try {
    const body = await req.json();
    const requestId = String(body.requestId || "");
    const reply = String(body.reply || "").trim().slice(0, 2000);
    const status = String(body.status || "");
    if (!requestId || !["open", "in_progress", "resolved"].includes(status))
      return NextResponse.json(
        { error: "Provide a request ID and a valid status." },
        { status: 400 }
      );
    const { data, error } = await client
      .from("support_requests")
      .update({
        admin_reply: reply || null,
        status,
        updated_at: new Date().toISOString(),
      })
      .eq("id", requestId)
      .select("id");
    if (error || !data || data.length === 0)
      return NextResponse.json(
        { error: "Could not update the request (it may not exist)." },
        { status: 409 }
      );
    await logAdmin(
      client,
      user.id,
      `support_${status}`,
      "support_request",
      requestId,
      reply
    );
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
}
