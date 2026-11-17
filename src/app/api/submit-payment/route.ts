import { NextResponse } from "next/server";
import { getServerSupabase, isSupabaseConfigured } from "@/lib/supabase";

// POST /api/submit-payment — student submits a payment reference.
// Status is always "pending"; only an admin can change it.
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const reference = String(body.reference || "").trim();
    const evidenceNote = String(body.evidenceNote || "").trim().slice(0, 500);
    if (reference.length < 3 || reference.length > 200) {
      return NextResponse.json({ error: "Enter a valid payment reference." }, { status: 400 });
    }
    if (!isSupabaseConfigured()) {
      // Database not connected yet: accept for the local demo flow and say so.
      return NextResponse.json({ ok: true, persisted: false, status: "pending", note: "Database not connected in this deployment; the submission was recorded on the student's device only." });
    }
    const auth = req.headers.get("authorization") || "";
    const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
    const client = getServerSupabase(token);
    if (!client) return NextResponse.json({ error: "Service unavailable." }, { status: 503 });
    const { data: { user } } = await client.auth.getUser(token);
    if (!user) return NextResponse.json({ error: "Log in first." }, { status: 401 });
    const { error } = await client.from("payments").insert({ student_id: user.id, reference, evidence_note: evidenceNote, status: "pending" });
    if (error) return NextResponse.json({ error: "Could not save the submission. Try again." }, { status: 500 });
    return NextResponse.json({ ok: true, persisted: true, status: "pending" });
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
}
