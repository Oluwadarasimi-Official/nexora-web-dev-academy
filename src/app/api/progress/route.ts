import { NextResponse } from "next/server";
import { getUserFromRequest, isSupabaseConfigured } from "@/lib/supabase";

// GET /api/progress — read this student's progress back from the academy
// database (B3 fix: the DB used to be write-only, so a new device or a
// cleared browser showed "Not yet activated, 0 progress" even though the
// server had the student activated with completed topics).
// Bearer token required; the client (studentFetch) sends the session token
// and RLS returns only the caller's own rows.
// Returns: activated, completed topic slugs, daily new-topic counts by
// Lagos date, best quiz attempt per topic slug, valid certificates, and
// server notifications. The client merges this into localStorage (see
// hydrateProgressFromServer in lib/store.ts) and never destroys local-only
// records. In the local demo flow (Supabase not configured) the answer is
// { ok: true, configured: false } and the client stays local-only.
export async function GET(req: Request) {
  try {
    if (!isSupabaseConfigured()) {
      return NextResponse.json({ ok: true, configured: false });
    }
    const { user, client } = await getUserFromRequest(req);
    if (!user || !client) {
      return NextResponse.json({ error: "Log in first." }, { status: 401 });
    }
    const [profile, progress, daily, attempts, certs, notes] = await Promise.all([
      client.from("profiles").select("activated").eq("id", user.id).maybeSingle(),
      client.from("lesson_progress").select("topic_slug").eq("student_id", user.id),
      client.from("daily_learning_limits").select("lagos_date,new_topics_completed").eq("student_id", user.id),
      client.from("quiz_attempts").select("topic_slug,score,passed,submitted_at").eq("student_id", user.id).order("submitted_at", { ascending: false }),
      client.from("certificates").select("certificate_id,level_id,title,issued_at").eq("student_id", user.id).eq("status", "valid").order("issued_at", { ascending: false }),
      client.from("notifications").select("id,text,read,created_at").eq("student_id", user.id).order("created_at", { ascending: false }).limit(50),
    ]);
    if (profile.error) {
      return NextResponse.json({ error: "Could not load your progress." }, { status: 500 });
    }
    // Best attempt per topic slug (highest score; latest wins a tie) —
    // the same rule the complete-topic gate uses (any passed attempt counts).
    const quizAttempts: Record<string, { score: number; passed: boolean; at: string }> = {};
    for (const a of attempts.data ?? []) {
      const slug = a.topic_slug as string;
      const cur = quizAttempts[slug];
      const at = (a.submitted_at as string) || "";
      if (!cur || (a.score as number) > cur.score || ((a.score as number) === cur.score && at > cur.at)) {
        quizAttempts[slug] = { score: a.score as number, passed: Boolean(a.passed), at };
      }
    }
    const dailyMap: Record<string, number> = {};
    for (const d of daily.data ?? []) {
      dailyMap[d.lagos_date as string] = d.new_topics_completed as number;
    }
    return NextResponse.json({
      ok: true,
      activated: Boolean(profile.data?.activated),
      completedTopics: (progress.data ?? []).map((r) => r.topic_slug as string),
      daily: dailyMap,
      quizAttempts,
      certificates: (certs.data ?? []).map((c) => ({
        level: c.level_id as number,
        id: c.certificate_id as string,
        title: c.title as string,
        issuedAt: c.issued_at as string,
      })),
      notifications: (notes.data ?? []).map((n) => ({
        id: n.id as string,
        text: n.text as string,
        at: n.created_at as string,
        read: Boolean(n.read),
      })),
    });
  } catch {
    return NextResponse.json({ error: "Could not load your progress." }, { status: 500 });
  }
}
