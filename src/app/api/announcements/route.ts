import { NextResponse } from "next/server";
import { getUserFromRequest, isSupabaseConfigured } from "@/lib/supabase";

// GET /api/announcements — academy announcements for students, newest
// first. Bearer token required (the student dashboard is signed-in
// only). The table has a public-read policy ("public read announcements",
// migration 001), so any signed-in student may read them. (B7 fix: the
// admin could post announcements, but no student page ever read the
// table — they went into a void.)
export async function GET(req: Request) {
  try {
    if (!isSupabaseConfigured()) {
      return NextResponse.json({ ok: true, configured: false, announcements: [] });
    }
    const { user, client } = await getUserFromRequest(req);
    if (!user || !client) {
      return NextResponse.json({ error: "Log in first." }, { status: 401 });
    }
    const { data, error } = await client
      .from("announcements")
      .select("id,title,body,audience,created_at")
      .order("created_at", { ascending: false });
    if (error)
      return NextResponse.json(
        { error: "Could not load announcements." },
        { status: 500 }
      );
    return NextResponse.json({ ok: true, announcements: data ?? [] });
  } catch {
    return NextResponse.json(
      { error: "Could not load announcements." },
      { status: 500 }
    );
  }
}
