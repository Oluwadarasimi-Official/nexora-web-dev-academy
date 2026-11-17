import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminApi";
import { isSupabaseConfigured } from "@/lib/supabase";

// POST /api/admin/setup — promote a registered account to administrator.
// Requires BOTH: the caller is a signed-in administrator (their Bearer
// session token, verified server-side — the anon key can never see rows
// under RLS, which is why the old version always answered "no registered
// account") AND the ADMIN_SETUP_TOKEN (server-only env var, set by the
// owner in Vercel). The token is compared server-side and never logged.
// If ADMIN_SETUP_TOKEN is not set, this always refuses.
export async function POST(req: Request) {
  try {
    const guard = await requireAdmin(req);
    if ("error" in guard) return guard.error;
    const { client } = guard.ctx;
    const body = await req.json();
    const email = String(body.email || "").trim().toLowerCase();
    const setupToken = String(body.setupToken || "");
    const expected = process.env.ADMIN_SETUP_TOKEN || "";
    if (!expected)
      return NextResponse.json(
        {
          error:
            "Admin bootstrap is not configured. The owner must set ADMIN_SETUP_TOKEN in Vercel first (see HANDOVER.md).",
        },
        { status: 503 }
      );
    if (!setupToken || setupToken !== expected)
      return NextResponse.json(
        { error: "Invalid setup token." },
        { status: 403 }
      );
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      return NextResponse.json(
        { error: "Enter a valid registered email." },
        { status: 400 }
      );
    if (!isSupabaseConfigured())
      return NextResponse.json(
        {
          error:
            "Supabase is not connected. Connect it first, then retry the bootstrap.",
        },
        { status: 503 }
      );
    const { data: profile } = await client
      .from("profiles")
      .select("id")
      .eq("email", email)
      .maybeSingle();
    if (!profile)
      return NextResponse.json(
        {
          error:
            "No registered account uses that email. Register the account first at /register.",
        },
        { status: 404 }
      );
    const { error } = await client
      .from("user_roles")
      .upsert({ user_id: profile.id, role: "admin" }, { onConflict: "user_id,role" });
    if (error)
      return NextResponse.json(
        { error: "Could not grant the admin role." },
        { status: 500 }
      );
    return NextResponse.json({
      ok: true,
      message:
        "Administrator role granted. That account can now sign in and open /admin.",
    });
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
}
