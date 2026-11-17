import { NextResponse } from "next/server";
import {
  getUserFromRequest,
  isSupabaseConfigured,
} from "@/lib/supabase";
import { readAcademySettings, DEFAULT_SETTINGS } from "@/lib/settings";

// GET /api/settings — the effective academy settings every student page
// displays as a rule (daily new-topic limit, quiz pass mark, exam pass
// mark). Bearer token required; the values come from academy_settings
// via readAcademySettings() (migration 008 lets signed-in users read
// them) and fall back to the documented defaults. The values are not
// sensitive — the same numbers are already published in the FAQ. (B9:
// student pages used to hardcode 3/day and 7/10, so an admin changing a
// setting changed nothing the students could see.)
export async function GET(req: Request) {
  try {
    if (!isSupabaseConfigured()) {
      return NextResponse.json({ ok: true, configured: false, ...DEFAULT_SETTINGS });
    }
    const { user, client } = await getUserFromRequest(req);
    if (!user || !client) {
      return NextResponse.json({ error: "Log in first." }, { status: 401 });
    }
    const settings = await readAcademySettings(client);
    return NextResponse.json({ ok: true, ...settings });
  } catch {
    return NextResponse.json({ error: "Could not load settings." }, { status: 500 });
  }
}
