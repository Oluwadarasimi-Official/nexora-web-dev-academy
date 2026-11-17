import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminApi";

// GET /api/admin/overview — live dashboard metrics + recent activity.
// Admin only; the caller's Bearer token is verified by requireAdmin.
export async function GET(req: Request) {
  const guard = await requireAdmin(req);
  if ("error" in guard) return guard.error;
  const { client } = guard.ctx;
  try {
    const [profiles, payments, codes, certs, logs] = await Promise.all([
      client.from("profiles").select("id,activated"),
      client.from("payments").select("id,status"),
      client.from("access_codes").select("id,status"),
      client.from("certificates").select("id,status"),
      client
        .from("admin_activity_logs")
        .select("id,action,detail,created_at")
        .order("created_at", { ascending: false })
        .limit(8),
    ]);
    const err =
      profiles.error || payments.error || codes.error || certs.error || logs.error;
    if (err)
      return NextResponse.json(
        { error: "Could not load dashboard data." },
        { status: 500 }
      );
    const students = profiles.data ?? [];
    const payList = payments.data ?? [];
    const codeList = codes.data ?? [];
    const certList = certs.data ?? [];
    return NextResponse.json({
      studentsTotal: students.length,
      studentsActivated: students.filter((s) => s.activated).length,
      studentsUnactivated: students.filter((s) => !s.activated).length,
      paymentsPending: payList.filter((p) => p.status === "pending").length,
      paymentsTotal: payList.length,
      codesTotal: codeList.length,
      codesUnused: codeList.filter((c) => c.status === "unused").length,
      codesAssigned: codeList.filter((c) => c.status === "assigned").length,
      codesRedeemed: codeList.filter((c) => c.status === "redeemed").length,
      codesRevoked: codeList.filter((c) => c.status === "revoked").length,
      certificatesIssued: certList.filter((c) => c.status === "valid").length,
      recentActivity: logs.data ?? [],
    });
  } catch {
    return NextResponse.json(
      { error: "Could not load dashboard data." },
      { status: 500 }
    );
  }
}
