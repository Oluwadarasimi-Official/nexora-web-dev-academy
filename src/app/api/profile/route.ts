import { NextResponse } from "next/server";
import { getUserFromRequest, isSupabaseConfigured } from "@/lib/supabase";

// POST /api/profile — update the signed-in student's display name.
// Bearer token required. Body: { name }. Writes profiles.full_name
// (the "own profile" RLS policy allows a student to update their own
// row) and, best-effort, the Supabase Auth user_metadata full_name —
// sign-in reads the name from user_metadata, so without that second
// write the display name would revert on the next sign-in. (B14 fix:
// "Save Name" used to update only the localStorage session, so the
// admin students page and certificates kept showing the old name.)
export async function POST(req: Request) {
  try {
    if (!isSupabaseConfigured()) {
      return NextResponse.json(
        {
          error:
            "Profile updates need the academy database, which is not connected in this deployment yet.",
        },
        { status: 503 }
      );
    }
    const { user, client } = await getUserFromRequest(req);
    if (!user || !client) {
      return NextResponse.json({ error: "Log in first." }, { status: 401 });
    }
    const body = await req.json();
    const name = String(body.name || "").trim();
    if (name.length < 2 || name.length > 100)
      return NextResponse.json(
        { error: "Enter a name of 2–100 characters." },
        { status: 400 }
      );
    const { data, error } = await client
      .from("profiles")
      .update({ full_name: name })
      .eq("id", user.id)
      .select("id");
    if (error)
      return NextResponse.json(
        { error: "Could not update your profile." },
        { status: 500 }
      );
    if (!data || data.length === 0)
      return NextResponse.json(
        { error: "Profile not found. Contact the administrator." },
        { status: 409 }
      );
    // Best-effort: keep the sign-in display name in step. A failure here
    // must not fail the save — profiles is the authority (admin views and
    // certificates read it); the session name refreshes from here on the
    // next sign-in in any case.
    try {
      await client.auth.updateUser({ data: { full_name: name } });
    } catch {}
    return NextResponse.json({ ok: true, name });
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
}
