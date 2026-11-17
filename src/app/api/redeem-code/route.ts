import { NextResponse } from "next/server";
import { getServerSupabase, isSupabaseConfigured } from "@/lib/supabase";
import { rateLimited, clientIp } from "@/lib/data";

// POST /api/redeem-code — atomic redemption via redeem_code() (migration 001).
// The code is hashed server-side; full codes are never logged or returned.
export async function POST(req: Request) {
  if (rateLimited(`redeem:${clientIp(req)}`, 10, 60 * 60 * 1000)) {
    return NextResponse.json({ error: "Too many attempts. Try again later." }, { status: 429 });
  }
  try {
    const body = await req.json();
    const code = String(body.code || "").trim().toUpperCase();
    if (!/^NEX-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/.test(code)) {
      return NextResponse.json({ error: "Enter the code exactly as issued (format NEX-XXXX-XXXX-XXXX)." }, { status: 400 });
    }
    if (!isSupabaseConfigured()) {
      return NextResponse.json({ error: "Activation needs the academy database, which is not connected in this deployment yet. Contact the administrator." }, { status: 503 });
    }
    const auth = req.headers.get("authorization") || "";
    const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
    const client = getServerSupabase(token);
    if (!client) return NextResponse.json({ error: "Service unavailable." }, { status: 503 });
    const { data: { user } } = await client.auth.getUser(token);
    if (!user) return NextResponse.json({ error: "Log in first." }, { status: 401 });
    const { data, error } = await client.rpc("redeem_code", { p_code: code, p_student: user.id });
    if (error) return NextResponse.json({ error: "Redemption failed. Try again." }, { status: 500 });
    if (data === "ok") return NextResponse.json({ ok: true, activated: true });
    if (data === "already_activated") return NextResponse.json({ error: "This account is already activated." }, { status: 409 });
    if (data === "already_redeemed") return NextResponse.json({ error: "This code has already been redeemed." }, { status: 409 });
    if (data === "not_assigned") return NextResponse.json({ error: "This code was assigned to a different student." }, { status: 403 });
    return NextResponse.json({ error: "Invalid code. Check it and try again." }, { status: 404 });
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
}
