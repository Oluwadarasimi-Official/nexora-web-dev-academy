import { NextResponse } from "next/server";
import { getServerSupabase, isSupabaseConfigured } from "@/lib/supabase";
import { rateLimited, clientIp } from "@/lib/data";

// POST /api/verify-certificate — public, narrow, safe fields only.
// Returns valid/invalid/revoked + name, title, level, issue date, academy, ID.
// Never returns email or any private account data.
export async function POST(req: Request) {
  if (rateLimited(`verify:${clientIp(req)}`, 30, 60 * 1000)) {
    return NextResponse.json({ error: "Too many verification attempts. Try again in a minute." }, { status: 429 });
  }
  try {
    const body = await req.json();
    const certificateId = String(body.certificateId || "").trim().toUpperCase();
    if (!certificateId) return NextResponse.json({ error: "Enter a certificate ID." }, { status: 400 });
    if (isSupabaseConfigured()) {
      const client = getServerSupabase();
      if (client) {
        const { data } = await client.from("certificates").select("certificate_id, student_name, level_id, title, issued_at, status").eq("certificate_id", certificateId).maybeSingle();
        if (data) {
          const levelName = data.level_id === 1 ? "Beginner" : data.level_id === 2 ? "Intermediate" : "Advanced";
          try { await client.from("certificate_verification_logs").insert({ certificate_id: certificateId, result: data.status, source_ip: clientIp(req) }); } catch {}
          return NextResponse.json({ valid: data.status === "valid", status: data.status, certificateId: data.certificate_id, studentName: data.student_name, title: data.title, level: data.level_id, levelName, issuedAt: data.issued_at, academy: "Nexora Web Dev. Academy" });
        }
        return NextResponse.json({ valid: false, status: "not_found" });
      }
    }
    // Not connected: only the local device's certificates can be verified.
    return NextResponse.json({ valid: false, status: "not_found", note: "The academy database is not connected in this deployment, so only certificates issued in the connected deployment can be verified. Check the ID and try again after the owner connects Supabase." });
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
}
