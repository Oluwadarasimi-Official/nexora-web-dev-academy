import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminApi";

// GET /api/admin/logs — the audit trail (admin_activity_logs), newest
// first, with the acting administrator's name joined in code. Admin only.
export async function GET(req: Request) {
  const guard = await requireAdmin(req);
  if ("error" in guard) return guard.error;
  const { client } = guard.ctx;
  try {
    const [logs, profiles] = await Promise.all([
      client
        .from("admin_activity_logs")
        .select("id,admin_id,action,target_type,target_id,detail,created_at")
        .order("created_at", { ascending: false })
        .limit(100),
      client.from("profiles").select("id,full_name,email"),
    ]);
    if (logs.error || profiles.error)
      return NextResponse.json(
        { error: "Could not load the audit log." },
        { status: 500 }
      );
    const names = new Map(
      (profiles.data ?? []).map((p) => [p.id, p] as const)
    );
    const list = (logs.data ?? []).map((l) => ({
      id: l.id,
      admin_id: l.admin_id,
      admin_name: l.admin_id
        ? (names.get(l.admin_id)?.full_name ?? "Unknown administrator")
        : null,
      action: l.action,
      target_type: l.target_type,
      target_id: l.target_id,
      detail: l.detail,
      created_at: l.created_at,
    }));
    return NextResponse.json({ logs: list });
  } catch {
    return NextResponse.json(
      { error: "Could not load the audit log." },
      { status: 500 }
    );
  }
}
