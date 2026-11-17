import { NextResponse } from "next/server";
import { CERTIFICATE_TITLES } from "@/lib/curriculum";
import { isLevelComplete } from "@/lib/examServer";
import { getUserFromRequest, isSupabaseConfigured } from "@/lib/supabase";
import { checkSuspension, suspendedMessage } from "@/lib/studentGuard";

// POST /api/issue-certificate — issues one certificate per student per
// level, persisted in the database so it verifies publicly.
// The old version required no login, checked nothing, wrote nothing and
// returned a random ID that always failed public verification
// ("not_found") — contradicting the site's own copy ("something you can
// actually prove"). Now: the caller must be signed in, the server
// re-checks eligibility from the database (full level completion AND a
// passed final examination), the certificate is inserted into the
// certificates table (unique per student + level — re-issuing returns the
// existing ID), and the returned ID verifies as valid.
// In the local demo flow (Supabase not configured) there is no database
// or auth to check, so the old device-local ID is returned and labelled
// honestly as unpersisted.
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const level = Number(body.level);
    const title = CERTIFICATE_TITLES[level];
    if (!title) return NextResponse.json({ error: "Unknown level." }, { status: 404 });
    const year = new Date().getFullYear();

    if (!isSupabaseConfigured()) {
      const serial = String(Math.floor(100000 + Math.random() * 900000));
      const certificateId = `NEX-B${level}-${year}-${serial}`;
      return NextResponse.json({
        ok: true,
        certificateId,
        title,
        level,
        issuedAt: new Date().toISOString(),
        persisted: false,
        note: "Recorded on this device only — the academy database is not connected in this deployment, so this ID cannot be verified publicly.",
      });
    }

    const { user, client } = await getUserFromRequest(req);
    if (!user || !client) return NextResponse.json({ error: "Log in first." }, { status: 401 });
    // B8: a suspended student cannot issue a certificate.
    const susp = await checkSuspension(client, user.id);
    if (susp.suspended)
      return NextResponse.json({ error: suspendedMessage(susp.reason) }, { status: 403 });
    if (!(await isLevelComplete(client, user.id, level)))
      return NextResponse.json(
        { error: "Complete every topic and quiz in this level first." },
        { status: 403 }
      );
    const { data: passed } = await client
      .from("examination_attempts")
      .select("id")
      .eq("student_id", user.id)
      .eq("level_id", level)
      .eq("status", "passed")
      .order("submitted_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (!passed)
      return NextResponse.json(
        { error: "Pass the final examination for this level first." },
        { status: 403 }
      );
    // Idempotent: one valid certificate per student per level.
    const { data: existing } = await client
      .from("certificates")
      .select("certificate_id,title,issued_at")
      .eq("student_id", user.id)
      .eq("level_id", level)
      .eq("status", "valid")
      .maybeSingle();
    if (existing)
      return NextResponse.json({
        ok: true,
        certificateId: existing.certificate_id,
        title: existing.title,
        level,
        issuedAt: existing.issued_at,
        persisted: true,
        alreadyIssued: true,
      });
    const { data: profile } = await client
      .from("profiles")
      .select("full_name")
      .eq("id", user.id)
      .maybeSingle();
    const studentName = (
      profile?.full_name ||
      String(body.studentName || "").trim() ||
      "Student"
    ).slice(0, 200);
    // Insert with a fresh serial; a (rare) id collision retries with a new one.
    for (let i = 0; i < 5; i++) {
      const serial = String(Math.floor(100000 + Math.random() * 900000));
      const certificateId = `NEX-B${level}-${year}-${serial}`;
      const issuedAt = new Date().toISOString();
      const { error } = await client.from("certificates").insert({
        certificate_id: certificateId,
        student_id: user.id,
        student_name: studentName,
        level_id: level,
        title,
        issued_at: issuedAt,
        issued_by: user.id,
        status: "valid",
      });
      if (!error)
        return NextResponse.json({ ok: true, certificateId, title, level, issuedAt, persisted: true });
      if (error.code !== "23505")
        return NextResponse.json({ error: "Could not issue the certificate." }, { status: 500 });
      // Unique violation: either the serial collided (retry) or another
      // request just issued this student's certificate (return that one).
      const { data: raced } = await client
        .from("certificates")
        .select("certificate_id,title,issued_at")
        .eq("student_id", user.id)
        .eq("level_id", level)
        .eq("status", "valid")
        .maybeSingle();
      if (raced)
        return NextResponse.json({
          ok: true,
          certificateId: raced.certificate_id,
          title: raced.title,
          level,
          issuedAt: raced.issued_at,
          persisted: true,
          alreadyIssued: true,
        });
    }
    return NextResponse.json({ error: "Could not issue the certificate." }, { status: 500 });
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
}
