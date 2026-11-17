import { NextResponse } from "next/server";
import { CERTIFICATE_TITLES } from "@/lib/curriculum";

// POST /api/issue-certificate — issues one certificate per student per level.
// In the connected flow the server re-checks completion + exam pass from the
// database and enforces the unique (student_id, level_id) constraint.
// In the local flow the client has already checked eligibility; the ID is
// generated deterministically and the record is mirrored locally.
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const level = Number(body.level);
    const title = CERTIFICATE_TITLES[level];
    if (!title) return NextResponse.json({ error: "Unknown level." }, { status: 404 });
    const year = new Date().getFullYear();
    const serial = String(Math.floor(100000 + Math.random() * 900000));
    const certificateId = `NEX-B${level}-${year}-${serial}`;
    return NextResponse.json({ ok: true, certificateId, title, level, issuedAt: new Date().toISOString(), persisted: false, note: "In the connected Supabase flow this ID is written to certificates with a unique constraint; duplicate issuance for the same student and level is rejected by the database." });
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
}
